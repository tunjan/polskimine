import React, { useLayoutEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { hexToHSL } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

const STYLE_TAG_ID = "custom-language-theme";

export const LanguageThemeManager: React.FC = () => {
  const { language, languageColors } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      languageColors: s.languageColors,
    })),
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute("data-language");
    if (previousLanguage && previousLanguage !== language) {
      root.removeAttribute("data-language");
    }

    if (!language) return;

    root.setAttribute("data-language", language);

    const customColor = languageColors?.[language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor && typeof customColor === "string") {
      let h = 0, s = 0, l = 0;

      if (customColor.startsWith("#")) {
         const hsl = hexToHSL(customColor);
         h = hsl.h;
         s = hsl.s;
         l = hsl.l;
      } else if (/^[0-9\s.%]+$/.test(customColor)) {
          const parts = customColor.split(" ").map((v) => parseFloat(v));
          h = Number.isNaN(parts[0]) ? 0 : parts[0];
          s = Number.isNaN(parts[1]) ? 100 : parts[1];
          l = Number.isNaN(parts[2]) ? 50 : parts[2];
      } else {
         styleTag.innerHTML = "";
         return;
      }

      const normalizedH = h;
      const normalizedS = s;
      const normalizedL = l;
      const darkL =
        normalizedL < 50
          ? Math.min(normalizedL + 30, 90)
          : Math.max(normalizedL - 10, 60);
      const hslString = `${normalizedH} ${normalizedS}% ${normalizedL}%`; // Construct HSL string for CSS variable
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${language}"] {
          --primary: hsl(${hslString});
          --ring: hsl(${hslString});
        }
        :root[data-language="${language}"].dark {
          --primary: hsl(${darkColor});
          --ring: hsl(${darkColor});
        }
      `;
    } else {
      styleTag.innerHTML = "";
    }

    return () => {
      root.removeAttribute("data-language");
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [language, languageColors]);

  return null;
};
