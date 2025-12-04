import React, { useState } from 'react';
import { ArrowRight, Command, ArrowLeft, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty } from '@/types';
import { AuthLayout } from './components/AuthLayout';
import { GamePanel, GameButton, GameInput, GameDivider, GameLoader } from '@/components/ui/game-ui';

type SignupStep = 'credentials' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, markInitialDeckGenerated } = useAuth();
  const { settings } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

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
    setSignupStep('level');
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSignupStep('deck');
  };

  const handleDeckSetup = async (useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      const authData = await signUpWithEmail(email, password, username, selectedLevel);

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      const userId = authData.user.id;

      if (useAI && apiKey) {
        await updateUserSettings(userId, { geminiApiKey: apiKey });
        const cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
        await saveAllCards(cards);
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        toast.success('Account created! Loading beginner course...');
      }

      await markInitialDeckGenerated();
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  // Render helpers
  const renderHeader = () => (
    <div className="text-center mb-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-500">
        <Command size={32} />
      </div>
      <h1 className="text-2xl font-bold tracking-tight font-ui uppercase text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        {mode === 'signin' ? 'Welcome back, Traveler' : 'Begin your journey'}
      </p>
    </div>
  );

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <GameInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail size={16} />}
        required
      />
      <GameInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={16} />}
        required
      />
      
      <GameButton type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? <GameLoader size="sm" /> : 'Sign In'}
      </GameButton>
    </form>
  );

  const renderSignUpCredentials = () => (
    <form onSubmit={handleSignUpCredentials} className="space-y-4">
      <GameInput
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={<UserIcon size={16} />}
        required
      />
      <GameInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail size={16} />}
        required
      />
      <GameInput
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={16} />}
        required
      />
      
      <GameButton type="submit" className="w-full mt-2">
        Continue <ArrowRight size={16} />
      </GameButton>
    </form>
  );

  if (loading && signupStep === 'deck') {
    return (
      <AuthLayout>
        <GamePanel variant="ornate" className="text-center py-12">
          <GameLoader size="lg" text="Forging your deck..." />
          <p className="mt-6 text-muted-foreground text-sm max-w-xs mx-auto">
            Consulting the archives to prepare your personalized learning path.
          </p>
        </GamePanel>
      </AuthLayout>
    );
  }

  if (mode === 'signup' && signupStep === 'level') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSignupStep('credentials')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector 
            selectedLevel={selectedLevel} 
            onSelectLevel={handleLevelSelected} 
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  if (mode === 'signup' && signupStep === 'deck') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSignupStep('level')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Deck Configuration</h2>
          </div>
          <DeckGenerationStep 
            language={settings.language}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <GamePanel variant="ornate" showCorners className="py-8 px-6 md:px-8">
        {renderHeader()}

        {mode === 'signin' ? renderSignIn() : renderSignUpCredentials()}

        <GameDivider />

        <div className="space-y-4">
          <GameButton 
            variant="secondary" 
            className="w-full" 
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <Command size={16} /> Continue with Google
          </GameButton>

          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setSignupStep('credentials');
              }}
              className="text-xs text-muted-foreground hover:text-amber-500 transition-colors font-medium uppercase tracking-wider"
            >
              {mode === 'signin' 
                ? "Don't have an account? Join the guild" 
                : "Already a member? Sign in"}
            </button>
          </div>
        </div>
      </GamePanel>
    </AuthLayout>
  );
};
