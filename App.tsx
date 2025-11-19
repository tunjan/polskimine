import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';
import { AddCardModal } from './components/AddCardModal';
import { Card, DeckStats, ReviewHistory } from './types';
import { MOCK_CARDS, MOCK_HISTORY, STORAGE_KEY, HISTORY_KEY } from './constants';
import { isCardDue } from './services/srs';
import { Database, Settings } from 'lucide-react';

type View = 'dashboard' | 'study';

const App: React.FC = () => {
  // Cards State
  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_CARDS;
  });

  // History State
  const [history, setHistory] = useState<ReviewHistory>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : MOCK_HISTORY;
  });
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const stats: DeckStats = useMemo(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalReviews = 0;

    // Fix for Type 'unknown' error by casting
    const reviewCounts = Object.values(history) as number[];
    totalReviews = reviewCounts.reduce((acc, val) => acc + val, 0);

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
        currentStreak = 0; // Active streak, just not today yet
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

  const addCard = (newCard: Card) => {
    setCards(prev => [newCard, ...prev]);
  };

  const deleteCard = (id: string) => {
    if (confirm('Are you sure you want to delete this card permanently?')) {
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCard = (updatedCard: Card) => {
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const recordReview = () => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => ({
        ...prev,
        [today]: (prev[today] || 0) + 1
    }));
  };

  const dueCards = useMemo(() => cards.filter(isCardDue), [cards]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="p-2 bg-gray-900 rounded-md text-white group-hover:bg-gray-800 transition-colors">
                <Database size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-gray-900 leading-none">Polski<span className="text-gray-400">Mining</span></span>
                <span className="text-[10px] font-mono text-gray-400 leading-none mt-1">V 1.0.2 LOCAL</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-500">
                <span>CARDS: {cards.length}</span>
                <span className="text-gray-300">|</span>
                <span>DUE: {dueCards.length}</span>
             </div>
             <button className="text-gray-400 hover:text-gray-900 transition-colors">
                <Settings size={18} />
             </button>
          </div>
        </div>
      </nav>

      {/* Reduced padding top/bottom to fix scrolling issues on smaller screens */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-6 pb-8 flex flex-col">
        {currentView === 'dashboard' ? (
          <Dashboard 
            cards={cards}
            stats={stats}
            history={history}
            onStartSession={() => setCurrentView('study')}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onDeleteCard={deleteCard}
          />
        ) : (
          <StudySession 
            dueCards={dueCards}
            onUpdateCard={updateCard}
            onRecordReview={recordReview}
            onExit={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 bg-gray-50 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-gray-400 font-mono">
            <p>PolskiMining SRS System</p>
            <p>Local-First Storage</p>
        </div>
      </footer>

      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
    </div>
  );
};

export default App;