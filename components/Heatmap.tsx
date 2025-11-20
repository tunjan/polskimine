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
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800/50';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/30';
    if (count <= 5) return 'bg-emerald-300 dark:bg-emerald-800/50';
    if (count <= 9) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <div className="w-max min-w-full">
        <div className="grid gap-x-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, 10px)` }}>
          {monthMarkers.map((label, idx) => (
            <span key={`month-${idx}`} className="text-[9px] text-gray-400 dark:text-gray-500 font-mono text-center h-4 block">
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
                className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-pointer ${day.inFuture ? 'opacity-0' : getColor(day.count)} ${selectedDay.dateKey === day.dateKey ? 'ring-2 ring-offset-1 ring-gray-900 dark:ring-gray-100 dark:ring-offset-gray-900' : ''}`}
                title={`${day.dateKey}: ${day.count} reviews`}
                role="gridcell"
                aria-label={`${day.dateKey}: ${day.count} reviews`}
                aria-pressed={selectedDay.dateKey === day.dateKey}
                />
            ))}
            </div>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-end items-center text-[9px] text-gray-400 dark:text-gray-500 font-mono px-1 uppercase tracking-wide gap-2">
              <span>Less</span>
              <div className="flex items-center gap-[2px]">
                  <div className="w-[10px] h-[10px] bg-gray-100 dark:bg-gray-800/50 rounded-[1px]"></div>
                  <div className="w-[10px] h-[10px] bg-emerald-200 dark:bg-emerald-900/30 rounded-[1px]"></div>
                  <div className="w-[10px] h-[10px] bg-emerald-300 dark:bg-emerald-800/50 rounded-[1px]"></div>
                  <div className="w-[10px] h-[10px] bg-emerald-400 dark:bg-emerald-600 rounded-[1px]"></div>
                  <div className="w-[10px] h-[10px] bg-emerald-500 dark:bg-emerald-500 rounded-[1px]"></div>
              </div>
              <span>More</span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-lg px-4 py-3" aria-live="polite">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-mono">Selected</div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedDay.count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">reviews</div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-mono" role="status">
              {selectedDay.dateLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};