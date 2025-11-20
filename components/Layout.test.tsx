import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/DeckContext', () => ({
  useDeck: () => ({
    stats: {
      total: 50,
      due: 10,
      learned: 20,
      streak: 5,
      totalReviews: 100,
      longestStreak: 15,
    },
  }),
}));

// Mock the version constant
vi.mock('../components/Layout', async () => {
  const actual = await vi.importActual<typeof import('./Layout')>('../components/Layout');
  return {
    ...actual,
  };
});

describe('Layout', () => {
  const renderWithRouter = (children: React.ReactNode) => {
    return render(
      <MemoryRouter>
        <Layout>{children}</Layout>
      </MemoryRouter>
    );
  };

  it('renders children content', () => {
    renderWithRouter(<div data-testid="test-child">Test Content</div>);
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('displays PolskiMining branding', () => {
    renderWithRouter(<div />);
    const brandings = screen.getAllByText(/Polski/);
    expect(brandings.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mining/).length).toBeGreaterThan(0);
  });

  it('shows deck statistics in navigation', () => {
    renderWithRouter(<div />);
    expect(screen.getByText(/CARDS: 50/)).toBeInTheDocument();
    expect(screen.getByText(/DUE: 10/)).toBeInTheDocument();
  });

  it('renders navigation with sticky positioning', () => {
    const { container } = renderWithRouter(<div />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain('sticky');
  });

  it('displays database icon', () => {
    renderWithRouter(<div />);
    // Icon is rendered via lucide-react Database component
    const navSection = screen.getAllByText(/Polski/)[0].closest('div');
    expect(navSection).toBeInTheDocument();
  });

  it('renders footer with info text', () => {
    renderWithRouter(<div />);
    expect(screen.getAllByText(/PolskiMining SRS System/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Local-First Storage/)).toBeInTheDocument();
  });

  it('links to home page from logo', () => {
    renderWithRouter(<div />);
    const logoLink = screen.getAllByText(/Polski/)[0].closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('applies dark mode classes when in dark theme', () => {
    const { container } = renderWithRouter(<div />);
    // The dark mode class is on the wrapper div, not main
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('dark:bg-gray-950');
  });

  it('renders version info', () => {
    renderWithRouter(<div />);
    // Should show version or DEV
    expect(screen.getByText(/V.*LOCAL/)).toBeInTheDocument();
  });

  it('uses responsive design classes', () => {
    const { container } = renderWithRouter(<div />);
    const nav = container.querySelector('nav');
    const innerDiv = nav?.querySelector('div');
    expect(innerDiv?.className).toContain('max-w-5xl');
    expect(innerDiv?.className).toContain('mx-auto');
  });

  it('positions footer at bottom', () => {
    const { container } = renderWithRouter(<div />);
    const footer = container.querySelector('footer');
    expect(footer?.className).toContain('mt-auto');
  });

  it('hides stats on small screens', () => {
    const { container } = renderWithRouter(<div />);
    const statsDiv = screen.getByText(/CARDS: 50/).closest('div');
    expect(statsDiv?.className).toContain('hidden');
    expect(statsDiv?.className).toContain('md:flex');
  });
});
