import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { getCardColumns } from './CardTableColumns';
import { GamePanel } from '@/components/ui/game-ui';
import { RowSelectionState } from '@tanstack/react-table';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: Card) => void;
  onPrioritizeCard: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, index: number, isShift: boolean) => void;
  onSelectAll: () => void;

  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  searchTerm,
  onEditCard,
  onDeleteCard,
  onViewHistory,
  onPrioritizeCard,
  selectedIds,
  onToggleSelect,
  onSelectAll,

  page = 0,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}) => {
  const rowSelection = useMemo(() => {
    const state: RowSelectionState = {};
    selectedIds.forEach((id) => {
      state[id] = true;
    });
    return state;
  }, [selectedIds]);

  const handleRowSelectionChange = (newSelection: RowSelectionState) => {
    const newSelectedIds = new Set(Object.keys(newSelection).filter(id => newSelection[id]));
    const currentSelectedIds = selectedIds;

    newSelectedIds.forEach(id => {
      if (!currentSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });

    currentSelectedIds.forEach(id => {
      if (!newSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });
  };

  const columns = useMemo(
    () => getCardColumns({
      onEditCard,
      onDeleteCard,
      onViewHistory,
      onPrioritizeCard,
    }),
    [onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <GamePanel className="p-6 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md" glowOnHover>
          {/* Decorative container with diamond shape */}
          <div className="relative mb-8">
            <div className="w-20 h-20 border border-border/60 flex items-center justify-center rotate-45">
              <BookOpen className="w-7 h-7 text-muted-foreground/40 -rotate-45" strokeWidth={1.5} />
            </div>
            {/* Enhanced corner accents */}
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            {/* Center diamond accent */}
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-primary/50" />
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">No cards found</h3>
          <p className="text-sm text-muted-foreground/60 font-light font-ui">
            Your collection appears to be empty
          </p>
          {/* Decorative line */}
          <div className="flex items-center gap-2 mt-6 w-full max-w-[200px]">
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
            <span className="flex-1 h-px bg-gradient-to-r from-border/60 via-border/40 to-transparent" />
            <span className="w-1 h-1 rotate-45 bg-border/40" />
            <span className="flex-1 h-px bg-gradient-to-l from-border/60 via-border/40 to-transparent" />
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
          </div>
        </GamePanel>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full px-4 md:px-6 lg:px-8 py-4">
      <DataTable
        columns={columns}
        data={cards}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        enableRowSelection
        getRowId={(row) => row.id}
        searchValue={searchTerm}
        searchColumn="targetSentence"
        pageSize={50}
        onRowClick={onViewHistory}
        manualPagination={true}
        pageCount={totalPages}
        pageIndex={page}
        onPageChange={onPageChange}
        totalItems={totalCount}
      />
    </div>
  );
};
