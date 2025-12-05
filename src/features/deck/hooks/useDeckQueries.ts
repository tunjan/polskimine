import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/services/db/repositories/statsRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/services/db/repositories/historyRepository';
import { getDueCards, saveCard } from '@/services/db/repositories/cardRepository';
import { addReviewLog } from '@/services/db/repositories/revlogRepository';
import { Card, Grade } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { format, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from 'sonner';
import { CardXpPayload } from '@/features/xp/xpUtils';

export const useDeckStatsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['deckStats', settings.language],
    queryFn: () => fetchStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['dueCards', settings.language],
    queryFn: () => getDueCards(new Date(), settings.language),
    staleTime: 60 * 1000,
  });
};

export const useReviewsTodayQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['reviewsToday', settings.language],
    queryFn: () => getTodayReviewStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['history', settings.language],
    queryFn: () => fetchHistory(settings.language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, grade, xpPayload }: { card: Card; grade: Grade; xpPayload?: CardXpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;

      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440;

      const scheduledDays = card.interval || 0;

      await addReviewLog(card, grade, elapsedDays, scheduledDays);

      const xpAmount = xpPayload?.totalXp ?? 0;

      return { card, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] })
      ]);

      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]);

      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });

      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
        if (!old) return { newCards: 0, reviewCards: 0 };
        return {
          newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
          reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
        };
      });

      queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
        if (!old) return [];
        if (grade === 'Again') return old;
        return old.filter(c => c.id !== card.id);
      });

      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXP(xpAmount);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + xpAmount
          };
        });
      }

      return { previousHistory, previousReviewsToday, previousDueCards, previousDashboardStats };
    },
    onError: (err, newTodo, context) => {
      if (context) {
        queryClient.setQueryData(['history', settings.language], context.previousHistory);
        queryClient.setQueryData(['reviewsToday', settings.language], context.previousReviewsToday);
        queryClient.setQueryData(['dueCards', settings.language], context.previousDueCards);
        queryClient.setQueryData(['dashboardStats', settings.language], context.previousDashboardStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', settings.language] });
    },
  });
};


export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
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

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + BONUS_AMOUNT
          };
        });
      }
    }
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, date, xpEarned }: { card: Card; date: string; xpEarned: number }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || settings.language);
      return { card, date, xpEarned };
    },
    onSuccess: ({ xpEarned }) => {
      if (user && xpEarned > 0) {
        incrementXP(-xpEarned);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: Math.max(0, (old.languageXp || 0) - xpEarned)
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    }
  });
};
