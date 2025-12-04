import React from 'react';
import { LogIn, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center ">
          <Command size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LinguaFlow</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sign in to sync your decks, earn XP, and climb the global leaderboard.
          </p>
        </div>
      </div>
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 font-medium "
      >
        <LogIn size={18} />
        Continue with Google
      </button>
      <p className="text-[11px] uppercase text-muted-foreground tracking-[0.2em]">
        Powered by Supabase Auth
      </p>
    </div>
  );
};
