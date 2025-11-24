import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Zap, History, Pencil, Trash2 } from 'lucide-react';
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

// --- Atomic Components ---

const StatusIndicator = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    new: 'text-blue-600 dark:text-blue-400',
    learning: 'text-orange-600 dark:text-orange-400',
    graduated: 'text-emerald-600 dark:text-emerald-400',
    known: 'text-zinc-400 dark:text-zinc-600',
  };

  // Minimalist dot + mono text
  return (
    <div className="flex items-center gap-2">
      <div className={clsx("w-1.5 h-1.5 rounded-full", status === 'known' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-current', colors[status])} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {status}
      </span>
    </div>
  );
};

const ScheduleInfo = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
  if (status === 'new') return <span className="text-muted-foreground/30 text-[10px] font-mono tracking-widest">QUEUE</span>;
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  // Priority check
  if (date.getFullYear() === 1970) {
      return <span className="text-amber-600 font-mono text-[10px] uppercase tracking-widest font-medium">PRIORITY</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs font-mono text-foreground tabular-nums">
        {interval}<span className="text-[9px] text-muted-foreground ml-0.5">D</span>
      </span>
      <span className="text-[10px] text-muted-foreground/60 truncate font-mono tracking-tight">
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    </div>
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
            "group flex items-center border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-150",
            isSelected ? "bg-zinc-50 dark:bg-zinc-900/50" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
        )}
    >
      {/* 1. Selection (Invisible until hover or selected) */}
      <div 
        className="w-10 h-full flex items-center justify-center shrink-0 cursor-pointer"
        onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
        }}
      >
          <div className={clsx(
              "w-3 h-3 border transition-all duration-200",
              isSelected 
                ? "bg-foreground border-foreground" 
                : "border-zinc-300 dark:border-zinc-700 opacity-0 group-hover:opacity-100"
          )} />
      </div>

      {/* 2. Main Content - High Contrast Typography */}
      <div 
        className="flex-1 min-w-0 pr-8 py-3 cursor-pointer flex flex-col justify-center h-full"
        onClick={() => onViewHistory(card)}
      >
          <div className="flex items-baseline gap-4">
             <span className={clsx(
                 "text-base font-light tracking-tight truncate transition-colors",
                 isSelected ? "text-foreground font-normal" : "text-zinc-900 dark:text-zinc-100"
             )}>
                {card.targetSentence}
             </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal truncate mt-1">
            {card.nativeTranslation}
          </span>
      </div>

      {/* 3. Metadata Grid - Strictly Monospace */}
      <div className="hidden md:flex items-center h-full mr-2">
          
          {/* Status */}
          <div className="w-32 px-4 flex items-center h-full">
              <StatusIndicator status={card.status} />
          </div>

          {/* Stats */}
          <div className="w-20 px-4 flex items-center justify-end h-full">
              <span className="text-xs font-mono text-zinc-500 tabular-nums">
                {card.reps}
              </span>
          </div>

          {/* Schedule */}
          <div className="w-32 px-4 flex items-center justify-end h-full">
               <ScheduleInfo dateStr={card.dueDate} status={card.status} interval={card.interval} />
          </div>
      </div>
      
      {/* 4. Actions - Ghost Trigger */}
      <div className="w-12 h-full flex items-center justify-center">
        <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-foreground transition-colors outline-none opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal size={16} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none border-border p-1 bg-background shadow-none border">
                <DropdownMenuItem onClick={() => onPrioritizeCard(card.id)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <Zap size={12} className="mr-3" /> Prioritize
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewHistory(card)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <History size={12} className="mr-3" /> History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditCard(card)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <Pencil size={12} className="mr-3" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="rounded-none text-xs font-mono uppercase tracking-wider text-destructive focus:text-destructive cursor-pointer">
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
          <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-300 dark:text-zinc-700 space-y-4">
              <div className="w-px h-12 bg-current" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Empty Index</p>
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
            itemSize={80} // Taller rows for breathability
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