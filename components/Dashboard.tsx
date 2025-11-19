import React, { useState, useMemo, useEffect } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { Button } from './ui/Button';
import { Play, Plus, Trash2, Search, Flame, Layers, CheckCircle2 } from 'lucide-react';
import { isCardDue } from '../services/srs';
import { Heatmap } from './Heatmap';
import { FixedSizeList as List } from 'react-window';

interface DashboardProps {
  cards: Card[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  onOpenAddModal: () => void;
  onDeleteCard: (id: string) => void;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    cards: Card[];
    onDeleteCard: (id: string) => void;
  };
}

const Row = ({ index, style, data }: RowProps) => {
  const { cards, onDeleteCard } = data;
  const card = cards[index];
  const isDue = isCardDue(card);
  
  return (
    <div style={style} className="flex items-center border-b border-gray-100 hover:bg-gray-50/80 transition-colors px-6">
      <div className="flex-1 py-4 pr-4">
          <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-900 text-base truncate">
              {card.targetWord ? (
                  card.targetSentence.split(' ').map((word, i) => 
                  word.toLowerCase().includes(card.targetWord!.toLowerCase()) 
                  ? <span key={i} className="text-gray-900 font-bold border-b border-gray-300">{word} </span>
                  : <span key={i} className="text-gray-600">{word} </span>
                  )
              ) : (
                  <span className="text-gray-900">{card.targetSentence}</span>
              )}
              </span>
              <span className="text-gray-400 text-xs truncate">{card.nativeTranslation}</span>
          </div>
      </div>
      <div className="w-32 px-4">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase border ${
          isDue 
              ? 'bg-red-50 text-red-700 border-red-100' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
          {isDue ? 'Ready' : new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
      </div>
      <div className="w-20 pl-4 text-right">
          <button 
              onClick={() => onDeleteCard(card.id)}
              className="text-gray-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-md"
              title="Delete Card"
              aria-label={`Delete card: ${card.targetSentence}`}
          >
              <Trash2 size={16} />
          </button>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  cards, 
  stats, 
  history,
  onStartSession, 
  onOpenAddModal,
  onDeleteCard 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredCards = useMemo(() => cards.filter(c => 
    c.targetSentence.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    c.nativeTranslation.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ), [cards, debouncedSearchTerm]);

  const itemData = useMemo(() => ({
    cards: filteredCards,
    onDeleteCard
  }), [filteredCards, onDeleteCard]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Miner's Log
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">
            Track your progress and manage your sentence deck.
          </p>
        </div>
        <div className="flex items-center gap-3">
             <Button 
              variant="secondary" 
              onClick={onOpenAddModal}
              className="shadow-sm"
            >
              <Plus size={16} className="mr-2"/> New Entry
            </Button>
            <Button 
              disabled={stats.due === 0} 
              onClick={onStartSession}
              variant={stats.due > 0 ? "primary" : "secondary"}
              className="shadow-sm"
            >
              <Play size={16} fill="currentColor" className="mr-2" /> 
              Start Mining {stats.due > 0 && <span className="ml-1 opacity-80">({stats.due})</span>}
            </Button>
        </div>
      </div>

      {/* 2. Analytics Panel (Stats + Heatmap) */}
      <div className="space-y-6">
        
        {/* Top: High-Density Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                <Flame size={12} className={stats.streak > 0 ? "text-orange-600" : "text-gray-400"} fill="currentColor"/> Current Streak
              </span>
              <span className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.streak} <span className="text-sm text-gray-400 font-normal">days</span></span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                <Layers size={12} className="text-gray-400"/> Total Deck
              </span>
              <span className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.total} <span className="text-sm text-gray-400 font-normal">cards</span></span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600"/> Graduated
              </span>
              <span className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.learned} <span className="text-sm text-gray-400 font-normal">words</span></span>
            </div>
          </div>

        </div>

        {/* Bottom: Heatmap */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-wider">Consistency Graph</h3>
              <span className="text-xs font-mono text-gray-400">{new Date().getFullYear()}</span>
          </div>
          <Heatmap history={history} />
        </div>

      </div>

      {/* 3. Deck Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h2 className="text-lg font-medium text-gray-900">Deck Registry</h2>
          
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
            <input 
              type="text"
              placeholder="Filter by word..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-gray-400 focus:ring-0 outline-none text-sm w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white flex flex-col">
          {filteredCards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50/50">
              <p className="text-sm font-mono text-gray-400">No cards match your query.</p>
              {cards.length === 0 && (
                 <Button variant="outline" size="sm" onClick={onOpenAddModal} className="mt-4">
                    Create First Card
                 </Button>
              )}
            </div>
          ) : (
            <>
               <div className="bg-gray-50 text-gray-500 font-mono text-[10px] uppercase tracking-wider border-b border-gray-200 flex px-6 py-3">
                  <div className="flex-1 font-semibold">Target Sentence</div>
                  <div className="w-32 px-4 font-semibold">Next Review</div>
                  <div className="w-20 pl-4 font-semibold text-right">Actions</div>
               </div>
               <div className="flex-1">
                 <List
                    height={550} // Approximate height minus header
                    itemCount={filteredCards.length}
                    itemSize={88} // Estimated row height
                    width="100%"
                    itemData={itemData}
                 >
                    {Row}
                 </List>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};