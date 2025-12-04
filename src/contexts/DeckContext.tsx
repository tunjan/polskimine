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

interface DeckContextValue {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  recordReview: (card: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
  undoReview: () => Promise<void>;
  canUndo: boolean;
  refreshDeckData: () => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

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
    const sortedDates = Object.keys(history || {}).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const totalReviews = Object.values(history || {}).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    const srsToday = getSRSDate(new Date());
    const todayStr = getUTCDateString(srsToday);
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = getUTCDateString(srsYesterday);

    if (history?.[todayStr]) {
      currentStreak = 1;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = getUTCDateString(checkDate);
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (history?.[yesterdayStr]) {
      currentStreak = 0; 
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = getUTCDateString(checkDate);
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }
    }

    return { currentStreak, longestStreak, totalReviews };
  }, [history]);

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

    const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
    const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

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
  }, [dbStats, dueCards, reviewsToday, settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, streakStats]);

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

  const value = useMemo(
    () => ({
      history: history || {},
      stats,
      reviewsToday: reviewsToday || { newCards: 0, reviewCards: 0 },
      isLoading,
      dataVersion: 0,
      recordReview,
      undoReview,
      canUndo: !!lastReview,
      refreshDeckData,
    }),
    [history, stats, reviewsToday, isLoading, recordReview, undoReview, lastReview, refreshDeckData]
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};