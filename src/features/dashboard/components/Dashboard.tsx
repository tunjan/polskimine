import React, { useMemo } from 'react';
import { Card as CardType, DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, Play } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { useSettings } from '@/contexts/SettingsContext';
import { useChartColors } from '@/hooks/useChartColors';
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis
} from 'recharts';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

interface DashboardProps {
  metrics: { new: number; learning: number; graduated: number; known: number };
  forecast: { day: string; fullDate: string; count: number }[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
}

// Ultra Minimal Stat
const StatItem = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
    <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-4xl lg:text-6xl font-light tracking-tighter text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted-foreground font-medium">{sub}</span>}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  forecast,
  stats,
  history,
  onStartSession,
}) => {
  const { settings } = useSettings();
  const colors = useChartColors();

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10">
        <div className="space-y-2 md:space-y-4">
            {/* Responsive text sizing: 5xl on mobile, 8xl on desktop */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground leading-[0.9]">
                {stats.due} <span className="text-muted-foreground/30">Due</span>
            </h1>
            <div className="flex gap-4 pl-1 md:pl-2">
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                   {settings.language} — {stats.total} Total Cards
                </p>
                <span className="text-muted-foreground/30 font-mono text-xs">|</span>
                <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
                   <span className="text-primary">{stats.newDue} New</span> / {stats.reviewDue} Review
                </p>
            </div>
        </div>
        <div className="pb-2 w-full md:w-auto">
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="w-full md:w-auto justify-center group relative flex items-center gap-4 pl-8 pr-6 py-4 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg md:shadow-none"
            >
                <span className="relative z-10">Start Session</span>
                <div className="relative z-10 w-6 h-6 bg-background rounded-full flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                    <Play size={10} fill="currentColor" className="ml-0.5" />
                </div>
            </button>
        </div>
      </section>

      {/* Data Grid - 2 columns on mobile, 4 on desktop */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-4 md:gap-16 border-t border-border pt-12 md:pt-16">
        <StatItem label="New" value={metrics.new} />
        <StatItem label="Learning" value={metrics.learning} />
        <StatItem label="Review" value={metrics.graduated} />
        <StatItem label="Mastered" value={metrics.known} />
      </section>

      {/* Analytics Row */}
      <section className="flex flex-col gap-12 md:gap-16 border-t border-border pt-12 md:pt-16">
        
        {/* Heatmap */}
        <div className="space-y-6 md:space-y-8 overflow-hidden">
            <div className="flex items-baseline justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Consistency</h3>
                <span className="text-xs text-foreground font-medium">{stats.streak} Day Streak</span>
            </div>
            <Heatmap history={history} />
        </div>

        {/* Forecast Chart - Utilitarian Style */}
        <div className="space-y-6 md:space-y-8">
            <div className="flex items-baseline justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Forecast</h3>
                <span className="text-xs text-muted-foreground">Next 14 Days</span>
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast} barGap={0}>
                        <Tooltip 
                          cursor={{ fill: colors.muted }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                              <div
                                className="text-[10px] py-1 px-2 font-mono rounded shadow-sm text-primary-foreground"
                                style={{ backgroundColor: colors.primary }}
                              >
                              {payload[0].payload.fullDate}: <span className="font-bold">{payload[0].value}</span>
                              </div>
                            );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill={colors.primary} radius={[2, 2, 2, 2]} barSize={8} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>
    </div>
  );
};