import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY } from '../constants';
import { BEGINNER_DECK } from '../data/beginnerDeck';
import { isCardDue } from '../services/srs';
import { db } from '../services/db';
import { toast } from 'sonner';

interface DeckContextType {
  history: ReviewHistory;
  stats: DeckStats;
  isLoading: boolean;
  dataVersion: number;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  updateCard: (card: Card) => void;
  recordReview: (card: Card) => void;
  undoReview: () => void;
  canUndo: boolean;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ReviewHistory>({});
  const [stats, setStats] = useState<DeckStats>({
    total: 0, due: 0, learned: 0, streak: 0, totalReviews: 0, longestStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastReview, setLastReview] = useState<{ card: Card, date: string } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
        const dbStats = await db.getStats();
        // We need to merge with history-based stats which are calculated in memory or need to be recalculated
        // For now, we can recalculate streak here or keep it separate.
        // Let's recalculate streak from current history state.
        setStats(prev => ({
            ...prev,
            total: dbStats.total,
            due: dbStats.due,
            learned: dbStats.learned
        }));
    } catch (e) {
        console.error("Failed to refresh stats", e);
    }
  }, []);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentCards = await db.getCards();
        
        // Reset logic: If we have very few cards (likely old mock data) or empty, seed with beginner deck
        if (currentCards.length <= 5) {
            console.log("Seeding beginner deck...");
            await db.clearAllCards();
            await db.clearHistory();
            await db.saveAllCards(BEGINNER_DECK);
            setHistory({});
            toast.success("Deck reset to Beginner Polish course!");
        } else {
            let loadedHistory = await db.getHistory();
            setHistory(loadedHistory);
        }
        
        // Initial stats load
        const dbStats = await db.getStats();
        setStats(prev => ({ ...prev, ...dbStats }));

      } catch (error) {
        console.error("Failed to load data from DB", error);
        toast.error("Failed to load your deck. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Effect to update streak stats whenever history changes
  useEffect(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalReviews = 0;

    const reviewCounts = Object.values(history);
    totalReviews = reviewCounts.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (history[todayStr]) {
        currentStreak = 1;
        let checkDate = new Date(yesterday);
        while(true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (history[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    } else if (history[yesterdayStr]) {
        currentStreak = 0; 
         let checkDate = new Date(yesterday);
        while(true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (history[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0;
    }

    if (sortedDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i-1]);
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

    setStats(prev => ({
        ...prev,
        streak: currentStreak,
        totalReviews,
        longestStreak
    }));
  }, [history]);

  const notifyUpdate = useCallback(() => {
      setDataVersion(v => v + 1);
      refreshStats();
  }, [refreshStats]);

  const addCard = useCallback(async (newCard: Card) => {
    try {
        await db.saveCard(newCard);
        toast.success('Card added successfully');
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to save card');
    }
  }, [notifyUpdate]);

  const deleteCard = useCallback(async (id: string) => {
    try {
        await db.deleteCard(id);
        toast.success('Card deleted');
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to delete card');
    }
  }, [notifyUpdate]);

  const updateCard = useCallback(async (updatedCard: Card) => {
    try {
        await db.saveCard(updatedCard);
        notifyUpdate();
    } catch (e) {
        console.error(e);
        toast.error('Failed to update card');
    }
  }, [notifyUpdate]);

  const recordReview = useCallback(async (oldCard: Card) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
    }));
    setLastReview({ card: oldCard, date: today });
    try {
        await db.incrementHistory(today, 1);
        // Note: We don't strictly need to notifyUpdate here if we only care about stats, 
        // but if we want to update 'due' counts immediately after a review in Dashboard, we should.
        // However, StudySession handles its own state. Dashboard might need to know.
        notifyUpdate();
    } catch (e) {
        console.error(e);
    }
  }, [notifyUpdate]);

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;

    try {
        await db.saveCard(card);
    } catch (e) { console.error(e); }

    setHistory(prev => ({
        ...prev,
        [date]: Math.max(0, (prev[date] || 0) - 1)
    }));
    try {
        await db.incrementHistory(date, -1);
    } catch (e) { console.error(e); }

    setLastReview(null);
    toast.success("Review undone");
    notifyUpdate();
  }, [lastReview, notifyUpdate]);

  const contextValue = useMemo(() => ({
    history,
    stats,
    isLoading,
    dataVersion,
    addCard,
    deleteCard,
    updateCard,
    recordReview,
    undoReview,
    canUndo: !!lastReview
  }), [history, stats, isLoading, dataVersion, addCard, deleteCard, updateCard, recordReview, undoReview, lastReview]);

  return (
    <DeckContext.Provider value={contextValue}>
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};
