import React from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, Info } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { LevelProgressBar } from './LevelProgressBar';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

interface DashboardProps {
    metrics: { new: number; learning: number; graduated: number; known: number };
    forecast: { day: string; fullDate: string; count: number }[];
    stats: DeckStats;
    history: ReviewHistory;
    onStartSession: () => void;
    cards: any[];
    languageXp: number;
}

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-2">
        <span className="text-4xl md:text-5xl font-light tracking-tighter tabular-nums">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  </div>
);

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

export const Dashboard: React.FC<DashboardProps> = ({
        metrics,
        stats,
        history,
        onStartSession,
        cards,
        languageXp
}) => {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const currentLevel = calculateLevel(languageXp);

  const { data: revlogStats } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  return (
    <div className="space-y-24 animate-in fade-in duration-700 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left: Main Counter */}
        <div className="lg:col-span-7 space-y-12">
          <div className="flex items-center gap-3">
             <div className={`h-1.5 w-1.5 rounded-full bg-primary`} />
             <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
               {settings.language} Deck
             </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-8xl sm:text-9xl lg:text-[10rem] font-light tracking-tighter text-foreground -ml-1 leading-[0.8]">
                {stats.due}
            </h1>
            <p className="text-xl text-muted-foreground font-light tracking-tight pl-2">
                Cards due today
            </p>
          </div>

          <div className="flex gap-16 pt-4 pl-1">
             <div className="flex flex-col gap-1">
                <span className="text-3xl font-light tabular-nums">{stats.newDue}</span>
                {/* Changed label from "Unseen" to "New" */}
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">New</span>
             </div>
             <div className="w-px bg-border/60 h-12" />
             <div className="flex flex-col gap-1">
                <span className="text-3xl font-light tabular-nums">{stats.reviewDue}</span>
                {/* Changed label from "Mature" to "Reviews" to avoid collision with "Learning" */}
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reviews</span>
             </div>
          </div>
        </div>

        {/* Right: Action & Profile */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full gap-16 pt-4">
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="group w-full bg-transparent hover:bg-transparent text-foreground transition-all flex items-center justify-between gap-4 disabled:opacity-30 disabled:cursor-not-allowed border-b border-foreground/20 hover:border-foreground pb-6"
            >
                <span className="font-light tracking-tight text-4xl md:text-5xl">Start Session</span>
                <ArrowRight size={40} className="group-hover:translate-x-4 transition-transform opacity-50 group-hover:opacity-100" strokeWidth={1} />
            </button>

            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Level {currentLevel}</span>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums">
                            {languageXp.toLocaleString()} <span className="text-sm text-muted-foreground font-mono">XP</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Balance</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={10} className="text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs p-3 font-mono text-xs">
                                        Points are used in the Sabotage Store.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums text-foreground">
                            {profile?.points?.toLocaleString() ?? 0} <span className="text-sm text-muted-foreground font-mono">PTS</span>
                        </div>
                    </div>
                </div>
                <LevelProgressBar xp={languageXp} level={currentLevel} />
            </div>
        </div>
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- STATS GRID --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-12">
        {/* Labels kept as requested, but data source is now bucketed by interval */}
        <StatCard label="Unseen" value={metrics.new} />
        <StatCard label="Learning" value={metrics.learning} />
        <StatCard label="Mature" value={metrics.graduated} />
        <StatCard label="Known" value={metrics.known} />
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- ACTIVITY HEATMAP --- */}
      <section className="space-y-8">
          <div className="flex items-end justify-between">
              <div className="space-y-1">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Activity Map</h3>
                  <p className="text-3xl font-light tracking-tight">{stats.streak} Day Streak</p>
              </div>
              <div className="hidden md:block text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Reviews</span>
                    <p className="text-xl font-mono font-light">{stats.totalReviews.toLocaleString()}</p>
              </div>
          </div>
          
          <div className="w-full overflow-hidden">
              <Heatmap history={history} />
          </div>
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- ANALYTICS SECTION --- */}
      {revlogStats && (
        <section className="space-y-12">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="text-sm font-medium tracking-tight">Performance Analytics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 h-auto md:h-64">
                {/* 1. Volume */}
                <div className="col-span-1">
                    <ReviewVolumeChart data={revlogStats.activity} />
                </div>

                {/* 2. Retention */}
                <div className="col-span-1 border-t md:border-t-0 md:border-l border-border/50 pt-8 md:pt-0 md:pl-8">
                    <TrueRetentionChart 
                        data={revlogStats.retention} 
                        targetRetention={settings.fsrs.request_retention} 
                    />
                </div>
            </div>
        </section>
      )}
      
      <div className="w-full h-px bg-border" />

      {/* --- WORKLOAD & STABILITY --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <RetentionStats cards={cards} />
      </section>
    </div>
  );
};