import React, { useLayoutEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';

const STYLE_TAG_ID = 'custom-language-theme';

export const LanguageThemeManager: React.FC = () => {
    const { language, languageColors } = useSettingsStore(useShallow(s => ({
        language: s.language,
        languageColors: s.languageColors
    })));

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute('data-language');
    if (previousLanguage && previousLanguage !== language) {
      root.removeAttribute('data-language');
    }

    if (!language) return;

    root.setAttribute('data-language', language);

    const customColor = languageColors?.[language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor && typeof customColor === 'string') {
      if (!/^[0-9\s.%]+$/.test(customColor)) {
        styleTag.innerHTML = '';
        return;
      }
      const [h, s, l] = customColor.split(' ').map(v => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL = normalizedL < 50 ? Math.min(normalizedL + 30, 90) : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${language}"] {
          --primary: hsl(${customColor});
          --ring: hsl(${customColor});
        }
        :root[data-language="${language}"].dark {
          --primary: hsl(${darkColor});
          --ring: hsl(${darkColor});
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }


    return () => {
      root.removeAttribute('data-language');
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [language, languageColors]);

  return null;
};
