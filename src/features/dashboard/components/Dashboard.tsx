import React from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, Play, TrendingUp, Activity, Calendar } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { useSettings } from '@/contexts/SettingsContext';
import { useChartColors } from '@/hooks/useChartColors';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import { format, addDays, parseISO } from 'date-fns';

interface DashboardProps {
  metrics: { new: number; learning: number; graduated: number; known: number };
  forecast: { day: string; fullDate: string; count: number }[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: any[]; // Added to pass to RetentionStats
}

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
  <div className="flex flex-col gap-2 p-6 rounded-xl bg-secondary/20 border border-border/50">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-2">
        <span className="text-3xl font-light tracking-tight tabular-nums">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  forecast,
  stats,
  history,
  onStartSession,
  cards
}) => {
  const { settings } = useSettings();
  const colors = useChartColors();

  // Prepare forecast data for the mini chart
  const forecastData = forecast.slice(0, 7).map(item => ({
    ...item,
    day: format(parseISO(item.fullDate), 'EEE')
  }));

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
             <div className={`h-1.5 w-1.5 rounded-full bg-primary`} />
             <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
               {settings.language} Deck
             </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-light tracking-tighter text-foreground -ml-1">
                {stats.due}
            </h1>
            <p className="text-xl text-muted-foreground font-light tracking-tight">
                Cards due for review today
            </p>
          </div>

          <div className="flex gap-8 pt-4">
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-medium tabular-nums">{stats.newDue}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">New</span>
             </div>
             <div className="w-px bg-border h-10" />
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-medium tabular-nums">{stats.reviewDue}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Review</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-end gap-6">
            <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">7-Day Forecast</h3>
                    <span className="text-xs text-muted-foreground">Upcoming load</span>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecastData}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: colors.muted }} 
                                dy={10}
                            />
                            <Bar 
                                dataKey="count" 
                                fill={colors.foreground} 
                                radius={[2, 2, 2, 2]} 
                                barSize={32}
                                fillOpacity={0.9}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="group w-full bg-foreground text-background hover:opacity-90 transition-all px-8 py-5 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-foreground/5"
            >
                <span className="font-medium tracking-tight text-lg">Start Session</span>
                <Play size={18} fill="currentColor" />
            </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="New Cards" value={metrics.new} />
        <StatCard label="Learning" value={metrics.learning} />
        <StatCard label="Graduated" value={metrics.graduated} />
        <StatCard label="Mastered" value={metrics.known} />
      </section>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-muted-foreground" />
                    <h3 className="text-lg font-medium tracking-tight">Activity</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-light tabular-nums">{stats.streak}</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Day Streak</span>
                </div>
            </div>
            <div className="p-6 rounded-2xl border border-border/50 bg-background">
                <Heatmap history={history} />
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-muted-foreground" />
                <h3 className="text-lg font-medium tracking-tight">Retention</h3>
            </div>
            <RetentionStats cards={cards} />
        </div>
      </section>
    </div>
  );
};

