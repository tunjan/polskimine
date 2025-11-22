import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export type CurseType = 'comic_sans' | 'blur' | 'uwu' | 'rotate' | 'gaslight';

interface ActiveCurse {
  id: string;
  curse_type: CurseType;
  expires_at: string;
}

interface SabotageContextType {
  activeCurses: ActiveCurse[];
  isCursedWith: (type: CurseType) => boolean;
}

const SabotageContext = createContext<SabotageContextType | undefined>(undefined);

export const SabotageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCurses, setActiveCurses] = useState<ActiveCurse[]>([]);

  const fetchCurses = async () => {
    if (!user) return;

    // Assuming a table 'active_curses' exists based on the store implementation logic
    const { data, error } = await supabase
      .from('active_curses')
      .select('*')
      .eq('target_user_id', user.id)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching curses:', error);
      return;
    }

    setActiveCurses(data as ActiveCurse[]);
  };

  useEffect(() => {
    fetchCurses();

    if (!user) return;

    // Realtime subscription to know when we get cursed immediately
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
        (payload) => {
          const newCurse = payload.new as ActiveCurse;
          setActiveCurses((prev) => [...prev, newCurse]);
          
          // Notify the victim
          const messages = {
            comic_sans: "You feel... less serious.",
            blur: "Is it foggy in here?",
            uwu: "UwU what's this?",
            rotate: "Do you come from a land down under?",
            gaslight: "Are you sure about that?"
          };
          toast.error(`You have been cursed! ${messages[newCurse.curse_type] || ''}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isCursedWith = (type: CurseType) => {
    return activeCurses.some((c) => c.curse_type === type);
  };

  return (
    <SabotageContext.Provider value={{ activeCurses, isCursedWith }}>
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
