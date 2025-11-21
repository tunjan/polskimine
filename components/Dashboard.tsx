import React, { useMemo } from 'react';
import { Card, DeckStats, ReviewHistory } from '../types';
import { Play, Sun, Moon } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface DashboardProps {
  cards: Card[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  stats,
  history,
  onStartSession,
}) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
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
    return counts;
  }, [cards]);

  // --- Chart Data Preparation ---

  // 1. Forecast Data
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
    
    data[0].label = 'Today';
    data[1].label = 'Tmrw';
    return data;
  }, [cards]);

  // 2. Stability Data
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

  // 3. Retention Data
  const retentionData = useMemo(() => {
      // TODO: Implement real retention tracking based on review logs
      return [];
  }, []);

  const themeColors = {
    bar: isDark ? '#60a5fa' : '#3b82f6', // Blue
    barStability: isDark ? '#34d399' : '#10b981', // Emerald
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#1f2937' : '#e5e7eb',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f3f4f6' : '#111827',
    line: isDark ? '#f472b6' : '#db2777', // Pinkish
  };

  return (
    <div className="space-y-12">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Witaj!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {stats.due > 0 ? `${stats.due} Reviews Due Today.` : 'No reviews due right now.'}
            </p>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className={`bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 ${
                  stats.due === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-800 dark:hover:bg-gray-200'
                }`}
            >
                <Play size={18} fill="currentColor" />
                Start Studying
            </button>
            <button 
                onClick={toggleTheme}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Toggle theme"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Section 1: Core Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="flex flex-col">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{metrics.new}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">New</span>
        </div>
        <div className="flex flex-col">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{metrics.learning}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Learning</span>
        </div>
        <div className="flex flex-col">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{metrics.graduated}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Graduated</span>
        </div>
        <div className="flex flex-col">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{metrics.known}</span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">Known</span>
        </div>
      </section>

      {/* Section 2: Activity & Schedule */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Activity Heatmap */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity (Last 365 Days)</h3>
            <div className="w-full overflow-hidden">
                <Heatmap history={history} />
            </div>
        </div>

        {/* Forecast */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews Forecast (Next 30 Days)</h3>
            <div className="h-48 w-full min-h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: themeColors.text }} 
                            interval={4}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText }}
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="count" fill={themeColors.bar} radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>

      {/* Section 3: Progress & Retention */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Retention Rate */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Retention Rate</h3>
            <div className="h-48 w-full min-h-48">
                {retentionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retentionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
                            <XAxis 
                                dataKey="day" 
                                tick={{ fontSize: 10, fill: themeColors.text }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                domain={[0.5, 1]} 
                                tick={{ fontSize: 10, fill: themeColors.text }} 
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText }}
                                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Retention']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke={themeColors.line} 
                                strokeWidth={2} 
                                dot={false} 
                                activeDot={{ r: 4 }} 
                            />
                            {/* Target line */}
                            <Line 
                                type="monotone" 
                                dataKey={() => 0.9} 
                                stroke={themeColors.text} 
                                strokeDasharray="3 3" 
                                strokeWidth={1} 
                                dot={false} 
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No retention data available yet</p>
                    </div>
                )}
            </div>
        </div>

        {/* Stability Distribution */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Card Stability</h3>
            <div className="h-48 w-full min-h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stabilityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeColors.grid} opacity={0.5} />
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: themeColors.text }} 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: `1px solid ${themeColors.tooltipBorder}`, backgroundColor: themeColors.tooltipBg, color: themeColors.tooltipText }}
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        />
                        <Bar dataKey="count" fill={themeColors.barStability} radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>
    </div>
  );
};