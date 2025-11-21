import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import clsx from 'clsx';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

const Row = ({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard } = data;
  const card = cards[index];
  if (!card) return null;

  const statusColors = {
      new: 'text-blue-500',
      learning: 'text-amber-500',
      graduated: 'text-emerald-500',
      known: 'text-muted-foreground'
  };

  return (
    <div style={style} className="group flex items-center gap-6 px-4 hover:bg-secondary/30 transition-colors border-b border-border/40">
      {/* Status Indicator */}
      <div className={clsx("w-2 h-2 rounded-full shrink-0", 
          card.status === 'new' ? 'bg-blue-500' :
          card.status === 'learning' ? 'bg-amber-500' :
          card.status === 'graduated' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
      )} />
      
      {/* Content */}
      <div className="flex-1 min-w-0 py-4 flex flex-col justify-center">
          <span className="text-base font-normal text-foreground truncate">
             {card.targetSentence}
          </span>
          <span className="text-sm text-muted-foreground truncate font-light">
             {card.nativeTranslation}
          </span>
      </div>

      {/* Metadata - Only show on md+ */}
      <div className="hidden md:flex flex-col items-end justify-center w-32 shrink-0 gap-1">
        <span className={clsx("text-[10px] font-mono uppercase tracking-widest", statusColors[card.status as keyof typeof statusColors])}>
            {card.status}
        </span>
      </div>
      
      {/* Actions */}
      <div className="w-12 flex items-center justify-end">
        <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none">
                <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditCard(card)}>
                    <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="text-destructive focus:text-destructive">
                    <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const CardList: React.FC<CardListProps> = ({ cards, onEditCard, onDeleteCard }) => (
    <div className="flex-1 h-full w-full border-t border-border/40">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={cards.length}
            itemSize={80}
            itemData={{ cards, onEditCard, onDeleteCard }}
            className="no-scrollbar"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
);
