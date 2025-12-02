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

interface ChartDataItem {
  label: string;
  count: number;
  fullDate?: Date;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataItem }>;
  label?: string;
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

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-4 py-3 rounded-md">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">{label}</div>
          <div className="text-sm font-normal tabular-nums mt-1">{payload[0].value}</div>
        </div>
      );
    }
    return null;
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-light font-ui">
        No data available
      </div>
    );
  }

  return (
    <>
        {/* Forecast Chart */}
        <div className="flex flex-col h-48 md:h-56 min-w-0 w-full">
            <div className="flex items-baseline justify-between mb-6 md:mb-8 min-w-0 gap-2">
                <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50 truncate">Workload Forecast</h3>
                <div className="flex gap-3 md:gap-6 shrink-0">
                    {(['7d', '1m', '1y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setForecastRange(range)}
                            className={clsx(
                                "text-[9px] font-mono uppercase tracking-[0.2em] transition-all pb-1",
                                forecastRange === range 
                                    ? "text-foreground border-b-2 border-primary" 
                                    : "text-muted-foreground/40 hover:text-muted-foreground"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
                            axisLine={false}
                            tickLine={false}
                            interval={forecastRange === '1m' ? 2 : 0}
                            dy={12}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.foreground, opacity: 0.05 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={28}>
                            {forecastData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Stability Chart */}
        <div className="flex flex-col h-48 md:h-56 min-w-0 w-full mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between mb-6 md:mb-8 min-w-0 gap-2">
                <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50 truncate">Memory Stability</h3>
                <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] shrink-0">
                    Retention Interval
                </div>
            </div>
            
            <div className="flex-1 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stabilityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            dy={12}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.foreground, opacity: 0.05 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={28}>
                             {stabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.4 + (index * 0.07)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </>
  );
};