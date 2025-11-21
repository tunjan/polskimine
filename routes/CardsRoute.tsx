import React, { useState, useMemo, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Search, Plus, Trash2, Pencil, CheckCircle2, LayoutList } from 'lucide-react';

import { List } from 'react-window';
import { toast } from 'sonner';
import { useDeck } from '../contexts/DeckContext';
import { Card, CardStatus } from '../types';
import { isCardDue } from '../services/srs';
import { Button } from '../components/ui/Button';
import { AddCardModal } from '../components/AddCardModal';
import { db } from '../services/db';

interface RowData {
  cards: Card[];
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Card) => void;
  onMarkKnown: (card: Card) => void;
  dueCardIds?: Set<string>;
}

const Row = ({ index, style, cards, onDeleteCard, onEditCard, onMarkKnown, dueCardIds }: RowData & { index: number, style: React.CSSProperties }) => {
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

export const CardsRoute: React.FC = () => {
  const { deleteCard, updateCard, addCard, dataVersion } = useDeck();
  const [cards, setCards] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CardStatus>('all');
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 600 });

  useEffect(() => {
    const fetchCards = async () => {
      const loadedCards = await db.getCards();
      setCards(loadedCards);
    };
    fetchCards();
  }, [dataVersion]);

  useEffect(() => {
    if (listContainerRef.current) {
        setListDimensions({
            width: listContainerRef.current.offsetWidth,
            height: listContainerRef.current.offsetHeight
        });
    }
    
    const handleResize = () => {
        if (listContainerRef.current) {
            setListDimensions({
                width: listContainerRef.current.offsetWidth,
                height: listContainerRef.current.offsetHeight
            });
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCard(undefined);
  };

  const handleMarkKnown = (card: Card) => {
    const updatedCard = { ...card, status: 'known' as const };
    updateCard(updatedCard);
  };

  const handleDeleteWithUndo = (id: string) => {
    const cardToDelete = cards.find(c => c.id === id);
    if (!cardToDelete) return;

    deleteCard(id);

    toast.success('Card deleted', {
        action: {
            label: 'Undo',
            onClick: () => addCard(cardToDelete)
        },
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
    onEditCard: handleEditCard,
    onMarkKnown: handleMarkKnown,
  }), [filteredCards, handleDeleteWithUndo, handleMarkKnown]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutList size={24} />
          Cards List
        </h2>
        <Button onClick={() => setIsAddModalOpen(true)} variant="primary" size="sm" className="gap-2">
            <Plus size={16} />
            Add Card
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
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

      <div ref={listContainerRef} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex-1 min-h-[400px]">
        {filteredCards.length > 0 ? (
            <List<RowData>
                style={{ height: listDimensions.height, width: listDimensions.width }}
                rowCount={filteredCards.length}
                rowHeight={72}
                rowProps={itemData}
                className="no-scrollbar"
                rowComponent={Row}
            />
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No cards found</p>
            </div>
        )}
      </div>

      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAdd={addCard}
        initialCard={editingCard}
      />
    </div>
  );
};
