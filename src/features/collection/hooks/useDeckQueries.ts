import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { db } from "@/db/dexie";
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from "@/db/repositories/statsRepository";
import {
  getHistory as fetchHistory,
  incrementHistory,
} from "@/db/repositories/historyRepository";
import { getDueCards, saveCard } from "@/db/repositories/cardRepository";
import { addReviewLog } from "@/db/repositories/revlogRepository";
import { Card, Grade } from "@/types";
import { getSRSDate } from "@/core/srs/scheduler";
import { format, differenceInMinutes } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { toast } from "sonner";
import { CardXpPayload } from "@/core/gamification/xp";

export const useDeckStatsQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["deckStats", language],
    queryFn: () => fetchStats(language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const language = useSettingsStore((s) => s.language);
  const ignoreLearningStepsWhenNoCards = useSettingsStore(
    (s) => s.ignoreLearningStepsWhenNoCards,
  );
  return useQuery({
    queryKey: ["dueCards", language, ignoreLearningStepsWhenNoCards],
    queryFn: () =>
      getDueCards(new Date(), language, ignoreLearningStepsWhenNoCards),
    staleTime: 60 * 1000,
  });
};

export const useReviewsTodayQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["reviewsToday", language],
    queryFn: () => getTodayReviewStats(language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["history", language],
    queryFn: () => fetchHistory(language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({
      card,
      newCard,
      grade,
      xpPayload,
    }: {
      card: Card;
      newCard: Card;
      grade: Grade;
      xpPayload?: CardXpPayload;
    }) => {
      const today = format(getSRSDate(new Date()), "yyyy-MM-dd");

      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;

      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440;

      const scheduledDays = card.scheduled_days ?? card.interval ?? 0;

      await db.transaction(
        "rw",
        [db.cards, db.revlog, db.aggregated_stats, db.history],
        async () => {
          await saveCard(newCard);
          await addReviewLog(card, grade, elapsedDays, scheduledDays);
          await incrementHistory(today, 1, card.language || language);
        },
      );

      const xpAmount = xpPayload?.totalXp ?? 0;

      return { card: newCard, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), "yyyy-MM-dd");

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["history", language] }),
        queryClient.cancelQueries({ queryKey: ["reviewsToday", language] }),
        queryClient.cancelQueries({ queryKey: ["dueCards", language] }),
        queryClient.cancelQueries({ queryKey: ["deckStats", language] }),
        queryClient.cancelQueries({ queryKey: ["dashboardStats", language] }),
      ]);

      const previousHistory = queryClient.getQueryData(["history", language]);
      const previousReviewsToday = queryClient.getQueryData([
        "reviewsToday",
        language,
      ]);
      const previousDueCards = queryClient.getQueryData(["dueCards", language]);
      const previousDashboardStats = queryClient.getQueryData([
        "dashboardStats",
        language,
      ]);

      queryClient.setQueryData(["history", language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });

      queryClient.setQueryData(["reviewsToday", language], (old: any) => {
        if (!old) return { newCards: 0, reviewCards: 0 };
        return {
          newCards: card.status === "new" ? old.newCards + 1 : old.newCards,
          reviewCards:
            card.status !== "new" ? old.reviewCards + 1 : old.reviewCards,
        };
      });

      queryClient.setQueryData(
        ["dueCards", language],
        (old: Card[] | undefined) => {
          if (!old) return [];
          if (grade === "Again") return old;
          return old.filter((c) => c.id !== card.id);
        },
      );

      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXP(xpAmount);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + xpAmount,
          };
        });
      }

      return {
        previousHistory,
        previousReviewsToday,
        previousDueCards,
        previousDashboardStats,
      };
    },
    onError: (_err, _newTodo, context) => {
      if (context) {
        queryClient.setQueryData(
          ["history", language],
          context.previousHistory,
        );
        queryClient.setQueryData(
          ["reviewsToday", language],
          context.previousReviewsToday,
        );
        queryClient.setQueryData(
          ["dueCards", language],
          context.previousDueCards,
        );
        queryClient.setQueryData(
          ["dashboardStats", language],
          context.previousDashboardStats,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["history", language] });
      queryClient.invalidateQueries({ queryKey: ["reviewsToday", language] });
      queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", language] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats", language] });
    },
  });
};

export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { incrementXP } = useGamification();
  const BONUS_AMOUNT = 20;

  return useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: (data) => {
      if (data && data.success) {
        toast.success(`Daily Goal Complete! +${BONUS_AMOUNT} XP`);
        incrementXP(BONUS_AMOUNT);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + BONUS_AMOUNT,
          };
        });
      }
    },
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({
      card,
      date,
      xpEarned,
    }: {
      card: Card;
      date: string;
      xpEarned: number;
    }) => {
      await db.transaction(
        "rw",
        [db.cards, db.history, db.revlog],
        async () => {
          await saveCard(card);
          await incrementHistory(date, -1, card.language || language);

          const latestLog = await db.revlog
            .where("card_id")
            .equals(card.id)
            .reverse()
            .first();
          if (latestLog) {
            await db.revlog.delete(latestLog.id);
          }
        },
      );
      return { card, date, xpEarned };
    },
    onSuccess: ({ xpEarned }) => {
      if (user && xpEarned > 0) {
        incrementXP(-xpEarned);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: Math.max(0, (old.languageXp || 0) - xpEarned),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["history", language] });
      queryClient.invalidateQueries({ queryKey: ["reviewsToday", language] });
      queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", language] });
    },
  });
};
