import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/types';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Activity, Clock, Target, Zap, X as XIcon, History, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrnateSeparator } from '@/components/ui/separator';


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
  <div className="relative group flex flex-col justify-center p-5 bg-card/30 border border-amber-700/10 hover:border-amber-600/30 hover:bg-amber-600/5 transition-all duration-300">
    {/* Corner accent on hover */}
    <span className="absolute top-0 left-0 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/60" />
      <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/60" />
    </span>
    <span className="absolute bottom-0 right-0 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/60" />
      <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/60" />
    </span>

    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-amber-600/60 dark:text-amber-500/60 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{icon}</span>}
      <span className="text-[10px] font-serif uppercase tracking-[0.15em] text-muted-foreground group-hover:text-amber-700/80 dark:group-hover:text-amber-400/80 transition-colors">{label}</span>
    </div>
    <span className="text-3xl font-serif tracking-wide tabular-nums text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-100 transition-colors">{value}</span>
    {subtext && <span className="text-[10px] text-muted-foreground/60 mt-1 font-sans tracking-wide">{subtext}</span>}
  </div>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);

  return (
    <div className="relative group flex items-center justify-between py-3 border-b border-amber-700/10 last:border-0 hover:bg-amber-600/5 px-2 transition-colors rounded-sm">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/40 group-hover:bg-amber-500 transition-colors" />
        <span className="text-xs font-serif uppercase tracking-widest text-muted-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{label}</span>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-sm font-medium text-foreground/90 tabular-nums">{format(date, 'PPP')}</span>
        <span className="text-[10px] text-muted-foreground/50 font-sans">{formatDistanceToNow(date, { addSuffix: true })}</span>
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
    if (state === 0) return 'border-amber-600/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'; if (state === 1) return 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400'; if (state === 2) return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'; if (state === 3) return 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'; return 'border-slate-500/50 bg-slate-500/10 text-slate-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 bg-linear-to-b from-background via-background to-card border-2 border-amber-700/30 dark:border-amber-600/25 overflow-hidden gap-0 [&>button]:hidden">
        {/* Ornate Genshin corners removed */}

        {/* Inner decorative frame removed */}

        {/* Floating diamond decorations */}
        <span className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse" />

        <div className="overflow-y-auto relative z-20 custom-scrollbar">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onClose}
              className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 border border-transparent hover:border-amber-600/30 bg-card/50 hover:bg-amber-600/10 transition-all group rounded-sm"
            >
              <XIcon size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Header */}
          <div className="p-8 md:p-10 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center border border-amber-600/40 bg-amber-600/10 rotate-45">
                  <History size={18} className="text-amber-600 dark:text-amber-500 -rotate-45" strokeWidth={1.5} />
                </div>
                <div>
                  <DialogTitle className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-500/60 block">
                    Archive
                  </DialogTitle>
                  <span className="text-lg font-serif tracking-wide text-foreground">Card Details</span>
                </div>
              </div>

              <div className={cn(
                "relative px-4 py-1.5 border text-[10px] font-serif uppercase tracking-[0.15em] mr-8",
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

            <OrnateSeparator className="mb-8" />

            <div className="space-y-4 text-center">
              <h2 className="text-3xl md:text-4xl font-serif tracking-wide text-foreground leading-tight">
                {card.targetSentence}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed italic">
                {card.nativeTranslation}
              </p>
            </div>
            <DialogDescription className="sr-only">Detailed statistics for this flashcard</DialogDescription>
          </div>

          {/* Stats Grid */}
          <div className="px-8 md:px-10 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                label="Total Reviews"
                value={card.reps || 0}
                subtext="Repetitions"
                icon={<Activity size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Lapses"
                value={card.lapses || 0}
                subtext="Forgotten count"
                icon={<Zap size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Stability"
                value={`${stability}d`}
                subtext="Retention Interval"
                icon={<Target size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Difficulty"
                value={`${(card.difficulty || 0).toFixed(1)}`}
                subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
                icon={<Clock size={14} strokeWidth={1.5} />}
              />
            </div>
          </div>

          {/* Footer: Timeline */}
          <div className="mx-8 md:mx-10 mb-10 bg-card/40 border border-amber-700/10 p-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar size={100} />
            </div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/60" />
              <h3 className="text-[10px] font-serif uppercase tracking-[0.15em] text-muted-foreground">
                Chronicle
              </h3>
              <span className="flex-1 h-px bg-linear-to-r from-amber-600/20 to-transparent" />
            </div>

            <div className="space-y-1 relative z-10">
              <TimelineEvent label="Created" dateStr={card.first_review || card.dueDate} />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
