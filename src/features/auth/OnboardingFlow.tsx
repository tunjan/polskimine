import React, { useState } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { Difficulty, Card, Language, LanguageId } from '@/types';
import { toast } from 'sonner';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { Command, LogOut } from 'lucide-react';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { GERMAN_BEGINNER_DECK } from '@/features/deck/data/germanBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

const BEGINNER_DECKS: Record<Language, Card[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const OnboardingFlow: React.FC = () => {
  const { user, signOut } = useAuth();
  const { markInitialDeckGenerated } = useProfile();
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [step, setStep] = useState<'language' | 'level' | 'deck'>('language');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      // Set the first selected language as the primary language
      updateSettings({ language: selectedLanguages[0] });
      setStep('level');
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep('deck');
  };

  const handleDeckComplete = async (languages: Language[], useAI: boolean, apiKey?: string) => {
    if (!user || !selectedLevel) return;

    try {
      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }

      let allCards: Card[] = [];

      if (useAI && apiKey) {
        // For AI generation, generate for all selected languages
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
      } else {
        // Load default decks for all selected languages
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map(c => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: user.id
          }));
          allCards = [...allCards, ...languageCards];
        }
      }

      // Ensure all cards have user_id
      allCards = allCards.map(c => ({ ...c, user_id: user.id }));

      if (allCards.length > 0) {
        console.log('[OnboardingFlow] Saving', allCards.length, 'cards across', languages.length, 'languages...');
        await saveAllCards(allCards);
        toast.success(`Loaded ${allCards.length} cards for ${languages.length} language${languages.length > 1 ? 's' : ''}.`);
        console.log('[OnboardingFlow] Cards saved.');
      }

      console.log('[OnboardingFlow] Marking initial deck as generated...');
      await markInitialDeckGenerated();

      setTimeout(() => {
        window.location.reload();
      }, 2000);

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
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
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
              {step === 'language' ? 'Select Languages.' : (step === 'level' ? 'Proficiency Level.' : 'Initialize Decks.')}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === 'language' ? 'Step 1 of 3' : (step === 'level' ? 'Step 2 of 3' : 'Step 3 of 3')}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === 'language' && (
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
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
              languages={selectedLanguages}
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
