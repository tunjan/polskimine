import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardList } from "./CardList";
import { vi, describe, it, expect } from "vitest";
import { Card, CardStatus } from "@/types";

// Mock DataTable since it's a complex UI component
vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({ data, onRowClick }: any) => (
    <div data-testid="data-table">
      {data.map((card: any) => (
        <div
          key={card.id}
          onClick={() => onRowClick && onRowClick(card)}
          data-testid={`row-${card.id}`}
        >
          {card.targetWord}
        </div>
      ))}
    </div>
  ),
}));

// Mock columns
vi.mock("./CardTableColumns", () => ({
  getCardColumns: () => [],
}));

const mockCards: Card[] = [
  {
    id: "1",
    targetWord: "Word1",
    targetSentence: "Sentence 1",
    nativeTranslation: "Translation 1",
    status: CardStatus.NEW,
    created_at: "",
    interval: 0,
    easeFactor: 0,
    reps: 0,
    language: "polish",
    dueDate: "",
    notes: "",
    user_id: "u1",
  },
  {
    id: "2",
    targetWord: "Word2",
    targetSentence: "Sentence 2",
    nativeTranslation: "Translation 2",
    status: CardStatus.LEARNING,
    created_at: "",
    interval: 0,
    easeFactor: 0,
    reps: 0,
    language: "polish",
    dueDate: "",
    notes: "",
    user_id: "u1",
  },
];

describe("CardList", () => {
  const defaultProps = {
    cards: mockCards,
    searchTerm: "",
    onEditCard: vi.fn(),
    onDeleteCard: vi.fn(),
    onViewHistory: vi.fn(),
    onPrioritizeCard: vi.fn(),
    selectedIds: new Set<string>(),
    onToggleSelect: vi.fn(),
    onSelectAll: vi.fn(),
    page: 0,
    totalPages: 1,
    totalCount: 2,
    onPageChange: vi.fn(),
  };

  it("renders empty state when no cards", () => {
    render(<CardList {...defaultProps} cards={[]} totalCount={0} />);
    expect(screen.getByText("No cards found")).toBeInTheDocument();
    expect(
      screen.getByText("Your collection appears to be empty"),
    ).toBeInTheDocument();
  });

  it("renders list of cards", () => {
    render(<CardList {...defaultProps} />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByText("Word1")).toBeInTheDocument();
    expect(screen.getByText("Word2")).toBeInTheDocument();
  });

  it("calls onViewHistory when row is clicked", async () => {
    const user = userEvent.setup();
    render(<CardList {...defaultProps} />);
    await user.click(screen.getByTestId("row-1"));
    expect(defaultProps.onViewHistory).toHaveBeenCalledWith(mockCards[0]);
  });
});
