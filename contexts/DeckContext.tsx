import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY } from '../constants';
import { isCardDue } from '../services/srs';
import { db } from '../services/db';
import { toast } from 'sonner';

interface DeckContextType {
  cards: Card[];
  history: ReviewHistory;
  stats: DeckStats;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  updateCard: (card: Card) => void;
  recordReview: (card: Card) => void;
  undoReview: () => void;
  canUndo: boolean;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [history, setHistory] = useState<ReviewHistory>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastReview, setLastReview] = useState<{ card: Card, date: string } | null>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        let loadedCards = await db.getCards();
        let loadedHistory = await db.getHistory();

        // Migration / Seeding Logic
        if (loadedCards.length === 0) {
           // Check localStorage for legacy data
           const localCards = localStorage.getItem(STORAGE_KEY);
           if (localCards) {
             try {
               loadedCards = JSON.parse(localCards);
               await db.saveAllCards(loadedCards);
               localStorage.removeItem(STORAGE_KEY); // Clear legacy
             } catch (e) {
               console.error("Migration failed", e);
             }
           } else {
             // Seed with Mocks if absolutely nothing exists
             loadedCards = MOCK_CARDS;
             await db.saveAllCards(loadedCards);
           }
        }

        if (Object.keys(loadedHistory).length === 0) {
            const localHistory = localStorage.getItem(HISTORY_KEY);
            if (localHistory) {
                try {
                    loadedHistory = JSON.parse(localHistory);
                    await db.saveFullHistory(loadedHistory);
                    localStorage.removeItem(HISTORY_KEY);
                } catch (e) {
                    console.error("History migration failed", e);
                }
            } else {
                loadedHistory = MOCK_HISTORY;
                await db.saveFullHistory(loadedHistory);
            }
        }

        setCards(loadedCards);
        setHistory(loadedHistory);
      } catch (error) {
        console.error("Failed to load data from DB", error);
        toast.error("Failed to load your deck. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addCard = useCallback(async (newCard: Card) => {
    setCards(prev => [newCard, ...prev]);
    try {
        await db.saveCard(newCard);
        toast.success('Card added successfully');
    } catch (e) {
        console.error(e);
        toast.error('Failed to save card');
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    try {
        await db.deleteCard(id);
        toast.success('Card deleted');
    } catch (e) {
        console.error(e);
        toast.error('Failed to delete card');
    }
  }, []);

  const updateCard = useCallback(async (updatedCard: Card) => {
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    try {
        await db.saveCard(updatedCard);
    } catch (e) {
        console.error(e);
        toast.error('Failed to update card');
    }
  }, []);

  const recordReview = useCallback(async (oldCard: Card) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
    }));
    setLastReview({ card: oldCard, date: today });
    try {
        await db.incrementHistory(today, 1);
    } catch (e) {
        console.error(e);
    }
  }, []);

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;

    setCards(prev => prev.map(c => c.id === card.id ? card : c));
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
  }, [lastReview]);

  const stats: DeckStats = useMemo(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalReviews = 0;

    const reviewCounts = Object.values(history);
    // Ensure we are summing numbers
    totalReviews = reviewCounts.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Simple streak calculation
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
        currentStreak = 0; // Active streak logic can be complex, keeping it simple
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

    return {
        total: cards.length,
        due: cards.filter(c => isCardDue(c)).length,
        learned: cards.filter(c => c.status === 'graduated').length,
        streak: currentStreak,
        totalReviews,
        longestStreak
    };
  }, [cards, history]);

  return (
    <DeckContext.Provider value={{ cards, history, stats, addCard, deleteCard, updateCard, recordReview, undoReview, canUndo: !!lastReview }}>
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
