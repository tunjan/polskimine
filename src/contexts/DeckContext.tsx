import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, DeckStats, Grade, ReviewHistory } from '@/types';
import { BEGINNER_DECK } from '@/features/deck/data/beginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getSRSDate } from '@/features/study/logic/srs';
import {
  saveAllCards,
  saveCard,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/services/db/repositories/historyRepository';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/services/db/repositories/statsRepository';
import { supabase } from '@/lib/supabase';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';

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
  return 'Polish';
};

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [history, setHistory] = useState<ReviewHistory>({});
  const [stats, setStats] = useState<DeckStats>({
    total: 0,
    due: 0,
    newDue: 0,
    reviewDue: 0,
    learned: 0,
    streak: 0,
    totalReviews: 0,
    longestStreak: 0,
  });
  const [reviewsToday, setReviewsToday] = useState({ newCards: 0, reviewCards: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const [dbStats, dueCards, todayReviews] = await Promise.all([
        fetchStats(settings.language),
        getDueCards(new Date(), settings.language),
        getTodayReviewStats(settings.language),
      ]);

      setReviewsToday(todayReviews);

      const limitedCards = applyStudyLimits(dueCards, {
        dailyNewLimit: settings.dailyNewLimit,
        dailyReviewLimit: settings.dailyReviewLimit,
        reviewsToday: todayReviews,
      });

      const newDue = limitedCards.filter(isNewCard).length;
      const reviewDue = limitedCards.length - newDue;

      setStats((prev) => ({
        ...prev,
        total: dbStats.total,
        learned: dbStats.learned,
        due: limitedCards.length,
        newDue,
        reviewDue,
      }));
    } catch (error) {
      console.error('Failed to refresh stats', error);
    }
  }, [settings.language, settings.dailyNewLimit, settings.dailyReviewLimit]);

  const refreshDeckData = useCallback(() => {
    setDataVersion((version) => version + 1);
  }, []);

  // Removed local card state management functions as we now use React Query


  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedHistory = await fetchHistory(settings.language);
        setHistory(loadedHistory);
        await refreshStats();
        
        // Check if deck is empty and load beginner deck if needed
        if (user) {
          const { count } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('language', settings.language)
            .eq('user_id', user.id);
            
          if (count === 0) {
            const deck =
              settings.language === 'norwegian'
                ? NORWEGIAN_BEGINNER_DECK
                : settings.language === 'japanese'
                ? JAPANESE_BEGINNER_DECK
                : BEGINNER_DECK;
            await saveAllCards(deck);
            toast.success(`Loaded Beginner ${languageLabel(settings.language)} course!`);
            await refreshStats();
          }
        }
      } catch (error) {
        console.error('Failed to load data from DB', error);
        toast.error('Failed to load your deck. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshStats, settings.language, dataVersion]);

  useEffect(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    const srsToday = getSRSDate(new Date());
    const todayStr = format(srsToday, 'yyyy-MM-dd');
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = format(srsYesterday, 'yyyy-MM-dd');

    if (history[todayStr]) {
      currentStreak = 1;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (history[yesterdayStr]) {
      currentStreak = 0;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
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

    setStats((prev) => ({
      ...prev,
      streak: currentStreak,
      totalReviews,
      longestStreak,
    }));
  }, [history]);

  const recordReview = useCallback(
    async (oldCard: Card, grade: Grade) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      setHistory((prev) => ({
        ...prev,
        [today]: (prev[today] || 0) + 1,
      }));
      
      setStats((prev) => ({
        ...prev,
        due: Math.max(0, prev.due - 1),
        newDue: oldCard.status === 'new' ? Math.max(0, prev.newDue - 1) : prev.newDue,
        reviewDue: oldCard.status !== 'new' ? Math.max(0, prev.reviewDue - 1) : prev.reviewDue,
        totalReviews: prev.totalReviews + 1,
      }));

      setLastReview({ card: oldCard, date: today });
      try {
        await incrementHistory(today, 1, oldCard.language || settings.language);
        if (user) {
          const xpAmount =
            oldCard.status === 'new'
              ? 50
              : grade === 'Again'
              ? 1
              : grade === 'Hard'
              ? 5
              : 10;

          void supabase
            .from('activity_log')
            .insert({
              user_id: user.id,
              activity_type: oldCard.status === 'new' ? 'new_card' : 'review',
              xp_awarded: xpAmount,
              language: oldCard.language || settings.language,
            })
            .then(({ error }) => {
              if (error) {
                console.error('Failed to award XP', error);
              }
            });
        }
      } catch (error) {
        console.error(error);
        // Rollback
        setHistory((prev) => ({ ...prev, [today]: Math.max(0, (prev[today] || 0) - 1) }));
        setStats((prev) => ({
          ...prev,
          due: prev.due + 1,
          newDue: oldCard.status === 'new' ? prev.newDue + 1 : prev.newDue,
          reviewDue: oldCard.status !== 'new' ? prev.reviewDue + 1 : prev.reviewDue,
          totalReviews: Math.max(0, prev.totalReviews - 1),
        }));
        toast.error("Failed to save review progress");
      }
    },
    [settings.language, user]
  );

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;
    
    try {
      await saveCard(card);
      setHistory((prev) => ({
        ...prev,
        [date]: Math.max(0, (prev[date] || 0) - 1),
      }));
      
      setStats((prev) => ({
        ...prev,
        due: prev.due + 1,
        newDue: card.status === 'new' ? prev.newDue + 1 : prev.newDue,
        reviewDue: card.status !== 'new' ? prev.reviewDue + 1 : prev.reviewDue,
        totalReviews: Math.max(0, prev.totalReviews - 1),
      }));

      await incrementHistory(date, -1, card.language || settings.language);
      setLastReview(null);
      toast.success('Review undone');
    } catch (error) {
      console.error(error);
    }
  }, [lastReview, settings.language]);

  const value = useMemo(
    () => ({
      history,
      stats,
      reviewsToday,
      isLoading,
      dataVersion,
      recordReview,
      undoReview,
      canUndo: !!lastReview,
      refreshDeckData,
    }),
    [history, stats, reviewsToday, isLoading, dataVersion, recordReview, undoReview, lastReview, refreshDeckData]
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