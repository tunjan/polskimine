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
      <div className={clsx(
        "flex items-center gap-3 px-4 py-2 rounded-sm border backdrop-blur-sm",
        currentFeedback.isBonus 
          ? "bg-amber-500/5 border-amber-500/30 text-amber-600" 
          : "bg-background/80 border-border/40 text-muted-foreground"
      )}>
        <Zap size={12} className={currentFeedback.isBonus ? "fill-amber-600" : "fill-none"} />
        <span className="text-xs font-mono uppercase tracking-[0.2em]">
          {currentFeedback.message}
        </span>
      </div>
    </div>
  );
};
