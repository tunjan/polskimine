import { useCallback } from "react";
import { Card, Grade } from "@/types";
import { CardXpPayload } from "@/core/gamification/xp";
import {
  useRecordReviewMutation,
  useUndoReviewMutation,
} from "@/features/collection/hooks/useDeckQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUTCDateString } from "@/constants";
import { getSRSDate } from "@/core/srs/scheduler";
import { useDeckStore } from "@/stores/useDeckStore";

export const useDeckActions = () => {
  const queryClient = useQueryClient();
  const recordReviewMutation = useRecordReviewMutation();
  const undoReviewMutation = useUndoReviewMutation();

  const recordReview = useCallback(
    async (
      oldCard: Card,
      newCard: Card,
      grade: Grade,
      xpPayload?: CardXpPayload,
    ) => {
      const today = getUTCDateString(getSRSDate(new Date()));
      const xpEarned = xpPayload?.totalXp ?? 0;

      useDeckStore
        .getState()
        .setLastReview({ card: oldCard, date: today, xpEarned });

      try {
        await recordReviewMutation.mutateAsync({
          card: oldCard,
          newCard,
          grade,
          xpPayload,
        });
      } catch (error) {
        console.error("Failed to record review", error);
        toast.error("Failed to save review progress");
        const currentLast = useDeckStore.getState().lastReview;
        if (currentLast?.card.id === oldCard.id) {
          useDeckStore.getState().clearLastReview();
        }
      }
    },
    [recordReviewMutation],
  );

  const undoReview = useCallback(async () => {
    const lastReview = useDeckStore.getState().lastReview;
    if (!lastReview) return;
    const { card, date, xpEarned } = lastReview;

    try {
      await undoReviewMutation.mutateAsync({ card, date, xpEarned });
      useDeckStore.getState().clearLastReview();
      toast.success("Review undone");
    } catch (error) {
      console.error("Failed to undo review", error);
      toast.error("Failed to undo review");
    }
  }, [undoReviewMutation]);

  const refreshDeckData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["deckStats"] });
    queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    queryClient.invalidateQueries({ queryKey: ["reviewsToday"] });
    queryClient.invalidateQueries({ queryKey: ["history"] });
    queryClient.invalidateQueries({ queryKey: ["cards"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardCards"] });
  }, [queryClient]);

  return {
    recordReview,
    undoReview,
    refreshDeckData,
  };
};
