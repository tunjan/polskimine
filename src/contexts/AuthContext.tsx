import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  xp: number;     // Lifetime accumulation for Ranking
  points: number; // Spendable currency for Sabotage
  level: number;
  avatar_url?: string | null;
  updated_at?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  loading: boolean;
  incrementXPOptimistically: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      const nextSession = data.session;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- REALTIME LISTENER FOR POINTS/XP ---
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as Profile;
          // Prevent XP/Points downgrade during optimistic updates
          // Only accept server updates if they are higher than current local state
          setProfile(prev => {
            if (!prev) return newProfile;
            // Guard against race condition: don't downgrade XP if local is ahead
            if (prev.xp > newProfile.xp || prev.points > newProfile.points) {
              return prev;
            }
            return newProfile;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to load profile', error);
      return;
    }

    // Ensure points exists, default to 0 if column is missing or null
    const safeData = {
        ...data,
        points: data.points ?? 0
    };

    setProfile(safeData as Profile);
  };

  const signInWithGoogle = async () => {
    const redirectTo = window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Signed out');
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update username');
      throw error;
    }
    // No need to manually setProfile here, the realtime subscription will catch it
  };

  const incrementXPOptimistically = (amount: number) => {
    if (!profile) return;
    
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        xp: (prev.xp || 0) + amount,
        points: (prev.points || 0) + amount,
        level: Math.floor(Math.sqrt(((prev.xp || 0) + amount) / 100)) + 1
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, updateUsername, loading, incrementXPOptimistically }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};