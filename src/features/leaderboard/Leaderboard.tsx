import React, { useEffect, useState } from 'react';
import { Trophy, Info, Globe, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import clsx from 'clsx';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  xp: number;
  level: number;
}

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'lifetime';
type LanguageFilter = 'all' | 'polish' | 'norwegian' | 'japanese';

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
          language_filter: languageFilter
        });

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange, languageFilter]);

  const RankDisplay = ({ rank }: { rank: number }) => {
    if (rank <= 3) {
       return (
         <div className="relative flex items-center justify-center w-8 h-8">
            <span className={clsx(
                "text-3xl font-bold tracking-tighter leading-none",
                rank === 1 ? "text-yellow-500" : 
                rank === 2 ? "text-zinc-400" : 
                "text-amber-700"
            )}>
                {rank}
            </span>
         </div>
       );
    }
    return <span className="font-mono text-sm text-muted-foreground/50">#{rank}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <header className="space-y-8">
        <div className="flex items-center gap-4 text-muted-foreground">
            <Trophy size={20} strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Global Rankings</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-4">
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-foreground leading-[0.85]">
                Top Miners
                </h1>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info size={24} className="text-muted-foreground hover:text-foreground transition-colors mt-2" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-xs p-4">
                            <div className="space-y-2">
                                <p>Rankings are calculated based on XP earned during the selected time period.</p>
                                <p className="text-xs text-muted-foreground">XP is earned by adding cards (50xp) and reviewing them (1-10xp).</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Language Filter */}
                <div className="w-full sm:w-40">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-2">
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
                        </SelectContent>
                    </Select>
                </div>

                {/* Time Range Filter */}
                <div className="w-full sm:w-40">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-2">
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

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 border-b border-foreground text-[10px] font-mono uppercase tracking-widest text-muted-foreground pb-2">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-6">Miner</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-3 text-right">
            {timeRange === 'lifetime' ? 'Lifetime XP' : 'XP Gained'}
        </div>
      </div>

      {/* List */}
      <div className="space-y-1 min-h-[300px]">
        {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
                <Filter size={24} className="opacity-50" />
                <span className="font-mono text-xs tracking-widest">CALCULATING RANKS...</span>
            </div>
        ) : profiles.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <span className="font-mono text-xs tracking-widest">NO DATA FOR THIS PERIOD</span>
            </div>
        ) : (
          profiles.map((profile, index) => {
            const rank = index + 1;
            const isCurrentUser = profile.id === user?.id;

            const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;

            return (
              <div
                key={profile.id}
                className={clsx(
                  "group relative grid grid-cols-12 gap-4 items-center py-4 md:py-5 border-b border-border/40 transition-all duration-300",
                  isCurrentUser ? "opacity-100 bg-secondary/10" : "opacity-70 hover:opacity-100"
                )}
              >
                {/* Rank */}
                <div className="col-span-2 md:col-span-1 flex justify-center">
                   <RankDisplay rank={rank} />
                </div>
                
                {/* User Info */}
                <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                    <span className={clsx(
                        "text-lg md:text-xl font-medium tracking-tight truncate",
                        isCurrentUser && "text-primary"
                    )}>
                        {profile.username || 'Anonymous'}
                    </span>
                    {isCurrentUser && (
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase tracking-widest">
                            You
                        </div>
                    )}
                </div>

                {/* Level (Hidden on small mobile) */}
                <div className="hidden md:block col-span-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    Lvl {level}
                  </span>
                </div>
                
                {/* XP */}
                <div className="col-span-3 md:col-span-3 text-right">
                    <span className="text-xl md:text-2xl font-light tracking-tight tabular-nums">
                        {profile.xp.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">xp</span>
                </div>

                {/* Hover Indicator Line */}
                <div className="absolute bottom-0 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full opacity-20" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};