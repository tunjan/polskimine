import { renderHook, act } from "@testing-library/react";
import { MusicProvider, useMusic } from "./MusicContext";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("MusicContext", () => {
  let audioMock: any;

  beforeEach(() => {
    audioMock = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      loop: false,
      volume: 1,
    };
    
    // Mock global Audio
    vi.stubGlobal('Audio', vi.fn(function() { return audioMock; }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MusicProvider>{children}</MusicProvider>
  );

  it("should initialize paused", () => {
    const { result } = renderHook(() => useMusic(), { wrapper });
    expect(result.current.isPlaying).toBe(false);
  });

  it("should toggle play", () => {
    const { result } = renderHook(() => useMusic(), { wrapper });
    
    act(() => {
      result.current.togglePlay();
    });
    
    expect(result.current.isPlaying).toBe(true);
    expect(audioMock.play).toHaveBeenCalled();
    
    act(() => {
      result.current.togglePlay();
    });
    
    expect(result.current.isPlaying).toBe(false);
    expect(audioMock.pause).toHaveBeenCalled();
  });

  it("should change volume", () => {
    const { result } = renderHook(() => useMusic(), { wrapper });
    
    act(() => {
      result.current.setVolume(0.5);
    });
    
    expect(result.current.volume).toBe(0.5);
    // audioRef effect runs on mount and volume change
    expect(audioMock.volume).toBe(0.5);
  });
});
