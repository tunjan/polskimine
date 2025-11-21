import React from 'react';
import clsx from 'clsx';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardStatus } from '@/types';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

interface RowData {
  cards: Card[];
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

const statusColors: Record<CardStatus, string> = {
  new: 'bg-blue-500',
  learning: 'bg-amber-500',
  graduated: 'bg-emerald-500',
  known: 'bg-gray-300',
};

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { cards, onEditCard, onDeleteCard } = data;
  const card = cards[index];
  
  if (!card) return null;
  return (
    <div
      style={style}
      className="group flex items-center border-b border-gray-50 dark:border-gray-900 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-default"
    >
      <div className="w-6 md:w-8 flex justify-center items-center gap-1 shrink-0">
        <div className={clsx('w-1.5 h-1.5 rounded-full', statusColors[card.status as CardStatus])} />
        {card.isLeech && (
            <div title="Leech Card">
                <AlertTriangle size={10} className="text-amber-500" />
            </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 pr-2 md:pr-4">
        <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-3">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {card.targetSentence}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600 truncate flex-1">
            {card.nativeTranslation}
          </span>
        </div>
      </div>

      {/* Date hidden on mobile */}
      <div className="hidden md:block w-24 text-right text-[10px] font-mono text-gray-300 dark:text-gray-700 shrink-0">
        {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>
      
      <div className="w-14 md:w-16 flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEditCard(card)} className="text-gray-400 hover:text-black dark:hover:text-white p-1">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteCard(card.id)} className="text-gray-400 hover:text-red-600 p-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const CardList: React.FC<CardListProps> = ({ cards, searchTerm, onEditCard, onDeleteCard }) => {
  const filteredCards = cards;

  return (
    <div className="flex-1 h-full min-h-[400px] flex flex-col">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={filteredCards.length}
            itemSize={56}
            itemData={{ cards: filteredCards, onEditCard, onDeleteCard }}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};