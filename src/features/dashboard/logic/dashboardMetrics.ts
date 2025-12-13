import { DashboardMetrics } from "@/features/dashboard/components/Dashboard";

export interface DashboardCounts {
  new: number;
  learning: number;
  relearning: number;
  review: number;
  known: number;
}

export function calculateDashboardMetrics(
  counts: DashboardCounts,
  dailyLimit: number,
  newCardsStudiedToday: number,
  dailyReviewLimit?: number,
  reviewsStudiedToday?: number,
): DashboardMetrics {
  const remainingNew = Math.max(0, dailyLimit - newCardsStudiedToday);
  const newCardsToShow = Math.min(counts.new, remainingNew);

  let reviewsToShow = counts.review;
  if (dailyReviewLimit !== undefined && reviewsStudiedToday !== undefined) {
    const remainingReviews = Math.max(0, dailyReviewLimit - reviewsStudiedToday);
    reviewsToShow = Math.min(counts.review, remainingReviews);
  }

  return {
    total:
      counts.new +
      counts.learning +
      counts.relearning +
      counts.review +
      counts.known,
    new: newCardsToShow,
    learning: counts.learning,
    relearning: counts.relearning,
    reviewing: reviewsToShow,
    known: counts.known,
  };
}
