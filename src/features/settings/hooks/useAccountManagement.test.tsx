import { renderHook, act, waitFor } from "@testing-library/react";
import { useAccountManagement } from "./useAccountManagement";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAuth } from "@/contexts/AuthContext";
import { clearAllCards } from "@/db/repositories/cardRepository";
import { toast } from "sonner";

vi.mock("@/stores/useSettingsStore");
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/db/repositories/cardRepository", () => ({
    clearAllCards: vi.fn(),
    saveAllCards: vi.fn(),
}));
vi.mock("@/db/repositories/historyRepository", () => ({ clearHistory: vi.fn() }));
const { mockToast } = vi.hoisted(() => ({ mockToast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
vi.mock("sonner", () => ({ toast: mockToast }));
vi.mock("@/db/dexie", () => ({
    db: { revlog: { clear: vi.fn() }, aggregated_stats: { clear: vi.fn() } }
}));
vi.mock("@/hooks/useDeckActions", () => ({ useDeckActions: () => ({ refreshDeckData: vi.fn() }) }));

describe("useAccountManagement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: { id: "user1" }, deleteAccount: vi.fn() });
        (useSettingsStore as any).mockReturnValue("polish"); // Default mock for language
        (useSettingsStore as any).mockImplementation((selector: any) => selector({ language: "polish", proficiency: {}, updateSettings: vi.fn() }));
    });

    it("should handle deck reset confirmation flow", async () => {
        const { result } = renderHook(() => useAccountManagement());

        // First click triggers warning
        act(() => {
            result.current.handleResetDeck();
        });
        expect(mockToast.warning).toHaveBeenCalled();
        expect(result.current.confirmResetDeck).toBe(true);

        // Second click triggers reset
        await act(async () => {
             await result.current.handleResetDeck();
        });
        expect(clearAllCards).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining("reset"));
        expect(result.current.confirmResetDeck).toBe(false);
    });

     it("should handle account delete confirmation flow", async () => {
        const deleteAccount = vi.fn();
        (useAuth as any).mockReturnValue({ user: {}, deleteAccount });
        const { result } = renderHook(() => useAccountManagement());

        act(() => {
            result.current.handleResetAccount();
        });
        expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining("Click again"));
        expect(result.current.confirmResetAccount).toBe(true);

        await act(async () => {
             await result.current.handleResetAccount();
        });
        expect(deleteAccount).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith("Account deleted.");
    });
});
