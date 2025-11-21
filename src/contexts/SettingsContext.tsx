import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { FSRS_DEFAULTS } from '../constants';

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'polish',
  languageColors: {
    polish: '346 84% 45%',
    norwegian: '200 90% 40%',
    japanese: '330 85% 65%',
  },
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  ignoreLearningStepsWhenNoCards: false,
  // Added TTS Defaults
  tts: {
    provider: 'browser',
    voiceURI: null, // null = use browser default
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
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('language_mining_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setSettings(prev => ({
            ...prev,
            ...parsed,
            // Deep merge nested objects to ensure new fields (like tts) exist if local storage is old
            fsrs: { ...prev.fsrs, ...(parsed.fsrs || {}) },
            tts: { ...prev.tts, ...(parsed.tts || {}) },
            languageColors: { ...prev.languageColors, ...(parsed.languageColors || {}) }
        }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        fsrs: { ...prev.fsrs, ...(newSettings.fsrs || {}) },
        tts: { ...prev.tts, ...(newSettings.tts || {}) },
        languageColors: { ...prev.languageColors, ...(newSettings.languageColors || {}) }
      };
      localStorage.setItem('language_mining_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('language_mining_settings', JSON.stringify(DEFAULT_SETTINGS));
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