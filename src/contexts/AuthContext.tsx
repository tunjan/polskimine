import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/db/dexie';
import { toast } from 'sonner';

interface LocalUser {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, languageLevel?: string) => Promise<any>;
  updateUsername: (username: string) => Promise<void>;
  login: () => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await db.profile.get(LOCAL_USER_ID);

        if (profile) {
          setUser({ id: LOCAL_USER_ID, email: 'local-user', username: profile.username });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signInWithGoogle = async () => {
    toast.info('This is a local app. Please create a profile.');
  };

  const signInWithEmail = async (_email: string, _password: string) => {
    toast.info('This is a local app. Please create a profile.');
  };

  const signUpWithEmail = async (_email: string, _password: string, username: string, languageLevel?: string) => {
    const now = new Date().toISOString();
    await db.profile.put({
      id: LOCAL_USER_ID,
      username,
      xp: 0,
      points: 0,
      level: 1,
      language_level: languageLevel || 'beginner',
      created_at: now,
      updated_at: now
    });

    setUser({ id: LOCAL_USER_ID, email: 'local-user', username });
    return { user: { id: LOCAL_USER_ID } };
  };

  const updateUsername = async (username: string) => {
    const now = new Date().toISOString();
    const exists = await db.profile.get(LOCAL_USER_ID);

    if (exists) {
      await db.profile.update(LOCAL_USER_ID, { username, updated_at: now });
    } else {
      await db.profile.put({
        id: LOCAL_USER_ID,
        username,
        xp: 0,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now
      });
    }

    setUser(prev => prev ? { ...prev, username } : { id: LOCAL_USER_ID, email: 'local-user', username });
  };

  const signOut = async () => {
    await db.profile.delete(LOCAL_USER_ID);
    setUser(null);
    toast.success('Signed out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        signInWithEmail,
        signUpWithEmail,
        updateUsername,
        login: async () => {
          const profile = await db.profile.get(LOCAL_USER_ID);
          if (profile) {
            setUser({ id: LOCAL_USER_ID, email: 'local-user', username: profile.username });
          }
        }
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
