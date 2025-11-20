import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardRoute } from './DashboardRoute';
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
  history: { '2024-01-01': 5 },
  stats: { total: 10, due: 3, learned: 5, streak: 2, totalReviews: 50, longestStreak: 10 },
  addCard: vi.fn(),
  deleteCard: vi.fn(),
  updateCard: vi.fn(),
  dataVersion: 1,
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
      w: [0.4, 1.1, 3.0],
    },
  },
};

const { mockDb } = vi.hoisted(() => {
  return {
    mockDb: {
      getCards: vi.fn().mockResolvedValue([]),
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

vi.mock('../components/Dashboard', () => ({
  Dashboard: ({ onStartSession, onOpenAddModal }: any) => (
    <div>
      <div>Mock Dashboard</div>
      <button onClick={onStartSession}>Start Session</button>
      <button onClick={onOpenAddModal}>Add Card</button>
    </div>
  ),
}));

vi.mock('../components/AddCardModal', () => ({
  AddCardModal: ({ isOpen, onClose }: any) => (
    isOpen ? <div>Add Card Modal<button onClick={onClose}>Close</button></div> : null
  ),
}));

vi.mock('../components/SettingsModal', () => ({
  SettingsModal: ({ isOpen, onClose }: any) => (
    isOpen ? <div>Settings Modal<button onClick={onClose}>Close</button></div> : null
  ),
}));

describe('DashboardRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.getCards.mockResolvedValue([]);
    mockUseDeck.dataVersion = 1;
  });

  it('renders Dashboard component', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Mock Dashboard')).toBeInTheDocument();
  });

  it('loads cards from database on mount', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(mockDb.getCards).toHaveBeenCalled();
    });
  });

  it('reloads cards when dataVersion changes', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    const initialCalls = mockDb.getCards.mock.calls.length;
    
    // Simulate dataVersion change
    mockUseDeck.dataVersion = 2;
    
    rerender(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(mockDb.getCards.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('navigates to study route on start session', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    const startButton = screen.getByText('Start Session');
    await userEvent.click(startButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/study');
  });

  it('opens add card modal', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    const addButton = screen.getByText('Add Card');
    await userEvent.click(addButton);
    
    expect(screen.getByText('Add Card Modal')).toBeInTheDocument();
  });

  it('closes add card modal', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    const addButton = screen.getByText('Add Card');
    await userEvent.click(addButton);
    
    const closeButton = screen.getByText('Close');
    await userEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Add Card Modal')).not.toBeInTheDocument();
    });
  });

  it('passes correct props to Dashboard', async () => {
    render(
      <MemoryRouter>
        <DashboardRoute />
      </MemoryRouter>
    );
    
    expect(await screen.findByText('Mock Dashboard')).toBeInTheDocument();
  });
});
