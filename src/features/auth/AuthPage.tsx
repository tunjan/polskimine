import React, { useState } from 'react';
import { ArrowRight, Loader2, Command } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, username);
        toast.success('Account created. Please check your email.');
      } else {
        await signInWithEmail(email, password);
        toast.success('Session established.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">
      
      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {mode === 'signin' ? 'Welcome back.' : 'Initialize account.'}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {mode === 'signin' ? 'Enter credentials to continue.' : 'Begin your sequence.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {mode === 'signup' && (
            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Username
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="User_01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          )}

          <div className="group relative">
            <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
              Email Address
            </label>
            <input
              className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
              placeholder="user@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="group relative">
            <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
              Password
            </label>
            <input
              className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Connect' : 'Register'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full h-11 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-3 rounded-[2px]"
            >
              Google Auth
            </button>
          </div>
        </form>

        {/* Footer / Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setEmail('');
                setPassword('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
          >
            <span>{mode === 'signin' ? 'No account?' : 'Have an account?'}</span>
            <span className="border-b border-muted-foreground/30 group-hover:border-foreground pb-0.5">
                {mode === 'signin' ? 'Create one' : 'Sign in'}
            </span>
          </button>
        </div>

      </div>

      {/* Version Tag */}
      <div className="fixed bottom-6 left-6 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
        System v2.0
      </div>
    </div>
  );
};