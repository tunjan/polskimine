import React, { useState } from 'react';
import { Command, ArrowRight, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, username);
        toast.success('Account created! Please check your email to verify.');
      } else {
        await signInWithEmail(email, password);
        toast.success('Welcome back');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary text-background flex items-center justify-center rounded-full mb-6">
            <Command size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground">Enter your credentials to access LinguaFlow</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <div className="relative">
                  <UserIcon size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <Mail size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground h-11 rounded-md text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            type="button"
            className="w-full border border-border h-11 rounded-md text-xs font-mono uppercase tracking-wider hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp((prev) => !prev)}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};