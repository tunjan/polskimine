import React from 'react';
import { 
  Play, 
  Activity, 
  Zap, 
  Trophy,
  BookOpen,
  Sparkles,
  Target,
  Flame,
  Star
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Type Imports
import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

// Contexts & Services
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { getLevelProgress } from '@/lib/utils';

// Game UI Components
import { 
  GamePanel, 
  GameStat, 
  GameSectionHeader, 
  GameProgressBar,
  GameButton,
  GameMetricRow,
  GameDivider
} from '@/components/ui/game-ui';

// Child Components
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

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1100px] mx-auto font-editorial">
      
      {/* --- HERO SECTION --- */}
      <section className="mb-10 md:mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Primary Action Card - Today's Mission */}
          <GamePanel variant="highlight" size="lg" glowOnHover className="flex flex-col justify-between min-h-[260px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" strokeWidth={2} />
                </div>
                <p className="text-xs text-foreground/80 uppercase tracking-[0.2em] font-medium font-ui">
                  Today's Mission
                </p>
              </div>
              {stats.due > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium uppercase tracking-wider rounded-full">
                  Ready
                </span>
              )}
            </div>
            
            {/* Main Stats */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <span className="text-6xl md:text-7xl font-light text-foreground tracking-tight tabular-nums">
                  {stats.due}
                </span>
                <p className="text-sm text-muted-foreground font-light mt-1">
                  card{stats.due === 1 ? '' : 's'} waiting for you
                </p>
              </div>
              
              {/* Breakdown */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} fill="currentColor" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-ui">New</span>
                  </div>
                  <p className="text-2xl font-light text-foreground tabular-nums">{stats.newDue}</p>
                </div>
                
                <div className="h-8 w-px bg-border" />
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Activity className="w-3.5 h-3.5 text-sky-500" strokeWidth={2} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-ui">Review</span>
                  </div>
                  <p className="text-2xl font-light text-foreground tabular-nums">{stats.reviewDue}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <GameButton 
              size="lg" 
              onClick={onStartSession}
              disabled={stats.due === 0}
              className="w-full mt-6"
              variant={stats.due > 0 ? 'primary' : 'ghost'}
            >
              <Play className="w-4 h-4 fill-current" /> 
              {stats.due > 0 ? 'Start Session' : 'All Caught Up'}
            </GameButton>
          </GamePanel>

          {/* Progress & Stats */}
          <div className="space-y-4">
            
            {/* Level Progress */}
            <GamePanel size="md" glowOnHover>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                        Level
                      </p>
                    </div>
                    <p className="text-3xl font-light text-foreground tabular-nums">
                      {levelData.level}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                      <Sparkles className="w-3 h-3 text-primary/60" strokeWidth={1.5} />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                        Experience
                      </p>
                    </div>
                    <p className="text-lg font-light text-foreground tabular-nums">
                      {languageXp.xp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
                
                <GameProgressBar
                  value={levelData.progressPercent}
                  variant="xp"
                  label={`${levelData.xpToNextLevel.toLocaleString()} XP to Level ${levelData.level + 1}`}
                />
              </div>
            </GamePanel>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-2">
              <GameMetricRow 
                icon={<Flame className="w-4 h-4" strokeWidth={1.5} />} 
                label="Current Streak" 
                value={stats.streak} 
                unit="days" 
              />
              <GameMetricRow 
                icon={<Activity className="w-4 h-4" strokeWidth={1.5} />} 
                label="Total Reviews" 
                value={stats.totalReviews.toLocaleString()} 
              />
              <GameMetricRow 
                icon={<Trophy className="w-4 h-4" strokeWidth={1.5} />} 
                label="Points Earned" 
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
          <EmptyState 
            icon={BookOpen}
            title="No cards yet"
            description="Start by adding some cards to your deck to begin learning."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <GameStat label="New" value={metrics.new} sublabel="Unseen cards" />
            <GameStat label="Learning" value={metrics.learning} sublabel="Currently studying" />
            <GameStat label="Reviewing" value={metrics.reviewing} sublabel="Mature cards" />
            <GameStat label="Mastered" value={metrics.known} sublabel="Fully learned" />
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
          <EmptyState 
            icon={Activity}
            title="No activity yet"
            description="Complete your first review session to see your activity patterns."
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
          <EmptyState 
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
          <EmptyState 
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

// Helper Components

const EmptyState: React.FC<{ 
  icon: React.ElementType; 
  title: string; 
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <GamePanel className="p-8 md:p-12 border-dashed flex flex-col items-center justify-center text-center">
    <div className="relative mb-4">
      {/* Decorative ring */}
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      {/* Corner accents */}
      <span className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30" />
      <span className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30" />
      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-primary/30" />
      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-primary/30" />
    </div>
    <h3 className="text-sm font-medium text-foreground mb-1 font-ui">{title}</h3>
    <p className="text-xs text-muted-foreground font-light max-w-60">{description}</p>
  </GamePanel>
);

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