import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Activity, 
  Zap, 
  Trophy,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Type Imports
import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

// Contexts & Services
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';

// Child Components (Assuming these accept className or style props)
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

interface DashboardProps {
  metrics: {
    total: number;
    new: number;
    learning: number;
    reviewing: number;
    known: number;
  };
  forecast: number;
  languageXp: { xp: number; level: number };
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: CardType[];
}

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
  const currentLevel = calculateLevel(languageXp.xp);

  const { data: revlogStats } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  // Calculate progress to next level for the Progress Bar
  const currentLevelXp = (currentLevel - 1) * (currentLevel - 1) * 100;
  const nextLevelXp = currentLevel * currentLevel * 100;
  const levelProgress = ((languageXp.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div 
      className="min-h-screen bg-background px-8 md:px-16 lg:px-24 py-6 md:py-8 max-w-[1400px] mx-auto"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      
      {/* --- HERO SECTION WITH GENEROUS WHITESPACE --- */}
      <section className="mb-32 md:mb-40">
        
        {/* Warm Welcome */}
        <div className="mb-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground mb-6 tracking-tight leading-[1.1]">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
            {stats.due > 0 
              ? `You have ${stats.due} card${stats.due === 1 ? '' : 's'} waiting for review. Let's continue your journey.`
              : 'All caught up! Your dedication is admirable.'}
          </p>
        </div>

        {/* Main Stats in Minimalist Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Primary Action Card */}
          <div className="space-y-12">
            <div className="">
              <div className="space-y-12">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                    Due Today
                  </p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-8xl md:text-9xl font-light text-foreground tracking-tight tabular-nums">
                      {stats.due}
                    </span>
                    <span className="text-2xl text-muted-foreground font-light">
                      card{stats.due === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-8 pt-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-3 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      New
                    </p>
                    <p className="text-3xl md:text-4xl font-light text-foreground tabular-nums">
                      {stats.newDue}
                    </p>
                  </div>
                  <div className="w-px bg-border" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-3 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      Review
                    </p>
                    <p className="text-3xl md:text-4xl font-light text-foreground tabular-nums">
                      {stats.reviewDue}
                    </p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={onStartSession}
                  disabled={stats.due === 0}
                  className="text-foreground h-14 text-sm uppercase tracking-[0.15em] font-medium rounded-sm border border-terracotta bg-transparent hover:bg-terracotta/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-muted"
                  style={{ 
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: '',
                    color: ''
                  }}
                >
                  <Play className="w-4 h-4 mr-3 fill-current" /> 
                  Begin Review
                </Button>
              </div>
            </div>
          </div>

          {/* Progress & Stats */}
          <div className="space-y-8">
            
            {/* Level Progress */}
            <div className="bg-card rounded-3xl p-10 md:p-12 border border-border">
              <div className="space-y-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      Level
                    </p>
                    <p className="text-5xl font-light text-foreground tabular-nums">
                      {currentLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-2 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      Experience
                    </p>
                    <p className="text-2xl font-light text-foreground tabular-nums">
                      {languageXp.xp.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-light">Progress to Level {currentLevel + 1}</span>
                    <span className="text-foreground font-medium tabular-nums">{Math.round(levelProgress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4">
              <MetricRow icon={Zap} label="Current Streak" value={stats.streak} unit="days" />
              <MetricRow icon={Activity} label="Total Reviews" value={stats.totalReviews.toLocaleString()} />
              <MetricRow icon={Trophy} label="Points Earned" value={profile?.points?.toLocaleString() ?? '0'} />
            </div>
          </div>
        </div>
      </section>

      {/* --- COLLECTION OVERVIEW --- */}
      <section className="mb-32 md:mb-40">
        <SectionHeader title="Your Collection" subtitle="A snapshot of your learning progress" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <StatCard label="Unseen" value={metrics.new} />
          <StatCard label="Learning" value={metrics.learning} />
          <StatCard label="Mature" value={metrics.reviewing} />
          <StatCard label="Known" value={metrics.known} />
        </div>
      </section>

      {/* --- ACTIVITY PATTERNS --- */}
      <section className="mb-32 md:mb-40">
        <SectionHeader title="Activity Patterns" subtitle="Your study history at a glance" />
        
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-border hidden md:block">
          <Heatmap history={history} />
        </div>
      </section>

      {/* --- PERFORMANCE INSIGHTS --- */}
      <section className="mb-32 md:mb-40">
        <SectionHeader title="Performance Insights" subtitle="Understanding your progress over time" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-card rounded-3xl p-10 md:p-12 border border-border">
            <h4 className="text-lg font-normal text-foreground mb-8 tracking-tight">Review Volume</h4>
            <div className="min-h-[280px]">
              {revlogStats && <ReviewVolumeChart data={revlogStats.activity} />}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-10 md:p-12 border border-border">
            <h4 className="text-lg font-normal text-foreground mb-8 tracking-tight">Retention Rate</h4>
            <div className="min-h-[280px]">
              {revlogStats && (
                <TrueRetentionChart 
                  data={revlogStats.retention} 
                  targetRetention={settings.fsrs.request_retention} 
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- DECK HEALTH --- */}
      <section className="mb-20">
        <SectionHeader title="Deck Health" subtitle="Overall retention and card stability metrics" />
        
        <div className="bg-card rounded-3xl p-10 md:p-14 border border-border">
          <RetentionStats cards={cards} />
        </div>
      </section>
    </div>
  );
};

// Helper Components for Clean, Minimal Design

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-12 md:mb-16">
    <h2 className="text-3xl md:text-4xl font-light text-foreground mb-3 tracking-tight">
      {title}
    </h2>
    {subtitle && (
      <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-card rounded-2xl p-8 md:p-10 border border-border hover:border-muted-foreground/30 transition-colors duration-300">
    <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mb-4 font-light" style={{ fontFamily: 'var(--font-sans)' }}>
      {label}
    </p>
    <p className="text-4xl md:text-5xl font-light text-foreground tabular-nums tracking-tight">
      {value.toLocaleString()}
    </p>
  </div>
);

const MetricRow = ({ 
  icon: Icon, 
  label, 
  value, 
  unit 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  unit?: string;
}) => (
  <div className="bg-card rounded-2xl p-6 md:p-7 border border-border flex items-center justify-between hover:border-muted-foreground/30 transition-colors duration-300">
    <div className="flex items-center gap-4">
      <Icon className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
      <span className="text-sm text-muted-foreground font-light tracking-wide" style={{ fontFamily: 'var(--font-sans)' }}>
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl md:text-3xl font-light text-foreground tabular-nums">
        {value}
      </span>
      {unit && (
        <span className="text-sm text-muted-foreground font-light">
          {unit}
        </span>
      )}
    </div>
  </div>
);