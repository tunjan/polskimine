import { renderHook, act } from "@testing-library/react";
import { GamificationProvider, useGamification } from "./GamificationContext";
import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/db/dexie", () => ({
  db: {
    profile: {
      update: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { db } from "@/db/dexie";
const mockDb = db as any;



const mockUseAuth = vi.fn();
const mockUseProfile = vi.fn();

vi.mock("./AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: () => mockUseProfile(),
}));

describe("GamificationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseProfile.mockReturnValue({
      profile: { xp: 100, points: 50 },
      refreshProfile: vi.fn(),
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GamificationProvider>{children}</GamificationProvider>
  );

  it("should increment XP", async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    
    await act(async () => {
      result.current.incrementXP(10);
    });

    
    
    expect(mockDb.profile.update).toHaveBeenCalledWith("u1", expect.objectContaining({
      xp: 110,
      points: 60,
      level: 2
    }));
  });

  it("should do nothing if no user", async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useGamification(), { wrapper });
    
    await act(async () => {
      result.current.incrementXP(10);
    });

    expect(mockDb.profile.update).not.toHaveBeenCalled();
  });
});
