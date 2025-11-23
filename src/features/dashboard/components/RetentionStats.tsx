import React, { useMemo, useState } from 'react';
import { Card } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { differenceInCalendarDays, parseISO, format, addDays, addMonths, eachMonthOfInterval } from 'date-fns';
import { useChartColors } from '@/hooks/useChartColors';
import clsx from 'clsx';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const colors = useChartColors();
  const [forecastRange, setForecastRange] = useState<'7d' | '1m' | '1y'>('7d');


  const forecastData = useMemo(() => {
    const today = new Date();
    let data: { label: string; count: number; fullDate?: Date }[] = [];

    if (forecastRange === '7d') {
      data = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'EEE'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1m') {
       data = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'd'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1y') {
        const months = eachMonthOfInterval({ start: today, end: addMonths(today, 11) });
        data = months.map(date => ({ label: format(date, 'MMM'), count: 0, fullDate: date }));
    }

    cards.forEach(card => {
      if (card.status === 'known' || !card.dueDate) return;
      const dueDate = parseISO(card.dueDate);
      const diffDays = differenceInCalendarDays(dueDate, today);
      
      if (diffDays < 0) return; 

      if (forecastRange === '7d' && diffDays < 7) data[diffDays].count++;
      else if (forecastRange === '1m' && diffDays < 30) data[diffDays].count++;
      else if (forecastRange === '1y') {
          const monthIndex = data.findIndex(d => d.fullDate && d.fullDate.getMonth() === dueDate.getMonth() && d.fullDate.getFullYear() === dueDate.getFullYear());
          if (monthIndex !== -1) data[monthIndex].count++;
      }
    });
    return data;
  }, [cards, forecastRange]);

  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '3d', min: 1, max: 3, count: 0 },
      { label: '1w', min: 3, max: 7, count: 0 },
      { label: '2w', min: 7, max: 14, count: 0 },
      { label: '1m', min: 14, max: 30, count: 0 },
      { label: '3m', min: 30, max: 90, count: 0 },
      { label: '3m+', min: 90, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [cards]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background text-[10px] font-mono uppercase tracking-wider px-3 py-2 shadow-xl border-none">
          <span className="opacity-70">{label}:</span> <span className="font-bold">{payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  if (!cards || cards.length === 0) {
    return <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No data available</div>;
  }

  return (
    <>
        {/* Forecast Chart */}
        <div className="flex flex-col h-64">
            <div className="flex items-baseline justify-between mb-8">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Workload Forecast</h3>
                <div className="flex gap-4">
                    {(['7d', '1m', '1y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setForecastRange(range)}
                            className={clsx(
                                "text-[10px] font-mono uppercase tracking-widest transition-colors",
                                forecastRange === range 
                                    ? "text-foreground border-b border-foreground" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
                            axisLine={false}
                            tickLine={false}
                            interval={forecastRange === '1m' ? 2 : 0}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.1 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                            {forecastData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Stability Chart */}
        <div className="flex flex-col h-64">
            <div className="flex items-baseline justify-between mb-8">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Memory Stability</h3>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Retention Interval
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stabilityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.1 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                             {stabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.5 + (index * 0.05)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </>
  );
};