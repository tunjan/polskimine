import { renderHook, act } from "@testing-library/react";
import { useDeckActions } from "./useDeckActions";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDeckStore } from "@/stores/useDeckStore";


const mockRecordReviewMutation = { mutateAsync: vi.fn() };
const mockUndoReviewMutation = { mutateAsync: vi.fn() };
const mockInvalidateQueries = vi.fn();

vi.mock("@/features/collection/hooks/useDeckQueries", () => ({
  useRecordReviewMutation: () => mockRecordReviewMutation,
  useUndoReviewMutation: () => mockUndoReviewMutation,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useDeckActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDeckStore.getState().clearLastReview();
  });

  it("should record review", async () => {
    const { result } = renderHook(() => useDeckActions());
    const oldCard: any = { id: "1" };
    const newCard: any = { id: "1", reps: 1 };
    
    await act(async () => {
      await result.current.recordReview(oldCard, newCard, "Good");
    });

    expect(mockRecordReviewMutation.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      card: oldCard,
      newCard: newCard,
      grade: "Good"
    }));
    
    
    const lastReview = useDeckStore.getState().lastReview;
    expect(lastReview).not.toBeNull();
    expect(lastReview?.card).toEqual(oldCard);
  });

  it("should undo review", async () => {
    const { result } = renderHook(() => useDeckActions());
    
    
    useDeckStore.getState().setLastReview({
      card: { id: "1" } as any,
      date: "2023-01-01",
      xpEarned: 10
    });

    await act(async () => {
      await result.current.undoReview();
    });

    expect(mockUndoReviewMutation.mutateAsync).toHaveBeenCalled();
    expect(useDeckStore.getState().lastReview).toBeNull();
  });

  it("should not undo if no last review", async () => {
    const { result } = renderHook(() => useDeckActions());
    await act(async () => {
      await result.current.undoReview();
    });
    expect(mockUndoReviewMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("should refresh deck data", () => {
    const { result } = renderHook(() => useDeckActions());
    result.current.refreshDeckData();
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(7); 
  });
});
