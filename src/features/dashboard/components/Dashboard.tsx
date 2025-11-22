import React from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, TrendingUp, Activity, Info } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { LevelProgressBar } from './LevelProgressBar';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChartColors } from '@/hooks/useChartColors';
import { format, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardProps {
    metrics: { new: number; learning: number; graduated: number; known: number };
    forecast: { day: string; fullDate: string; count: number }[];
    stats: DeckStats;
    history: ReviewHistory;
    onStartSession: () => void;
    cards: any[]; // Added to pass to RetentionStats
    languageXp: number; // Per-language XP
}

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-2">
        <span className="text-4xl font-light tracking-tighter tabular-nums">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  </div>
);

// Helper to calculate level from XP
const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

export const Dashboard: React.FC<DashboardProps> = ({
        metrics,
        forecast,
        stats,
        history,
        onStartSession,
        cards,
        languageXp
}) => {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const colors = useChartColors();

    // Calculate level based on language specific XP
    const currentLevel = calculateLevel(languageXp);

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Stats & Due */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Deck Identifier */}
          <div className="flex items-center gap-3">
             <div className={`h-1.5 w-1.5 rounded-full bg-primary`} />
             <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
               {settings.language} Deck
             </span>
          </div>
          
          {/* Main Counter */}
          <div className="space-y-2">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-light tracking-tighter text-foreground -ml-1">
                {stats.due}
            </h1>
            <p className="text-xl text-muted-foreground font-light tracking-tight">
                Cards due for review today
            </p>
          </div>

             {/* Breakdown Stats (Renamed: New->Unseen, Review->Mature) */}
          <div className="flex gap-12 pt-4">
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-medium tabular-nums">{stats.newDue}</span>
                     <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Unseen</span>
             </div>
             <div className="w-px bg-border h-10" />
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-medium tabular-nums">{stats.reviewDue}</span>
                     <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Mature</span>
             </div>
          </div>
        </div>

        {/* Right Column: Actions & User Stats */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full gap-12">
            
            {/* Start Button */}
            <div className="pt-2">
                <button 
                    onClick={onStartSession}
                    disabled={stats.due === 0}
                    className="group w-full bg-transparent hover:bg-transparent text-foreground transition-all py-2 flex items-center justify-between gap-4 disabled:opacity-50 disabled:cursor-not-allowed border-b border-foreground/20 hover:border-foreground pb-6"
                >
                    <span className="font-light tracking-tight text-4xl">Start Session</span>
                    <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform opacity-50 group-hover:opacity-100" />
                </button>
            </div>

            {/* Profile XP / Points Widget + Level Progress */}
            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{settings.language} XP</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={12} className="text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs p-4 bg-popover border-border">
                                        <div className="space-y-3">
                                            <p className="font-semibold text-sm">XP Breakdown:</p>
                                            <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-3">
                                                <li><span className="text-foreground font-medium">New Card:</span> +50 XP</li>
                                                <li><span className="text-foreground font-medium">Review (Good/Easy):</span> +10 XP</li>
                                                <li><span className="text-foreground font-medium">Review (Hard):</span> +5 XP</li>
                                                <li><span className="text-foreground font-medium">Review (Again):</span> +1 XP</li>
                                            </ul>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums">
                            {languageXp.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Points</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={12} className="text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs p-4 bg-popover border-border">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Points are earned 1:1 with XP but are a <span className="text-foreground font-medium">spendable currency</span>. Use them in the Sabotage Store.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums text-primary">
                            {profile?.points?.toLocaleString() ?? 0}
                        </div>
                    </div>
                </div>
                {/* New Level Progress Bar using Language XP and Level */}
                <div className="pt-4 border-t border-border/40">
                    <LevelProgressBar xp={languageXp} level={currentLevel} />
                </div>
            </div>
        </div>
      </section>

            {/* Stats Grid (Renamed labels) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-border/50 pt-12">
                <StatCard label="Unseen" value={metrics.new} />
        <StatCard label="Learning" value={metrics.learning} />
                <StatCard label="Mature" value={metrics.graduated} />
                <StatCard label="Known" value={metrics.known} />
      </section>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-1 gap-8 lg:gap-12">
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

