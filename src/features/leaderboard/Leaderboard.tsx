import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Sparkles, Crown, Medal, Award, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyStreakMultiplier } from '@/features/xp/xpUtils';
import { GamePanel, GameSectionHeader, GameDivider } from '@/components/ui/game-ui';
import { cn } from '@/lib/utils';
import clsx from 'clsx';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  xp: number;
  level?: number;
  streak?: number | null;
  avatar?: string | null;
}

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'lifetime';
type LanguageFilter = 'all' | 'polish' | 'norwegian' | 'japanese' | 'spanish';

const RankBadge = ({ rank }: { rank: number }) => {
  
  if (rank === 1) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-center w-12 h-12 bg-linear-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/50 transition-all duration-300 group-hover:border-amber-400/80 group-hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]">
          {/* Corner accents */}
          <span className="absolute -top-px -left-px w-2 h-2 border-l-2 border-t-2 border-amber-400" />
          <span className="absolute -top-px -right-px w-2 h-2 border-r-2 border-t-2 border-amber-400" />
          <span className="absolute -bottom-px -left-px w-2 h-2 border-l-2 border-b-2 border-amber-400" />
          <span className="absolute -bottom-px -right-px w-2 h-2 border-r-2 border-b-2 border-amber-400" />
          <Crown className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-center w-11 h-11 bg-linear-to-br from-slate-400/15 to-slate-300/10 border border-slate-400/40 transition-all duration-300 group-hover:border-slate-400/70">
          <span className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-slate-400" />
          <span className="absolute -top-px -right-px w-1.5 h-1.5 border-r border-t border-slate-400" />
          <span className="absolute -bottom-px -left-px w-1.5 h-1.5 border-l border-b border-slate-400" />
          <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-slate-400" />
          <Medal className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-orange-500/15 to-amber-500/10 border border-orange-400/40 transition-all duration-300 group-hover:border-orange-400/70">
          <span className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-orange-400" />
          <span className="absolute -top-px -right-px w-1.5 h-1.5 border-r border-t border-orange-400" />
          <span className="absolute -bottom-px -left-px w-1.5 h-1.5 border-l border-b border-orange-400" />
          <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-orange-400" />
          <Award className="w-4 h-4 text-orange-400" strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-9 h-9 bg-card/60 border border-border/50">
      <span className="text-sm font-light text-muted-foreground tabular-nums">{rank}</span>
    </div>
  );
};

const StreakIndicator = ({ days }: { days: number }) => {
  if (!days) return <span className="text-xs text-muted-foreground/30 font-ui">—</span>;

  const { value } = getDailyStreakMultiplier(days);
  const intensity = Math.min(Math.max(value - 1, 0), 1);

  
  const colorClass =
    intensity > 0.9
      ? 'text-orange-500'
      : intensity > 0.6
      ? 'text-amber-500'
      : intensity > 0.3
      ? 'text-yellow-600'
      : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-card/60 border border-border/40">
      <Flame size={14} className={cn('opacity-80', colorClass)} fill="currentColor" />
      <span className={cn('text-sm font-light tabular-nums', colorClass)}>{days}</span>
    </div>
  );
};

const getInitials = (value?: string | null) => {
  if (!value) return '?';
  return value
    .trim()
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_leaderboard', {
          time_range: timeRange,
          language_filter: languageFilter,
        });
        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange, languageFilter]);

  const timeRangeLabels: Record<TimeRange, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year',
    lifetime: 'All Time',
  };

  const languageLabels: Record<LanguageFilter, string> = {
    all: 'All Languages',
    polish: 'Polish',
    norwegian: 'Norwegian',
    japanese: 'Japanese',
    spanish: 'Spanish',
  };

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1100px] mx-auto">
      
      {/* Game-style Header */}
      <section className="mb-8 md:mb-10">
        <GamePanel variant="highlight" size="lg" glowOnHover className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center relative">
              <Trophy className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <span className="absolute -top-px -left-px w-2 h-2 border-l border-t border-primary" />
              <span className="absolute -top-px -right-px w-2 h-2 border-r border-t border-primary" />
              <span className="absolute -bottom-px -left-px w-2 h-2 border-l border-b border-primary" />
              <span className="absolute -bottom-px -right-px w-2 h-2 border-r border-b border-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-ui mb-1">Global Rankings</p>
              <h1 className="text-2xl md:text-3xl font-light text-foreground tracking-tight">
                Leaderboard
              </h1>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl">
            A celebration of dedication, consistency, and the pursuit of mastery.
          </p>
        </GamePanel>

        {/* Filters - Game Style */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['weekly', 'monthly', 'yearly', 'lifetime'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'relative px-4 py-2 text-xs uppercase tracking-widest font-ui transition-all duration-200 whitespace-nowrap border',
                  timeRange === range
                    ? 'text-foreground bg-card border-primary/50 shadow-[0_0_10px_-3px_hsl(var(--primary)/0.3)]'
                    : 'text-muted-foreground bg-transparent border-border/40 hover:border-border hover:text-foreground'
                )}
              >
                {timeRange === range && (
                  <>
                    <span className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-primary" />
                    <span className="absolute -top-px -right-px w-1.5 h-1.5 border-r border-t border-primary" />
                    <span className="absolute -bottom-px -left-px w-1.5 h-1.5 border-l border-b border-primary" />
                    <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-primary" />
                  </>
                )}
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-auto sm:ml-auto">
            <div className="relative">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as LanguageFilter)}
                className="w-full sm:w-auto appearance-none bg-card border border-border/50 px-4 py-2 pr-8 text-xs font-ui text-foreground uppercase tracking-widest outline-none focus:border-primary/50 transition-colors cursor-pointer"
              >
                {Object.entries(languageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border-r border-b border-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <GameDivider />

      {/* Leaderboard List */}
      <section className="pb-16 sm:pb-24">
        {loading ? (
          <GamePanel className="py-20 flex flex-col items-center justify-center gap-4 border-dashed">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary animate-spin" />
              <span className="absolute -top-px -left-px w-2 h-2 border-l border-t border-primary/50" />
              <span className="absolute -top-px -right-px w-2 h-2 border-r border-t border-primary/50" />
              <span className="absolute -bottom-px -left-px w-2 h-2 border-l border-b border-primary/50" />
              <span className="absolute -bottom-px -right-px w-2 h-2 border-r border-b border-primary/50" />
            </div>
            <span className="text-xs text-muted-foreground font-ui uppercase tracking-[0.15em]">Loading rankings...</span>
          </GamePanel>
        ) : profiles.length === 0 ? (
          <GamePanel className="py-20 text-center border-dashed">
            <p className="text-muted-foreground font-light">No rankings available for this period.</p>
          </GamePanel>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = profile.id === user?.id;
              const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
              const streak = profile.streak ?? 0;

              return (
                <GamePanel
                  key={profile.id}
                  variant={isCurrentUser ? 'highlight' : 'default'}
                  size="sm"
                  glowOnHover
                  className={cn(
                    'group flex items-center gap-3 sm:gap-4 md:gap-6 transition-all duration-300',
                    isCurrentUser && 'border-primary/40'
                  )}
                >
                  {/* Rank Badge */}
                  <div className="shrink-0">
                    <RankBadge rank={rank} />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <h3
                        className={cn(
                          'text-base sm:text-lg font-light truncate',
                          isCurrentUser ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {profile.username || 'Anonymous'}
                      </h3>
                      {isCurrentUser && (
                        <span className="hidden xs:inline px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-ui uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />
                        <p className="text-xs text-muted-foreground font-light font-ui">Level {level}</p>
                      </div>
                      {/* Show streak inline on mobile */}
                      <div className="flex sm:hidden items-center gap-1">
                        <StreakIndicator days={streak} />
                      </div>
                    </div>
                  </div>

                  {/* Streak - Hidden on mobile, shown on sm+ */}
                  <div className="hidden sm:block">
                    <StreakIndicator days={streak} />
                  </div>

                  {/* XP Display */}
                  <div className="text-right shrink-0">
                    <div className="relative px-3 py-2 bg-card/80 border border-border/50 group-hover:border-primary/30 transition-colors">
                      <span className="absolute -top-px -left-px w-1.5 h-1.5 border-l border-t border-primary/40 group-hover:border-primary/70 transition-colors" />
                      <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b border-primary/40 group-hover:border-primary/70 transition-colors" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-light tabular-nums text-foreground">
                          {profile.xp.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-ui">xp</span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkle for top 3 */}
                  {rank <= 3 && (
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      <Sparkles size={14} className="text-primary/40" />
                    </div>
                  )}
                </GamePanel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};