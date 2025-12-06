import { create } from 'zustand';
import { UserSettings, Language, LanguageId } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { UserApiKeys, updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';

const createLimits = (val: number): Record<Language, number> => ({
    [LanguageId.Polish]: val,
    [LanguageId.Norwegian]: val,
    [LanguageId.Japanese]: val,
    [LanguageId.Spanish]: val,
    [LanguageId.German]: val
});

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

const getInitialSettings = (): UserSettings => {
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

            // Validate cardOrder
            let validCardOrder = parsed.cardOrder;
            if (validCardOrder !== 'newFirst' && validCardOrder !== 'reviewFirst' && validCardOrder !== 'mixed') {
                validCardOrder = DEFAULT_SETTINGS.cardOrder;
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
                cardOrder: validCardOrder,
            };
        }
    } catch (e) {
        console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
};

interface SettingsState {
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
                fsrs: { ...state.settings.fsrs, ...(newSettings.fsrs || {}) },
                tts: { ...state.settings.tts, ...(newSettings.tts || {}) },
                languageColors: { ...state.settings.languageColors, ...(newSettings.languageColors || {}) },
                dailyNewLimits: { ...state.settings.dailyNewLimits, ...(newSettings.dailyNewLimits || {}) },
                dailyReviewLimits: { ...state.settings.dailyReviewLimits, ...(newSettings.dailyReviewLimits || {}) },
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
