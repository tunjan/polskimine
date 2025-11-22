import React from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Pencil, Trash2, Calendar, History, Zap, CheckSquare, Square } from 'lucide-react';
import { Card } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import clsx from 'clsx';
import { formatDistanceToNow, parseISO, isValid, format } from 'date-fns';

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

const StatusDot = ({ status }: { status: string }) => {
    const colorClass = 
        status === 'new' ? 'bg-blue-500' :
        status === 'learning' ? 'bg-amber-500' :
        status === 'graduated' ? 'bg-emerald-500' : 
        'bg-zinc-300 dark:bg-zinc-700';

    return <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", colorClass)} />;
};

const DueDateLabel = ({ dateStr, status }: { dateStr: string, status: string }) => {
  if (status === 'new') return <span className="text-muted-foreground/40">-</span>;
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  // Check if it's prioritized (approx 1970)
  if (date.getFullYear() === 1970) {
      return <span className="text-primary font-bold tracking-wider text-[10px] uppercase">Next</span>;
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground" title={format(date, 'PPP')}>
      <span className="truncate">{formatDistanceToNow(date, { addSuffix: true })}</span>
    </div>
  );
};

// Memoized Row Component
const Row = React.memo(({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
  const card = cards[index];
  if (!card) return null;

  const isSelected = selectedIds.has(card.id);

  return (
    <div 
        style={style} 
        className={clsx(
            "group border-b border-border/40 flex items-center px-1 transition-colors",
            isSelected ? "bg-primary/5" : "hover:bg-secondary/20"
        )}
    >
      {/* 0. Selection Checkbox */}
      <div className="w-10 flex items-center justify-center shrink-0">
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(card.id, index, e.shiftKey);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSelected ? (
                <CheckSquare size={16} className="text-primary" />
            ) : (
                <Square size={16} className="opacity-30 group-hover:opacity-100" />
            )}
          </button>
      </div>

      {/* 1. Status & Sentence (Main Content) */}
      <div 
        className="flex-1 min-w-0 pr-4 flex flex-col justify-center h-full py-3 cursor-pointer"
        onClick={() => onViewHistory(card)}
      >
          <div className="flex items-baseline gap-3 mb-1">
             <StatusDot status={card.status} />
             <span className={clsx(
                 "text-lg font-light tracking-tight truncate transition-colors",
                 isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
             )}>
                {card.targetSentence}
             </span>
          </div>
          <div className="pl-4.5">
             <span className="text-sm text-muted-foreground/60 font-light truncate block">
                {card.nativeTranslation}
             </span>
          </div>
      </div>

      {/* 2. Metadata Columns */}
      <div className="hidden md:flex items-center gap-8 mr-4 pointer-events-none">
          <div className="w-20 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</span>
              <span className="text-xs font-medium capitalize text-muted-foreground">{card.status}</span>
          </div>

          <div className="w-20 flex flex-col justify-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Interval</span>
              <span className="text-xs font-mono text-muted-foreground">{card.interval}d <span className="opacity-30">/</span> {card.reps}r</span>
          </div>

          <div className="w-24 flex flex-col justify-center text-right">
               <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Due</span>
               <span className="text-xs font-mono text-muted-foreground"><DueDateLabel dateStr={card.dueDate} status={card.status} /></span>
          </div>
      </div>
      
      {/* 3. Actions */}
      <div className="w-10 flex items-center justify-end mr-2">
        <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-md text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all outline-none">
                <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onPrioritizeCard(card.id)} className="text-xs font-mono uppercase tracking-wider text-primary focus:text-primary">
                    <Zap size={12} className="mr-2" /> Learn Now
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewHistory(card)} className="text-xs font-mono uppercase tracking-wider">
                    <History size={12} className="mr-2" /> History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditCard(card)} className="text-xs font-mono uppercase tracking-wider">
                    <Pencil size={12} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="text-xs font-mono uppercase tracking-wider text-destructive focus:text-destructive">
                    <Trash2 size={12} className="mr-2" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}, areEqual);

export const CardList: React.FC<CardListProps> = ({ 
    cards, 
    onEditCard, 
    onDeleteCard, 
    onViewHistory, 
    onPrioritizeCard,
    selectedIds,
    onToggleSelect
}) => {
  const itemData = React.useMemo(() => ({
    cards,
    onEditCard,
    onDeleteCard,
    onViewHistory,
    onPrioritizeCard,
    selectedIds,
    onToggleSelect
  }), [cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect]);

  if (cards.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/40 space-y-4 border-t border-border/40">
              <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center">
                  <Calendar size={20} strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest">No cards found</p>
          </div>
      );
  }

  return (
    <div className="flex-1 h-full w-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={cards.length}
            itemSize={88}
            itemData={itemData}
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