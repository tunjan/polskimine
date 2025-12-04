import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Language } from '../types';
import { FSRS_DEFAULTS } from '../constants';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings, migrateLocalSettingsToDatabase, UserApiKeys } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';


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
    spanish: '45 100% 50%', 
  },
  dailyNewLimits: createLimits(20),
  dailyReviewLimits: createLimits(100),
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  showWholeSentenceOnFront: false,
  ignoreLearningStepsWhenNoCards: false,
  binaryRatingMode: false,
  cardOrder: 'newFirst',
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
  settingsLoading: boolean;
  saveApiKeys: (apiKeys: UserApiKeys) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('language_mining_settings');
      if (saved) {
        const parsed = JSON.parse(saved);

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
          
          geminiApiKey: '',
        };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  
  useEffect(() => {
    const loadCloudSettings = async () => {
      if (!user) return;

      setSettingsLoading(true);
      try {
        
        const migrated = await migrateLocalSettingsToDatabase(user.id);
        if (migrated) {
          toast.success('Settings migrated to cloud');
        }

        
        const cloudSettings = await getUserSettings(user.id);
        if (cloudSettings) {
          setSettings(prev => ({
            ...prev,
            geminiApiKey: cloudSettings.geminiApiKey || '',
            tts: {
              ...prev.tts,
              googleApiKey: cloudSettings.googleTtsApiKey || '',
              azureApiKey: cloudSettings.azureTtsApiKey || '',
              azureRegion: cloudSettings.azureRegion || 'eastus',
            }
          }));
        }
      } catch (error) {
        console.error('Failed to load cloud settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadCloudSettings();
  }, [user]);

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

  
  const saveApiKeys = async (apiKeys: UserApiKeys) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setSettingsLoading(true);
      await updateUserSettings(user.id, apiKeys);

      
      setSettings(prev => ({
        ...prev,
        geminiApiKey: apiKeys.geminiApiKey || '',
        tts: {
          ...prev.tts,
          googleApiKey: apiKeys.googleTtsApiKey || '',
          azureApiKey: apiKeys.azureTtsApiKey || '',
          azureRegion: apiKeys.azureRegion || 'eastus',
        }
      }));

      toast.success('API keys synced to cloud');
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Failed to sync API keys');
      throw error;
    } finally {
      setSettingsLoading(false);
    }
  };

  
  useEffect(() => {
    const localSettings = {
      ...settings,
      
      geminiApiKey: '',
      tts: {
        ...settings.tts,
        googleApiKey: '',
        azureApiKey: '',
      }
    };
    localStorage.setItem('language_mining_settings', JSON.stringify(localSettings));
  }, [settings]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, settingsLoading, saveApiKeys }}>
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