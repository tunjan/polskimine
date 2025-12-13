import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { describe, it, expect, vi, beforeEach } from "vitest";


vi.mock("@/utils/security", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/utils/ids", () => ({
  generateId: vi.fn().mockReturnValue("new-user-id"),
}));

vi.mock("@/db/dexie", () => {
  const mockDb = {
    users: {
      get: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
    profile: {
      put: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cards: {
      where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) }),
      bulkDelete: vi.fn(),
    },
    revlog: {
      where: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue({ delete: vi.fn() }) }),
    },
    transaction: vi.fn((mode, tables, cb) => cb()),
  };
  return { db: mockDb };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));


import { db } from "@/db/dexie";



const mockDb = db as any;


describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should start with loading true and no user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("should register a new user", async () => {
    mockDb.users.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(null) }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register("newuser", "pass");
    });

    expect(result.current.user).toEqual({ id: "new-user-id", username: "newuser" });
    expect(mockDb.users.add).toHaveBeenCalled();
    expect(mockDb.profile.put).toHaveBeenCalled();
  });

  it("should login existing user", async () => {
    const existingUser = { id: "123", username: "existing", passwordHash: "hashed" };
    mockDb.users.where.mockReturnValue({
      equals: vi.fn().mockReturnValue({ first: vi.fn().mockResolvedValue(existingUser) }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("existing", "pass");
    });

    expect(result.current.user).toEqual({ id: "123", username: "existing" });
    expect(localStorage.getItem("linguaflow_current_user")).toBe("123");
  });

  it("should sign out", async () => {
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    
    
    
    
    
    vi.clearAllMocks();
  });
});
