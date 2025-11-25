import React, { useMemo } from 'react';
import { ReviewHistory } from '@/types';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { clsx } from 'clsx';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    let startDate = subDays(today, 364);
    const dayOfWeek = startDate.getDay(); // 0 is Sunday
    startDate = subDays(startDate, dayOfWeek); 
    
    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today
      });
    }
    return days;
  }, [history]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-border/60';
    if (count <= 2) return 'bg-[oklch(0.75_0.08_35)]';
    if (count <= 5) return 'bg-[oklch(0.62_0.10_35)]';
    if (count <= 9) return 'bg-[oklch(0.52_0.12_35)]';
    return 'bg-[oklch(0.42_0.14_35)]';
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto overflow-y-hidden lg:overflow-x-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="inline-block min-w-max py-2 lg:w-full">
              <div className="grid grid-rows-7 grid-flow-col gap-1 lg:gap-1">
              {calendarData.map((day) => (
                  <Tooltip key={day.dateKey} delayDuration={0}>
                      <TooltipTrigger asChild>
                          <div
                              className={clsx(
                                  "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-[12px] lg:h-[12px] rounded transition-all duration-200 hover:scale-110",
                                  day.inFuture ? 'opacity-0 pointer-events-none' : getColorClass(day.count)
                              )}
                          />
                      </TooltipTrigger>
                      <TooltipContent 
                        className="bg-card text-foreground px-4 py-2.5 rounded-xl border border-border"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
                            {format(day.date, 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm font-light tabular-nums">
                            {day.count} review{day.count === 1 ? '' : 's'}
                          </div>
                      </TooltipContent>
                  </Tooltip>
              ))}
              </div>
          </div>
      </div>
    </TooltipProvider>
  );
};