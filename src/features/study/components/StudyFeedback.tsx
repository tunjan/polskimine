import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { XpFeedback } from '@/features/xp/hooks/useXpSession';

export const StudyFeedback = ({ feedback }: { feedback: XpFeedback | null }) => {
  const [visible, setVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<XpFeedback | null>(null);

  useEffect(() => {
    if (feedback) {
      setCurrentFeedback(feedback);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!currentFeedback) return null;

  return (
    <div 
      key={currentFeedback.id}
      className={clsx(
        "absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      {/* Game-styled feedback panel */}
      <div className={clsx(
        "relative flex items-center gap-3 px-5 py-2.5 border backdrop-blur-sm",
        currentFeedback.isBonus 
          ? "bg-primary/5 border-primary/40 text-primary" 
          : "bg-card/80 border-border/40 text-muted-foreground"
      )}>
        {/* Corner accents */}
        <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute top-0 left-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute top-0 left-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -top-px -right-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute top-0 right-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute top-0 right-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -bottom-px -left-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute bottom-0 left-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute bottom-0 left-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute bottom-0 right-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute bottom-0 right-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        
        <span className="w-1.5 h-1.5 rotate-45 bg-current" />
        <Zap size={12} className={currentFeedback.isBonus ? "fill-primary" : "fill-none"} />
        <span className="text-xs font-ui uppercase tracking-[0.2em]">
          {currentFeedback.message}
        </span>
      </div>
    </div>
  );
};
