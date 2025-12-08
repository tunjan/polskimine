import { create } from 'zustand';
import { UserSettings, Language, LanguageId } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { UserApiKeys, updateUserSettings } from '@/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const DEFAULT_SETTINGS: UserSettings = {
    language: LanguageId.Polish,
    languageColors: {
        [LanguageId.Polish]: '#dc2626',
        [LanguageId.Norwegian]: '#ef4444',
        [LanguageId.Japanese]: '#f87171',
        [LanguageId.Spanish]: '#fca5a5',
        [LanguageId.German]: '#facc15',
    },
    dailyNewLimits: {
        [LanguageId.Polish]: 20,
        [LanguageId.Norwegian]: 20,
        [LanguageId.Japanese]: 20,
        [LanguageId.Spanish]: 20,
        [LanguageId.German]: 20,
    },
    dailyReviewLimits: {
        [LanguageId.Polish]: 100,
        [LanguageId.Norwegian]: 100,
        [LanguageId.Japanese]: 100,
        [LanguageId.Spanish]: 100,
        [LanguageId.German]: 100,
    },
    autoPlayAudio: false,
    blindMode: false,
    showTranslationAfterFlip: true,
    showWholeSentenceOnFront: false,
    ignoreLearningStepsWhenNoCards: false,
    binaryRatingMode: false,
    cardOrder: 'newFirst',
    learningSteps: [1, 10], geminiApiKey: '',
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

const getInitialSettings = (): UserSettings => {
    return DEFAULT_SETTINGS;
};

export interface SettingsState {
    settings: UserSettings;
    settingsLoading: boolean;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    resetSettings: () => void;
    setSettingsLoading: (loading: boolean) => void;
    setSettings: (settings: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
    saveApiKeys: (userId: string, apiKeys: UserApiKeys) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: getInitialSettings(),
    settingsLoading: false,

    updateSettings: (newSettings) =>
        set((state) => ({
            settings: {
                ...state.settings,
                ...newSettings,
                fsrs: newSettings.fsrs 
                    ? { ...state.settings.fsrs, ...newSettings.fsrs }
                    : state.settings.fsrs,
                tts: newSettings.tts
                    ? { ...state.settings.tts, ...newSettings.tts }
                    : state.settings.tts,
                languageColors: newSettings.languageColors
                    ? { ...state.settings.languageColors, ...(newSettings.languageColors as Record<Language, string>) }
                    : state.settings.languageColors,
                dailyNewLimits: newSettings.dailyNewLimits
                    ? { ...state.settings.dailyNewLimits, ...newSettings.dailyNewLimits }
                    : state.settings.dailyNewLimits,
                dailyReviewLimits: newSettings.dailyReviewLimits
                    ? { ...state.settings.dailyReviewLimits, ...newSettings.dailyReviewLimits }
                    : state.settings.dailyReviewLimits,
                learningSteps: newSettings.learningSteps || state.settings.learningSteps,
            },
        })),

    resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

    setSettingsLoading: (loading) => set({ settingsLoading: loading }),

    setSettings: (newSettings) =>
        set((state) => ({
            settings: typeof newSettings === 'function' ? newSettings(state.settings) : newSettings,
        })),

    saveApiKeys: async (userId, apiKeys) => {
        set({ settingsLoading: true });
        try {
            await updateUserSettings(userId, apiKeys);

            set((state) => ({
                settings: {
                    ...state.settings,
                    geminiApiKey: apiKeys.geminiApiKey || '',
                    tts: {
                        ...state.settings.tts,
                        googleApiKey: apiKeys.googleTtsApiKey || '',
                        azureApiKey: apiKeys.azureTtsApiKey || '',
                        azureRegion: apiKeys.azureRegion || 'eastus',
                    },
                },
            }));

            toast.success('API keys synced to cloud');
        } catch (error) {
            console.error('Failed to save API keys:', error);
            toast.error('Failed to sync API keys');
            throw error;
        } finally {
            set({ settingsLoading: false });
        }
    },
}));
