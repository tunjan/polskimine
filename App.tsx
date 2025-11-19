import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { StudySession } from './components/StudySession';
import { AddCardModal } from './components/AddCardModal';
import { DeckProvider, useDeck } from './contexts/DeckContext';
import { isCardDue } from './services/srs';
import { Database, Settings } from 'lucide-react';
import { Toaster } from 'sonner';

const DashboardRoute: React.FC = () => {
  const { cards, history, stats, addCard, deleteCard } = useDeck();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <Dashboard 
        cards={cards}
        stats={stats}
        history={history}
        onStartSession={() => navigate('/study')}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onDeleteCard={deleteCard}
      />
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
    </>
  );
};

const StudyRoute: React.FC = () => {
  const { cards, updateCard, recordReview, undoReview, canUndo } = useDeck();
  const navigate = useNavigate();
  const dueCards = useMemo(() => {
    const now = new Date();
    return cards.filter(c => isCardDue(c, now));
  }, [cards]);

  return (
    <StudySession 
      dueCards={dueCards}
      onUpdateCard={updateCard}
      onRecordReview={recordReview}
      onExit={() => navigate('/')}
      onUndo={undoReview}
      canUndo={canUndo}
    />
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cards, debug_makeAllDue } = useDeck();
  const dueCount = useMemo(() => cards.filter(isCardDue).length, [cards]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-3 cursor-pointer group" 
          >
            <div className="p-2 bg-gray-900 rounded-md text-white group-hover:bg-gray-800 transition-colors">
                <Database size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-gray-900 leading-none">Polski<span className="text-gray-400">Mining</span></span>
                <span className="text-[10px] font-mono text-gray-400 leading-none mt-1">V {__APP_VERSION__} LOCAL</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-4 text-xs font-mono text-gray-500">
                <span>CARDS: {cards.length}</span>
                <span className="text-gray-300">|</span>
                <span>DUE: {dueCount}</span>
             </div>
             <button 
                onClick={debug_makeAllDue}
                className="text-gray-400 hover:text-purple-600 transition-colors"
                title="DEBUG: Make all cards due"
             >
                <Settings size={18} />
             </button>
          </div>
        </div>
      </nav>

      {/* Reduced padding top/bottom to fix scrolling issues on smaller screens */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-6 pb-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 bg-gray-50 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-gray-400 font-mono">
            <p>PolskiMining SRS System</p>
            <p>Local-First Storage</p>
        </div>
      </footer>
    </div>
  );
};

const PolskiMineApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/study" element={<StudyRoute />} />
        </Routes>
      </Layout>
    </BrowserRouter>
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