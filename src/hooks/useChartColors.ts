import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';

const getCssVarValue = (name: string) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const normalizeColor = (value: string, fallback: string) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;
  // If it's a color function (rgb, hsl, oklch, etc) or hex, return as is
  if (/^(#|rgb|hsl|oklch|var)/i.test(candidate)) return candidate;
  // If it's space separated numbers (shadcn HSL convention), wrap in hsl()
  if (candidate.includes(' ')) return `hsl(${candidate})`;
  return candidate;
};

export const useChartColors = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();

  return useMemo(() => {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
      primary: normalizeColor(getCssVarValue('--primary'), '#3b82f6'),
      background: normalizeColor(getCssVarValue('--background'), '#ffffff'),
      foreground: normalizeColor(getCssVarValue('--foreground'), '#000000'),
      muted: normalizeColor(getCssVarValue('--muted'), '#e5e7eb'),
      mutedForeground: normalizeColor(getCssVarValue('--muted-foreground'), '#6b7280'),
      border: normalizeColor(getCssVarValue('--border'), '#d1d5db'),
      isDark: theme === 'dark' || (theme === 'system' && prefersDark),
    };
  }, [theme, settings.language, settings.languageColors]);
};