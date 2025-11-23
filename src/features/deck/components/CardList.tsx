import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Zap, History, Pencil, Trash2, Check } from 'lucide-react';
import { Card } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import clsx from 'clsx';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: Card) => void;
  onPrioritizeCard: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, index: number, isShift: boolean) => void;
}

// --- Sub-components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    new: 'text-blue-600 dark:text-blue-400',
    learning: 'text-orange-600 dark:text-orange-400',
    graduated: 'text-green-600 dark:text-green-400',
    known: 'text-muted-foreground',
  };

  return (
    <span className={clsx("text-[9px] font-mono uppercase tracking-widest", colors[status] || 'text-muted-foreground')}>
      {status}
    </span>
  );
};

const DueDate = ({ dateStr, status }: { dateStr: string, status: string }) => {
  if (status === 'new') return <span className="text-muted-foreground/20 text-[10px] font-mono">—</span>;
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  // Check for 1970 epoch (prioritized cards)
  if (date.getFullYear() === 1970) {
      return <span className="text-primary font-bold tracking-wider text-[9px] uppercase font-mono">Now</span>;
  }

  return (
    <span className="text-xs font-mono text-muted-foreground truncate">
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  );
};

const Row = memo(({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
  const card = cards[index];
  if (!card) return null;

  const isSelected = selectedIds.has(card.id);

  return (
    <div 
        style={style} 
        className={clsx(
            "group flex items-center border-b border-border/40 transition-colors duration-200",
            isSelected ? "bg-secondary/40" : "hover:bg-secondary/10"
        )}
    >
      {/* 1. Selection (Checkbox) */}
      <div 
        className="w-12 h-full flex items-center justify-center shrink-0 cursor-pointer"
        onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
        }}
      >
          <div className={clsx(
              "w-4 h-4 border transition-all duration-200 flex items-center justify-center",
              isSelected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-muted-foreground/30 group-hover:border-foreground/50 bg-transparent"
          )}>
            {isSelected && <Check size={10} strokeWidth={3} />}
          </div>
      </div>

      {/* 2. Main Content */}
      <div 
        className="flex-1 min-w-0 pr-6 py-4 cursor-pointer flex flex-col justify-center"
        onClick={() => onViewHistory(card)}
      >
          <div className="flex items-baseline gap-3 mb-1.5">
             <span className={clsx(
                 "text-sm md:text-base font-normal tracking-tight truncate transition-colors",
                 isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
             )}>
                {card.targetSentence}
             </span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground/50 font-light truncate">
                {card.nativeTranslation}
             </span>
          </div>
      </div>

      {/* 3. Metadata Grid (Hidden on Mobile) */}
      <div className="hidden md:flex items-center gap-px h-full mr-4 text-left">
          {/* Status */}
          <div className="w-24 px-4 flex items-center h-full border-l border-transparent group-hover:border-border/30">
              <StatusBadge status={card.status} />
          </div>

          {/* Stats */}
          <div className="w-24 px-4 flex flex-col justify-center h-full border-l border-transparent group-hover:border-border/30">
              <span className="text-xs font-mono text-muted-foreground">
                {card.reps}<span className="text-[9px] opacity-40 ml-0.5">R</span>
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {card.interval}d
              </span>
          </div>

          {/* Due Date */}
          <div className="w-32 px-4 flex items-center justify-end h-full border-l border-transparent group-hover:border-border/30">
               <DueDate dateStr={card.dueDate} status={card.status} />
          </div>
      </div>
      
      {/* 4. Actions */}
      <div className="w-12 h-full flex items-center justify-center border-l border-transparent group-hover:border-border/30">
        <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-sm text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-all outline-none opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none border-border p-0">
                <DropdownMenuItem onClick={() => onPrioritizeCard(card.id)} className="rounded-none py-2.5 px-3 text-xs font-mono uppercase tracking-wider focus:bg-secondary cursor-pointer">
                    <Zap size={12} className="mr-3 text-amber-500" /> Prioritize
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem onClick={() => onViewHistory(card)} className="rounded-none py-2.5 px-3 text-xs font-mono uppercase tracking-wider focus:bg-secondary cursor-pointer">
                    <History size={12} className="mr-3" /> Analyze
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditCard(card)} className="rounded-none py-2.5 px-3 text-xs font-mono uppercase tracking-wider focus:bg-secondary cursor-pointer">
                    <Pencil size={12} className="mr-3" /> Edit Content
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="rounded-none py-2.5 px-3 text-xs font-mono uppercase tracking-wider text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer">
                    <Trash2 size={12} className="mr-3" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}, areEqual);

export const CardList: React.FC<CardListProps> = (props) => {
  if (props.cards.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground/40 space-y-4">
              <div className="w-16 h-px bg-border" />
              <p className="text-[10px] font-mono uppercase tracking-widest">No entries found</p>
          </div>
      );
  }

  return (
    <div className="flex-1 h-full w-full bg-background">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={props.cards.length}
            itemSize={72} // Slightly taller for breathing room
            itemData={props}
            className="no-scrollbar"
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};