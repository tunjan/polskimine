import React, { useState, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';
import { AddCardModal } from './components/AddCardModal';
import { DeckProvider, useDeck } from './contexts/DeckContext';
import { isCardDue } from './services/srs';
import { Database, Settings } from 'lucide-react';
import { Toaster } from 'sonner';

type View = 'dashboard' | 'study';

const PolskiMineApp: React.FC = () => {
  const { cards, history, stats, addCard, deleteCard, updateCard, recordReview } = useDeck();
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
                <span className="text-[10px] font-mono text-gray-400 leading-none mt-1">V 1.0.3 LOCAL</span>
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

const App: React.FC = () => {
  return (
    <DeckProvider>
      <PolskiMineApp />
      <Toaster position="bottom-right" />
    </DeckProvider>
  );
};

export default App;