import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { Difficulty, Card, Language } from '@/types';
import { toast } from 'sonner';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { Command, LogOut } from 'lucide-react';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

export const OnboardingFlow: React.FC = () => {
  const { user, markInitialDeckGenerated, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState<'language' | 'level' | 'deck'>('language');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLanguageSelected = (language: Language) => {
    updateSettings({ language });
    setStep('level');
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep('deck');
  };

  const handleDeckComplete = async (useAI: boolean, apiKey?: string) => {
    if (!user || !selectedLevel) return;

    try {

      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }


      let cards: Card[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
      } else {

        const rawDeck =
          settings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK :
            (settings.language === 'japanese' ? JAPANESE_BEGINNER_DECK :
              (settings.language === 'spanish' ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));

        cards = rawDeck.map(c => ({
          ...c,
          id: uuidv4(),
          dueDate: new Date().toISOString(),

          tags: [...(c.tags || []), selectedLevel]
        }));
      }


      if (cards.length > 0) {
        await saveAllCards(cards);
        toast.success(`Loaded ${cards.length} cards into your deck.`);
      }


      await markInitialDeckGenerated();

    } catch (error: any) {
      console.error('Onboarding failed:', error);
      toast.error(error.message || 'Setup failed. Please try again.');
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">

      {/* Header / Nav */}
      <div className="fixed top-6 right-6">
        <button
          onClick={() => signOut()}
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Branding */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {step === 'language' ? 'Select Language.' : (step === 'level' ? 'Proficiency Level.' : 'Initialize Deck.')}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === 'language' ? 'Step 1 of 3' : (step === 'level' ? 'Step 2 of 3' : 'Step 3 of 3')}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === 'language' && (
          <LanguageSelector
            selectedLanguage={settings.language}
            onSelectLanguage={handleLanguageSelected}
          />
        )}

        {step === 'level' && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={handleLevelSelected}
            />
            <button
              onClick={() => setStep('language')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Back to Language Selection
            </button>
          </div>
        )}

        {step === 'deck' && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              language={settings.language}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckComplete}
            />
            <button
              onClick={() => setStep('level')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Back to Level Selection
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
