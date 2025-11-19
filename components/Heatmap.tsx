import React, { useMemo, useState } from 'react';
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

  const weeks = 53;
  const monthMarkers = useMemo(() => {
    const markers = new Array<string>(weeks).fill('');
    calendarData.forEach((day, idx) => {
      if (day.date.getDate() === 1) {
        const weekIndex = Math.floor(idx / 7);
        markers[weekIndex] = day.date.toLocaleString(undefined, { month: 'short' });
      }
    });
    return markers;
  }, [calendarData]);

  const [selectedDay, setSelectedDay] = useState(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    return {
      dateKey: todayKey,
      dateLabel: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      count: history[todayKey] || 0,
    };
  });

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
        <div className="grid" style={{ gridTemplateColumns: `repeat(${weeks}, 12px)` }}>
          {monthMarkers.map((label, idx) => (
            <span key={`month-${idx}`} className="text-[9px] text-gray-400 font-mono text-center">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]" role="grid">
            {calendarData.map((day) => (
                <div
                key={day.dateKey}
                onClick={() => setSelectedDay({
                  dateKey: day.dateKey,
                  dateLabel: day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                  count: day.count,
                })}
                className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-pointer ${day.inFuture ? 'opacity-0' : getColor(day.count)} ${selectedDay.dateKey === day.dateKey ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
                title={`${day.dateKey}: ${day.count} reviews`}
                role="gridcell"
                aria-label={`${day.dateKey}: ${day.count} reviews`}
                aria-pressed={selectedDay.dateKey === day.dateKey}
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
        <div className="mt-2 px-1 text-xs text-gray-600 font-mono">
          <span className="text-gray-400 uppercase tracking-wide mr-2">Selected</span>
          <span className="text-gray-900">{selectedDay.dateLabel}</span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="text-gray-900">{selectedDay.count}</span> reviews
        </div>
      </div>
    </div>
  );
};