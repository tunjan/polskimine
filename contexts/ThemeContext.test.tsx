import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('provides default theme value', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe('system');
  });

  it('sets light theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('sets dark theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider storageKey="test-theme">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem('test-theme')).toBe('dark');
  });

  it('loads theme from localStorage', () => {
    localStorage.setItem('vite-ui-theme', 'dark');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe('dark');
  });

  it('applies system theme when set to system', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');
    // System theme applies based on prefers-color-scheme
  });

  it('removes previous theme class when changing themes', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('uses custom storage key', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider storageKey="custom-key">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(localStorage.getItem('custom-key')).toBe('light');
  });

  it('respects defaultTheme prop', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe('dark');
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('updates DOM when theme changes', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.className).toContain('light');

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.className).toContain('dark');
    expect(document.documentElement.className).not.toContain('light');
  });
});
