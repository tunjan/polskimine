import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardList } from "./CardList";
import { vi, describe, it, expect } from "vitest";
import { Card, CardStatus } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

vi.mock("./CardTableColumns", () => ({
  getCardColumns: ({
    onEditCard,
    onDeleteCard,
    onViewHistory,
    onPrioritizeCard,
  }: any) => [
    {
      id: "select",
      header: "Select",
      cell: ({ row }: any) => (
        <button
          onClick={() => row.toggleSelected()}
          data-testid={`select-${row.original.id}`}
        >
          Select {row.original.targetWord}
        </button>
      ),
    },
    {
      accessorKey: "targetWord",
      header: "Word",
      cell: ({ row }: any) => <span>{row.original.targetWord}</span>,
    },
    {
      accessorKey: "targetSentence",
      header: "Sentence",
      cell: ({ row }: any) => (
        <div
          dangerouslySetInnerHTML={{ __html: row.original.targetSentence }}
          data-testid={`sentence-${row.original.id}`}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCard(row.original);
            }}
            data-testid={`edit-${row.original.id}`}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCard(row.original.id);
            }}
            data-testid={`delete-${row.original.id}`}
          >
            Delete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(row.original);
            }}
            data-testid={`history-${row.original.id}`}
          >
            History
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrioritizeCard(row.original.id);
            }}
            data-testid={`prioritize-${row.original.id}`}
          >
            Prioritize
          </button>
        </div>
      ),
    },
  ],
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    data,
    columns,
    onRowClick,
    onRowSelectionChange,
    columnVisibility,
    onColumnVisibilityChange,
  }: any) => (
    <div data-testid="data-table">
      <div data-testid="visibility-props">
        {JSON.stringify(columnVisibility)}
      </div>
      <button
        onClick={() =>
          onColumnVisibilityChange &&
          onColumnVisibilityChange({ targetWord: false })
        }
        data-testid="toggle-visibility-btn"
      >
        Toggle Visibility
      </button>
      <table>
        <thead>
          <tr>
            {columns.map((col: ColumnDef<any>, idx: number) => (
              <th key={col.id || (col as any).accessorKey || idx}>
                {typeof col.header === "function"
                  ? (col.header as any)({
                      table: {
                        getIsAllPageRowsSelected: () => false,
                        getIsSomePageRowsSelected: () => false,
                        toggleAllPageRowsSelected: () => {},
                      },
                    })
                  : col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((card: any) => (
            <tr
              key={card.id}
              onClick={() => onRowClick && onRowClick(card)}
              data-testid={`row-${card.id}`}
            >
              {columns.map((col: ColumnDef<any>, idx: number) => (
                <td key={col.id || (col as any).accessorKey || idx}>
                  {flexRenderMock(col.cell, {
                    row: {
                      original: card,
                      getValue: (key: string) => card[key],
                      toggleSelected: () =>
                        onRowSelectionChange &&
                        onRowSelectionChange((prev: any) => ({
                          ...prev,
                          [card.id]: !prev?.[card.id],
                        })),
                    },
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

const flexRenderMock = (Comp: any, props: any) => {
  if (typeof Comp === "function") {
    return Comp(props);
  }
  return Comp;
};

const mockCards: Card[] = [
  {
    id: "1",
    targetWord: "Word1",
    targetSentence: "Sentence <b>1</b>",
    nativeTranslation: "Translation 1",
    status: CardStatus.NEW,
    created_at: "2023-01-01",
    interval: 0,
    easeFactor: 0,
    reps: 0,
    language: "polish",
    dueDate: "2023-01-01",
    notes: "",
    user_id: "u1",
  },
  {
    id: "2",
    targetWord: "Word2",
    targetSentence: "Sentence 2",
    nativeTranslation: "Translation 2",
    status: CardStatus.LEARNING,
    created_at: "2023-01-02",
    interval: 0,
    easeFactor: 0,
    reps: 0,
    language: "polish",
    dueDate: "2023-01-02",
    notes: "",
    user_id: "u1",
  },
];

describe("CardList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
    columnVisibility: {},
    onColumnVisibilityChange: vi.fn(),
  };

  it("renders list of cards with correct content", () => {
    render(<CardList {...defaultProps} />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByText("Word1")).toBeInTheDocument();
    expect(screen.getByText("Word2")).toBeInTheDocument();
  });

  it("renders empty state correctly", () => {
    render(<CardList {...defaultProps} cards={[]} totalCount={0} />);
    expect(screen.getByText("No cards found")).toBeInTheDocument();
  });

  it("triggers row click action (view history)", async () => {
    const user = userEvent.setup();
    render(<CardList {...defaultProps} />);
    await user.click(screen.getByTestId("row-1"));
    expect(defaultProps.onViewHistory).toHaveBeenCalledWith(mockCards[0]);
  });

  it("renders HTML in sentence column", () => {
    render(<CardList {...defaultProps} />);
    const sentenceCell = screen.getByTestId("sentence-1");

    expect(sentenceCell.innerHTML).toContain("<b>1</b>");
  });

  it("passes columnVisibility props to DataTable", () => {
    const visibility = { targetSentence: false };
    render(<CardList {...defaultProps} columnVisibility={visibility} />);
    expect(screen.getByTestId("visibility-props")).toHaveTextContent(
      JSON.stringify(visibility),
    );
  });

  it("triggers onColumnVisibilityChange when table requests it", async () => {
    const user = userEvent.setup();
    const onVisibilityChange = vi.fn();
    render(
      <CardList
        {...defaultProps}
        onColumnVisibilityChange={onVisibilityChange}
      />,
    );

    await user.click(screen.getByTestId("toggle-visibility-btn"));
    expect(onVisibilityChange).toHaveBeenCalledWith({ targetWord: false });
  });

  it("triggers action buttons correctly", async () => {
    const user = userEvent.setup();
    render(<CardList {...defaultProps} />);

    await user.click(screen.getByTestId("edit-1"));
    expect(defaultProps.onEditCard).toHaveBeenCalledWith(mockCards[0]);

    await user.click(screen.getByTestId("delete-1"));
    expect(defaultProps.onDeleteCard).toHaveBeenCalledWith("1");

    await user.click(screen.getByTestId("history-1"));
    expect(defaultProps.onViewHistory).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("prioritize-1"));
    expect(defaultProps.onPrioritizeCard).toHaveBeenCalledWith("1");
  });

  it("handles selection toggle", async () => {
    const user = userEvent.setup();
    render(<CardList {...defaultProps} />);

    await user.click(screen.getByTestId("select-1"));
  });
});
