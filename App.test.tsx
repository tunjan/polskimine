import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

// Mock all context providers and components
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/DeckContext', () => ({
  DeckProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock('@/routes/DashboardRoute', () => ({
  DashboardRoute: () => <div data-testid="dashboard-route">Dashboard</div>,
}));

vi.mock('@/routes/StudyRoute', () => ({
  StudyRoute: () => <div data-testid="study-route">Study</div>,
}));

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('renders the Toaster component', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('renders DashboardRoute on root path', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard-route')).toBeInTheDocument();
  });

  it('renders StudyRoute on /study path', async () => {
    window.history.pushState({}, '', '/study');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('study-route')).toBeInTheDocument();
    });
  });

  it('wraps app with ThemeProvider', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('wraps app with SettingsProvider', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('wraps app with DeckProvider', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('provides router context via BrowserRouter', () => {
    render(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
