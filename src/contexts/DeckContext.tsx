import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Card, DeckStats, Grade, ReviewHistory } from '@/types';
import { getUTCDateString } from '@/constants';


import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getSRSDate } from '@/features/study/logic/srs';
import { useQueryClient } from '@tanstack/react-query';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import {
  useDeckStatsQuery,
  useDueCardsQuery,
  useReviewsTodayQuery,
  useHistoryQuery,
  useRecordReviewMutation,
  useUndoReviewMutation,
} from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';

interface DeckState {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  canUndo: boolean;
}

interface DeckDispatch {
  recordReview: (card: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
  undoReview: () => Promise<void>;
  refreshDeckData: () => void;
}

const DeckStateContext = createContext<DeckState | undefined>(undefined);
const DeckDispatchContext = createContext<DeckDispatch | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  
  const { user } = useAuth(); 

  const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
  const { data: reviewsToday, isLoading: reviewsLoading } = useReviewsTodayQuery();
  const { data: history, isLoading: historyLoading } = useHistoryQuery();

  const recordReviewMutation = useRecordReviewMutation();
  const undoReviewMutation = useUndoReviewMutation();

  const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

  const isLoading = statsLoading || dueCardsLoading || reviewsLoading || historyLoading;

  const streakStats = useMemo(() => {
    if (!history || Object.keys(history).length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalReviews: 0 };
    }

    // Sort dates once for efficient processing
    const sortedDates = Object.keys(history).sort();
    
    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    // Calculate longest streak using sorted dates (O(n) instead of O(n²))
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Calculate current streak from today/yesterday backwards
    // Use binary search approach - find today's position and count backwards
    const srsToday = getSRSDate(new Date());
    const todayStr = getUTCDateString(srsToday);
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = getUTCDateString(srsYesterday);

    let currentStreak = 0;

    // Find starting point for current streak count
    const hasToday = history[todayStr];
    const hasYesterday = history[yesterdayStr];

    if (hasToday || hasYesterday) {
      // Start counting from either today or yesterday
      const startDate = new Date(hasToday ? srsToday : srsYesterday);
      currentStreak = 1;

      // Count consecutive days backwards using sorted dates for O(n) lookup
      // Create a Set for O(1) date lookups instead of while loop
      const dateSet = new Set(sortedDates);
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() - 1);

      // Maximum reasonable streak check (bounded iteration)
      const maxDays = Math.min(sortedDates.length, 365 * 10); // 10 years max
      for (let i = 0; i < maxDays; i++) {
        const dateStr = getUTCDateString(checkDate);
        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return { currentStreak, longestStreak, totalReviews };
  }, [history]);

  const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
  const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

  const stats = useMemo<DeckStats>(() => {
    if (!dbStats || !dueCards || !reviewsToday) {
      return {
        total: 0,
        due: 0,
        newDue: 0,
        reviewDue: 0,
        learned: 0,
        streak: 0,
        totalReviews: 0,
        longestStreak: 0,
      };
    }

    const limitedCards = applyStudyLimits(dueCards, {
      dailyNewLimit: currentNewLimit,
      dailyReviewLimit: currentReviewLimit,
      reviewsToday: reviewsToday,
    });

    const newDue = limitedCards.filter(isNewCard).length;
    const reviewDue = limitedCards.length - newDue;

    return {
      total: dbStats.total,
      learned: dbStats.learned,
      due: limitedCards.length,
      newDue,
      reviewDue,
      streak: streakStats.currentStreak,
      totalReviews: streakStats.totalReviews,
      longestStreak: streakStats.longestStreak,
    };
  }, [dbStats, dueCards, reviewsToday, currentNewLimit, currentReviewLimit, streakStats]);

  const recordReview = useCallback(async (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    const today = getUTCDateString(getSRSDate(new Date()));
    setLastReview({ card: oldCard, date: today });

    try {
      await recordReviewMutation.mutateAsync({ card: oldCard, grade, xpPayload });
    } catch (error) {
      console.error("Failed to record review", error);
      toast.error("Failed to save review progress");
      setLastReview(prev => (prev?.card.id === oldCard.id ? null : prev));
    }
  }, [recordReviewMutation]);

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;

    try {
      await undoReviewMutation.mutateAsync({ card, date });
      setLastReview(null);
      toast.success('Review undone');
    } catch (error) {
      console.error("Failed to undo review", error);
      toast.error("Failed to undo review");
    }
  }, [lastReview, undoReviewMutation]);

  const refreshDeckData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deckStats'] });
    queryClient.invalidateQueries({ queryKey: ['dueCards'] });
    queryClient.invalidateQueries({ queryKey: ['reviewsToday'] });
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
  }, [queryClient]);

  const stateValue = useMemo<DeckState>(
    () => ({
      history: history || {},
      stats,
      reviewsToday: reviewsToday || { newCards: 0, reviewCards: 0 },
      isLoading,
      dataVersion: 0,
      canUndo: !!lastReview,
    }),
    [history, stats, reviewsToday, isLoading, lastReview]
  );

  const dispatchValue = useMemo<DeckDispatch>(
    () => ({
      recordReview,
      undoReview,
      refreshDeckData,
    }),
    [recordReview, undoReview, refreshDeckData]
  );

  return (
    <DeckStateContext.Provider value={stateValue}>
      <DeckDispatchContext.Provider value={dispatchValue}>
        {children}
      </DeckDispatchContext.Provider>
    </DeckStateContext.Provider>
  );
};

export const useDeckState = () => {
  const context = useContext(DeckStateContext);
  if (context === undefined) {
    throw new Error('useDeckState must be used within a DeckProvider');
  }
  return context;
};

export const useDeckDispatch = () => {
  const context = useContext(DeckDispatchContext);
  if (context === undefined) {
    throw new Error('useDeckDispatch must be used within a DeckProvider');
  }
  return context;
};

export const useDeck = () => {
  return { ...useDeckState(), ...useDeckDispatch() };
};
