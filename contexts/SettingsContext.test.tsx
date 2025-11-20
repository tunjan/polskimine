import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provides default settings', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    expect(result.current.settings).toEqual({
      dailyNewLimit: 20,
      dailyReviewLimit: 100,
      autoPlayAudio: false,
      showTranslationAfterFlip: true,
      fsrs: {
        request_retention: 0.9,
        maximum_interval: 36500,
        enable_fuzzing: true,
        w: expect.any(Array),
      },
    });
  });

  it('updates settings', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.updateSettings({ dailyNewLimit: 30 });
    });

    expect(result.current.settings.dailyNewLimit).toBe(30);
  });

  it('persists settings to localStorage', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.updateSettings({ dailyNewLimit: 25 });
    });

    const stored = localStorage.getItem('polskimine_settings');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.dailyNewLimit).toBe(25);
  });

  it('loads settings from localStorage', () => {
    const savedSettings = {
      dailyNewLimit: 15,
      dailyReviewLimit: 50,
      autoPlayAudio: true,
      showTranslationAfterFlip: false,
      fsrs: {
        request_retention: 0.85,
        maximum_interval: 10000,
        enable_fuzzing: false,
      },
    };

    localStorage.setItem('polskimine_settings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    expect(result.current.settings.dailyNewLimit).toBe(15);
    expect(result.current.settings.autoPlayAudio).toBe(true);
  });

  it('updates FSRS settings', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.updateSettings({
        fsrs: { 
          request_retention: 0.95,
          maximum_interval: 36500,
          enable_fuzzing: true,
        },
      });
    });

    expect(result.current.settings.fsrs.request_retention).toBe(0.95);
  });

  it('merges partial updates', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    const originalLimit = result.current.settings.dailyReviewLimit;

    act(() => {
      result.current.updateSettings({ dailyNewLimit: 10 });
    });

    expect(result.current.settings.dailyNewLimit).toBe(10);
    expect(result.current.settings.dailyReviewLimit).toBe(originalLimit);
  });

  it('resets settings to defaults', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    // Change settings
    act(() => {
      result.current.updateSettings({ dailyNewLimit: 50 });
    });

    expect(result.current.settings.dailyNewLimit).toBe(50);

    // Reset
    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings.dailyNewLimit).toBe(20);
  });

  it('clears localStorage on reset', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    act(() => {
      result.current.updateSettings({ dailyNewLimit: 30 });
    });

    expect(localStorage.getItem('polskimine_settings')).toBeTruthy();

    act(() => {
      result.current.resetSettings();
    });

    const stored = localStorage.getItem('polskimine_settings');
    const parsed = JSON.parse(stored!);
    expect(parsed.dailyNewLimit).toBe(20);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('polskimine_settings', 'invalid json');

    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    // Should still provide default settings
    expect(result.current.settings.dailyNewLimit).toBe(20);
  });

  it('merges FSRS settings with defaults', () => {
    const partialSettings = {
      fsrs: { request_retention: 0.88 },
    };

    localStorage.setItem('polskimine_settings', JSON.stringify(partialSettings));

    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    expect(result.current.settings.fsrs.request_retention).toBe(0.88);
    expect(result.current.settings.fsrs.maximum_interval).toBe(36500);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');

    consoleSpy.mockRestore();
  });
});
