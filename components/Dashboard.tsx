import React, { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { Card, DeckStats, ReviewHistory, CardStatus } from '../types';
import { Button } from './ui/Button';
import { Play, Plus, Trash2, Search, CheckCircle2, Pencil, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { isCardDue } from '../services/srs';
import { Heatmap } from './Heatmap';
import { List } from 'react-window';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  cards: Card[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  onOpenAddModal: () => void;
  onDeleteCard: (id: string) => void;
  onAddCard?: (card: Card) => void;
  onEditCard: (card: Card) => void;
  onOpenSettings: () => void;
  onMarkKnown: (card: Card) => void;
}

interface RowData {
  cards: Card[];
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Card) => void;
  onMarkKnown: (card: Card) => void;
}

interface RowProps extends RowData {
  index: number;
  style: React.CSSProperties;
}

const Row = ({ index, style, cards, onDeleteCard, onEditCard, onMarkKnown }: RowProps) => {
  const card = cards[index];
  const isDue = isCardDue(card);
  const isKnown = card.status === 'known';
  
  const statusColor = {
    new: 'bg-blue-400',
    learning: 'bg-amber-400',
    graduated: 'bg-emerald-400',
    known: 'bg-gray-300 dark:bg-gray-600',
  };

  return (
    <div
      style={style}
      className="group flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-4"
    >
      <div className="w-3 mr-3 flex justify-center">
        <div className={clsx("w-1.5 h-1.5 rounded-full", statusColor[card.status])} />
      </div>
      
      <div className="flex-1 py-3 min-w-0">
          <div className="flex items-baseline gap-3">
              <span className={clsx("font-medium truncate transition-colors", isKnown ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100')}>
              {card.targetWord ? (
                  card.targetSentence.split(' ').map((word, i) => 
                  word.toLowerCase().includes(card.targetWord!.toLowerCase()) 
                  ? <span key={i} className="font-bold">{word} </span>
                  : <span key={i}>{word} </span>
                  )
              ) : (
                  card.targetSentence
              )}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-sm truncate hidden sm:inline">{card.nativeTranslation}</span>
          </div>
      </div>

      <div className="w-24 text-right text-xs font-mono text-gray-400 dark:text-gray-500">
        {isDue ? <span className="text-rose-600 dark:text-rose-400 font-medium">Due</span> : new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>

      <div className="w-24 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isKnown && (
            <button 
                onClick={(e) => { e.stopPropagation(); onMarkKnown(card); }}
                className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                title="Mark as Known"
            >
                <CheckCircle2 size={16} />
            </button>
          )}
          <button 
              onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Edit"
          >
              <Pencil size={16} />
          </button>
          <button 
              onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete"
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
  onDeleteCard,
  onAddCard,
  onEditCard,
  onOpenSettings,
  onMarkKnown
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CardStatus>('all');
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleDeleteWithUndo = (id: string) => {
    const cardToDelete = cards.find(c => c.id === id);
    if (!cardToDelete) return;

    onDeleteCard(id);

    toast.success('Card deleted', {
        action: onAddCard ? {
            label: 'Undo',
            onClick: () => onAddCard(cardToDelete)
        } : undefined,
        duration: 4000,
    });
  };

  const filteredCards = useMemo(() => cards
    .filter(c =>
      c.targetSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nativeTranslation.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(c => (statusFilter === 'all' ? true : c.status === statusFilter))
  , [cards, searchTerm, statusFilter]);

  const itemData = useMemo(() => ({
    cards: filteredCards,
    onDeleteCard: handleDeleteWithUndo,
    onEditCard,
    onMarkKnown
  }), [filteredCards, onDeleteCard, onAddCard, onEditCard, onMarkKnown]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
            Dashboard
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 font-mono transition-colors">
            <span><strong className="text-gray-900 dark:text-gray-200">{stats.due}</strong> due</span>
            <span><strong className="text-gray-900 dark:text-gray-200">{stats.streak}d</strong> streak</span>
            <span><strong className="text-gray-900 dark:text-gray-200">{stats.learned}</strong> known</span>
            <span><strong className="text-gray-900 dark:text-gray-200">{stats.total}</strong> total</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <Button 
              variant="ghost" 
              onClick={toggleTheme}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            </Button>
             <Button 
              variant="ghost" 
              onClick={onOpenSettings}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
            >
              <Settings size={18} />
            </Button>
             <Button 
              variant="secondary" 
              onClick={onOpenAddModal}
              className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Plus size={16} className="mr-2"/> Add Card
            </Button>
            <Button
              variant={stats.due > 0 ? 'primary' : 'secondary'}
              disabled={stats.due === 0}
              onClick={onStartSession}
              className={stats.due === 0 ? "dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700" : ""}
            >
              <Play size={16} className="mr-2" />
              Review ({stats.due})
            </Button>
        </div>
      </div>

      {/* Heatmap (Collapsed/Minimal) */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-8 transition-colors">
         <Heatmap history={history} />
      </div>

      {/* Deck List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text"
              placeholder="Search cards..."
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-md focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none text-sm w-full transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg transition-colors">
            {(['all', 'new', 'learning', 'graduated', 'known'] as const).map(option => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  statusFilter === option
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
              >
                {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 min-h-[400px] transition-colors">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
              <Search size={24} className="mb-2 opacity-20" />
              <p className="text-sm">No cards found</p>
            </div>
          ) : (
             <List<RowData>
                style={{ width: '100%', height: 600 }}
                rowCount={filteredCards.length}
                rowHeight={52}
                rowProps={itemData}
                rowComponent={Row}
             />
          )}
        </div>
      </div>
    </div>
  );
};
