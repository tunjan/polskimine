import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type CurseType = 'comic_sans' | 'blur' | 'uwu' | 'rotate' | 'gaslight';

interface ActiveCurse {
  id: string;
  curse_type: CurseType;
  expires_at: string;
  origin_user_id?: string;
  sender_username?: string;
}

interface SabotageContextType {
  activeCurses: ActiveCurse[];
  isCursedWith: (type: CurseType) => boolean;
  notificationQueue: ActiveCurse[];
  dismissNotification: () => void;
}

const SabotageContext = createContext<SabotageContextType | undefined>(undefined);

export const SabotageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCurses, setActiveCurses] = useState<ActiveCurse[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<ActiveCurse[]>([]);

  const fetchCurses = async () => {
    if (!user) return;

    const { data: cursesData, error } = await supabase
      .from('active_curses')
      .select('*')
      .eq('target_user_id', user.id)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching curses:', error);
      return;
    }

    const rawCurses = (cursesData || []) as ActiveCurse[];

    const enrichedCurses = await Promise.all(
      rawCurses.map(async (curse) => {
        if (curse.origin_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', curse.origin_user_id)
            .single();
          return { ...curse, sender_username: profile?.username || 'Unknown Rival' };
        }
        return { ...curse, sender_username: 'Anonymous' };
      })
    );

    setActiveCurses(enrichedCurses);

    const seenIds: string[] = JSON.parse(localStorage.getItem('linguaflow_seen_curses') || '[]');
    const newCurses = enrichedCurses.filter((c) => !seenIds.includes(c.id));
    if (newCurses.length > 0) {
      setNotificationQueue(newCurses);
    }
  };

  useEffect(() => {
    fetchCurses();
    if (!user) return;

    const channel = supabase
      .channel('sabotage_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_curses',
          filter: `target_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newCurse = payload.new as ActiveCurse;
          let senderName = 'Anonymous';
          if (newCurse.origin_user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', newCurse.origin_user_id)
              .single();
            if (data?.username) senderName = data.username || 'Unknown Rival';
          }
          const enriched = { ...newCurse, sender_username: senderName };
          setActiveCurses((prev) => [...prev, enriched]);
          setNotificationQueue((prev) => [...prev, enriched]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setActiveCurses((prev) => {
        const valid = prev.filter((c) => c.expires_at > now);
        return valid.length !== prev.length ? valid : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCursedWith = (type: CurseType) => activeCurses.some((c) => c.curse_type === type);

  const dismissNotification = () => {
    setNotificationQueue((prev) => {
      if (prev.length === 0) return prev;
      const [dismissed, ...rest] = prev;
      const seenIds: string[] = JSON.parse(localStorage.getItem('linguaflow_seen_curses') || '[]');
      if (!seenIds.includes(dismissed.id)) {
        seenIds.push(dismissed.id);
        localStorage.setItem('linguaflow_seen_curses', JSON.stringify(seenIds));
      }
      return rest;
    });
  };

  return (
    <SabotageContext.Provider
      value={{ activeCurses, isCursedWith, notificationQueue, dismissNotification }}
    >
      {children}
    </SabotageContext.Provider>
  );
};

export const useSabotage = () => {
  const context = useContext(SabotageContext);
  if (!context) {
    throw new Error('useSabotage must be used within SabotageProvider');
  }
  return context;
};
