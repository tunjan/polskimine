import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiService } from './ai';

const mockFetch = vi.fn();

const buildResponse = (text: string, ok = true) => ({
  ok,
  json: async () => (ok
    ? { candidates: [{ content: { parts: [{ text }] } }] }
    : { error: { message: text } }
  ),
});

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
  process.env.VITE_GEMINI_API_KEY = 'test-key';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.VITE_GEMINI_API_KEY;
});

describe('aiService', () => {
  it('translates text using Gemini', async () => {
    mockFetch.mockResolvedValue(buildResponse('Translated value'));
    const result = await aiService.translateText('Cześć');
    expect(result).toBe('Translated value');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('key=test-key'), expect.any(Object));
  });

  it('throws if API key is missing', async () => {
    delete process.env.VITE_GEMINI_API_KEY;
    await expect(aiService.translateText('Hej')).rejects.toThrow('Gemini API Key');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('parses analyzeWord payloads with code fences', async () => {
    mockFetch.mockResolvedValue(buildResponse('```json{"definition":"def","partOfSpeech":"noun","contextMeaning":"ctx"}```'));
    const result = await aiService.analyzeWord('kot', 'To jest kot.');
    expect(result).toEqual({ definition: 'def', partOfSpeech: 'noun', contextMeaning: 'ctx' });
  });

  it('falls back to safe defaults when JSON cannot be parsed', async () => {
    mockFetch.mockResolvedValue(buildResponse('not json at all'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await aiService.generateCardContent('To zdanie.');
    expect(result).toEqual({ translation: '', notes: '' });
    errorSpy.mockRestore();
  });

  it('surface API error payloads when Gemini rejects the request', async () => {
    mockFetch.mockResolvedValue(buildResponse('API exploded', false));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(aiService.translateText('Błąd')).rejects.toThrow('API exploded');
    errorSpy.mockRestore();
  });
});
