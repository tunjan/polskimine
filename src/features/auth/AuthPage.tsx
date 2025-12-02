import React, { useState } from 'react';
import { ArrowRight, Command, ArrowLeft } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/game-ui';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty } from '@/types';
import clsx from 'clsx';

type SignupStep = 'credentials' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, markInitialDeckGenerated } = useAuth();
  const { settings } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Signup flow state
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      toast.success('Session established.');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Move to level selection
    setSignupStep('level');
  };

  const handleLevelSelected = () => {
    if (!selectedLevel) {
      toast.error('Please select a proficiency level');
      return;
    }
    setSignupStep('deck');
  };

  const handleDeckSetup = async (useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      // First, create the account
      const authData = await signUpWithEmail(email, password, username, selectedLevel);

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      const userId = authData.user.id;

      // If using AI, save API key and generate deck
      if (useAI && apiKey) {
        // Save API key to database
        await updateUserSettings(userId, { geminiApiKey: apiKey });

        // Generate AI deck
        const cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });

        // Save cards to database
        await saveAllCards(cards);
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        // Default deck will be auto-loaded by DeckContext
        toast.success('Account created! Loading beginner course...');
      }

      // Mark initial deck as generated
      await markInitialDeckGenerated();

      // Success toast already shown above
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Setup failed');
      throw error; // Re-throw so DeckGenerationStep can handle it
    } finally {
      setLoading(false);
    }
  };

  const resetSignupFlow = () => {
    setSignupStep('credentials');
    setSelectedLevel(null);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetSignupFlow();
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
              {mode === 'signin'
                ? 'Welcome back.'
                : signupStep === 'credentials'
                  ? 'Initialize account.'
                  : signupStep === 'level'
                    ? 'Select level.'
                    : 'Setup deck.'}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {mode === 'signin'
                ? 'Enter credentials to continue.'
                : signupStep === 'credentials'
                  ? 'Begin your sequence.'
                  : signupStep === 'level'
                    ? `Step 2 of 3`
                    : `Step 3 of 3`}
            </p>
          </div>
        </div>

        {/* Signin Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-8">

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
                autoComplete="current-password"
              />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                {loading ? (
                  <ButtonLoader />
                ) : (
                  <>
                    Connect
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
        )}

        {/* Signup Form - Step 1: Credentials */}
        {mode === 'signup' && signupStep === 'credentials' && (
          <form onSubmit={handleSignUpCredentials} className="flex flex-col gap-8">

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
                autoComplete="new-password"
              />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Signup Step 2: Level Selection */}
        {mode === 'signup' && signupStep === 'level' && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSignupStep('credentials')}
                className="h-11 px-4 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 rounded-[2px]"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={handleLevelSelected}
                disabled={!selectedLevel}
                className="flex-1 h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Signup Step 3: Deck Generation */}
        {mode === 'signup' && signupStep === 'deck' && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              language={settings.language}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckSetup}
            />

            <button
              type="button"
              onClick={() => setSignupStep('level')}
              disabled={loading}
              className="h-11 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 rounded-[2px] disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        )}

        {/* Footer / Toggle */}
        {signupStep === 'credentials' && (
          <div className="flex justify-center">
            <button
              onClick={toggleMode}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <span>{mode === 'signin' ? 'No account?' : 'Have an account?'}</span>
              <span className="border-b border-muted-foreground/30 group-hover:border-foreground pb-0.5">
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </span>
            </button>
          </div>
        )}

      </div>

      {/* Version Tag */}
      <div className="fixed bottom-6 left-6 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
        System v2.0
      </div>
    </div>
  );
};