import { create } from "zustand";
import { UserSettings, Language, LanguageId } from "@/types";
import { FSRS_DEFAULTS } from "@/constants";
import {
  UserApiKeys,
  updateUserSettings,
} from "@/db/repositories/settingsRepository";
import { toast } from "sonner";
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: LanguageId.Polish,
  languageColors: {
    [LanguageId.Polish]: "#dc2626",
    [LanguageId.Norwegian]: "#ef4444",
    [LanguageId.Japanese]: "#f87171",
    [LanguageId.Spanish]: "#fca5a5",
    [LanguageId.German]: "#facc15",
  },
  proficiency: {
    [LanguageId.Polish]: "A1",
    [LanguageId.Norwegian]: "A1",
    [LanguageId.Japanese]: "A1",
    [LanguageId.Spanish]: "A1",
    [LanguageId.German]: "A1",
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
  playTargetWordAudioBeforeSentence: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  showWholeSentenceOnFront: false,
  ignoreLearningStepsWhenNoCards: false,
  binaryRatingMode: false,
  cardOrder: "newFirst",
  learningSteps: [1, 10],
  // Display Order
  newCardGatherOrder: "added",
  newCardSortOrder: "due",
  newReviewOrder: "newFirst",
  interdayLearningOrder: "mixed",
  reviewSortOrder: "due",
  // Lapses
  relearnSteps: [10],
  leechThreshold: 8,

  geminiApiKey: "AIzaSyBMVVvi9wcODo7c9-Da562BaLD-OwC1Xkk",
  tts: {
    provider: "browser",
    voiceURI: null,
    volume: 1.0,
    rate: 0.9,
    pitch: 1.0,
    googleApiKey: "",
    azureApiKey: "",
    azureRegion: "eastus",
  },
  fsrs: {
    request_retention: FSRS_DEFAULTS.request_retention,
    maximum_interval: FSRS_DEFAULTS.maximum_interval,
    w: FSRS_DEFAULTS.w,
    enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
  },
};

const debouncedSaveSettings = debounce(
  (userId: string, settings: UserSettings) => {
    updateUserSettings(userId, settings).catch((err) => {
      console.error("Failed to auto-save settings", err);
    });
  },
  1000,
);

export interface SettingsState extends UserSettings {
  settingsLoading: boolean;
  userId: string | null;

  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  setSettingsLoading: (loading: boolean) => void;
  setFullSettings: (
    settings: UserSettings | ((prev: UserSettings) => UserSettings),
  ) => void;
  initializeStore: (userId: string, settings: UserSettings) => void;
  saveApiKeys: (apiKeys: UserApiKeys) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  settingsLoading: false,
  userId: null,

  updateSettings: (newSettings) => {
    set((state) => {
      const updatedState = {
        ...state,
        ...newSettings,
        fsrs: newSettings.fsrs
          ? { ...state.fsrs, ...newSettings.fsrs }
          : state.fsrs,
        tts: newSettings.tts ? { ...state.tts, ...newSettings.tts } : state.tts,
        languageColors: newSettings.languageColors
          ? {
              ...state.languageColors,
              ...(newSettings.languageColors as Record<Language, string>),
            }
          : state.languageColors,
        proficiency: newSettings.proficiency
          ? { ...state.proficiency, ...newSettings.proficiency }
          : state.proficiency,
        dailyNewLimits: newSettings.dailyNewLimits
          ? { ...state.dailyNewLimits, ...newSettings.dailyNewLimits }
          : state.dailyNewLimits,
        dailyReviewLimits: newSettings.dailyReviewLimits
          ? { ...state.dailyReviewLimits, ...newSettings.dailyReviewLimits }
          : state.dailyReviewLimits,
        learningSteps: newSettings.learningSteps || state.learningSteps,
      };

      const userId = state.userId;
      if (userId) {
        const settingsToSave: UserSettings = {
          language: updatedState.language,
          languageColors: updatedState.languageColors,
          proficiency: updatedState.proficiency,
          dailyNewLimits: updatedState.dailyNewLimits,
          dailyReviewLimits: updatedState.dailyReviewLimits,
          autoPlayAudio: updatedState.autoPlayAudio,
          playTargetWordAudioBeforeSentence:
            updatedState.playTargetWordAudioBeforeSentence,
          blindMode: updatedState.blindMode,
          showTranslationAfterFlip: updatedState.showTranslationAfterFlip,
          showWholeSentenceOnFront: updatedState.showWholeSentenceOnFront,
          ignoreLearningStepsWhenNoCards:
            updatedState.ignoreLearningStepsWhenNoCards,
          binaryRatingMode: updatedState.binaryRatingMode,
          cardOrder: updatedState.cardOrder,
          learningSteps: updatedState.learningSteps,
          // Display Order
          newCardGatherOrder: updatedState.newCardGatherOrder,
          newCardSortOrder: updatedState.newCardSortOrder,
          newReviewOrder: updatedState.newReviewOrder,
          interdayLearningOrder: updatedState.interdayLearningOrder,
          reviewSortOrder: updatedState.reviewSortOrder,
          // Lapses
          relearnSteps: updatedState.relearnSteps,
          leechThreshold: updatedState.leechThreshold,
          leechAction: updatedState.leechAction,
          geminiApiKey: updatedState.geminiApiKey,
          tts: updatedState.tts,
          fsrs: updatedState.fsrs,
        };
        debouncedSaveSettings(userId, settingsToSave);
      }

      return updatedState;
    });
  },

  resetSettings: () => set({ ...DEFAULT_SETTINGS }),
  setSettingsLoading: (loading) => set({ settingsLoading: loading }),

  setFullSettings: (settingsOrUpdater) =>
    set((state) => {
      const newSettings =
        typeof settingsOrUpdater === "function"
          ? settingsOrUpdater(state)
          : settingsOrUpdater;
      return { ...newSettings };
    }),

  initializeStore: (userId, settings) => set({ userId, ...settings }),

  saveApiKeys: async (apiKeys) => {
    set({ settingsLoading: true });
    const { userId } = get();
    if (!userId) {
      console.error("No user ID found during saveApiKeys");
      set({ settingsLoading: false });
      return;
    }

    try {
      await updateUserSettings(userId, apiKeys);
      set((state) => ({
        geminiApiKey:
          apiKeys.geminiApiKey !== undefined
            ? apiKeys.geminiApiKey
            : state.geminiApiKey,
        tts: {
          ...state.tts,
          googleApiKey:
            apiKeys.googleTtsApiKey !== undefined
              ? apiKeys.googleTtsApiKey
              : state.tts.googleApiKey,
          azureApiKey:
            apiKeys.azureTtsApiKey !== undefined
              ? apiKeys.azureTtsApiKey
              : state.tts.azureApiKey,
          azureRegion:
            apiKeys.azureRegion !== undefined
              ? apiKeys.azureRegion
              : state.tts.azureRegion,
        },
      }));

      toast.success("API keys synced to cloud");
    } catch (error) {
      console.error("Failed to save API keys:", error);
      toast.error("Failed to sync API keys");
      throw error;
    } finally {
      set({ settingsLoading: false });
    }
  },
}));
