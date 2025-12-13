import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsContent } from "./SettingsPage"; 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { TTS_PROVIDER } from "@/constants/settings";


vi.mock("@/stores/useSettingsStore");
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/features/profile/hooks/useProfile", () => ({ useProfile: vi.fn() }));
vi.mock("@/hooks/useDeckActions", () => ({ useDeckActions: () => ({ refreshDeckData: vi.fn() }) }));
vi.mock("@/features/settings/hooks/useCloudSync", () => ({ useCloudSync: () => ({ handleSyncToCloud: vi.fn() }) }));
vi.mock("@/features/settings/hooks/useSyncthingSync", () => ({ useSyncthingSync: () => ({ saveToSyncFile: vi.fn(), loadFromSyncFile: vi.fn() }) }));
vi.mock("@/features/settings/hooks/useAccountManagement", () => ({ 
    useAccountManagement: () => ({ 
        handleResetDeck: vi.fn(), 
        handleResetAccount: vi.fn(),
        confirmResetDeck: false,
        confirmResetAccount: false
    }) 
}));
vi.mock("@/lib/tts", () => ({ ttsService: { getAvailableVoices: vi.fn().mockResolvedValue([]), speak: vi.fn() } }));


global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("SettingsPage", () => {
    const setSettings = vi.fn();
    const updateUsername = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useSettingsStore as any).mockImplementation((selector: any) => {
            if (!selector) return { language: "polish", tts: { provider: TTS_PROVIDER.BROWSER, rate: 1, volume: 1 }, fsrs: { w: [] } }; 
            return selector({ setFullSettings: setSettings }); 
        });
        (useAuth as any).mockReturnValue({ user: { id: "user1" } });
        (useProfile as any).mockReturnValue({ profile: { username: "TestUser" }, updateUsername });
    });

    it("should render profile settings", () => {
        render(<SettingsContent />);
        expect(screen.getByDisplayValue("TestUser")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("should render language settings", () => {
        render(<SettingsContent />);
        expect(screen.getByText("Language")).toBeInTheDocument();
        expect(screen.getByText("Active Course")).toBeInTheDocument();
    });

    it("should render TTS settings", () => {
        render(<SettingsContent />);
        expect(screen.getByText("Audio")).toBeInTheDocument();
        expect(screen.getByText("Browser Native")).toBeInTheDocument();
    });

    
});
