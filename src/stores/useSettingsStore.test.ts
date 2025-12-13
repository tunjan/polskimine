import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsStore, DEFAULT_SETTINGS } from "./useSettingsStore";
import { LanguageId } from "@/types";


vi.mock("@/db/repositories/settingsRepository", () => ({
  updateUserSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { updateUserSettings } from "@/db/repositories/settingsRepository";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      ...DEFAULT_SETTINGS,
      userId: "test-user-id",
      settingsLoading: false,
    });
    vi.clearAllMocks();
  });

  it("should initialize with default settings", () => {
    const state = useSettingsStore.getState();
    expect(state.language).toBe(LanguageId.Polish);
    expect(state.fsrs).toEqual(DEFAULT_SETTINGS.fsrs);
  });

  it("should update simple settings", () => {
    useSettingsStore.getState().updateSettings({ autoPlayAudio: true });
    expect(useSettingsStore.getState().autoPlayAudio).toBe(true);
  });

  it("should deeply merge nested settings (fsrs)", () => {
    useSettingsStore.getState().updateSettings({
      fsrs: { request_retention: 0.85 } as any
    });
    const state = useSettingsStore.getState();
    expect(state.fsrs.request_retention).toBe(0.85);
    
    expect(state.fsrs.maximum_interval).toBe(DEFAULT_SETTINGS.fsrs.maximum_interval);
  });

  it("should trigger persistence on update", () => {
    
    
    vi.useFakeTimers();
    useSettingsStore.getState().updateSettings({ autoPlayAudio: true });
    
    
    vi.advanceTimersByTime(1001);
    
    expect(updateUserSettings).toHaveBeenCalledWith("test-user-id", expect.objectContaining({
      autoPlayAudio: true
    }));
    
    vi.useRealTimers();
  });

  it("should reset settings to default", () => {
    useSettingsStore.getState().updateSettings({ autoPlayAudio: !DEFAULT_SETTINGS.autoPlayAudio });
    useSettingsStore.getState().resetSettings();
    expect(useSettingsStore.getState().autoPlayAudio).toBe(DEFAULT_SETTINGS.autoPlayAudio);
  });

  it("should save API keys", async () => {
    await useSettingsStore.getState().saveApiKeys({
      geminiApiKey: "new-key",
    });
    
    expect(updateUserSettings).toHaveBeenCalledWith("test-user-id", { geminiApiKey: "new-key" });
    expect(useSettingsStore.getState().geminiApiKey).toBe("new-key");
  });
});
