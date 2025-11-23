import React, { useEffect, useState } from 'react';
import { Trophy, Info, Globe, Calendar, Filter, Crown, Medal, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={20} className="text-yellow-500 fill-yellow-500/20" />;
  if (rank === 2) return <Medal size={20} className="text-slate-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-700" />;
  return (
    <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank}</span>
  );
};

const StreakMultiplierBadge = ({ days }: { days: number }) => {
  if (!days) return <span className="text-muted-foreground/40">-</span>;

  const { value, label } = getDailyStreakMultiplier(days);
  const intensity = Math.min(Math.max(value - 1, 0), 1);

  const colorClass =
    intensity > 0.9
      ? 'text-purple-500 bg-purple-500/10 border-purple-500/20'
      : intensity > 0.7
      ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      : intensity > 0.4
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      : intensity > 0.1
      ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      : 'text-muted-foreground bg-secondary border-transparent';

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
        colorClass
      )}
    >
      <Flame size={12} fill="currentColor" className="opacity-80" />
      <div className="flex flex-col leading-none gap-0.5">
        <span>{days} days</span>
        <span className="text-[9px] opacity-70 font-mono tracking-wide">
          {label.replace(/\s*\(([^)]*)\)/, (_, inner) => `· ${inner}`)}
        </span>
      </div>
    </div>
  );
};

const getInitials = (value?: string | null) => {
  if (!value) return '??';
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

  const xpLabel = timeRange === 'lifetime' ? 'Lifetime XP' : 'XP Gained';

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <header className="space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Trophy size={20} strokeWidth={1.5} />
          <span className="text-xs font-mono uppercase tracking-[0.4em]">Global Rankings</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground leading-[0.9]">
                Top Miners
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={22} className="text-muted-foreground hover:text-foreground transition-colors mt-1" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs p-4">
                    <div className="space-y-2 text-sm">
                      <p>Rankings reflect XP earned over the selected timeframe.</p>
                      <p className="text-xs text-muted-foreground">
                        Reviews now grant 1-8 base XP with combo bonuses and daily multiplier tiers—consistency beats marathons.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Weekly standings, lifetime grinders, and everyone chasing their streak multiplier.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-44">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <Globe size={10} /> Language
              </label>
              <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v as LanguageFilter)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="polish">Polish</SelectItem>
                  <SelectItem value="norwegian">Norwegian</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <Calendar size={10} /> Period
              </label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">Last 30 Days</SelectItem>
                  <SelectItem value="yearly">Last Year</SelectItem>
                  <SelectItem value="lifetime">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="border border-border/40 rounded-xl overflow-hidden bg-card/60 backdrop-blur">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/30 border-b border-border/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6 md:col-span-5">User</div>
          <div className="col-span-3 md:col-span-3 text-right">Streak</div>
          <div className="col-span-2 md:col-span-3 text-right">{xpLabel}</div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
            <Filter size={24} className="opacity-50" />
            <span className="font-mono text-xs tracking-widest">Calculating ranks...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No data for this period.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {profiles.map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = profile.id === user?.id;
              const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
              const streak = profile.streak ?? 0;
              const avatar = profile.avatar ?? getInitials(profile.username);

              return (
                <div
                  key={profile.id}
                  className={clsx(
                    'grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-secondary/20',
                    isCurrentUser && 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    <RankIcon rank={rank} />
                  </div>

                  <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-secondary-foreground border-border'
                      )}
                    >
                      {avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className={clsx('text-sm font-medium', isCurrentUser && 'text-primary')}>
                        {profile.username || 'Anonymous'} {isCurrentUser && '(You)'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Lvl {level}</span>
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-3 flex justify-end">
                    <StreakMultiplierBadge days={streak} />
                  </div>

                  <div className="col-span-2 md:col-span-3 text-right">
                    <span className="text-lg md:text-2xl font-semibold tracking-tight tabular-nums">
                      {profile.xp.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">xp</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};