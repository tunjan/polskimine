import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { describe, it, expect, vi } from "vitest";


vi.mock("@/components/ui/activity-heatmap", () => ({ ActivityHeatmap: () => <div data-testid="heatmap" /> }));
vi.mock("@/components/ui/level-badge", () => ({ 
    LevelBadge: ({ level }: any) => <div>Level {level} Badge</div>,
    getRankForLevel: () => ({ title: "RankTitle" }) 
}));
vi.mock("@/components/ui/streak-display", () => ({ StreakDisplay: () => <div>StreakDisplay</div> }));

describe("Dashboard", () => {
    const defaultProps = {
        metrics: { total: 100, new: 10, learning: 5, relearning: 2, reviewing: 20, known: 63 },
        languageXp: { xp: 500, level: 3 },
        stats: { currentStreak: 5, longestStreak: 10, todayCards: 20, todayTime: 1200 },
        history: { "2023-01-01": 5 },
        cards: [],
        onStartSession: vi.fn(),
    };

    it("should render greeting and summary", () => {
        render(<Dashboard {...defaultProps} />);
        expect(screen.getByText("Ready to study?")).toBeInTheDocument();
        
        expect(screen.getByText(/37 cards/)).toBeInTheDocument();
    });

    it("should check 'You're all caught up' if no due cards", () => {
        const props = { ...defaultProps, metrics: { ...defaultProps.metrics, new: 0, learning: 0, relearning: 0, reviewing: 0 } };
        render(<Dashboard {...props} />);
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
        expect(screen.getByText("Great job! You've completed all your reviews for now.")).toBeInTheDocument();
    });

    it("should render breakdown badges", () => {
        render(<Dashboard {...defaultProps} />);
        expect(screen.getByText("10 new")).toBeInTheDocument();
        expect(screen.getByText("7 learning")).toBeInTheDocument(); 
        expect(screen.getByText("20 review")).toBeInTheDocument();
    });

    it("should call onStartSession when clicked", () => {
        render(<Dashboard {...defaultProps} />);
        fireEvent.click(screen.getByText("Start Session"));
        expect(defaultProps.onStartSession).toHaveBeenCalled();
    });

    it("should disable button if no cards", () => {
        const props = { ...defaultProps, metrics: { ...defaultProps.metrics, new: 0, learning: 0, relearning: 0, reviewing: 0 } };
        render(<Dashboard {...props} />);
        const btn = screen.getByRole("button", { name: /Start Session/i });
        expect(btn).toBeDisabled();
    });
});
