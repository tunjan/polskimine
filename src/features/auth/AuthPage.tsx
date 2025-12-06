import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LanguageLevelSelector, DeckGenerationStep, AuthLayout } from './components';
import { LanguageSelector } from './components/LanguageSelector';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty, Card as CardType, Language, LanguageId } from '@/types';
import { Loader } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GenshinCorners } from '@/components/ui/decorative';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

type SetupStep = 'username' | 'language' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { markInitialDeckGenerated } = useProfile();
  const { login, signUpWithEmail } = useAuth();

  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [setupStep, setSetupStep] = useState<SetupStep>('username');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    setSetupStep('language');
  };

  const handleLanguageSelected = (language: Language) => {
    updateSettings({ language });
    setSetupStep('level');
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSetupStep('deck');
  };

  const handleDeckSetup = async (language: Language, useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      await signUpWithEmail('local', 'local', username.trim(), selectedLevel);

      if (useAI && apiKey) {
        await updateUserSettings('local-user', { geminiApiKey: apiKey });
      }

      let cards: CardType[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        const rawDeck =
          language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
            (language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
              (language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));

        cards = rawDeck.map(c => ({
          ...c,
          id: uuidv4(),
          dueDate: new Date().toISOString(),
          tags: [...(c.tags || []), selectedLevel]
        }));
        toast.success(`Loaded ${cards.length} starter cards!`);
      }

      if (cards.length > 0) {
        await saveAllCards(cards);
      }

      await markInitialDeckGenerated('local-user');
      await login();

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center my-8">

      <h1 className="text-2xl font-bold tracking-tight font-ui uppercase text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        Begin your journey
      </p>
    </div>
  );

  const renderUsernameStep = () => (
    <form onSubmit={handleUsernameSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-xs font-medium text-muted-foreground font-ui uppercase tracking-wider ml-1">
          Username
        </Label>
        <div className="relative group/input">
          <Input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-11"
            required
            minLength={3}
            maxLength={20}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-amber-500 transition-colors">
            <UserIcon size={16} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-2">
        Continue <ArrowRight size={16} />
      </Button>
    </form>
  );

  if (loading && setupStep === 'deck') {
    return (
      <AuthLayout>
        <Card variant="ornate" size="lg" className="text-center py-12">
          <Loader size="lg" />
          <h3 className="mt-4 text-lg font-medium tracking-wide font-ui">Forging your deck...</h3>
          <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'language') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card variant="ornate" size="lg">
          <GenshinCorners />
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('username')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold font-ui uppercase">Select Language</h2>
          </div>
          <LanguageSelector
            selectedLanguage={settings.language}
            onSelect={handleLanguageSelected}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'level') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card variant="ornate" size="lg">
          <GenshinCorners />
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('language')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold font-ui uppercase">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === 'deck') {
    return (
      <AuthLayout className="max-w-2xl">
        <Card variant="ornate" size="lg">
          <GenshinCorners />
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSetupStep('level')}>
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold font-ui uppercase">Deck Configuration</h2>
          </div>
          <DeckGenerationStep
            language={settings.language}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card variant="ornate" size="lg" className="py-8 px-6 md:px-8">
        <GenshinCorners />
        {renderHeader()}
        {renderUsernameStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
