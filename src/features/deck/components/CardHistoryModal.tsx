import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/types';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import clsx from 'clsx';

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({ 
  label, 
  value, 
  subtext 
}: { 
  label: string, 
  value: string | number, 
  subtext?: string 
}) => (
  <div className="flex flex-col justify-center p-6 md:p-8 border-b border-r border-border/40 last:border-r-0 [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">{label}</span>
    <span className="text-4xl md:text-5xl font-light tracking-tighter tabular-nums text-foreground">{value}</span>
    {subtext && <span className="text-xs text-muted-foreground mt-2 font-light">{subtext}</span>}
  </div>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);
  
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-sm font-light">{format(date, 'PPP')}</span>
        <span className="text-xs text-muted-foreground ml-2 opacity-50">{formatDistanceToNow(date, { addSuffix: true })}</span>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background border border-border  sm:rounded-xl p-0 gap-0 overflow-hidden">
        
        {/* Header: Clean, Spaced out */}
        <div className="p-8 md:p-10 border-b border-border/40">
          <div className="flex justify-between items-start mb-6">
             <DialogTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Card Analysis
             </DialogTitle>
             <div className="px-2 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {getFsrsLabel(card.state)}
             </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                {card.targetSentence}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed opacity-70">
                {card.nativeTranslation}
            </p>
          </div>
          <DialogDescription className="sr-only">Detailed statistics for this flashcard</DialogDescription>
        </div>

        {/* Stats Grid: 2x2 utilitarian grid */}
        <div className="grid grid-cols-2 border-b border-border/40">
            <StatBox 
              label="Total Reviews" 
              value={card.reps || 0}
              subtext="Repetitions"
            />
            <StatBox 
              label="Lapses" 
              value={card.lapses || 0}
              subtext="Forgotten count"
            />
            <StatBox 
              label="Stability" 
              value={`${stability}d`}
              subtext="Retention Interval"
            />
            <StatBox 
              label="Difficulty" 
              value={`${(card.difficulty || 0).toFixed(1)}`}
              subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
            />
        </div>

        {/* Footer: Timeline */}
        <div className="p-8 md:p-10 bg-secondary/5">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
              Lifecycle
            </h3>
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