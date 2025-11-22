import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Card, DeckStats, Grade, ReviewHistory } from '@/types';
import { getUTCDateString } from '@/constants';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getSRSDate } from '@/features/study/logic/srs';
import { useQueryClient } from '@tanstack/react-query';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import {
  useDeckStatsQuery,
  useDueCardsQuery,
  useReviewsTodayQuery,
  useHistoryQuery,
  useRecordReviewMutation,
  useUndoReviewMutation,
} from '@/features/deck/hooks/useDeckQueries';

interface DeckContextValue {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  recordReview: (card: Card, grade: Grade) => Promise<void>;
  undoReview: () => Promise<void>;
  canUndo: boolean;
  refreshDeckData: () => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

const languageLabel = (language: string) => {
  if (language === 'norwegian') return 'Norwegian';
  if (language === 'japanese') return 'Japanese';
  if (language === 'spanish') return 'Spanish';
  return 'Polish';
};

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user } = useAuth();
  
  // Queries
  const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
  const { data: reviewsToday, isLoading: reviewsLoading } = useReviewsTodayQuery();
  const { data: history, isLoading: historyLoading } = useHistoryQuery();
  
  // Mutations
  const recordReviewMutation = useRecordReviewMutation();
  const undoReviewMutation = useUndoReviewMutation();

  const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

  const isLoading = statsLoading || dueCardsLoading || reviewsLoading || historyLoading;

  // Prevent double loading of beginner deck
  const isSeeding = useRef(false);
  // Track which languages have been successfully seeded
  const seededLanguages = useRef<Set<string>>(new Set());

  // Memoize streak calculation separately with higher granularity control
  // to prevent expensive recalculation on every review
  const streakStats = useMemo(() => {
    // Calculate streaks from history
    const sortedDates = Object.keys(history || {}).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const totalReviews = Object.values(history || {}).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    // Use UTC date strings consistently to prevent timezone mismatches
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
  }, [history]); // Only recalculate when history object reference changes

  // Derived Stats
  // Performance note: This calculation now delegates expensive streak computation
  // to a separate useMemo to reduce render cost during rapid reviews
  // 
  // IMPORTANT: The 'due' count is derived from limitedCards.length to ensure consistency.
  // The optimistic update in useDeckQueries also updates deckStats.due, but this context
  // uses the client-side array as the source of truth for the current session.
  // This prevents desync between the mutation's filter logic and the context's applyStudyLimits.
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
      due: limitedCards.length, // Source of truth: client-side filtered array
      newDue,
      reviewDue,
      streak: streakStats.currentStreak,
      totalReviews: streakStats.totalReviews,
      longestStreak: streakStats.longestStreak,
    };
  }, [dbStats, dueCards, reviewsToday, settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, streakStats]);

  // Beginner Deck Loading
  useEffect(() => {
    const loadBeginnerDeck = async () => {
      // Abort if currently seeding or this language already seeded
      if (isSeeding.current || seededLanguages.current.has(settings.language)) return;

      if (!statsLoading && dbStats && dbStats.total === 0 && user) {
         // Lock the process immediately
         isSeeding.current = true;

         const rawDeck =
              settings.language === 'norwegian'
                ? NORWEGIAN_BEGINNER_DECK
                : settings.language === 'japanese'
                ? JAPANESE_BEGINNER_DECK
                : settings.language === 'spanish'
                ? SPANISH_BEGINNER_DECK
                : POLISH_BEGINNER_DECK;
            
         // FIX: Generate fresh UUIDs to prevent database collisions
         const deck = rawDeck.map(card => ({
           ...card,
           id: crypto.randomUUID(),
           dueDate: new Date().toISOString()
         }));
            
        try {
          await saveAllCards(deck);
          // Mark this language as seeded only after success
          seededLanguages.current.add(settings.language);
          toast.success(`Loaded Beginner ${languageLabel(settings.language)} course!`);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] }),
            queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] }),
            queryClient.invalidateQueries({ queryKey: ['cards'] })
          ]);
        } catch (e) {
          console.error("Failed to load beginner deck", e);
        } finally {
          // Always unlock so retries (e.g. language switch) are possible
          isSeeding.current = false;
        }
      }
    };
    
    loadBeginnerDeck();
  }, [dbStats, statsLoading, user, settings.language, queryClient]);

  const recordReview = useCallback(async (oldCard: Card, grade: Grade) => {
      const today = getUTCDateString(getSRSDate(new Date()));
      setLastReview({ card: oldCard, date: today });
      
      try {
        await recordReviewMutation.mutateAsync({ card: oldCard, grade });
      } catch (error) {
          console.error("Failed to record review", error);
          toast.error("Failed to save review progress");
          // Only clear undo state if the failed card matches current lastReview
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