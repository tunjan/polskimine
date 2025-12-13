import { renderHook, act, waitFor } from "@testing-library/react";
import { useSyncthingSync } from "./useSyncthingSync";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as syncService from "@/lib/sync/syncService";

vi.mock("@/lib/sync/syncService");
vi.mock("@/stores/useSettingsStore", () => ({
    useSettingsStore: Object.assign(vi.fn(), { getState: vi.fn().mockReturnValue({}) })
}));
const { mockToast } = vi.hoisted(() => ({ mockToast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("sonner", () => ({ toast: mockToast }));

const createWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useSyncthingSync", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (syncService.getLastSyncTime as any).mockResolvedValue(null);
    });

    it("should save to sync file", async () => {
        (syncService.saveSyncFile as any).mockResolvedValue({ success: true });
        const { result } = renderHook(() => useSyncthingSync(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.saveToSyncFile();
        });

        expect(syncService.saveSyncFile).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalled();
    });

    it("should handle save error", async () => {
        (syncService.saveSyncFile as any).mockResolvedValue({ success: false, error: "Failed" });
        const { result } = renderHook(() => useSyncthingSync(), { wrapper: createWrapper() });

        await act(async () => {
            await result.current.saveToSyncFile();
        });

        expect(mockToast.error).toHaveBeenCalledWith("Failed");
    });
});
