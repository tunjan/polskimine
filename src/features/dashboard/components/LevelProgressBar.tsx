import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LevelProgressBarProps {
  xp: number;
  level: number;
  className?: string;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ xp, level, className }) => {
  const progressData = useMemo(() => {


    const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
    const nextLevelStartXP = 100 * Math.pow(level, 2);

    const xpGainedInLevel = xp - currentLevelStartXP;
    const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;

    const percentage = Math.min(100, Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100));
    const xpRemaining = nextLevelStartXP - xp;

    return { percentage, xpRemaining, nextLevelStartXP };
  }, [xp, level]);

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current Level</span>
          <span className="text-sm font-medium font-mono">{level}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Next Level</span>
          <span className="text-xs font-mono text-muted-foreground">-{progressData.xpRemaining.toLocaleString()} XP</span>
        </div>
      </div>
      {/* Bar */}
      <Progress value={progressData.percentage} className="h-1 bg-secondary" />
    </div>
  );
};
