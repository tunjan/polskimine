import React, { useMemo } from 'react';
import { ReviewHistory } from '../types';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  // Generate last 52 weeks
  const calendarData = useMemo(() => {
    const today = new Date();
    const days = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay(); 
    startDate.setDate(startDate.getDate() - dayOfWeek); 

    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today
      });
    }
    return days;
  }, [history]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-gray-300';
    if (count <= 5) return 'bg-gray-400';
    if (count <= 9) return 'bg-gray-600';
    return 'bg-gray-900';
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <div className="w-max min-w-full">
        <div className="flex gap-[3px]">
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]" role="grid">
            {calendarData.map((day) => (
                <div
                key={day.dateKey}
                className={`w-[10px] h-[10px] rounded-[1px] transition-colors duration-300 ${day.inFuture ? 'opacity-0' : getColor(day.count)} focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-400`}
                title={`${day.dateKey}: ${day.count} reviews`}
                role="gridcell"
                tabIndex={day.inFuture ? -1 : 0}
                aria-label={`${day.dateKey}: ${day.count} reviews`}
                />
            ))}
            </div>
        </div>
        <div className="flex justify-end items-center text-[9px] text-gray-400 font-mono mt-3 px-1 uppercase tracking-wide gap-2">
            <span>Less</span>
            <div className="flex items-center gap-[2px]">
                <div className="w-[10px] h-[10px] bg-gray-100 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-gray-300 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-gray-400 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-gray-600 rounded-[1px]"></div>
                <div className="w-[10px] h-[10px] bg-gray-900 rounded-[1px]"></div>
            </div>
            <span>More</span>
        </div>
      </div>
    </div>
  );
};