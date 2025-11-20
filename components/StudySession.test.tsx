import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { StudySession } from './StudySession';
import { Card } from '../types';

const mockCalculate = vi.fn();

const mockIsCardDue = vi.fn(() => true);

vi.mock('../services/srs', () => ({
  calculateNextReview: (...args: Parameters<typeof mockCalculate>) => mockCalculate(...args),
  isCardDue: (...args: Parameters<typeof mockIsCardDue>) => mockIsCardDue(...args),
}));

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
      w: [],
    },
  },
};

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => mockSettings,
}));

const buildCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? 'card-1',
  targetSentence: overrides.targetSentence ?? 'To jest zdanie.',
  nativeTranslation: overrides.nativeTranslation ?? 'This is a sentence.',
  notes: overrides.notes ?? '',
  status: overrides.status ?? 'learning',
  interval: overrides.interval ?? 0,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  ...overrides,
});

const createHandlers = () => ({
  onUpdateCard: vi.fn(),
  onRecordReview: vi.fn(),
  onExit: vi.fn(),
  onMarkKnown: vi.fn(),
  onUndo: vi.fn(),
});

beforeEach(() => {
  mockCalculate.mockImplementation((card: Card) => ({
    ...card,
    id: `${card.id}-scheduled`,
  }));
});

describe('StudySession', () => {
  it('renders the empty state when there are no due cards', () => {
    const handlers = createHandlers();
    render(
      <StudySession
        dueCards={[]}
        onUpdateCard={handlers.onUpdateCard}
        onRecordReview={handlers.onRecordReview}
        onExit={handlers.onExit}
        onMarkKnown={handlers.onMarkKnown}
        onUndo={handlers.onUndo}
        canUndo
      />
    );

    expect(screen.getByText(/Queue Cleared/i)).toBeInTheDocument();
  });

  it('grades a card and schedules the next review', async () => {
    const handlers = createHandlers();
    const cards = [buildCard({ id: 'card-a' })];

    render(
      <StudySession
        dueCards={cards}
        onUpdateCard={handlers.onUpdateCard}
        onRecordReview={handlers.onRecordReview}
        onExit={handlers.onExit}
        onMarkKnown={handlers.onMarkKnown}
        onUndo={handlers.onUndo}
        canUndo
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Show Answer/i }));
    await userEvent.click(screen.getByRole('button', { name: /Good/i }));

    expect(mockCalculate).toHaveBeenCalledWith(cards[0], 'Good', mockSettings.settings.fsrs);
    expect(handlers.onUpdateCard).toHaveBeenCalledWith({ ...cards[0], id: 'card-a-scheduled' });
    expect(handlers.onRecordReview).toHaveBeenCalledWith(cards[0]);
  });

  it('allows the user to mark a card as known', async () => {
    const handlers = createHandlers();
    const cards = [buildCard({ id: 'known-card' })];

    render(
      <StudySession
        dueCards={cards}
        onUpdateCard={handlers.onUpdateCard}
        onRecordReview={handlers.onRecordReview}
        onExit={handlers.onExit}
        onMarkKnown={handlers.onMarkKnown}
        onUndo={handlers.onUndo}
        canUndo
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Mark Known/i }));
    expect(handlers.onMarkKnown).toHaveBeenCalledWith(cards[0]);
  });

  it('invokes undo callback when available', async () => {
    const handlers = createHandlers();
    const cards = [buildCard({ id: 'card-undo' })];

    render(
      <StudySession
        dueCards={cards}
        onUpdateCard={handlers.onUpdateCard}
        onRecordReview={handlers.onRecordReview}
        onExit={handlers.onExit}
        onMarkKnown={handlers.onMarkKnown}
        onUndo={handlers.onUndo}
        canUndo
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /Undo/i }));
    expect(handlers.onUndo).toHaveBeenCalled();
  });
});
