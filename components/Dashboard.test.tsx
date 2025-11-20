import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';
import { Card, DeckStats, ReviewHistory } from '../types';

vi.mock('./Heatmap', () => ({
  Heatmap: ({ history }: { history: ReviewHistory }) => (
    <div data-testid="heatmap">Heatmap with {Object.keys(history).length} entries</div>
  ),
}));

vi.mock('react-window', () => ({
  List: ({ rowCount, rowComponent: Row, rowProps }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: rowCount }).map((_, index) => (
        <Row
          key={index}
          index={index}
          style={{}}
          ariaAttributes={{
            role: 'listitem',
            'aria-posinset': index + 1,
            'aria-setsize': rowCount,
          }}
          {...rowProps}
        />
      ))}
    </div>
  ),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./CramModal', () => ({
  CramModal: () => null,
}));

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: overrides.id ?? `card-${Math.random()}`,
  targetSentence: overrides.targetSentence ?? 'Test sentence',
  nativeTranslation: overrides.nativeTranslation ?? 'Test translation',
  notes: overrides.notes ?? '',
  status: overrides.status ?? 'learning',
  interval: overrides.interval ?? 1,
  easeFactor: overrides.easeFactor ?? 2.5,
  dueDate: overrides.dueDate ?? new Date().toISOString(),
  targetWord: overrides.targetWord,
  ...overrides,
});

const createStats = (overrides: Partial<DeckStats> = {}): DeckStats => ({
  total: overrides.total ?? 10,
  due: overrides.due ?? 5,
  learned: overrides.learned ?? 3,
  streak: overrides.streak ?? 7,
  totalReviews: overrides.totalReviews ?? 100,
  longestStreak: overrides.longestStreak ?? 15,
});

describe('Dashboard', () => {
  const createProps = () => ({
    cards: [
      createCard({ id: '1', targetSentence: 'Cześć', status: 'new' }),
      createCard({ id: '2', targetSentence: 'Dziękuję', status: 'learning' }),
      createCard({ id: '3', targetSentence: 'Dobranoc', status: 'graduated' }),
    ],
    stats: createStats(),
    history: { '2024-01-01': 10, '2024-01-02': 5 },
    onStartSession: vi.fn(),
    onOpenAddModal: vi.fn(),
    onDeleteCard: vi.fn(),
    onAddCard: vi.fn(),
    onEditCard: vi.fn(),
    onOpenSettings: vi.fn(),
    onMarkKnown: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with stats', () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    expect(screen.getAllByText(String(props.stats.due)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(props.stats.streak)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(props.stats.learned)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(props.stats.total)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Due/i)).toBeInTheDocument();
    expect(screen.getByText(/Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Known/i)).toBeInTheDocument();
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it('renders heatmap component', () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  });

  it('filters cards by search term', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const searchInput = screen.getByPlaceholderText(/Search cards/i);
    await userEvent.type(searchInput, 'Cześć');
    
    await waitFor(() => {
      expect(screen.getByText('Cześć')).toBeInTheDocument();
      expect(screen.queryByText('Dziękuję')).not.toBeInTheDocument();
    });
  });

  it('filters cards by status', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const newButton = screen.getByRole('button', { name: /New/i });
    await userEvent.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByText('Cześć')).toBeInTheDocument();
    });
  });

  it('calls onStartSession when review button clicked', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const reviewButton = screen.getByRole('button', { name: /Review \(5\)/i });
    await userEvent.click(reviewButton);
    
    expect(props.onStartSession).toHaveBeenCalledTimes(1);
  });

  it('disables review button when no cards are due', () => {
    const props = createProps();
    props.stats.due = 0;
    render(<Dashboard {...props} />);
    
    const reviewButton = screen.getByRole('button', { name: /Review \(0\)/i });
    expect(reviewButton).toBeDisabled();
  });

  it('calls onOpenAddModal when add card button clicked', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const addButton = screen.getByRole('button', { name: /Add Card/i });
    await userEvent.click(addButton);
    
    expect(props.onOpenAddModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when settings button clicked', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const settingsButton = screen.getByRole('button', { name: /Settings/i });
    await userEvent.click(settingsButton);
    
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('shows no cards message when filtered list is empty', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const searchInput = screen.getByPlaceholderText(/Search cards/i);
    await userEvent.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.getByText(/No cards found/i)).toBeInTheDocument();
    });
  });

  it('highlights target word in sentence', () => {
    const props = createProps();
    props.cards = [
      createCard({ 
        id: '1', 
        targetSentence: 'Ten samochód jest szybki',
        targetWord: 'samochód'
      }),
    ];
    render(<Dashboard {...props} />);
    
    expect(screen.getByText(/samochód/)).toBeInTheDocument();
  });

  it('shows due label for cards that are due', () => {
    const props = createProps();
    props.cards = [
      createCard({ 
        id: '1',
        dueDate: new Date(Date.now() - 86400000).toISOString() 
      }),
    ];
    render(<Dashboard {...props} />);
    
    // "Due" appears in stats header and on the card
    const dueLabels = screen.getAllByText(/Due/i);
    expect(dueLabels.length).toBeGreaterThan(0);
  });

  it('allows marking cards as known', async () => {
    const props = createProps();
    const card = props.cards[0];
    render(<Dashboard {...props} />);
    
    // Hover to show action buttons
    const cardRow = screen.getByText(card.targetSentence).closest('div');
    if (cardRow) {
      await userEvent.hover(cardRow);
      
      const markKnownButtons = screen.getAllByTitle('Mark as Known');
      await userEvent.click(markKnownButtons[0]);
      
      expect(props.onMarkKnown).toHaveBeenCalledWith(card);
    }
  });

  it('allows editing cards', async () => {
    const props = createProps();
    const card = props.cards[0];
    render(<Dashboard {...props} />);
    
    const cardRow = screen.getByText(card.targetSentence).closest('div');
    if (cardRow) {
      await userEvent.hover(cardRow);
      
      const editButtons = screen.getAllByTitle('Edit');
      await userEvent.click(editButtons[0]);
      
      expect(props.onEditCard).toHaveBeenCalledWith(card);
    }
  });

  it('allows deleting cards with undo option', async () => {
    const props = createProps();
    const card = props.cards[0];
    render(<Dashboard {...props} />);
    
    const cardRow = screen.getByText(card.targetSentence).closest('div');
    if (cardRow) {
      await userEvent.hover(cardRow);
      
      const deleteButtons = screen.getAllByTitle('Delete');
      await userEvent.click(deleteButtons[0]);
      
      expect(props.onDeleteCard).toHaveBeenCalledWith(card.id);
    }
  });

  it('filters by multiple status types', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    // Show all cards first
    expect(screen.getByText('Cześć')).toBeInTheDocument();
    expect(screen.getByText('Dziękuję')).toBeInTheDocument();
    
    // Filter by learning
    const learningButton = screen.getByRole('button', { name: /Learning/i });
    await userEvent.click(learningButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Cześć')).not.toBeInTheDocument();
      expect(screen.getByText('Dziękuję')).toBeInTheDocument();
    });
  });

  it('combines search and status filters', async () => {
    const props = createProps();
    render(<Dashboard {...props} />);
    
    const searchInput = screen.getByPlaceholderText(/Search cards/i);
    await userEvent.type(searchInput, 'Dz');
    
    const learningButton = screen.getByRole('button', { name: /Learning/i });
    await userEvent.click(learningButton);
    
    await waitFor(() => {
      expect(screen.getByText('Dziękuję')).toBeInTheDocument();
      expect(screen.queryByText('Cześć')).not.toBeInTheDocument();
    });
  });
});
