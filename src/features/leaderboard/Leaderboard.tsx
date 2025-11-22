import React, { useEffect, useState } from 'react';
import { Trophy, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import clsx from 'clsx';

interface Profile {
  id: string;
  username: string | null;
  xp: number;
  level: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, xp, level')
        .order('xp', { ascending: false })
        .limit(50);

      if (error) console.error('Failed to load leaderboard', error);
      setProfiles(data || []);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

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
    <div className="max-w-5xl mx-auto pb-20 space-y-16 md:space-y-24">
      
      {/* Header Section */}
      <header className="space-y-6">
        <div className="flex items-center gap-4 text-muted-foreground">
            <Trophy size={20} strokeWidth={1.5} />
            <span className="text-xs font-mono uppercase tracking-widest">Global Rankings</span>
        </div>
        
        <div className="flex items-start gap-4">
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-foreground leading-[0.85]">
            Top Miners
            </h1>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info size={24} className="text-muted-foreground hover:text-foreground transition-colors mt-2" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="max-w-xs p-4">
                        <div className="space-y-2">
                            <p><span className="font-bold text-primary">XP (Experience):</span> Measures your lifetime learning progress. It determines your Rank and Level. It never decreases.</p>
                            <p><span className="font-bold text-primary">Points:</span> A spendable currency earned alongside XP. Use Points in the Sabotage Store to mess with other learners.</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </header>

      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 border-b border-foreground text-[10px] font-mono uppercase tracking-widest text-muted-foreground pb-2">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-6">Miner</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-3 text-right">Lifetime XP</div>
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading ? (
            <div className="py-20 text-center text-muted-foreground font-mono text-xs animate-pulse">
                SYNCING LEDGER...
            </div>
        ) : (
          profiles.map((profile, index) => {
            const rank = index + 1;
            const isCurrentUser = profile.id === user?.id;

            return (
              <div
                key={profile.id}
                className={clsx(
                  "group relative grid grid-cols-12 gap-4 items-center py-4 md:py-5 border-b border-border/40 transition-all duration-300",
                  isCurrentUser ? "opacity-100" : "opacity-70 hover:opacity-100"
                )}
              >
                {/* Rank */}
                <div className="col-span-2 md:col-span-1 flex justify-center">
                   <RankDisplay rank={rank} />
                </div>
                
                {/* User Info */}
                <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                    <span className="text-lg md:text-xl font-medium tracking-tight truncate">
                        {profile.username || 'Anonymous'}
                    </span>
                    {isCurrentUser && (
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" title="You" />
                    )}
                </div>

                {/* Level (Hidden on small mobile) */}
                <div className="hidden md:block col-span-2">
                    <span className="text-sm font-mono text-muted-foreground">
                        Lvl {profile.level}
                    </span>
                </div>
                
                {/* XP */}
                <div className="col-span-3 md:col-span-3 text-right">
                    <span className="text-xl md:text-2xl font-light tracking-tight tabular-nums">
                        {profile.xp.toLocaleString()}
                    </span>
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