import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StudyRoute } from './StudyRoute';
import { MemoryRouter } from 'react-router-dom';
import { Card } from '../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseDeck = {
  updateCard: vi.fn(),
  recordReview: vi.fn(),
  undoReview: vi.fn(),
  canUndo: false,
};

const mockUseSettings = {
  settings: {
    dailyNewLimit: 20,
    dailyReviewLimit: 100,
    autoPlayAudio: false,
    showTranslationAfterFlip: true,
    fsrs: {
      request_retention: 0.9,
      maximum_interval: 36500,
      enable_fuzzing: true,
    },
  },
};

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      getDueCards: vi.fn().mockResolvedValue([]),
      getTodayReviewStats: vi.fn().mockResolvedValue({ newCards: 0, reviewCards: 0 }),
      getCramCards: vi.fn().mockResolvedValue([]),
    }
  }
});

vi.mock('../contexts/DeckContext', () => ({
  useDeck: () => mockUseDeck,
}));

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings,
}));

vi.mock('../services/db', () => ({
  db: mockDb,
}));

vi.mock('../services/studyLimits', () => ({
  applyStudyLimits: vi.fn((cards) => cards),
}));

vi.mock('../components/StudySession', () => ({
  StudySession: ({ dueCards, onExit }: any) => (
    <div>
      <div>Study Session</div>
      <div>Cards: {dueCards.length}</div>
      <button onClick={onExit}>Exit</button>
    </div>
  ),
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

describe('StudyRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.getDueCards.mockResolvedValue([]);
    mockDb.getTodayReviewStats.mockResolvedValue({ newCards: 0, reviewCards: 0 });
    mockDb.getCramCards.mockResolvedValue([]);
  });

  it('shows loading state initially', async () => {
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockDb.getDueCards).toHaveBeenCalled();
    });
  });

  it('loads due cards on mount', async () => {
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(mockDb.getDueCards).toHaveBeenCalled();
    });
  });

  it('renders StudySession with loaded cards', async () => {
    mockDb.getDueCards.mockResolvedValue([createCard(), createCard()]);
    
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Study Session')).toBeInTheDocument();
      expect(screen.getByText('Cards: 2')).toBeInTheDocument();
    });
  });

  it('navigates back on exit', async () => {
    mockDb.getDueCards.mockResolvedValue([createCard()]);
    
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Exit')).toBeInTheDocument();
    });
    
    const exitButton = screen.getByText('Exit');
    await exitButton.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('applies study limits to cards', async () => {
    const { applyStudyLimits } = await import('../services/studyLimits');
    
    mockDb.getDueCards.mockResolvedValue([
      createCard({ id: '1' }),
      createCard({ id: '2' }),
      createCard({ id: '3' }),
    ]);
    
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(applyStudyLimits).toHaveBeenCalled();
    });
  });

  it('passes correct settings to study limits', async () => {
    const { applyStudyLimits } = await import('../services/studyLimits');
    
    mockDb.getDueCards.mockResolvedValue([createCard()]);
    
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(applyStudyLimits).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          dailyNewLimit: 20,
          dailyReviewLimit: 100,
          reviewsToday: expect.objectContaining({
            newCards: 0,
            reviewCards: 0,
          }),
        })
      );
    });
  });

  it('handles empty due cards', async () => {
    mockDb.getDueCards.mockResolvedValue([]);
    
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Study Session')).toBeInTheDocument();
      expect(screen.getByText('Cards: 0')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton with correct structure', async () => {
    render(
      <MemoryRouter>
        <StudyRoute />
      </MemoryRouter>
    );
    
    // Check for skeleton elements
    const container = screen.getByTestId('loading-skeleton');
    expect(container.className).toContain('animate-pulse');
    await waitFor(() => {
      expect(mockDb.getDueCards).toHaveBeenCalled();
    });
  });
});
