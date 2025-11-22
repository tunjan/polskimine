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
    // Show last 52 weeks (approx 1 year)
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
    if (count === 0) return 'bg-secondary/40';
    if (count <= 2) return 'bg-foreground/20';
    if (count <= 5) return 'bg-foreground/40';
    if (count <= 9) return 'bg-foreground/70';
    return 'bg-foreground';
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto no-scrollbar">
          <div className="min-w-max">
              <div className="grid grid-rows-7 grid-flow-col gap-[4px]">
              {calendarData.map((day) => (
                  <Tooltip key={day.dateKey} delayDuration={0}>
                      <TooltipTrigger asChild>
                          <div
                              className={clsx(
                                  "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[1px] transition-all duration-300",
                                  day.inFuture ? 'opacity-0 pointer-events-none' : getColorClass(day.count)
                              )}
                          />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-mono uppercase tracking-wider bg-foreground text-background border-none px-3 py-1.5">
                          {format(day.date, 'MMM d')}: <span className="font-bold">{day.count}</span> reviews
                      </TooltipContent>
                  </Tooltip>
              ))}
              </div>
          </div>
      </div>
    </TooltipProvider>
  );
};