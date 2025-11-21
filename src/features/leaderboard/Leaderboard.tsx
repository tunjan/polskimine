import React, { useEffect, useState } from 'react';
import { Trophy, Medal, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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

      if (error) {
        console.error('Failed to load leaderboard', error);
      }

      setProfiles(data || []);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Medal className="text-yellow-500" />;
    if (index === 1) return <Medal className="text-gray-400" />;
    if (index === 2) return <Medal className="text-amber-600" />;
    return <span className="font-mono font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 dark:bg-yellow-900/20">
          <Trophy size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">Top language miners globally</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading ranks...</div>
        ) : (
          profiles.map((profile, index) => (
            <div
              key={profile.id}
              className={`flex items-center p-4 border-b border-border last:border-0 ${
                profile.id === user?.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="w-12 flex justify-center font-mono font-bold text-lg text-muted-foreground">
                {renderRankIcon(index)}
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <UserIcon size={16} className="opacity-50" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {profile.username || 'Anonymous Miner'}
                    {profile.id === user?.id && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {profile.level}</div>
                </div>
              </div>
              <div className="font-mono font-bold text-lg tracking-tight">
                {profile.xp.toLocaleString()} {' '}
                <span className="text-xs font-sans font-normal text-muted-foreground">XP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};