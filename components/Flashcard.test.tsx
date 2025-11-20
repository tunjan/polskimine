import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcard } from './Flashcard';
import { Card } from '../types';

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? 'test-card',
  targetSentence: overrides.targetSentence ?? 'To jest test',
  nativeTranslation: overrides.nativeTranslation ?? 'This is a test',
  notes: overrides.notes ?? 'Test notes',
  status: overrides.status ?? 'learning',
  interval: overrides.interval ?? 1,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  targetWord: overrides.targetWord,
  ...overrides,
});

describe('Flashcard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset speech synthesis mock
    const mockGetVoices = vi.fn(() => [{ lang: 'pl-PL' } as SpeechSynthesisVoice]);
    window.speechSynthesis.getVoices = mockGetVoices;
  });

  it('renders the target sentence', () => {
    const card = createCard({ targetSentence: 'Cześć, jak się masz?' });
    render(<Flashcard card={card} isFlipped={false} />);
    
    expect(screen.getByText(/Cześć, jak się masz?/)).toBeInTheDocument();
  });

  it('highlights target word when provided', () => {
    const card = createCard({
      targetSentence: 'Ten samochód jest szybki',
      targetWord: 'samochód',
    });
    render(<Flashcard card={card} isFlipped={false} />);
    
    const highlighted = screen.getByText('samochód');
    expect(highlighted).toBeInTheDocument();
    expect(highlighted.className).toContain('text-polishRed');
  });

  it('does not show translation when not flipped', () => {
    const card = createCard({ nativeTranslation: 'Secret translation' });
    render(<Flashcard card={card} isFlipped={false} />);
    
    expect(screen.queryByText('Secret translation')).not.toBeInTheDocument();
  });

  it('shows translation when flipped', () => {
    const card = createCard({ nativeTranslation: 'This is visible' });
    render(<Flashcard card={card} isFlipped={true} />);
    
    expect(screen.getByText('This is visible')).toBeInTheDocument();
  });

  it('shows notes when flipped', () => {
    const card = createCard({ notes: 'Important grammar note' });
    render(<Flashcard card={card} isFlipped={true} />);
    
    expect(screen.getByText('Important grammar note')).toBeInTheDocument();
  });

  it('hides notes when card has no notes', () => {
    const card = createCard({ notes: '' });
    render(<Flashcard card={card} isFlipped={true} />);
    
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('displays status indicator', () => {
    const card = createCard({ status: 'learning' });
    render(<Flashcard card={card} isFlipped={false} />);
    
    expect(screen.getByText(/learning/i)).toBeInTheDocument();
  });

  it('renders audio button when voice is available', async () => {
    const card = createCard();
    render(<Flashcard card={card} isFlipped={false} />);
    
    await waitFor(() => {
      const audioButton = screen.queryByTitle('Listen');
      expect(audioButton).toBeInTheDocument();
    });
  });

  it('calls speech synthesis when audio button clicked', async () => {
    const card = createCard({ targetSentence: 'Test audio' });
    render(<Flashcard card={card} isFlipped={false} />);
    
    await waitFor(() => {
      const audioButton = screen.getByTitle('Listen');
      expect(audioButton).toBeInTheDocument();
    });
    
    const audioButton = screen.getByTitle('Listen');
    await userEvent.click(audioButton);
    
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('auto-plays audio when flipped if enabled', async () => {
    const card = createCard({ targetSentence: 'Auto play test' });
    const { rerender } = render(
      <Flashcard card={card} isFlipped={false} autoPlayAudio={true} />
    );
    
    // Initially not flipped, should not play
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    
    // Flip the card
    rerender(<Flashcard card={card} isFlipped={true} autoPlayAudio={true} />);
    
    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  it('does not auto-play when autoPlayAudio is false', async () => {
    const card = createCard();
    const { rerender } = render(
      <Flashcard card={card} isFlipped={false} autoPlayAudio={false} />
    );
    
    rerender(<Flashcard card={card} isFlipped={true} autoPlayAudio={false} />);
    
    await waitFor(() => {
      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('hides translation when showTranslation is false', () => {
    const card = createCard({ nativeTranslation: 'Hidden translation' });
    render(<Flashcard card={card} isFlipped={true} showTranslation={false} />);
    
    const translationText = screen.queryByText('Hidden translation');
    expect(translationText).not.toBeInTheDocument();
  });

  it('shows translation when showTranslation is true', () => {
    const card = createCard({ nativeTranslation: 'Visible translation' });
    render(<Flashcard card={card} isFlipped={true} showTranslation={true} />);
    
    expect(screen.getByText('Visible translation')).toBeInTheDocument();
  });

  it('renders sentence without highlighting when no target word', () => {
    const card = createCard({
      targetSentence: 'Całe zdanie jest ważne',
      targetWord: undefined,
    });
    render(<Flashcard card={card} isFlipped={false} />);
    
    expect(screen.getByText('Całe zdanie jest ważne')).toBeInTheDocument();
  });

  it('handles case-insensitive word highlighting', () => {
    const card = createCard({
      targetSentence: 'SAMOCHÓD jest Samochód',
      targetWord: 'samochód',
    });
    render(<Flashcard card={card} isFlipped={false} />);
    
    const sentence = screen.getByText(/SAMOCHÓD/);
    expect(sentence).toBeInTheDocument();
  });

  it('displays correct status colors for different card states', () => {
    const statuses: Array<Card['status']> = ['new', 'learning', 'graduated', 'known'];
    
    statuses.forEach((status) => {
      const card = createCard({ status });
      const { unmount } = render(<Flashcard card={card} isFlipped={false} />);
      
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders without audio button when no voice available', () => {
    window.speechSynthesis.getVoices = vi.fn(() => [] as SpeechSynthesisVoice[]);
    
    const card = createCard();
    render(<Flashcard card={card} isFlipped={false} />);
    
    expect(screen.queryByTitle('Listen')).not.toBeInTheDocument();
  });
});
