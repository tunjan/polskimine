import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { DeckProvider, useDeck } from './DeckContext';
import { Card } from '../types';
import { act } from 'react';

const mockSettings = {
  settings: {
    dailyNewLimit: 20,
    dailyReviewLimit: 100,
    autoPlayAudio: false,
    showTranslationAfterFlip: true,
    fsrs: {
      request_retention: 0.9,
      maximum_interval: 36500,
      enable_fuzzing: true,
      w: [0.4, 1.1, 3.0],
    },
  },
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
};

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      getCards: vi.fn().mockResolvedValue([]),
      getHistory: vi.fn().mockResolvedValue({}),
      getStats: vi.fn().mockResolvedValue({ total: 0, due: 0, learned: 0 }),
      getDueCards: vi.fn().mockResolvedValue([]),
      getTodayReviewStats: vi.fn().mockResolvedValue({ newCards: 0, reviewCards: 0 }),
      saveCard: vi.fn().mockResolvedValue(undefined),
      deleteCard: vi.fn().mockResolvedValue(undefined),
      clearAllCards: vi.fn().mockResolvedValue(undefined),
      clearHistory: vi.fn().mockResolvedValue(undefined),
      saveAllCards: vi.fn().mockResolvedValue(undefined),
      incrementHistory: vi.fn().mockResolvedValue(undefined),
    }
  }
});

vi.mock('../services/db', () => ({
  db: mockDb,
}));

vi.mock('../data/beginnerDeck', () => ({
  BEGINNER_DECK: [
    { id: 'beginner-1', targetSentence: 'Cześć', nativeTranslation: 'Hi', status: 'new' },
  ],
}));

vi.mock('./SettingsContext', () => ({
  useSettings: () => mockSettings,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? 'test-card',
  targetSentence: overrides.targetSentence ?? 'Test',
  nativeTranslation: overrides.nativeTranslation ?? 'Test',
  notes: overrides.notes ?? '',
  status: overrides.status ?? 'new',
  interval: overrides.interval ?? 0,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  ...overrides,
});

describe('DeckContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.getCards.mockResolvedValue([]);
    mockDb.getHistory.mockResolvedValue({});
    mockDb.getStats.mockResolvedValue({ total: 0, due: 0, learned: 0 });
    mockDb.getDueCards.mockResolvedValue([]);
    mockDb.getTodayReviewStats.mockResolvedValue({ newCards: 0, reviewCards: 0 });
  });

  it('provides initial context values', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.history).toBeDefined();
  });

  it('loads data from database on mount', async () => {
    mockDb.getCards.mockResolvedValue(Array(6).fill(createCard()));
    mockDb.getHistory.mockResolvedValue({ '2024-01-01': 5 });
    mockDb.getStats.mockResolvedValue({ total: 1, due: 1, learned: 0 });

    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDb.getCards).toHaveBeenCalled();
    expect(mockDb.getHistory).toHaveBeenCalled();
    expect(mockDb.getStats).toHaveBeenCalled();
  });

  it('adds a card', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newCard = createCard({ id: 'new-card' });
    
    await act(async () => {
      await result.current.addCard(newCard);
    });

    expect(mockDb.saveCard).toHaveBeenCalledWith(newCard);
  });

  it('deletes a card', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteCard('card-to-delete');
    });

    expect(mockDb.deleteCard).toHaveBeenCalledWith('card-to-delete');
  });

  it('updates a card', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedCard = createCard({ id: 'update-card' });
    
    await act(async () => {
      await result.current.updateCard(updatedCard);
    });

    expect(mockDb.saveCard).toHaveBeenCalledWith(updatedCard);
  });

  it('records a review', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const card = createCard();
    
    await act(async () => {
      await result.current.recordReview(card);
    });

    const today = new Date().toISOString().split('T')[0];
    expect(mockDb.incrementHistory).toHaveBeenCalledWith(today, 1);
  });

  it('calculates streak correctly', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    mockDb.getCards.mockResolvedValue(Array(6).fill(createCard()));
    mockDb.getHistory.mockResolvedValue({
      [today]: 5,
      [yesterday]: 3,
    });

    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.streak).toBeGreaterThan(0);
  });

  it('calculates total reviews correctly', async () => {
    mockDb.getCards.mockResolvedValue(Array(6).fill(createCard()));
    mockDb.getHistory.mockResolvedValue({
      '2024-01-01': 10,
      '2024-01-02': 5,
      '2024-01-03': 8,
    });

    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.totalReviews).toBe(23);
  });

  it('supports undo functionality', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const card = createCard();
    
    // Record a review first
    await act(async () => {
      await result.current.recordReview(card);
    });

    expect(result.current.canUndo).toBe(true);

    // Undo the review
    await act(async () => {
      await result.current.undoReview();
    });

    expect(result.current.canUndo).toBe(false);
  });

  it('resets to beginner deck when few cards', async () => {
    mockDb.getCards.mockResolvedValue([createCard()]);

    renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(mockDb.clearAllCards).toHaveBeenCalled();
      expect(mockDb.saveAllCards).toHaveBeenCalled();
    });
  });

  it('updates data version on changes', async () => {
    const { result } = renderHook(() => useDeck(), {
      wrapper: DeckProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialVersion = result.current.dataVersion;

    await act(async () => {
      await result.current.addCard(createCard());
    });

    await waitFor(() => {
      expect(result.current.dataVersion).toBeGreaterThan(initialVersion);
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useDeck());
    }).toThrow('useDeck must be used within a DeckProvider');

    consoleSpy.mockRestore();
  });
});
