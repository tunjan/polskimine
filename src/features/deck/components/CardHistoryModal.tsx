import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/types';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Activity, Clock, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({ 
  label, 
  value, 
  subtext,
  icon
}: { 
  label: string, 
  value: string | number, 
  subtext?: string,
  icon?: React.ReactNode
}) => (
  <div className="relative group flex flex-col justify-center p-6 md:p-8 border-b border-r border-border/50 last:border-r-0 [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 hover:bg-card/50 transition-colors">
    {/* Corner accent on hover */}
    <span className="absolute top-2 left-2 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
      <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
    </span>
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-muted-foreground/50">{icon}</span>}
      <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </div>
    <span className="text-4xl md:text-5xl font-light tracking-tight tabular-nums text-foreground">{value}</span>
    {subtext && <span className="text-[10px] text-muted-foreground/60 mt-2 font-ui tracking-wide">{subtext}</span>}
  </div>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);
  
  return (
    <div className="relative group flex items-baseline justify-between py-3 border-b border-border/40 last:border-0">
      {/* Left accent line on hover */}
      <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-transparent group-hover:bg-primary/40 transition-colors" />
      <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground w-24 shrink-0 pl-3">{label}</span>
      <div className="text-right">
        <span className="text-sm font-light text-foreground">{format(date, 'PPP')}</span>
        <span className="text-[10px] text-muted-foreground/50 ml-2 font-ui">{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>
    </div>
  );
};

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, isOpen, onClose }) => {
  if (!card) return null;

  const difficultyPercent = Math.min(100, Math.round(((card.difficulty || 0) / 10) * 100));
  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;


  const getFsrsLabel = (state?: number) => {
      if (state === 0) return 'New';
      if (state === 1) return 'Learning';
      if (state === 2) return 'Review';
      if (state === 3) return 'Relearning';
      return 'Unknown';
  };

  const getStateColor = (state?: number) => {
      if (state === 0) return 'border-amber-700/50 bg-amber-600/10 text-amber-600 dark:text-amber-400';
      if (state === 1) return 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400';
      if (state === 2) return 'border-pine-500/50 bg-pine-500/10 text-pine-600 dark:text-pine-400';
      if (state === 3) return 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400';
      return 'border-border bg-muted/50 text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border p-0 gap-0 overflow-hidden">
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-10">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
        </span>
        <span className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-10">
          <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
          <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
        </span>
        <span className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none z-10">
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
          <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
        </span>
        <span className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
        </span>
        
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-border/50">
          <div className="flex justify-between items-start mb-6">
             <DialogTitle className="flex items-center gap-2 text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
                Card Analysis
             </DialogTitle>
             <div className={cn(
               "relative px-3 py-1.5 border text-[10px] font-ui uppercase tracking-[0.15em]",
               getStateColor(card.state)
             )}>
                {/* Status badge corner accents */}
                <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute top-0 left-0 w-full h-0.5 bg-current opacity-50" />
                  <span className="absolute top-0 left-0 h-full w-0.5 bg-current opacity-50" />
                </span>
                <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-current opacity-50" />
                  <span className="absolute bottom-0 right-0 h-full w-0.5 bg-current opacity-50" />
                </span>
                {getFsrsLabel(card.state)}
             </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground leading-tight">
                {card.targetSentence}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground/70 font-light leading-relaxed">
                {card.nativeTranslation}
            </p>
          </div>
          <DialogDescription className="sr-only">Detailed statistics for this flashcard</DialogDescription>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 border-b border-border/50">
            <StatBox 
              label="Total Reviews" 
              value={card.reps || 0}
              subtext="Repetitions"
              icon={<Activity size={12} strokeWidth={1.5} />}
            />
            <StatBox 
              label="Lapses" 
              value={card.lapses || 0}
              subtext="Forgotten count"
              icon={<Zap size={12} strokeWidth={1.5} />}
            />
            <StatBox 
              label="Stability" 
              value={`${stability}d`}
              subtext="Retention Interval"
              icon={<Target size={12} strokeWidth={1.5} />}
            />
            <StatBox 
              label="Difficulty" 
              value={`${(card.difficulty || 0).toFixed(1)}`}
              subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
              icon={<Clock size={12} strokeWidth={1.5} />}
            />
        </div>

        {/* Footer: Timeline */}
        <div className="p-8 md:p-10 bg-muted/5">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <h3 className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground">
                Lifecycle
              </h3>
              <span className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
            </div>
            <div className="space-y-1">
              <TimelineEvent label="Created" dateStr={card.first_review || card.dueDate} />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};