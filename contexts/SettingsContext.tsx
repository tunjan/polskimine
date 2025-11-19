import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { FSRS_DEFAULTS } from '../constants';

const DEFAULT_SETTINGS: UserSettings = {
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  autoPlayAudio: false,
  showTranslationAfterFlip: true,
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
    const saved = localStorage.getItem('polskimine_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default to handle new fields in future
        setSettings(prev => ({
            ...prev,
            ...parsed,
            fsrs: { ...prev.fsrs, ...(parsed.fsrs || {}) }
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
        fsrs: {
            ...prev.fsrs,
            ...(newSettings.fsrs || {})
        }
      };
      localStorage.setItem('polskimine_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('polskimine_settings', JSON.stringify(DEFAULT_SETTINGS));
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
