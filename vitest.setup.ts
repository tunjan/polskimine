import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  const speechSynthesisMock = {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as SpeechSynthesis['onvoiceschanged'],
  };

  Object.defineProperty(window, 'speechSynthesis', {
    value: speechSynthesisMock,
    writable: true,
  });

  if (!('SpeechSynthesisUtterance' in window)) {
    class MockUtterance {
      text: string;
      lang?: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    // @ts-expect-error jsdom polyfill for tests only
    window.SpeechSynthesisUtterance = MockUtterance;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
