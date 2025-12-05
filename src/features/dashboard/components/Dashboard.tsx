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
import { useProfile } from '@/contexts/ProfileContext';
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

import { MusicControl } from './MusicControl';
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
  const { profile } = useProfile();

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

        {/* Music Control */}
        <MusicControl />

        {/* === CHARACTER BANNER SECTION === */}
        <section className="mb-8 md:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-6">

            {/* Left: Character Card / Profile */}
            <div className="relative">
              <GamePanel
                variant="ornate"
                size="md"
                showCorners
                className="h-full bg-linear-to-br from-card via-card to-primary/5"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-0.5 bg-linear-to-r from-transparent via-primary/60 to-transparent" />

                {/* Level Emblem */}
                <div className="flex flex-col items-center pt-2 pb-2">
                  <LevelBadge
                    level={levelData.level}
                    xp={languageXp.xp}
                    progressPercent={levelData.progressPercent}
                    xpToNextLevel={levelData.xpToNextLevel}
                    showDetails={false}
                  />

                  {/* Rank Title */}
                  <div className="mt-2 text-center">
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
                <div className="flex items-center gap-3 my-3">
                  <span className="flex-1 h-px bg-border/50" />
                  <span className="w-2 h-2 rotate-45 bg-primary/40" />
                  <span className="flex-1 h-px bg-border/50" />
                </div>

                {/* Stats - Attribute Style */}
                <div className="space-y-0">
                  <div className="genshin-attr-row">
                    <span className="attr-label text-sm flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                      Total XP
                    </span>
                    <span className="attr-value">{languageXp.xp.toLocaleString()}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary/60" />
                      Next Level
                    </span>
                    <span className="attr-value">{levelData.xpToNextLevel.toLocaleString()} XP</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500/60" />
                      Points
                    </span>
                    <span className="attr-value">{profile?.points?.toLocaleString() ?? '0'}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-sky-500/60" />
                      Total Reviews
                    </span>
                    <span className="attr-value">{stats.totalReviews.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-3 border-t border-border/30">
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
              {/* Main Quest Card - Genshin Impact Style */}
              <div className="relative group/quest">
                {/* Outer glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-sm opacity-0 group-hover/quest:opacity-100 transition-opacity duration-500 blur-xl" />

                <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border border-amber-700/40 overflow-hidden">

                  {/* Top ornate border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-600/80 to-transparent" />

                  {/* Corner ornaments */}
                  <svg className="absolute top-0 left-0 w-12 h-12 text-amber-600/70" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                    <rect x="32" y="4" width="6" height="1" fill="currentColor" opacity="0.4" />
                  </svg>
                  <svg className="absolute top-0 right-0 w-12 h-12 text-amber-600/70 rotate-90" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                    <rect x="32" y="4" width="6" height="1" fill="currentColor" opacity="0.4" />
                  </svg>
                  <svg className="absolute bottom-0 left-0 w-12 h-12 text-amber-600/70 -rotate-90" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                  </svg>
                  <svg className="absolute bottom-0 right-0 w-12 h-12 text-amber-600/70 rotate-180" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                  </svg>

                  {/* Quest ribbon/banner */}
                  <div className=" px-5 pt-5 mx-auto flex justify-around pb-3">
                    <div className="flex justify-evenly gap-4 mx-auto">
                      <div className="flex-1 flex-col mx-auto">
                        {/* Quest type badge */}
                        <div className="items-center text-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 animate-pulse" />
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.25em]">
                            Daily Commission
                          </span>
                          <span className="w-8 h-px bg-gradient-to-r from-amber-600/60 to-transparent" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground ">
                          Study Session
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Decorative separator */}
                  <div className="flex items-center gap-3 px-5">
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                    <span className="w-1 h-1 rotate-45 bg-amber-500/60" />
                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                  </div>

                  {/* Due count display - Central focus */}
                  <div className="flex items-center justify-center py-6 px-5">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-3">


                        {/* Diamond frame */}
                        <div className="absolute inset-4 border-2 border-amber-600/50 rotate-45" />
                        <div className="absolute inset-6 border border-amber-600/30 rotate-45" />

                        {/* Number with glow */}
                        <div className="relative">
                          <span className={cn(
                            "absolute inset-0 font-semibold text-amber-400/30 blur-sm font-serif",
                            stats.due >= 1000 ? "text-xl md:text-2xl" : stats.due >= 100 ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                          )}>
                            {stats.due}
                          </span>
                          <span className={cn(
                            "relative font-semibold text-foreground tabular-nums font-serif",
                            stats.due >= 1000 ? "text-xl md:text-2xl" : stats.due >= 100 ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                          )}>
                            {stats.due}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium tracking-wide">
                        {stats.due === 0 ? 'All caught up!' : 'Cards awaiting review'}
                      </p>
                    </div>
                  </div>

                  {/* Rewards preview - Genshin loot style */}
                  <div className="px-5 pb-5">
                    <div className="text-[10px] text-amber-600/80 font-semibold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="w-4 h-px bg-amber-600/40" />
                      Session Details
                      <span className="flex-1 h-px bg-amber-700/30" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="relative group/reward bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-700/30 p-3 hover:border-amber-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex items-center justify-center bg-amber-500/10 rounded-4xl">
                            
                            <Star className="w-5 h-5 text-amber-400 " fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.newDue}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">New Cards</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative group/reward bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-700/30 p-3 hover:border-sky-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex items-center justify-center bg-sky-500/10 rounded-4xl">
                            
                            <Activity className="w-5 h-5 text-sky-400 " />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.reviewDue}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reviews</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigate button - Quest accept style */}
                    <button
                      onClick={onStartSession}
                      disabled={stats.due === 0}
                      className={cn(
                        "group/btn relative w-full overflow-hidden",
                        "transition-all duration-300",
                        stats.due > 0
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      {/* Button background with animated gradient */}
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        stats.due > 0
                          ? "bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 group-hover/btn:from-amber-500/30 group-hover/btn:via-amber-400/25 group-hover/btn:to-amber-500/30"
                          : "bg-gradient-to-r from-emerald-500/20 via-emerald-400/15 to-emerald-500/20"
                      )} />

                      {/* Borders */}
                      <div className={cn(
                        "absolute inset-0 border-2 transition-colors",
                        stats.due > 0
                          ? "border-amber-600/50 group-hover/btn:border-amber-500/80"
                          : "border-emerald-600/40"
                      )} />

                      {/* Inner border */}
                      <div className={cn(
                        "absolute inset-1 border transition-colors",
                        stats.due > 0
                          ? "border-amber-700/30 group-hover/btn:border-amber-600/40"
                          : "border-emerald-700/20"
                      )} />

                      {/* Top shine line */}
                      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                      <div className="relative py-4 px-6">
                        {stats.due > 0 ? (
                          <div className="flex items-center justify-center gap-4">
                            <span className="w-6 h-px bg-amber-500/50 group-hover/btn:w-10 group-hover/btn:bg-amber-400 transition-all duration-300" />
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-500 opacity-60" />
                            <span className="text-base font-bold tracking-[0.35em] text-amber-600 dark:text-amber-300 uppercase">
                              Navigate
                            </span>
                            
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-500 opacity-60" />
                            <span className="w-6 h-px bg-amber-500/50 group-hover/btn:w-10 group-hover/btn:bg-amber-400 transition-all duration-300" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-semibold tracking-[0.25em] text-emerald-600 dark:text-emerald-300 uppercase">
                              Commission Complete
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Bottom ornate border */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
                </div>
              </div>

              {/* Streak Display */}
              <GamePanel size="md" glowOnHover className="bg-linear-to-r from-card to-amber-500/5">
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
              action={{ label: 'Add Cards', onClick: () => { } }}
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
    border: 'border-amber-600/30 hover:border-amber-600/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    accent: 'bg-amber-500',
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

