import { renderHook, waitFor } from "@testing-library/react";
import { useProfile } from "./useProfile";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/dexie";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("@/db/dexie", () => ({
    db: {
        profile: {
            get: vi.fn(),
            update: vi.fn(),
        }
    }
}));

// Setup QueryClient for testing
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useProfile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return null profile if no user", async () => {
        (useAuth as any).mockReturnValue({ user: null });
        const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
        
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.profile).toBeNull();
    });

    it("should fetch profile for logged in user", async () => {
        (useAuth as any).mockReturnValue({ user: { id: "user1" } });
        (db.profile.get as any).mockResolvedValue({ id: "user1", username: "TestUser" });

        const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.profile).toEqual({ id: "user1", username: "TestUser" }));
    });

    it("should update username", async () => {
        (useAuth as any).mockReturnValue({ user: { id: "user1" } });
        (db.profile.get as any).mockResolvedValue({ id: "user1", username: "OldName" });
        (db.profile.update as any).mockResolvedValue(1);

        const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
        
        await waitFor(() => expect(result.current.profile?.username).toBe("OldName"));

        await result.current.updateUsername("NewName");

        // Should update cache optimistically/onSuccess
        expect(db.profile.update).toHaveBeenCalledWith("user1", expect.objectContaining({ username: "NewName" }));
        await waitFor(() => expect(result.current.profile?.username).toBe("NewName"));
    });
});
