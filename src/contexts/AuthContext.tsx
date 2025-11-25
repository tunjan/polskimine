import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
interface Profile {
  id: string;
  username: string | null;
  xp: number;     // Lifetime accumulation for Ranking
  points: number; // Spendable currency for Sabotage
  level: number;
  avatar_url?: string | null;
  updated_at?: string | null;
  language_level?: string | null; // User's proficiency level (A1, A2, B1, B2, C1, C2)
  initial_deck_generated?: boolean; // Whether user completed initial deck setup
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, languageLevel?: string) => Promise<any>;
  updateUsername: (username: string) => Promise<void>;
  markInitialDeckGenerated: () => Promise<void>;
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


          setProfile(prev => {
            if (!prev) return newProfile;

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


    const safeData = {
      ...data,
      points: data.points ?? 0
    };

    setProfile(safeData as Profile);
  };

  const signInWithGoogle = async () => {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'com.linguaflow.app://auth/callback'
      : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({ // <--- Destructure 'data'
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Capacitor.isNativePlatform()
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (Capacitor.isNativePlatform() && data?.url) {
      await Browser.open({ url: data.url, windowName: '_self' });
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

  const signUpWithEmail = async (email: string, password: string, username: string, languageLevel?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, language_level: languageLevel },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    return data;
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

    // Manually update local state to trigger re-render in App.tsx immediately
    setProfile((prev) => prev ? { ...prev, username: newUsername } : null);
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

  const markInitialDeckGenerated = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ initial_deck_generated: true })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to mark initial deck as generated:', error);
      return;
    }

    setProfile((prev) => prev ? { ...prev, initial_deck_generated: true } : null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, updateUsername, loading, incrementXPOptimistically, markInitialDeckGenerated }}
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