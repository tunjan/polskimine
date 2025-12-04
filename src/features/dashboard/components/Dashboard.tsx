import React, { useMemo } from 'react';
import { 
  Activity, 
  Zap, 
  Trophy,
  BookOpen,
  Sparkles,
  Target,
  Star,
  Circle,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, format } from 'date-fns';

import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { getLevelProgress, cn } from '@/lib/utils';

import { 
  GamePanel, 
  GameSectionHeader, 
  GameDivider,
  LevelBadge,
  StreakDisplay,
  GameEmptyState,
  getRankForLevel
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
  const rank = getRankForLevel(levelData.level);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.015] dark:opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 10L30 15L25 10Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1200px] mx-auto">
        
        {/* === CHARACTER BANNER SECTION === */}
        <section className="mb-8 md:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            
            {/* Left: Character Card / Profile */}
            <div className="relative">
              <GamePanel 
                variant="ornate" 
                size="lg" 
                showCorners 
                className="h-full bg-linear-to-br from-card via-card to-primary/5"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-0.5 bg-linear-to-r from-transparent via-primary/60 to-transparent" />
                
                {/* Level Emblem */}
                <div className="flex flex-col items-center pt-2 pb-4">
                  <LevelBadge
                    level={levelData.level}
                    xp={languageXp.xp}
                    progressPercent={levelData.progressPercent}
                    xpToNextLevel={levelData.xpToNextLevel}
                    showDetails={false}
                  />
                  
                  {/* Rank Title */}
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <span className="w-6 h-px bg-primary/40" />
                      <span className={cn("text-[10px] font-bold uppercase tracking-[0.25em]", rank.color)}>
                        {rank.title}
                      </span>
                      <span className="w-6 h-px bg-primary/40" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground tracking-wide">
                      Level {levelData.level}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <span className="flex-1 h-px bg-border/50" />
                  <span className="w-2 h-2 rotate-45 bg-primary/40" />
                  <span className="flex-1 h-px bg-border/50" />
                </div>

                {/* Stats - Attribute Style */}
                <div className="space-y-0">
                  <div className="genshin-attr-row">
                    <span className="attr-label flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                      Total XP
                    </span>
                    <span className="attr-value">{languageXp.xp.toLocaleString()}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary/60" />
                      Next Level
                    </span>
                    <span className="attr-value">{levelData.xpToNextLevel.toLocaleString()} XP</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500/60" />
                      Points
                    </span>
                    <span className="attr-value">{profile?.points?.toLocaleString() ?? '0'}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-sky-500/60" />
                      Total Reviews
                    </span>
                    <span className="attr-value">{stats.totalReviews.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                    <span>Progress</span>
                    <span>{Math.round(levelData.progressPercent)}%</span>
                  </div>
                  <div className="relative h-2 bg-muted/40 border border-border/40">
                    <div 
                      className={cn("h-full transition-all duration-700", rank.accentColor)}
                      style={{ width: `${levelData.progressPercent}%` }}
                    />
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/30" />
                    <span className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary/30" />
                  </div>
                </div>
              </GamePanel>
            </div>

            {/* Right: Mission Panel */}
            <div className="space-y-4">
              {/* Main Quest Card */}
              <GamePanel 
                variant="highlight" 
                size="lg" 
                showCorners 
                glowOnHover
                className="relative overflow-hidden"
              >
                {/* Quest header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 flex items-center justify-center bg-amber-600/15 border-2 border-amber-700/50">
                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-[0.2em]">Daily Commission</span>
                     
                    </div>
                    <h2 className="text-xl font-semibold text-foreground tracking-wide mt-1">
                      Study Session
                    </h2>
                  </div>
                </div>

                {/* Large due count */}
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-6">
                      {/* Outer diamond */}
                      <div className="absolute inset-0 border-2 border-amber-700/40 rotate-45" />
                      {/* Inner diamond */}
                      <div className="absolute inset-2.5 border border-amber-700/25 rotate-45" />
                      {/* Number */}
                      <span className="text-5xl md:text-6xl font-semibold text-foreground tabular-nums relative z-10 font-serif">
                        {stats.due}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium tracking-wide">
                      {stats.due === 0 ? 'All caught up!' : 'Cards awaiting review'}
                    </p>
                  </div>
                </div>

                {/* Reward preview */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/30">
                    <div className="w-10 h-10 flex items-center justify-center border border-amber-700/30 bg-amber-600/10">
                      <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground tabular-nums">{stats.newDue}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">New Cards</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/30">
                    <div className="w-10 h-10 flex items-center justify-center border border-sky-500/30 bg-sky-500/10">
                      <Activity className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground tabular-nums">{stats.reviewDue}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reviews</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={onStartSession}
                  disabled={stats.due === 0}
                  className={cn(
                    "group relative w-full py-4 px-6 overflow-hidden",
                    "transition-all duration-300",
                    stats.due > 0 
                      ? "border-2 border-amber-700/60 hover:border-amber-700 bg-amber-600/10 hover:bg-amber-600/20" 
                      : "border-2 border-pine-500/40 bg-pine-500/10 cursor-not-allowed"
                  )}
                >
                  
                  {stats.due > 0 ? (
                    <div className="flex items-center justify-center gap-4">
                      <span className="w-10 h-0.5 bg-amber-600/50 group-hover:w-14 group-hover:bg-amber-400 transition-all duration-300" />
                      <span className="text-lg font-bold tracking-[0.3em] text-amber-600 dark:text-amber-400 uppercase">
                        Begin
                      </span>
                      <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
                      <span className="w-10 h-0.5 bg-amber-600/50 group-hover:w-14 group-hover:bg-amber-400 transition-all duration-300" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-pine-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold tracking-[0.2em] uppercase">
                        Mission Complete
                      </span>
                    </div>
                  )}
                </button>
              </GamePanel>

              {/* Streak Display */}
              <GamePanel size="md" glowOnHover className="bg-linear-to-r from-card to-orange-500/5">
                <StreakDisplay
                  currentStreak={stats.streak}
                  lastSevenDays={lastSevenDays}
                  isAtRisk={isStreakAtRisk}
                />
              </GamePanel>
            </div>
          </div>
        </section>

        <GameDivider />

        {/* === CARD COLLECTION === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader 
            title="Card Collection" 
            subtitle="Your vocabulary inventory" 
            icon={<BookOpen className="w-4 h-4" strokeWidth={1.5} />}
          />
          
          {hasNoCards ? (
            <GameEmptyState 
              icon={BookOpen}
              title="Empty Inventory"
              description="Your card collection is empty. Add cards to start building your vocabulary."
              action={{ label: 'Add Cards', onClick: () => {} }}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <InventorySlot 
                icon={<Circle className="w-4 h-4" />}
                label="New"
                value={metrics.new}
                description="Unseen cards"
                color="sky"
              />
              <InventorySlot 
                icon={<Clock className="w-4 h-4" />}
                label="Learning"
                value={metrics.learning}
                description="In progress"
                color="amber"
              />
              <InventorySlot 
                icon={<Activity className="w-4 h-4" />}
                label="Reviewing"
                value={metrics.reviewing}
                description="Mature cards"
                color="violet"
              />
              <InventorySlot 
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Mastered"
                value={metrics.known}
                description="Fully learned"
                color="pine"
              />
            </div>
          )}
        </section>

        {/* === ADVENTURE LOG === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader 
            title="Adventure Log" 
            subtitle="Your study history over time"
            icon={<Activity className="w-4 h-4" strokeWidth={1.5} />}
          />
          
          {hasNoActivity ? (
            <GameEmptyState 
              icon={Activity}
              title="No Adventures Yet"
              description="Complete your first study session to begin logging your journey."
              action={{ label: 'Start Adventure', onClick: onStartSession }}
            />
          ) : (
            <GamePanel size="md">
              <Heatmap history={history} />
            </GamePanel>
          )}
        </section>

        {/* === ATTRIBUTES === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader 
            title="Attributes" 
            subtitle="Performance metrics and trends"
            icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
          />
          
          {hasNoActivity ? (
            <GameEmptyState 
              icon={Sparkles}
              title="Stats Locked"
              description="Complete some reviews to unlock performance attributes."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              <GamePanel size="md">
                <ChartHeader 
                  icon={<Activity className="w-3.5 h-3.5 text-sky-500" />}
                  title="Review Volume"
                />
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
                <ChartHeader 
                  icon={<Target className="w-3.5 h-3.5 text-pine-500" />}
                  title="Retention Rate"
                />
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

        {/* === DECK ANALYSIS === */}
        <section className="mb-8">
          <GameSectionHeader 
            title="Deck Analysis" 
            subtitle="Card stability and health metrics"
            icon={<Zap className="w-4 h-4" strokeWidth={1.5} />}
          />
          
          {hasNoCards ? (
            <GameEmptyState 
              icon={Activity}
              title="No Data"
              description="Add cards to your deck to see analysis metrics."
            />
          ) : (
            <GamePanel size="md">
              <RetentionStats cards={cards} />
            </GamePanel>
          )}
        </section>
      </div>
    </div>
  );
};

// === HELPER COMPONENTS ===

interface InventorySlotProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  color: 'sky' | 'amber' | 'violet' | 'pine';
}

const colorConfig = {
  sky: {
    border: 'border-sky-500/30 hover:border-sky-500/50',
    bg: 'bg-sky-500/10',
    text: 'text-sky-500',
    accent: 'bg-sky-500',
  },
  amber: {
    border: 'border-amber-700/30 hover:border-amber-700/50',
    bg: 'bg-amber-600/10',
    text: 'text-amber-500',
    accent: 'bg-amber-600',
  },
  violet: {
    border: 'border-violet-500/30 hover:border-violet-500/50',
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    accent: 'bg-violet-500',
  },
  pine: {
    border: 'border-pine-500/30 hover:border-pine-500/50',
    bg: 'bg-pine-500/10',
    text: 'text-pine-500',
    accent: 'bg-pine-500',
  },
};

function InventorySlot({ icon, label, value, description, color }: InventorySlotProps) {
  const colors = colorConfig[color];
  
  return (
    <div className={cn(
      "group relative bg-card border-2 p-4 transition-all duration-200",
      colors.border
    )}>
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent, "opacity-60")} />
      
      {/* Corner accents on hover */}
      <div className={cn("absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      
      {/* Icon */}
      <div className={cn("w-9 h-9 flex items-center justify-center mb-3 border", colors.border.split(' ')[0], colors.bg)}>
        <span className={colors.text}>{icon}</span>
      </div>
      
      {/* Label */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">
        {label}
      </p>
      
      {/* Value */}
      <p className="text-3xl font-semibold text-foreground tabular-nums">
        {value.toLocaleString()}
      </p>
      
      {/* Description */}
      <p className="text-[11px] text-muted-foreground/60 mt-1 font-medium">
        {description}
      </p>
    </div>
  );
}

function ChartHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
      {icon}
      <h4 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h4>
    </div>
  );
}

const ChartSkeleton: React.FC = () => (
  <div className="h-full w-full flex items-end gap-1 animate-pulse">
    {Array.from({ length: 12 }).map((_, i) => (
      <div 
        key={i} 
        className="flex-1 bg-muted/50" 
        style={{ height: `${20 + Math.random() * 60}%` }}
      />
    ))}
  </div>
);

const ChartEmpty: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <p className="text-xs text-muted-foreground font-medium">No data available</p>
  </div>
);
