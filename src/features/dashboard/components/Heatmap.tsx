import React, { useMemo } from 'react';
import { ReviewHistory } from '@/types';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    if (count === 0) return 'bg-secondary';
    if (count <= 2) return 'bg-primary/30';
    if (count <= 5) return 'bg-primary/50';
    if (count <= 9) return 'bg-primary/70';
    return 'bg-primary';
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto no-scrollbar pb-2">
          <div className="w-max">
              <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
              {calendarData.map((day) => (
                  <Tooltip key={day.dateKey} delayDuration={0}>
                      <TooltipTrigger asChild>
                          <div
                              className={`w-2.5 h-2.5 rounded-[1px] transition-colors duration-200 ${day.inFuture ? 'opacity-0 pointer-events-none' : getColorClass(day.count)}`}
                          />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-mono bg-foreground text-background border-none px-2 py-1">
                          {format(day.date, 'MMM d')}: <span className="font-bold">{day.count}</span>
                      </TooltipContent>
                  </Tooltip>
              ))}
              </div>
          </div>
      </div>
    </TooltipProvider>
  );
};