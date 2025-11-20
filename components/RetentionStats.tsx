import React, { useMemo } from 'react';
import { Card } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const themeColors = {
    bar: isDark ? '#60a5fa' : '#3b82f6',
    barHover: isDark ? '#93c5fd' : '#60a5fa',
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#1f2937' : '#e5e7eb',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
  };

  // 1. Future Due (Forecast)
  const forecastData = useMemo(() => {
    const daysToShow = 30;
    const data = new Array(daysToShow).fill(0).map((_, i) => ({ day: i, count: 0, label: `+${i}d` }));
    const today = new Date();

    cards.forEach(card => {
      if (card.status === 'known' || card.status === 'new') return;
      
      const dueDate = parseISO(card.dueDate);
      const diff = differenceInCalendarDays(dueDate, today);
      
      if (diff >= 0 && diff < daysToShow) {
        data[diff].count++;
      }
    });
    
    // Label for today/tomorrow
    data[0].label = 'Today';
    data[1].label = 'Tmrw';
    
    return data;
  }, [cards]);

  // 2. Stability Distribution
  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '1-3d', min: 1, max: 3, count: 0 },
      { label: '3-7d', min: 3, max: 7, count: 0 },
      { label: '7-14d', min: 7, max: 14, count: 0 },
      { label: '14-30d', min: 14, max: 30, count: 0 },
      { label: '1-3m', min: 30, max: 90, count: 0 },
      { label: '3-6m', min: 90, max: 180, count: 0 },
      { label: '6m-1y', min: 180, max: 365, count: 0 },
      { label: '1y+', min: 365, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [cards]);

  // 3. Status Distribution
  const statusData = useMemo(() => {
    const counts = {
      new: 0,
      learning: 0,
      graduated: 0,
      known: 0
    };
    
    cards.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return [
      { name: 'New', value: counts.new, color: isDark ? '#60a5fa' : '#3b82f6' },
      { name: 'Learning', value: counts.learning, color: isDark ? '#fbbf24' : '#f59e0b' },
      { name: 'Graduated', value: counts.graduated, color: isDark ? '#34d399' : '#10b981' },
      { name: 'Known', value: counts.known, color: isDark ? '#9ca3af' : '#6b7280' },
    ];
  }, [cards, isDark]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Reviews (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: themeColors.text }} 
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: themeColors.text }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" fill={themeColors.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Card Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stability Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Memory Stability (Retention Strength)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Shows how long cards are expected to be remembered (90% retention probability). Higher is better.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: themeColors.text }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: themeColors.text }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" fill={isDark ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
