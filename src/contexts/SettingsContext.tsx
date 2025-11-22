import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Language } from '../types';
import { FSRS_DEFAULTS } from '../constants';

// Helper to create per-language limits objects
const createLimits = (val: number): Record<Language, number> => ({
  polish: val,
  norwegian: val,
  japanese: val,
  spanish: val
});

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'polish',
  languageColors: {
    polish: '346 84% 45%',
    norwegian: '200 90% 40%',
    japanese: '330 85% 65%',
    spanish: '45 100% 50%', // Yellow/Goldish
  },
  dailyNewLimits: createLimits(20),
  dailyReviewLimits: createLimits(100),
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  ignoreLearningStepsWhenNoCards: false,
  geminiApiKey: '',
  tts: {
    provider: 'browser',
    voiceURI: null,
    volume: 1.0,
    rate: 0.9,
    pitch: 1.0,
    googleApiKey: '',
    azureApiKey: '',
    azureRegion: 'eastus'
  },
  fsrs: {
    request_retention: FSRS_DEFAULTS.request_retention,
    maximum_interval: FSRS_DEFAULTS.maximum_interval,
    w: FSRS_DEFAULTS.w,
    enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
  }
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initialization: read localStorage before first render to avoid overwriting saved settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('language_mining_settings');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Migration: single numeric fields -> per-language objects
        let migratedDailyNewLimits = parsed.dailyNewLimits;
        if (typeof parsed.dailyNewLimit === 'number') {
          migratedDailyNewLimits = createLimits(parsed.dailyNewLimit);
        }
        let migratedDailyReviewLimits = parsed.dailyReviewLimits;
        if (typeof parsed.dailyReviewLimit === 'number') {
          migratedDailyReviewLimits = createLimits(parsed.dailyReviewLimit);
        }

        return {
          ...DEFAULT_SETTINGS,
            ...parsed,
            dailyNewLimits: migratedDailyNewLimits || DEFAULT_SETTINGS.dailyNewLimits,
            dailyReviewLimits: migratedDailyReviewLimits || DEFAULT_SETTINGS.dailyReviewLimits,
            fsrs: { ...DEFAULT_SETTINGS.fsrs, ...(parsed.fsrs || {}) },
            tts: { ...DEFAULT_SETTINGS.tts, ...(parsed.tts || {}) },
            languageColors: { ...DEFAULT_SETTINGS.languageColors, ...(parsed.languageColors || {}) },
            geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey
        };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      fsrs: { ...prev.fsrs, ...(newSettings.fsrs || {}) },
      tts: { ...prev.tts, ...(newSettings.tts || {}) },
      languageColors: { ...prev.languageColors, ...(newSettings.languageColors || {}) },
      dailyNewLimits: { ...prev.dailyNewLimits, ...(newSettings.dailyNewLimits || {}) },
      dailyReviewLimits: { ...prev.dailyReviewLimits, ...(newSettings.dailyReviewLimits || {}) },
    }));
  };

  // Sync settings to localStorage whenever they change
  // (separated from state updater to ensure pure reducer functions and prevent
  // multiple writes in Strict Mode)
  useEffect(() => {
    localStorage.setItem('language_mining_settings', JSON.stringify(settings));
  }, [settings]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};