import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card as CardModel } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { getCardColumns } from './CardTableColumns';
import { Card } from '@/components/ui/card';
import { RowSelectionState } from '@tanstack/react-table';

interface CardListProps {
  cards: CardModel[];
  searchTerm: string;
  onEditCard: (card: CardModel) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: CardModel) => void;
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
      onToggleSelect,
    }),
    [onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, onToggleSelect]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Card className="p-6 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md">
                    <div className="relative mb-8">
            <div className="w-16 h-16 border rounded-full flex items-center justify-center bg-muted/20">
              <BookOpen className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">No cards found</h3>
          <p className="text-sm text-muted-foreground/60 font-light ">
            Your collection appears to be empty
          </p>
          
        </Card>
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
