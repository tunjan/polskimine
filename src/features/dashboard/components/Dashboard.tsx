import React, { useMemo } from 'react';
import { 
  Play, 
  Activity, 
  Zap, 
  Trophy,
  BookOpen,
  Sparkles,
  Target,
  Star,
  Circle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, format } from 'date-fns';


import { DeckStats, ReviewHistory, Card as CardType } from '@/types';


import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { getLevelProgress } from '@/lib/utils';


import { 
  GamePanel, 
  GameStat, 
  GameSectionHeader, 
  GameButton,
  GameMetricRow,
  GameDivider,
  LevelBadge,
  StreakDisplay,
  CircularProgress,
  GameEmptyState,
  CardDistributionBar
} from '@/components/ui/game-ui';


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
  languageXp: { xp: number; level: number };
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: CardType[];
}


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
  
  const levelData = getLevelProgress(languageXp.xp);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  // Calculate last 7 days for streak display
  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  // Check if streak is at risk (no reviews today)
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  // Card distribution segments for the bar
  const cardSegments = [
    { label: 'New', value: metrics.new, color: 'bg-sky-500' },
    { label: 'Learning', value: metrics.learning, color: 'bg-amber-500' },
    { label: 'Reviewing', value: metrics.reviewing, color: 'bg-violet-500' },
    { label: 'Mastered', value: metrics.known, color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1100px] mx-auto font-editorial">
      
      {/* --- HERO SECTION --- */}
      <section className="mb-10 md:mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Primary Action Card - Today's Mission (Genshin-inspired) */}
          <GamePanel variant="highlight" size="lg" glowOnHover showCorners className="flex flex-col justify-between min-h-[280px] overflow-hidden relative border-primary/20">
            {/* Decorative background pattern - Genshin Commission Style */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Top accent line with diamond endpoints */}
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border border-primary/40 bg-background" />
              
              {/* Geometric constellation pattern */}
  
              
              {/* Floating diamond particles */}
              <div className="absolute top-8 left-8 w-1.5 h-1.5 rotate-45 bg-primary/20 animate-pulse" />
              <div className="absolute top-16 right-12 w-1 h-1 rotate-45 bg-primary/30 animate-pulse delay-500" />
              <div className="absolute bottom-20 left-16 w-1 h-1 rotate-45 bg-primary/25 animate-pulse delay-1000" />
              <div className="absolute bottom-12 right-1/4 w-1.5 h-1.5 rotate-45 border border-primary/20 animate-pulse delay-700" />
              
              {/* Side accent lines */}
              <div className="absolute left-0 top-1/4 w-px h-1/2 bg-linear-to-b from-transparent via-primary/20 to-transparent" />
              <div className="absolute right-0 top-1/4 w-px h-1/2 bg-linear-to-b from-transparent via-primary/20 to-transparent" />
            </div>
            
        

            {/* Main Stats */}
            <div className="flex-1 flex flex-col justify-center py-2 relative z-10">
              <div className="flex items-center justify-center gap-8 md:gap-12 mb-6">
                {/* Left decorative wing */}
       

                <div className="text-center relative">
 
                  
                  <div className="relative">
                    <div className="text-6xl md:text-8xl font-light text-foreground tracking-tighter tabular-nums relative inline-block">
                      {stats.due}
                      {stats.due === 0 && (
                        <div className="absolute -top-3 -right-5 animate-in zoom-in duration-300">
                          <div className="relative">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            <div className="absolute inset-0 w-7 h-7 bg-emerald-500/20 blur-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rotate-45 bg-border/60" />
                      <div className="h-px w-6 bg-border/40" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium tracking-[0.2em] uppercase">
                      {stats.due === 1 ? 'Card' : 'Cards'} Remaining
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="h-px w-6 bg-border/40" />
                      <div className="w-1 h-1 rotate-45 bg-border/60" />
                    </div>
                  </div>
                </div>

       
              </div>
              
              {/* Rewards Section - Styled like Genshin item rewards */}
              <div className="flex justify-center gap-3 md:gap-6">
                {/* New Cards Reward */}
                <div className="group relative flex flex-row items-center gap-2 md:gap-6">
                  <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    {/* Item frame */}
                    <div className="absolute inset-0 border border-amber-500/30 rotate-45 group-hover:border-amber-500/50 transition-colors" />
                    <div className="absolute inset-1 border border-amber-500/10 rotate-45" />
                    {/* Icon */}
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 group-hover:scale-110 transition-transform relative z-10" fill="currentColor" />
                  </div>
                  <div className="text-left">
                    <span className="block text-base md:text-lg font-medium leading-none tabular-nums">{stats.newDue}</span>
                    <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 block">New</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center opacity-30">
                  <div className="h-px w-2 md:w-4 bg-border" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rotate-45 border border-border mx-0.5 md:mx-1" />
                  <div className="h-px w-2 md:w-4 bg-border" />
                </div>

                {/* Review Cards Reward */}
                <div className="group relative flex flex-row items-center gap-2 md:gap-6">
                  <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    {/* Item frame */}
                    <div className="absolute inset-0 border border-sky-500/30 rotate-45 group-hover:border-sky-500/50 transition-colors" />
                    <div className="absolute inset-1 border border-sky-500/10 rotate-45" />
                    {/* Icon */}
                    <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-sky-500 group-hover:scale-110 transition-transform relative z-10" />
                  </div>
                  <div className="text-left">
                    <span className="block text-base md:text-lg font-medium leading-none tabular-nums">{stats.reviewDue}</span>
                    <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 block">Review</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="relative mt-4 z-10">
              {/* Decorative line above button */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px flex-1 bg-linear-to-r from-transparent to-border/40" />
                <div className="w-1.5 h-1.5 rotate-45 border border-primary/30" />
                <div className="h-px flex-1 bg-linear-to-l from-transparent to-border/40" />
              </div>
              
              <GameButton 
                size="lg" 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="w-full relative overflow-hidden group border-primary/40 hover:border-primary/70 transition-all duration-300"
                variant={stats.due > 0 ? 'primary' : 'ghost'}
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {/* Button content */}
                <span className="flex items-center justify-center gap-3 py-0.5">
                  {stats.due > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rotate-45 bg-current opacity-40" />
                        <span className="w-1.5 h-1.5 rotate-45 bg-current opacity-60" />
                      </div>
                      <Play className="w-4 h-4 fill-current" />
                      <span className="tracking-[0.2em] font-bold">BEGIN</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rotate-45 bg-current opacity-60" />
                        <span className="w-1 h-1 rotate-45 bg-current opacity-40" />
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="tracking-[0.15em] font-medium">COMMISSION COMPLETE</span>
                    </>
                  )}
                </span>
              </GameButton>
            </div>
          </GamePanel>

          {/* Progress & Stats */}
          <div className="space-y-4">
            
            {/* Level Badge - Enhanced */}
            <GamePanel size="md" glowOnHover className="bg-linear-to-br from-card to-primary/5">
              <LevelBadge
                level={levelData.level}
                xp={languageXp.xp}
                progressPercent={levelData.progressPercent}
                xpToNextLevel={levelData.xpToNextLevel}
                showDetails={true}
              />
            </GamePanel>

            {/* Streak Display - Enhanced */}
            <GamePanel size="md" glowOnHover>
              <StreakDisplay
                currentStreak={stats.streak}
                lastSevenDays={lastSevenDays}
                isAtRisk={isStreakAtRisk}
              />
            </GamePanel>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <GameMetricRow 
                icon={<Activity className="w-4 h-4 text-sky-500" strokeWidth={1.5} />} 
                label="Reviews" 
                value={stats.totalReviews.toLocaleString()} 
              />
              <GameMetricRow 
                icon={<Trophy className="w-4 h-4 text-yellow-500" strokeWidth={1.5} />} 
                label="Points" 
                value={profile?.points?.toLocaleString() ?? '0'} 
              />
            </div>
          </div>
        </div>
      </section>

      <GameDivider />

      {/* --- COLLECTION OVERVIEW --- */}
      <section className="mb-10 md:mb-12">
        <GameSectionHeader 
          title="Your Collection" 
          subtitle="A snapshot of your learning progress" 
          icon={<BookOpen className="w-4 h-4" strokeWidth={1.5} />}
        />
        
        {hasNoCards ? (
          <GameEmptyState 
            icon={BookOpen}
            title="No cards yet"
            description="Start by adding some cards to your deck to begin learning."
            action={{ label: 'Add Cards', onClick: () => {} }}
          />
        ) : (
          <div className="space-y-5">

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <GameStat 
                label="New" 
                value={metrics.new} 
                sublabel="Unseen cards" 
                icon={<Circle className="w-3.5 h-3.5" />}
                color="sky"
              />
              <GameStat 
                label="Learning" 
                value={metrics.learning} 
                sublabel="Currently studying" 
                icon={<Clock className="w-3.5 h-3.5" />}
                color="amber"
              />
              <GameStat 
                label="Reviewing" 
                value={metrics.reviewing} 
                sublabel="Mature cards" 
                icon={<Activity className="w-3.5 h-3.5" />}
                color="violet"
              />
              <GameStat 
                label="Mastered" 
                value={metrics.known} 
                sublabel="Fully learned" 
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                color="emerald"
              />
            </div>
            
          </div>
        )}
      </section>

      {/* --- ACTIVITY PATTERNS --- */}
      <section className="mb-10 md:mb-12">
        <GameSectionHeader 
          title="Activity Patterns" 
          subtitle="Your study history at a glance"
          icon={<Activity className="w-4 h-4" strokeWidth={1.5} />}
        />
        
        {hasNoActivity ? (
          <GameEmptyState 
            icon={Activity}
            title="No activity yet"
            description="Complete your first review session to see your activity patterns."
            action={{ label: 'Start Learning', onClick: onStartSession }}
          />
        ) : (
          <GamePanel size="md">
            <Heatmap history={history} />
          </GamePanel>
        )}
      </section>

      {/* --- PERFORMANCE INSIGHTS --- */}
      <section className="mb-10 md:mb-12">
        <GameSectionHeader 
          title="Performance Insights" 
          subtitle="Understanding your progress over time"
          icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
        />
        
        {hasNoActivity ? (
          <GameEmptyState 
            icon={Sparkles}
            title="No data available"
            description="Review some cards to unlock performance insights."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            <GamePanel size="md">
              <h4 className="text-sm font-medium text-foreground mb-4 tracking-tight font-ui flex items-center gap-2">
                <span className="w-1 h-1 rotate-45 bg-primary/60" />
                Review Volume
              </h4>
              <div className="min-h-[180px] md:min-h-[200px]">
                {isRevlogLoading ? (
                  <ChartSkeleton />
                ) : revlogStats ? (
                  <ReviewVolumeChart data={revlogStats.activity} />
                ) : (
                  <ChartEmpty />
                )}
              </div>
            </GamePanel>

            <GamePanel size="md">
              <h4 className="text-sm font-medium text-foreground mb-4 tracking-tight font-ui flex items-center gap-2">
                <span className="w-1 h-1 rotate-45 bg-primary/60" />
                Retention Rate
              </h4>
              <div className="min-h-[180px] md:min-h-[200px]">
                {isRevlogLoading ? (
                  <ChartSkeleton />
                ) : revlogStats ? (
                  <TrueRetentionChart 
                    data={revlogStats.retention} 
                    targetRetention={settings.fsrs.request_retention} 
                  />
                ) : (
                  <ChartEmpty />
                )}
              </div>
            </GamePanel>
          </div>
        )}
      </section>

      {/* --- DECK HEALTH --- */}
      <section className="mb-8">
        <GameSectionHeader 
          title="Deck Health" 
          subtitle="Overall retention and card stability metrics"
          icon={<Zap className="w-4 h-4" strokeWidth={1.5} />}
        />
        
        {hasNoCards ? (
          <GameEmptyState 
            icon={Activity}
            title="No cards to analyze"
            description="Add cards to your deck to see health metrics."
          />
        ) : (
          <GamePanel size="md">
            <RetentionStats cards={cards} />
          </GamePanel>
        )}
      </section>
    </div>
  );
};


const ChartSkeleton: React.FC = () => (
  <div className="h-full w-full flex items-end gap-1 animate-pulse">
    {Array.from({ length: 12 }).map((_, i) => (
      <div 
        key={i} 
        className="flex-1 bg-muted/50 rounded-sm" 
        style={{ height: `${20 + Math.random() * 60}%` }}
      />
    ))}
  </div>
);

const ChartEmpty: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <p className="text-xs text-muted-foreground font-light font-ui">No data available</p>
  </div>
);