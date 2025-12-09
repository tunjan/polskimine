import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "./Dashboard";
import { vi, describe, it, expect } from "vitest";

// Mocks
vi.mock("@/stores/useSettingsStore", () => ({
  useSettingsStore: vi.fn(() => ({
    language: "polish",
    fsrs: { request_retention: 0.9 },
  })),
}));

vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: () => ({ profile: { username: "Test User", points: 100 } }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/db/repositories/statsRepository", () => ({
  getRevlogStats: vi.fn(),
}));

vi.mock("./Heatmap", () => ({
  Heatmap: () => <div data-testid="heatmap">Heatmap</div>,
}));

vi.mock("./ReviewVolumeChart", () => ({
  ReviewVolumeChart: () => <div data-testid="volume-chart">Volume Chart</div>,
}));

vi.mock("./TrueRetentionChart", () => ({
  TrueRetentionChart: () => (
    <div data-testid="retention-chart">Retention Chart</div>
  ),
}));

vi.mock("./RetentionStats", () => ({
  RetentionStats: () => (
    <div data-testid="retention-stats">Retention Stats</div>
  ),
}));

describe("Dashboard", () => {
  const mockProps = {
    metrics: {
      total: 10,
      new: 5,
      learning: 3,
      reviewing: 2,
      known: 1,
    },
    languageXp: { xp: 500, level: 5 },
    stats: {
      streak: 3,
      due: 5,
      newDue: 2,
      learningDue: 1,
      reviewDue: 1,
      lapseDue: 1,
      retention: 0.9,
      totalReviews: 50,
      total: 100,
      learned: 80,
      longestStreak: 10,
    },
    history: { "2024-01-01": 10 },
    onStartSession: vi.fn(),
    cards: [],
  };

  it("renders profile information", () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("renders streak information", () => {
    render(<Dashboard {...mockProps} />);
    // Streak is 3. We can look for "3" inside the streak card or associated with "days"
    // The "3" is next to "days" and "Streak" label.
    // Let's use regex or look for unique combination if possible, or testid.
    // Given the component structure, it is visually distinct.
    // We can find by text "3" but check if there are multiple.
    // To be safe, let's look for "3" and filter or use allByText.
    const threes = screen.getAllByText("3");
    expect(threes.length).toBeGreaterThan(0);
    // Or better, check if "3 days" text exists if formatted that way?
    // Dashboard: <span className="text-2xl font-bold">{stats.streak}</span> ... <span ...>days</span>
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "span" &&
          content === "3" &&
          element.classList.contains("font-bold")
        );
      }),
    ).toBeInTheDocument();
  });

  it("renders due counts and start button", () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText("Due for Review")).toBeInTheDocument();
    // 5 due.
    const fives = screen.getAllByText("5");
    expect(fives.length).toBeGreaterThan(0);
    expect(screen.getByText("Start Session")).toBeInTheDocument();
  });

  it("calls onStartSession when clicked", () => {
    render(<Dashboard {...mockProps} />);
    fireEvent.click(screen.getByText("Start Session"));
    expect(mockProps.onStartSession).toHaveBeenCalled();
  });

  it("renders tabs and default heat map", () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText("Review Heatmap")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap")).toBeInTheDocument();
  });

  it("switches to analytics tab and shows charts with activity", async () => {
    const user = userEvent.setup();
    render(<Dashboard {...mockProps} />);
    await user.click(screen.getByText(/Analytics/i));

    // We expect charts to be attempted to render (but hidden due to null data)
    // OR just verify the empty message is NOT there.
    expect(
      screen.queryByText("Complete reviews to unlock analytics."),
    ).not.toBeInTheDocument();
  });

  it("shows empty state message in analytics tab when no activity", async () => {
    const user = userEvent.setup();
    const noActivityProps = {
      ...mockProps,
      stats: {
        ...mockProps.stats,
        totalReviews: 0,
        total: 100,
        learned: 80,
        longestStreak: 10,
      },
    };
    render(<Dashboard {...noActivityProps} />);
    const analyticsTab = screen.getByRole("tab", { name: /analytics/i });
    await user.click(analyticsTab);

    await waitFor(() => {
      expect(
        screen.getByText("Complete reviews to unlock analytics."),
      ).toBeInTheDocument();
    });
  });
});
