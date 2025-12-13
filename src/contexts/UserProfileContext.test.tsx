import { renderHook, waitFor } from "@testing-library/react";
import { UserProfileProvider, useUserProfile } from "./UserProfileContext";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/dexie", () => ({
  db: {
    profile: {
      where: vi.fn(),
    },
  },
}));

import { db } from "@/db/dexie";
const mockDbProfile = (db.profile as any);


describe("UserProfileContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProfileProvider>{children}</UserProfileProvider>
  );

  it("should load profile if exists", async () => {
    mockDbProfile.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(1),
      }),
    });

    const { result } = renderHook(() => useUserProfile(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toEqual({ id: "local-user" });
  });

  it("should handle no profile", async () => {
    mockDbProfile.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
      }),
    });

    const { result } = renderHook(() => useUserProfile(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile).toBeNull();
  });
});
