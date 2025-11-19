import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY } from '../constants';
import { isCardDue } from '../services/srs';
import { toast } from 'sonner';

interface DeckContextType {
  cards: Card[];
  history: ReviewHistory;
  stats: DeckStats;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  updateCard: (card: Card) => void;
  recordReview: () => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state lazily to avoid blocking main thread on initial render if data is huge
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_CARDS;
    } catch (e) {
      console.error("Failed to load cards", e);
      return MOCK_CARDS;
    }
  });

  const [history, setHistory] = useState<ReviewHistory>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : MOCK_HISTORY;
    } catch (e) {
      console.error("Failed to load history", e);
      return MOCK_HISTORY;
    }
  });

  // Persist to localStorage with a simple effect for now. 
  // In a real app with 2000+ cards, we might want to debounce this or use IndexedDB.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }, 500); // Debounce by 500ms
    return () => clearTimeout(timeoutId);
  }, [cards]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [history]);

  const addCard = useCallback((newCard: Card) => {
    setCards(prev => [newCard, ...prev]);
    toast.success('Card added successfully');
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('Card deleted');
  }, []);

  const updateCard = useCallback((updatedCard: Card) => {
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  }, []);

  const recordReview = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
    }));
  }, []);

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
        due: cards.filter(isCardDue).length,
        learned: cards.filter(c => c.status === 'graduated').length,
        streak: currentStreak,
        totalReviews,
        longestStreak
    };
  }, [cards, history]);

  return (
    <DeckContext.Provider value={{ cards, history, stats, addCard, deleteCard, updateCard, recordReview }}>
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
