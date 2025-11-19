import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { AddCardModal } from './AddCardModal';

vi.mock('../services/ai', () => ({
  aiService: {
    generateCardContent: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AddCardModal', () => {
  const createProps = () => ({
    isOpen: true,
    onClose: vi.fn(),
    onAdd: vi.fn(),
  });

  it('prevents submission when target word is missing from the sentence', async () => {
    const props = createProps();
    render(<AddCardModal {...props} />);

    await userEvent.type(screen.getByPlaceholderText(/Ten samochód/), 'To jest dom.');
    await userEvent.type(screen.getByPlaceholderText(/Highlight word/), 'pies');
    await userEvent.type(screen.getByPlaceholderText(/e.g., car/), 'This is a house.');

    await userEvent.click(screen.getByRole('button', { name: /Save Card/i }));

    expect(await screen.findByText(/Target word provided but not found/i)).toBeInTheDocument();
    expect(props.onAdd).not.toHaveBeenCalled();
  });

  it('submits a new card when required fields are present', async () => {
    const props = createProps();
    render(<AddCardModal {...props} />);

    await userEvent.type(screen.getByPlaceholderText(/Ten samochód/), 'To jest dom.');
    await userEvent.type(screen.getByPlaceholderText(/e.g., car/), 'This is a house.');

    await userEvent.click(screen.getByRole('button', { name: /Save Card/i }));

    await waitFor(() => expect(props.onAdd).toHaveBeenCalledTimes(1));
    const savedCard = props.onAdd.mock.calls[0][0];
    expect(savedCard.targetSentence).toBe('To jest dom.');
    expect(savedCard.nativeTranslation).toBe('This is a house.');
    expect(savedCard.targetWord).toBeUndefined();
    expect(props.onClose).toHaveBeenCalled();
  });
});
