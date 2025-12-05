import React, { useState } from 'react';
import { ArrowRight, Command, ArrowLeft, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LanguageLevelSelector, DeckGenerationStep, AuthLayout } from './components';
import { LanguageSelector } from './components/LanguageSelector';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty, Card, Language, LanguageId } from '@/types';
import { GamePanel, GameButton, GameInput, GameLoader } from '@/components/ui/game-ui';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

type SetupStep = 'username' | 'language' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { createLocalProfile, markInitialDeckGenerated } = useProfile();

  const { settings, updateSettings } = useSettings();
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

  const handleDeckSetup = async (useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      await createLocalProfile(username.trim(), selectedLevel);

      if (useAI && apiKey) {
        await updateUserSettings('local-user', { geminiApiKey: apiKey });
      }

      let cards: Card[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        const rawDeck =
          settings.language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
            (settings.language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
              (settings.language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));

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

      await markInitialDeckGenerated();
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center mb-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-400/10 border-2 border-amber-400/20 flex items-center justify-center text-amber-400">
        <Command size={32} />
      </div>
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
      <GameInput
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={<UserIcon size={16} />}
        required
        minLength={3}
        maxLength={20}
      />

      <GameButton type="submit" className="w-full mt-2">
        Continue <ArrowRight size={16} />
      </GameButton>
    </form>
  );

  if (loading && setupStep === 'deck') {
    return (
      <AuthLayout>
        <GamePanel variant="ornate" className="text-center py-12">
          <GameLoader size="lg" text="Forging your deck..." />
          <p className="mt-6 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </GamePanel>
      </AuthLayout>
    );
  }

  if (setupStep === 'language') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('username')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Select Language</h2>
          </div>
          <LanguageSelector
            selectedLanguage={settings.language}
            onSelect={handleLanguageSelected}
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  if (setupStep === 'level') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('language')}>
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

  if (setupStep === 'deck') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('level')}>
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
        {renderUsernameStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </GamePanel>
    </AuthLayout>
  );
};
