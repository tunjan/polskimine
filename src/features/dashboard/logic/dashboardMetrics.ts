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
): DashboardMetrics {
  const remainingNew = Math.max(0, dailyLimit - newCardsStudiedToday);
  const newCardsToShow = Math.min(counts.new, remainingNew);

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
    reviewing: counts.review,
    known: counts.known,
  };
}
