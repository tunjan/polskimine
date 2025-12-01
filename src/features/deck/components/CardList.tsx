import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Zap, History, Pencil, Trash2, Circle } from 'lucide-react';
import { Card } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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

// --- Refined, Editorial Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    new: { 
      label: 'Unseen', 
      color: 'text-[oklch(0.48_0.08_85)]', 
      bg: 'bg-[oklch(0.95_0.02_85)]' 
    },
    learning: { 
      label: 'Learning', 
      color: 'text-[oklch(0.52_0.12_35)]', 
      bg: 'bg-[oklch(0.96_0.03_35)]' 
    },
    graduated: { 
      label: 'Reviewing', 
      color: 'text-[oklch(0.50_0.10_150)]', 
      bg: 'bg-[oklch(0.95_0.02_150)]' 
    },
    known: { 
      label: 'Mastered', 
      color: 'text-muted-foreground', 
      bg: 'bg-muted/30' 
    },
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <span 
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-light tracking-wide transition-colors",
        config.bg,
        config.color
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <Circle className="w-1.5 h-1.5 fill-current" />
      {config.label}
    </span>
  );
};

const ScheduleDisplay = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
  if (status === 'new') {
    return (
      <div className="text-right space-y-0.5">
        <p className="text-xs text-muted-foreground/60 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
          Awaiting review
        </p>
      </div>
    );
  }
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  // Priority check
  if (date.getFullYear() === 1970) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.96_0.05_45)] text-[oklch(0.45_0.10_45)]">
        <span className="text-xs font-medium tracking-wide" style={{ fontFamily: 'var(--font-sans)' }}>
          Priority
        </span>
      </div>
    );
  }

  const isPast = date < new Date();

  return (
    <div className="text-right space-y-0.5">
      <p className={clsx(
        "text-sm font-light tabular-nums",
        isPast ? "text-foreground" : "text-muted-foreground"
      )} style={{ fontFamily: 'var(--font-serif)' }}>
        {format(date, 'MMM d, yyyy')}
      </p>
      <p className="text-xs text-muted-foreground/60 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
        {interval > 0 && `${interval} day${interval > 1 ? 's' : ''} • `}
        {formatDistanceToNow(date, { addSuffix: true })}
      </p>
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
        "group px-8 md:px-12 transition-all duration-300",
        isSelected 
          ? "bg-[oklch(0.96_0.015_75)]" 
          : "hover:bg-[oklch(0.98_0.005_85)]"
      )}
    >
      <div className="flex items-start gap-6 py-8 border-b border-border/40">
        
        {/* Selection Indicator - Subtle and Elegant */}
        <div 
          className="mt-1 shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
          }}
        >
          <div className={clsx(
            "w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
            isSelected 
              ? "border-[oklch(0.52_0.12_35)] bg-[oklch(0.52_0.12_35)]" 
              : "border-border/60 group-hover:border-muted-foreground/40"
          )}>
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-background" />
            )}
          </div>
        </div>

        {/* Main Content - Literary Typography */}
        <div 
          className="flex-1 min-w-0 cursor-pointer space-y-3"
          onClick={() => onViewHistory(card)}
        >
          {/* Target Language - Serif, Large, Elegant */}
          <h3 
            className={clsx(
              "text-xl md:text-2xl font-light leading-relaxed tracking-tight transition-colors",
              isSelected ? "text-foreground" : "text-foreground/90"
            )}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {card.targetSentence}
          </h3>
          
          {/* Translation - Smaller, Sans-serif, Muted */}
          <p 
            className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-3xl"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {card.nativeTranslation}
          </p>

          {/* Metadata Row - Refined, Spaced */}
          <div className="flex items-center gap-6 pt-2">
            <StatusBadge status={card.status} />
            
            <div className="h-4 w-px bg-border/40" />
            
            <span 
              className="text-xs text-muted-foreground/60 font-light tracking-wide"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reviewed {card.reps} time{card.reps !== 1 ? 's' : ''}
            </span>

            {/* Mobile: Show schedule inline */}
            <div className="md:hidden ml-auto">
              <ScheduleDisplay dateStr={card.dueDate} status={card.status} interval={card.interval} />
            </div>
          </div>
        </div>

        {/* Desktop: Schedule & Actions */}
        <div className="hidden md:flex items-start gap-8 mt-1">
          <div className="min-w-[180px]">
            <ScheduleDisplay dateStr={card.dueDate} status={card.status} interval={card.interval} />
          </div>
          
          {/* Actions Menu - Minimal */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 outline-none",
                "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50",
                "opacity-0 group-hover:opacity-100 focus:opacity-100"
              )}
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 rounded-2xl border-border bg-card  p-2"
            >
              <DropdownMenuItem 
                onClick={() => onPrioritizeCard(card.id)} 
                className="rounded-xl text-sm font-light cursor-pointer py-2.5 px-3"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <Zap size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                Mark as priority
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 bg-border/40" />
              <DropdownMenuItem 
                onClick={() => onViewHistory(card)} 
                className="rounded-xl text-sm font-light cursor-pointer py-2.5 px-3"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <History size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                View history
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEditCard(card)} 
                className="rounded-xl text-sm font-light cursor-pointer py-2.5 px-3"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <Pencil size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                Edit card
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 bg-border/40" />
              <DropdownMenuItem 
                onClick={() => onDeleteCard(card.id)} 
                className="rounded-xl text-sm font-light cursor-pointer py-2.5 px-3 text-destructive focus:text-destructive"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <Trash2 size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                Delete card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}, areEqual);

export const CardList: React.FC<CardListProps> = (props) => {
  if (props.cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
        <div className="w-px h-24 bg-border/30" />
        <div className="text-center space-y-3">
          <p 
            className="text-2xl font-light text-muted-foreground/60 tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            No cards found
          </p>
          <p 
            className="text-sm text-muted-foreground/40 font-light"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Your collection appears to be empty
          </p>
        </div>
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
            itemCount={props.cards.length}
            itemSize={160} // Generous spacing for airy feel
            itemData={props}
            className="no-scrollbar"
            overscanCount={3}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};