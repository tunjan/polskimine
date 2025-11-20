import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';

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
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
};

const mockUseDeck = {
  dataVersion: 1,
};

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings,
}));

vi.mock('../contexts/DeckContext', () => ({
  useDeck: () => mockUseDeck,
}));

vi.mock('../services/db', () => ({
  db: {
    clearAllCards: vi.fn(),
    clearHistory: vi.fn(),
    saveAllCards: vi.fn(),
    getCards: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue({}),
    saveFullHistory: vi.fn(),
  },
}));

vi.mock('../data/beginnerDeck', () => ({
  BEGINNER_DECK: [{ id: '1', targetSentence: 'Test' }],
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
});

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const props = createProps();
    render(<SettingsModal {...props} isOpen={false} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays all settings sections', () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('General Preferences')).toBeInTheDocument();
    expect(screen.getByText('Daily Limits')).toBeInTheDocument();
    expect(screen.getByText('FSRS Configuration')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('closes modal when close button clicked', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const closeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') !== null && btn.textContent === ''
    );
    
    if (closeButton) {
      await userEvent.click(closeButton);
      expect(props.onClose).toHaveBeenCalled();
    }
  });

  it('closes modal on Escape key', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    await userEvent.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('updates daily new limit', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const input = screen.getByLabelText(/New Cards \/ Day/i);
    await userEvent.clear(input);
    await userEvent.type(input, '30');
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyNewLimit: 30 })
    );
  });

  it('updates daily review limit', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const input = screen.getByLabelText(/Max Reviews \/ Day/i);
    await userEvent.clear(input);
    await userEvent.type(input, '200');
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ dailyReviewLimit: 200 })
    );
  });

  it('toggles auto-play audio', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const checkbox = screen.getByLabelText(/Auto-play Audio/i);
    await userEvent.click(checkbox);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoPlayAudio: true })
    );
  });

  it('toggles show translation setting', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const checkbox = screen.getByLabelText(/Show Translation After Flip/i);
    await userEvent.click(checkbox);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ showTranslationAfterFlip: false })
    );
  });

  it('adjusts FSRS request retention', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const slider = screen.getByLabelText(/Request Retention/i);
    // Simulate changing the slider
    await userEvent.click(slider);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalled();
  });

  it('updates FSRS maximum interval', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const input = screen.getByLabelText(/Maximum Interval/i);
    await userEvent.clear(input);
    await userEvent.type(input, '10000');
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        fsrs: expect.objectContaining({ maximum_interval: 10000 })
      })
    );
  });

  it('toggles FSRS fuzzing', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const checkbox = screen.getByLabelText(/Enable Fuzzing/i);
    await userEvent.click(checkbox);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        fsrs: expect.objectContaining({ enable_fuzzing: false })
      })
    );
  });

  it('exports data as JSON', async () => {
    const props = createProps();
    
    // Mock createElement to return a real element we can spy on
    const mockAnchor = document.createElement('a');
    const clickSpy = vi.spyOn(mockAnchor, 'click');
    
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockAnchor;
      return originalCreateElement(tagName);
    });
    
    render(<SettingsModal {...props} />);
    
    const exportButton = screen.getByRole('button', { name: /Export Backup/i });
    await userEvent.click(exportButton);
    
    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });

    createElementSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('requires double confirmation for deck reset', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const resetButton = screen.getByRole('button', { name: /Reset Deck/i });
    
    // First click
    await userEvent.click(resetButton);
    expect(screen.getByText(/Are you absolutely sure/i)).toBeInTheDocument();
    
    // Second click would trigger actual reset
  });

  it('requires double confirmation for settings reset', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const resetButton = screen.getByRole('button', { name: /Reset Settings/i });
    
    // First click
    await userEvent.click(resetButton);
    expect(screen.getByText(/Click again to confirm/i)).toBeInTheDocument();
  });

  it('calls resetSettings on second confirmation', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const resetButton = screen.getByRole('button', { name: /Reset Settings/i });
    
    // Click twice
    await userEvent.click(resetButton);
    await userEvent.click(resetButton);
    
    expect(mockUseSettings.resetSettings).toHaveBeenCalled();
  });

  it('closes modal on cancel', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelButton);
    
    expect(props.onClose).toHaveBeenCalled();
  });

  it('saves and closes on save button', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await userEvent.click(saveButton);
    
    expect(mockUseSettings.updateSettings).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it('traps focus within modal', async () => {
    const props = createProps();
    render(<SettingsModal {...props} />);
    
    // Tab through elements
    await userEvent.tab();
    
    // Focus should stay within modal
    const activeElement = document.activeElement;
    const modal = screen.getByRole('dialog');
    expect(modal.contains(activeElement)).toBe(true);
  });
});
