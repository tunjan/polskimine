import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlashcardAudio } from "./useFlashcardAudio";
import { ttsService } from "@/lib/tts";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock ttsService
vi.mock("@/lib/tts", () => ({
  ttsService: {
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  },
}));

describe("useFlashcardAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should play normal speed for autoplay and set next click to slow", async () => {
    const card1 = { id: "1", targetSentence: "Sentence 1", targetWord: "Word 1" } as any;
    const ttsSettings = { rate: 1.0, pitch: 1.0, volume: 1.0, provider: "browser" } as any;

    const { result } = renderHook(
      (props) => useFlashcardAudio(props),
      {
        initialProps: {
            card: card1,
            language: "spanish" as any,
            tts: ttsSettings,
            isFlipped: true,
            autoPlayAudio: true,
            playTargetWordAudioBeforeSentence: false,
        },
      }
    );

    // 1. Autoplay should be normal speed
    expect(ttsService.speak).toHaveBeenCalledWith(
        expect.stringContaining("Sentence 1"),
        "spanish",
        expect.objectContaining({ rate: 1.0 })
    );

    // 2. State "playSlow" should be true now
    await waitFor(() => {
        expect(result.current.playSlow).toBe(true);
    });

    // 3. Manual click should be slow
    await act(async () => {
      await result.current.speak();
    });

    expect(ttsService.speak).toHaveBeenLastCalledWith(
        expect.stringContaining("Sentence 1"),
        "spanish",
        expect.objectContaining({ rate: 0.6 })
    );
  });

  it("should play target word first if option is enabled", async () => {
    const card1 = { id: "1", targetSentence: "Sentence 1", targetWord: "Word 1" } as any;
    const ttsSettings = { rate: 1.0 } as any;

    const { result } = renderHook(
        (props) => useFlashcardAudio(props),
        {
          initialProps: {
              card: card1,
              language: "spanish" as any,
              tts: ttsSettings,
              isFlipped: true,
              autoPlayAudio: true,
              playTargetWordAudioBeforeSentence: true,
          },
        }
      );

      // Verify call order: first Word, then Sentence
      // Because speak matches calls, we check the calls array
      // ttsService.speak is a mock
      
      const calls = (ttsService.speak as any).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
      
      // First call should be Word 1
      expect(calls[0][0]).toContain("Word 1");
      
      // Second call should be Sentence 1
      expect(calls[1][0]).toContain("Sentence 1");
  });
});
