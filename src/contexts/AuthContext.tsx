import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, LocalProfile, generateId } from '@/services/db/dexie';
import { toast } from 'sonner';

// Simplified user interface for local app
interface LocalUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  session: null; // No cloud sessions
  user: LocalUser | null;
  profile: LocalProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, languageLevel?: string) => Promise<any>;
  updateUsername: (username: string) => Promise<void>;
  updateLanguageLevel: (level: string) => Promise<void>;
  markInitialDeckGenerated: () => Promise<void>;
  loading: boolean;
  incrementXPOptimistically: (amount: number) => void;
  // New local-only methods
  createLocalProfile: (username: string, languageLevel?: string) => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load local profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const existingProfile = await db.profile.get(LOCAL_USER_ID);

        if (existingProfile) {
          setUser({ id: LOCAL_USER_ID });
          setProfile(existingProfile);
        } else {
          // No profile = user needs to create one
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Create a local profile (replaces sign up)
  const createLocalProfile = async (username: string, languageLevel?: string) => {
    const newProfile: LocalProfile = {
      id: LOCAL_USER_ID,
      username,
      xp: 0,
      points: 0,
      level: 1,
      language_level: languageLevel,
      initial_deck_generated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.profile.put(newProfile);
    setUser({ id: LOCAL_USER_ID });
    setProfile(newProfile);
    toast.success('Profile created!');
  };

  // Legacy methods - redirect to local profile creation
  const signInWithGoogle = async () => {
    // In local mode, just show a message
    toast.info('This is a local app. Please create a profile.');
  };

  const signInWithEmail = async (_email: string, _password: string) => {
    toast.info('This is a local app. Please create a profile.');
  };

  const signUpWithEmail = async (_email: string, _password: string, username: string, languageLevel?: string) => {
    await createLocalProfile(username, languageLevel);
    return { user: { id: LOCAL_USER_ID } };
  };

  const signOut = async () => {
    // Clear profile and user state
    await db.profile.delete(LOCAL_USER_ID);
    setUser(null);
    setProfile(null);
    toast.success('Signed out');
  };

  const updateUsername = async (newUsername: string) => {
    if (!profile) return;

    await db.profile.update(LOCAL_USER_ID, {
      username: newUsername,
      updated_at: new Date().toISOString()
    });

    setProfile(prev => prev ? { ...prev, username: newUsername } : null);
  };

  const updateLanguageLevel = async (level: string) => {
    if (!profile) return;

    await db.profile.update(LOCAL_USER_ID, {
      language_level: level,
      updated_at: new Date().toISOString()
    });

    setProfile(prev => prev ? { ...prev, language_level: level } : null);
  };

  const incrementXPOptimistically = (amount: number) => {
    if (!profile) return;

    const newXP = (profile.xp || 0) + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        xp: newXP,
        points: (prev.points || 0) + amount,
        level: newLevel
      };
    });

    // Persist to DB
    db.profile.update(LOCAL_USER_ID, {
      xp: newXP,
      points: (profile.points || 0) + amount,
      level: newLevel,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  };

  const markInitialDeckGenerated = async () => {
    // Always update database - don't check profile state as it may be stale
    // when called immediately after createLocalProfile
    await db.profile.update(LOCAL_USER_ID, {
      initial_deck_generated: true,
      updated_at: new Date().toISOString()
    });

    setProfile(prev => prev ? { ...prev, initial_deck_generated: true } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        session: null,
        user,
        profile,
        signInWithGoogle,
        signOut,
        signInWithEmail,
        signUpWithEmail,
        updateUsername,
        updateLanguageLevel,
        loading,
        incrementXPOptimistically,
        markInitialDeckGenerated,
        createLocalProfile
      }}
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
