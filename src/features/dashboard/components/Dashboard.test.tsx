import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard, DashboardProps } from "./Dashboard";

// Mock sub-components to avoid rendering complexity
vi.mock("@/components/ui/level-badge", () => ({
  LevelBadge: () => <div data-testid="level-badge" />,
  getRankForLevel: () => ({ title: "Rank 1" }),
}));
vi.mock("@/components/ui/streak-display", () => ({
  StreakDisplay: () => <div data-testid="streak-display" />,
}));
vi.mock("@/components/ui/activity-heatmap", () => ({
  ActivityHeatmap: () => <div data-testid="activity-heatmap" />,
}));

describe("Dashboard", () => {
  const defaultProps: DashboardProps = {
    metrics: {
      total: 0,
      new: 0,
      learning: 0,
      relearning: 0,
      reviewing: 0,
      known: 0,
    },
    languageXp: {
      xp: 0,
      level: 1,
    },
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      todayCards: 0,
      todayTime: 0,
    },
    history: {},
    cards: [],
    onStartSession: vi.fn(),
  };

  it("displays 'caught up' message when no cards are due or new", () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText(/You're all caught up!/i)).toBeInTheDocument();
  });

  it("displays correct breakdown for mixed states", () => {
    const props = {
      ...defaultProps,
      metrics: {
        ...defaultProps.metrics,
        new: 2,
        learning: 1,
        relearning: 0,
        reviewing: 1,
        total: 4,
      },
    };
    render(<Dashboard {...props} />);

    // Total count check
    expect(screen.getByText("4 cards")).toBeInTheDocument();

    // Breakdown checks
    const breakdown = screen.getByTestId("dashboard-hero-breakdown");
    expect(breakdown).toHaveTextContent("2 new");
    expect(breakdown).toHaveTextContent("1 learning");
    expect(breakdown).toHaveTextContent("1 review");
  });

  it("groups learning and relearning (lapses) together as 'learning'", () => {
    const props = {
      ...defaultProps,
      metrics: {
        ...defaultProps.metrics,
        new: 0,
        learning: 1,
        relearning: 2, // Lapses
        reviewing: 0,
        total: 3,
      },
    };
    render(<Dashboard {...props} />);

    // Total count
    expect(screen.getByText("3 cards")).toBeInTheDocument();

    const breakdown = screen.getByTestId("dashboard-hero-breakdown");
    expect(breakdown).toHaveTextContent("3 learning");
    expect(breakdown).not.toHaveTextContent("new");
    expect(breakdown).not.toHaveTextContent("review");
  });

  it("displays only new cards correctly", () => {
    const props = {
      ...defaultProps,
      metrics: {
        ...defaultProps.metrics,
        new: 5,
        learning: 0,
        relearning: 0,
        reviewing: 0,
        total: 5,
      },
    };
    render(<Dashboard {...props} />);

    expect(screen.getByText("5 cards")).toBeInTheDocument();

    const breakdown = screen.getByTestId("dashboard-hero-breakdown");
    expect(breakdown).toHaveTextContent("5 new");
    expect(breakdown).not.toHaveTextContent("learning");
    expect(breakdown).not.toHaveTextContent("review");
  });

  it("disables 'Start Session' button when caught up", () => {
    render(<Dashboard {...defaultProps} />);
    const button = screen.getByRole("button", { name: /start session/i });
    expect(button).toBeDisabled();
  });

  it("enables 'Start Session' button when there are cards to review", () => {
    const props = {
      ...defaultProps,
      metrics: {
        ...defaultProps.metrics,
        new: 1,
      },
    };
    render(<Dashboard {...props} />);
    const button = screen.getByRole("button", { name: /start session/i });
    expect(button).toBeEnabled();
  });
});
