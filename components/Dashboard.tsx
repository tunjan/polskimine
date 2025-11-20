import React, { useState, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { Card, DeckStats, ReviewHistory, CardStatus } from '../types';
import { Button } from './ui/Button';
import { Play, Plus, Trash2, Search, CheckCircle2, Pencil, Settings, Sun, Moon, Monitor, BarChart3, LayoutList, Clock, Flame, Layers, Zap } from 'lucide-react';
import { isCardDue } from '../services/srs';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { CramModal } from './CramModal';

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
  dueCardIds?: Set<string>;
}

interface RowData {
  cards: Card[];
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Card) => void;
  onMarkKnown: (card: Card) => void;
  dueCardIds?: Set<string>;
}

interface RowProps extends RowData {
  index: number;
  style: React.CSSProperties;
}

const Row = ({
  index,
  style,
  ariaAttributes: _aria,
  ...rowData
}: RowComponentProps<RowData>) => {
  const { cards, onDeleteCard, onEditCard, onMarkKnown, dueCardIds } = rowData;
  const card = cards[index];
  const isDue = dueCardIds?.has(card.id) ?? isCardDue(card);
  const isKnown = card.status === 'known';
  
  const statusColor = {
    new: 'bg-blue-500 dark:bg-blue-400',
    learning: 'bg-amber-500 dark:bg-amber-400',
    graduated: 'bg-emerald-500 dark:bg-emerald-400',
    known: 'bg-gray-300 dark:bg-gray-600',
  };

  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    <div
      style={style}
      className="group flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors px-4"
    >
      <div className="w-4 mr-3 flex justify-center">
        <div className={clsx("w-2 h-2 rounded-full ring-2 ring-opacity-20 dark:ring-opacity-20", statusColor[card.status], card.status === 'new' ? 'ring-blue-500' : card.status === 'learning' ? 'ring-amber-500' : card.status === 'graduated' ? 'ring-emerald-500' : 'ring-gray-400')} />
      </div>
      
      <div className="flex-1 py-3 min-w-0 grid gap-0.5">
          <div className="flex items-baseline gap-2">
              <span className={clsx("font-medium truncate transition-colors text-sm", isKnown ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100')}>
              {card.targetWord ? (
                  card.targetSentence.split(new RegExp(`\\b(${escapeRegExp(card.targetWord)})\\b`, 'gi')).map((part, i) => 
                  part.toLowerCase() === card.targetWord!.toLowerCase()
                  ? <span key={i} className="font-bold text-gray-900 dark:text-white">{part}</span>
                  : <span key={i}>{part}</span>
                  )
              ) : (
                  card.targetSentence
              )}
              </span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-xs truncate">{card.nativeTranslation}</span>
      </div>

      <div className="w-24 text-right text-xs font-medium text-gray-400 dark:text-gray-500">
        {isDue ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                Due
            </span>
        ) : (
            <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        )}
      </div>

      <div className="w-24 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isKnown && (
            <button 
                onClick={(e) => { e.stopPropagation(); onMarkKnown(card); }}
                className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                title="Mark as Known"
            >
                <CheckCircle2 size={14} />
            </button>
          )}
          <button 
              onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Edit"
          >
              <Pencil size={14} />
          </button>
          <button 
              onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
          >
              <Trash2 size={14} />
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
  onMarkKnown,
  dueCardIds
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CardStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [cards]);

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

  const virtualRowProps = useMemo(() => ({
    cards: filteredCards,
    onDeleteCard: handleDeleteWithUndo,
    onEditCard,
    onMarkKnown,
    dueCardIds
  }), [filteredCards, handleDeleteWithUndo, onEditCard, onMarkKnown, dueCardIds]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
            <Button 
              variant="secondary"
              onClick={() => setIsCramModalOpen(true)}
              className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <Zap size={16} className="mr-2" /> Cram
            </Button>
        </div>

        <div className="flex items-center gap-2">
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
              title="Settings"
            >
              <Settings size={18} />
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-rose-500 dark:text-rose-400 mb-1"><Clock size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.due}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Due</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-amber-500 dark:text-amber-400 mb-1"><Flame size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streak}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Streak</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-emerald-500 dark:text-emerald-400 mb-1"><CheckCircle2 size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.learned}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Known</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-blue-500 dark:text-blue-400 mb-1"><Layers size={20} /></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Total</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 dark:border-gray-800">
            <button
                onClick={() => setViewMode('list')}
                className={clsx(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    viewMode === 'list' 
                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
            >
                Cards
            </button>
            <button
                onClick={() => setViewMode('stats')}
                className={clsx(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    viewMode === 'stats' 
                        ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
            >
                Analytics
            </button>
        </div>

        {viewMode === 'stats' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} /> Activity
                    </h3>
                    <Heatmap history={history} />
                </div>
                <RetentionStats cards={cards} />
            </div>
        ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input 
                        type="text"
                        placeholder="Search cards..."
                        className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none text-sm w-full transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg transition-colors overflow-x-auto">
                        {(['all', 'new', 'learning', 'graduated', 'known'] as const).map(option => (
                        <button
                            key={option}
                            onClick={() => setStatusFilter(option)}
                            className={clsx(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
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
                
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 min-h-[400px] shadow-sm transition-colors">
                {filteredCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
                  <Search size={24} className="mb-2 opacity-20" />
                  <p className="text-sm">No cards found</p>
                  </div>
                ) : (
                  <List
                    defaultHeight={600}
                    rowCount={filteredCards.length}
                    rowHeight={60}
                    rowComponent={Row}
                    rowProps={virtualRowProps}
                    style={{ height: 600, width: '100%' }}
                    className="w-full"
                  />
                )}
                </div>
            </div>
        )}
      </div>

      {/* Settings Modal */}
      {/* This is handled by parent or context usually, but if it was here we'd render it */}
      
      <CramModal 
        isOpen={isCramModalOpen} 
        onClose={() => setIsCramModalOpen(false)} 
        tags={uniqueTags} 
      />
    </div>
  );
};