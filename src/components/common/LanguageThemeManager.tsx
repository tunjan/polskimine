import React, { useLayoutEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

const STYLE_TAG_ID = 'custom-language-theme';

export const LanguageThemeManager: React.FC = () => {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute('data-language');
    if (previousLanguage && previousLanguage !== settings.language) {
      root.removeAttribute('data-language');
    }

    if (!settings.language) return;

    root.setAttribute('data-language', settings.language);

    const customColor = settings.languageColors?.[settings.language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor) {
      const [h, s, l] = customColor.split(' ').map(v => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL = normalizedL < 50 ? Math.min(normalizedL + 30, 90) : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${settings.language}"] {
          --primary: ${customColor};
          --ring: ${customColor};
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }

    // Cleanup on unmount to prevent theme leak
    return () => {
      root.removeAttribute('data-language');
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [settings.language, settings.languageColors]);

  return null;
};