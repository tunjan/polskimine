import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyStreakMultiplier } from '@/features/xp/xpUtils';
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
  // Warm, editorial styling for ranks
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30">
        <span className="text-lg font-serif font-semibold text-amber-700 dark:text-amber-400">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-11 h-11 rounded-full bg-linear-to-br from-stone-100 to-gray-50 dark:from-stone-800/30 dark:to-gray-800/20 border border-stone-200/50 dark:border-stone-700/30">
        <span className="text-base font-serif font-medium text-stone-600 dark:text-stone-400">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30">
        <span className="text-sm font-serif font-medium text-orange-700 dark:text-orange-400">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-9 h-9">
      <span className="text-sm font-serif text-warm-gray dark:text-warm-gray/70">{rank}</span>
    </div>
  );
};

const StreakIndicator = ({ days }: { days: number }) => {
  if (!days) return <span className="text-xs text-muted-foreground/30 font-serif italic">—</span>;

  const { value } = getDailyStreakMultiplier(days);
  const intensity = Math.min(Math.max(value - 1, 0), 1);

  // Warm, muted color progression
  const colorClass =
    intensity > 0.9
      ? 'text-terracotta dark:text-terracotta-light'
      : intensity > 0.6
      ? 'text-amber-600 dark:text-amber-500'
      : intensity > 0.3
      ? 'text-orange-700 dark:text-orange-400'
      : 'text-warm-gray dark:text-warm-gray/80';

  return (
    <div className="flex items-center gap-1.5">
      <Flame size={14} className={clsx('opacity-70', colorClass)} fill="currentColor" />
      <span className={clsx('text-sm font-serif tabular-nums', colorClass)}>{days}</span>
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
    <div className="min-h-screen bg-background">
      {/* Editorial Header - Generous whitespace, serif typography */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-12 space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-2 sm:gap-3 text-terracotta dark:text-terracotta-light">
            <Trophy size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
            <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] sm:tracking-[0.25em] font-light">Leaderboard</span>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight text-foreground leading-[1.1]">
              Global Rankings
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-serif text-muted-foreground leading-relaxed max-w-2xl font-light">
              A celebration of dedication, consistency, and the quiet pursuit of mastery.
            </p>
          </div>
        </div>

        {/* Minimal Filter Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 items-start sm:items-center pt-2 sm:pt-4">
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['weekly', 'monthly', 'yearly', 'lifetime'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={clsx(
                  'font-serif transition-all pb-1 whitespace-nowrap min-w-fit',
                  timeRange === range
                    ? 'text-foreground border-b-2 border-terracotta dark:border-terracotta-light font-medium'
                    : 'text-muted-foreground hover:text-foreground active:text-foreground'
                )}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-auto sm:ml-auto">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as LanguageFilter)}
              className="w-full sm:w-auto bg-transparent border-b border-border pb-1 text-xs sm:text-sm font-serif text-foreground outline-none focus:border-terracotta dark:focus:border-terracotta-light transition-colors cursor-pointer"
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Refined Leaderboard Table */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {loading ? (
          <div className="py-20 sm:py-32 flex flex-col items-center justify-center gap-4 sm:gap-6 text-muted-foreground">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
            <span className="font-serif text-xs sm:text-sm font-light tracking-wide">Loading rankings...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-20 sm:py-32 text-center px-4">
            <p className="font-serif text-muted-foreground text-base sm:text-lg font-light">No rankings available for this period.</p>
          </div>
        ) : (
          <div className="space-y-0.5 sm:space-y-1">
            {profiles.map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = profile.id === user?.id;
              const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
              const streak = profile.streak ?? 0;

              return (
                <div
                  key={profile.id}
                  className={clsx(
                    'group relative flex items-center gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-[0.99] sm:active:scale-100',
                    isCurrentUser
                      ? 'bg-terracotta/5 dark:bg-terracotta/10 hover:bg-terracotta/10 dark:hover:bg-terracotta/15'
                      : 'hover:bg-muted/30 active:bg-muted/40'
                  )}
                >
                  {/* Rank Badge */}
                  <div className="shrink-0">
                    <RankBadge rank={rank} />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <h3
                        className={clsx(
                          'font-serif text-base sm:text-lg md:text-xl font-medium truncate',
                          isCurrentUser ? 'text-terracotta dark:text-terracotta-light' : 'text-foreground'
                        )}
                      >
                        {profile.username || 'Anonymous'}
                      </h3>
                      {isCurrentUser && (
                        <span className="hidden xs:inline text-[10px] sm:text-xs font-sans text-terracotta/70 dark:text-terracotta-light/70 uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs sm:text-sm font-serif text-muted-foreground font-light">Level {level}</p>
                      {/* Show streak inline on mobile */}
                      <div className="flex sm:hidden items-center gap-1">
                        <StreakIndicator days={streak} />
                      </div>
                    </div>
                  </div>

                  {/* Streak - Hidden on mobile, shown on sm+ */}
                  <div className="hidden sm:flex items-center gap-2">
                    <StreakIndicator days={streak} />
                  </div>

                  {/* XP */}
                  <div className="text-right space-y-0.5 shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl md:text-3xl font-serif font-light tabular-nums text-foreground">
                        {profile.xp.toLocaleString()}
                      </span>
                      <span className="text-[10px] sm:text-xs font-sans text-muted-foreground uppercase tracking-wider">xp</span>
                    </div>
                  </div>

                  {/* Subtle accent for top 3 */}
                  {rank <= 3 && (
                    <div className="absolute right-3 sm:right-4 top-3 sm:top-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      <Sparkles size={14} className="sm:w-4 sm:h-4 text-terracotta/30 dark:text-terracotta-light/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};