import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Zap, History, Pencil, Trash2, Star, Clock, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';
import { Card } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { GamePanel, GameButton } from '@/components/ui/game-ui';
import { cn } from '@/lib/utils';
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
  compactView?: boolean;
}



const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; borderColor: string; bgColor: string; textColor: string; accentColor: string }> = {
    new: { 
      label: 'Unseen', 
      icon: <Star className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />,
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      accentColor: 'bg-amber-500'
    },
    learning: { 
      label: 'Learning', 
      icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />,
      borderColor: 'border-sky-500/50',
      bgColor: 'bg-sky-500/10',
      textColor: 'text-sky-600 dark:text-sky-400',
      accentColor: 'bg-sky-500'
    },
    graduated: { 
      label: 'Reviewing', 
      icon: <Clock className="w-3 h-3" strokeWidth={1.5} />,
      borderColor: 'border-emerald-500/50',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      accentColor: 'bg-emerald-500'
    },
    known: { 
      label: 'Mastered', 
      icon: <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />,
      borderColor: 'border-primary/50',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      accentColor: 'bg-primary'
    },
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <span 
      className={cn(
        "relative inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-ui uppercase tracking-[0.15em] transition-all border",
        config.borderColor,
        config.bgColor,
        config.textColor
      )}
    >
      {/* Corner accents with color */}
      <span className={cn("absolute -top-px -left-px w-2 h-2 pointer-events-none")}>
        <span className={cn("absolute top-0 left-0 w-full h-0.5", config.accentColor, "opacity-60")} />
        <span className={cn("absolute top-0 left-0 h-full w-0.5", config.accentColor, "opacity-60")} />
      </span>
      <span className={cn("absolute -bottom-px -right-px w-2 h-2 pointer-events-none")}>
        <span className={cn("absolute bottom-0 right-0 w-full h-0.5", config.accentColor, "opacity-60")} />
        <span className={cn("absolute bottom-0 right-0 h-full w-0.5", config.accentColor, "opacity-60")} />
      </span>
      {/* Diamond accent */}
      <span className={cn("w-1 h-1 rotate-45", config.accentColor, "opacity-80")} />
      {config.icon}
      {config.label}
    </span>
  );
};

const ScheduleDisplay = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
  if (status === 'new') {
    return (
      <div className="relative px-4 py-2.5 bg-card/80 border border-border/50 text-right group/schedule">
        {/* Corner decorations */}
        <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/30" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/30" />
        </span>
        <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/30" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/30" />
        </span>
        <div className="flex items-center justify-end gap-2">
          <Sparkles className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground font-ui tracking-wide">
            Awaiting review
          </p>
        </div>
      </div>
    );
  }
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  
  if (date.getFullYear() === 1970) {
    return (
      <div className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/50 text-amber-600 dark:text-amber-400">
        {/* Corner decorations with accent */}
        <span className="absolute -top-px -left-px w-2.5 h-2.5 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500" />
        </span>
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500" />
        </span>
        <span className="w-1 h-1 rotate-45 bg-amber-500" />
        <Zap className="w-3.5 h-3.5" strokeWidth={2} fill="currentColor" />
        <span className="text-xs font-ui uppercase tracking-[0.15em] font-medium">
          Priority
        </span>
      </div>
    );
  }

  const isPast = date < new Date();

  return (
    <div className="relative px-4 py-2.5 bg-card/80 border border-border/50 text-right group-hover:border-primary/40 group-hover:bg-card transition-all duration-200">
      {/* Corner decorations */}
      <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/30 group-hover:bg-primary/50 transition-colors" />
        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/30 group-hover:bg-primary/50 transition-colors" />
      </span>
      <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/30 group-hover:bg-primary/50 transition-colors" />
        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/30 group-hover:bg-primary/50 transition-colors" />
      </span>
      <p className={cn(
        "text-sm font-light tabular-nums tracking-tight",
        isPast ? "text-foreground" : "text-muted-foreground"
      )}>
        {format(date, 'MMM d, yyyy')}
      </p>
      <p className="text-[10px] text-muted-foreground/60 font-ui mt-0.5 tracking-wide">
        {interval > 0 && `${interval}d interval • `}
        {formatDistanceToNow(date, { addSuffix: true })}
      </p>
    </div>
  );
};


const CompactRow = memo(({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
  const card = cards[index];
  if (!card) return null;

  const isSelected = selectedIds.has(card.id);

  const statusColors: Record<string, string> = {
    new: 'bg-amber-500',
    learning: 'bg-sky-500',
    graduated: 'bg-emerald-500',
    known: 'bg-primary',
  };

  return (
    <div 
      style={style} 
      className={cn(
        "group px-4 md:px-6 transition-all duration-200",
        isSelected 
          ? "bg-primary/5" 
          : "hover:bg-card/80"
      )}
    >
      <div className={cn(
        "relative flex items-center gap-3 py-2 border-b border-border/30",
        isSelected && "border-primary/30"
      )}>
        
        {/* Left accent line */}
        <span className={cn(
          "absolute left-0 top-1/4 bottom-1/4 w-0.5 transition-all duration-200",
          isSelected ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
        )} />

        {/* Selection Indicator - Compact */}
        <div 
          className="shrink-0 cursor-pointer pl-2"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
          }}
        >
          <div className={cn(
            "relative w-4 h-4 border transition-all duration-200 flex items-center justify-center",
            isSelected 
              ? "border-primary bg-primary" 
              : "border-border/60 group-hover:border-primary/50"
          )}>
            {isSelected && (
              <span className="w-1.5 h-1.5 bg-background" />
            )}
            <span className={cn(
              "absolute -top-px -left-px w-1 h-1 border-l border-t transition-colors",
              isSelected ? "border-primary" : "border-transparent group-hover:border-primary/30"
            )} />
            <span className={cn(
              "absolute -bottom-px -right-px w-1 h-1 border-r border-b transition-colors",
              isSelected ? "border-primary" : "border-transparent group-hover:border-primary/30"
            )} />
          </div>
        </div>

        {/* Status Dot */}
        <div className={cn(
          "w-2 h-2 shrink-0",
          statusColors[card.status] || statusColors.new
        )} style={{ transform: 'rotate(45deg)' }} />

        {/* Main Content - Single Line */}
        <div 
          className="flex-1 min-w-0 cursor-pointer flex items-center gap-4"
          onClick={() => onViewHistory(card)}
        >
          <span 
            className={cn(
              "text-sm font-light truncate flex-1",
              isSelected ? "text-foreground" : "text-foreground/90"
            )}
          >
            {card.targetSentence}
          </span>
          
          <span 
            className="text-xs text-muted-foreground/50 truncate max-w-[200px] hidden sm:block font-ui"
          >
            {card.nativeTranslation}
          </span>
        </div>

        {/* Compact Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span 
            className="text-[10px] text-muted-foreground/40 tabular-nums hidden md:block font-ui"
          >
            {card.reps}×
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={cn(
                "relative w-7 h-7 flex items-center justify-center transition-all duration-200 outline-none border border-transparent",
                "text-muted-foreground/30 hover:text-foreground hover:bg-card hover:border-border/50",
                "opacity-0 group-hover:opacity-100 focus:opacity-100"
              )}
            >
              <MoreHorizontal size={14} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-44 border-border bg-card p-1.5"
            >
              <DropdownMenuItem 
                onClick={() => onPrioritizeCard(card.id)} 
                className="text-xs font-ui cursor-pointer py-2 px-2.5"
              >
                <Zap size={14} className="mr-2 opacity-60" strokeWidth={1.5} /> 
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onViewHistory(card)} 
                className="text-xs font-ui cursor-pointer py-2 px-2.5"
              >
                <History size={14} className="mr-2 opacity-60" strokeWidth={1.5} /> 
                History
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEditCard(card)} 
                className="text-xs font-ui cursor-pointer py-2 px-2.5"
              >
                <Pencil size={14} className="mr-2 opacity-60" strokeWidth={1.5} /> 
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/40" />
              <DropdownMenuItem 
                onClick={() => onDeleteCard(card.id)} 
                className="text-xs font-ui cursor-pointer py-2 px-2.5 text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2 opacity-60" strokeWidth={1.5} /> 
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}, areEqual);

const Row = memo(({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
  const card = cards[index];
  if (!card) return null;

  const isSelected = selectedIds.has(card.id);

  return (
    <div 
      style={style} 
      className={cn(
        "group px-4 md:px-6 lg:px-8 transition-all duration-300",
        isSelected 
          ? "bg-primary/5" 
          : "hover:bg-card/50"
      )}
    >
      <div className={cn(
        "relative flex items-start gap-4 md:gap-6 py-5 md:py-6 ",
        isSelected && "border-primary/40"
      )}>
        
        {/* Left accent line - Enhanced Genshin style */}
        <span className={cn(
          "absolute left-0 top-3 bottom-3 w-[2px] transition-all duration-300",
          isSelected ? "bg-primary shadow-[0_0_8px_0_hsl(var(--primary)/0.5)]" : "bg-transparent group-hover:bg-primary/50"
        )} />

        {/* Selection Indicator - Enhanced Game Style */}
        <div 
          className="mt-1 shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
          }}
        >
          <div className={cn(
            "relative w-5 h-5 border transition-all duration-300 flex items-center justify-center",
            isSelected 
              ? "border-primary bg-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.6)]" 
              : "border-border/70 group-hover:border-primary/60 group-hover:bg-card"
          )}>
            {isSelected && (
              <span className="w-1.5 h-1.5 bg-background rotate-45" />
            )}
            {/* Corner accents - More prominent */}
            <span className={cn(
              "absolute -top-0.5 -left-0.5 w-2 h-2 transition-all duration-200 pointer-events-none",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <span className={cn("absolute top-0 left-0 w-full h-0.5", isSelected ? "bg-primary" : "bg-primary/50")} />
              <span className={cn("absolute top-0 left-0 h-full w-0.5", isSelected ? "bg-primary" : "bg-primary/50")} />
            </span>
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2 h-2 transition-all duration-200 pointer-events-none",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <span className={cn("absolute bottom-0 right-0 w-full h-0.5", isSelected ? "bg-primary" : "bg-primary/50")} />
              <span className={cn("absolute bottom-0 right-0 h-full w-0.5", isSelected ? "bg-primary" : "bg-primary/50")} />
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 min-w-0 cursor-pointer space-y-3"
          onClick={() => onViewHistory(card)}
        >
          {/* Target Language */}
          <h3 
            className={cn(
              "text-lg md:text-xl font-light leading-relaxed tracking-tight transition-colors",
              isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
            )}
          >
            {card.targetSentence}
          </h3>
          
          {/* Translation */}
          <p 
            className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-3xl"
          >
            {card.nativeTranslation}
          </p>

          {/* Metadata Row - Game Style */}
          <div className="flex items-center gap-4 pt-2">
            <StatusBadge status={card.status} />
            
            <span className="w-px h-4 bg-border/40" />
            
            <span 
              className="text-xs text-muted-foreground/60 font-ui tracking-wide"
            >
              {card.reps} review{card.reps !== 1 ? 's' : ''}
            </span>

            {/* Mobile: Show schedule inline */}
            <div className="md:hidden ml-auto">
              <ScheduleDisplay dateStr={card.dueDate} status={card.status} interval={card.interval} />
            </div>
          </div>
        </div>

        {/* Desktop: Schedule & Actions */}
        <div className="hidden md:flex items-start gap-4 mt-1">
          <div className="min-w-40">
            <ScheduleDisplay dateStr={card.dueDate} status={card.status} interval={card.interval} />
          </div>
          
          {/* Actions Menu - Game Style */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={cn(
                "relative w-9 h-9 flex items-center justify-center transition-all duration-200 outline-none border",
                "text-muted-foreground/40 hover:text-foreground hover:bg-card border-transparent hover:border-border/50",
                "opacity-0 group-hover:opacity-100 focus:opacity-100"
              )}
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 border-border bg-card p-2"
            >
              <DropdownMenuItem 
                onClick={() => onPrioritizeCard(card.id)} 
                className="text-sm font-ui cursor-pointer py-2.5 px-3"
              >
                <Zap size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                Mark as priority
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 bg-border/40" />
              <DropdownMenuItem 
                onClick={() => onViewHistory(card)} 
                className="text-sm font-ui cursor-pointer py-2.5 px-3"
              >
                <History size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                View history
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEditCard(card)} 
                className="text-sm font-ui cursor-pointer py-2.5 px-3"
              >
                <Pencil size={16} className="mr-3 opacity-60" strokeWidth={1.5} /> 
                Edit card
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 bg-border/40" />
              <DropdownMenuItem 
                onClick={() => onDeleteCard(card.id)} 
                className="text-sm font-ui cursor-pointer py-2.5 px-3 text-destructive focus:text-destructive"
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
  const { compactView = false } = props;
  
  if (props.cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <GamePanel className="p-10 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md" glowOnHover>
          <div className="relative mb-8">
            {/* Decorative container with diamond shape */}
            <div className="w-20 h-20 border border-border/60 flex items-center justify-center rotate-45">
              <BookOpen className="w-7 h-7 text-muted-foreground/40 -rotate-45" strokeWidth={1.5} />
            </div>
            {/* Enhanced corner accents */}
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            {/* Center diamond accent */}
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-primary/50" />
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">No cards found</h3>
          <p className="text-sm text-muted-foreground/60 font-light font-ui">
            Your collection appears to be empty
          </p>
          {/* Decorative line */}
          <div className="flex items-center gap-2 mt-6 w-full max-w-[200px]">
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
            <span className="flex-1 h-px bg-gradient-to-r from-border/60 via-border/40 to-transparent" />
            <span className="w-1 h-1 rotate-45 bg-border/40" />
            <span className="flex-1 h-px bg-gradient-to-l from-border/60 via-border/40 to-transparent" />
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
          </div>
        </GamePanel>
      </div>
    );
  }

  const itemSize = compactView ? 44 : 140;
  const RowComponent = compactView ? CompactRow : Row;

  const itemData = React.useMemo(() => ({
    cards: props.cards,
    searchTerm: props.searchTerm,
    onEditCard: props.onEditCard,
    onDeleteCard: props.onDeleteCard,
    onViewHistory: props.onViewHistory,
    onPrioritizeCard: props.onPrioritizeCard,
    selectedIds: props.selectedIds,
    onToggleSelect: props.onToggleSelect,
    compactView: props.compactView
  }), [
    props.cards, 
    props.searchTerm, 
    props.onEditCard, 
    props.onDeleteCard, 
    props.onViewHistory, 
    props.onPrioritizeCard, 
    props.selectedIds, 
    props.onToggleSelect, 
    props.compactView
  ]);

  return (
    <div className="flex-1 h-full w-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={props.cards.length}
            itemSize={itemSize}
            itemData={itemData}
            className="no-scrollbar"
            overscanCount={compactView ? 10 : 3}
          >
            {RowComponent}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};