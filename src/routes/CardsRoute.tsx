import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Sparkles,
  BookOpen,
  Zap,
  Trash2,
  Filter,
  Bookmark,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VisibilityState } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDeckStats } from "@/features/collection/hooks/useDeckStats";
import { Card, CardStatus } from "@/types";
import { AddCardModal } from "@/features/collection/components/AddCardModal";
import { GenerateCardsModal } from "@/features/generator/components/GenerateCardsModal";
import { CardHistoryModal } from "@/features/collection/components/CardHistoryModal";
import { CardList } from "@/features/collection/components/CardList";
import { useCardOperations } from "@/features/collection/hooks/useCardOperations";
import {
  useCardsQuery,
  CardFilters,
} from "@/features/collection/hooks/useCardsQuery";

import { cn } from "@/lib/utils";

export const CardsRoute: React.FC = () => {
  const { stats } = useDeckStats();
  const {
    addCard,
    addCardsBatch,
    updateCard,
    deleteCard,
    deleteCardsBatch,
    prioritizeCards,
  } = useCardOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CardFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const pageSize = 50;

  const { data, isLoading } = useCardsQuery(
    page,
    pageSize,
    debouncedSearch,
    filters,
  );
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const activeFilterCount =
    (filters.status && filters.status !== "all" ? 1 : 0) +
    (filters.bookmarked ? 1 : 0) +
    (filters.leech ? 1 : 0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, [page, debouncedSearch, filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsAddModalOpen(true);
  };

  const handleViewHistory = (card: Card) => {
    setSelectedCard(card);
    setIsHistoryModalOpen(true);
  };

  const handleToggleSelect = useCallback(
    (id: string, index: number, isShift: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (isShift && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          const idsInRange = cards.slice(start, end + 1).map((c) => c.id);
          const shouldSelect = !prev.has(id);
          idsInRange.forEach((rangeId) =>
            shouldSelect ? next.add(rangeId) : next.delete(rangeId),
          );
        } else {
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setLastSelectedIndex(index);
        }
        return next;
      });
    },
    [cards, lastSelectedIndex],
  );

  const handleBatchPrioritize = async () => {
    if (selectedIds.size === 0) return;
    await prioritizeCards(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} card${selectedIds.size === 1 ? "" : "s"}? This action cannot be undone.`,
      )
    ) {
      const ids = Array.from(selectedIds);
      await deleteCardsBatch(ids);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = useCallback(() => {
    const allCurrentPageIds = cards.map((c) => c.id);
    const allSelected = allCurrentPageIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [cards, selectedIds]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative bg-background">
      <header className="md:px-8 pb-2 border-b">
        <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Collection
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">{stats.total} Cards</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="tabular-nums">{stats.learned} Mastered</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>

            <div className="relative">
              <Button
                variant={activeFilterCount > 0 ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter Cards"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>

              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-popover border text-popover-foreground shadow-md rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-sm font-semibold">Filters</span>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            "all",
                            CardStatus.NEW,
                            CardStatus.LEARNING,
                            CardStatus.REVIEW,
                            CardStatus.KNOWN,
                          ] as const
                        ).map((status) => (
                          <Button
                            key={status}
                            variant={
                              filters.status === status ||
                              (!filters.status && status === "all")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                status: status === "all" ? undefined : status,
                              }))
                            }
                            className="capitalize h-8 text-xs font-normal"
                          >
                            {status === CardStatus.REVIEW
                              ? "graduated"
                              : status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Quick Filters
                      </label>
                      <div className="space-y-1.5">
                        <Button
                          variant={filters.bookmarked ? "secondary" : "outline"}
                          size="sm"
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              bookmarked: !f.bookmarked,
                            }))
                          }
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.bookmarked &&
                              "bg-primary/10 border-primary text-primary hover:bg-primary/20",
                          )}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmarked</span>
                        </Button>
                        <Button
                          variant={filters.leech ? "destructive" : "outline"}
                          size="sm"
                          onClick={() =>
                            setFilters((f) => ({ ...f, leech: !f.leech }))
                          }
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.leech
                              ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20"
                              : "",
                          )}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Leech Cards</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Toggle Columns">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {[
                  { id: "isBookmarked", label: "Bookmark" },
                  { id: "status", label: "Status" },
                  { id: "targetWord", label: "Word" },
                  { id: "targetSentence", label: "Sentence" },
                  { id: "nativeTranslation", label: "Translation" },
                  { id: "dueDate", label: "Due" },
                  { id: "created_at", label: "Created" },
                ].map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={columnVisibility[column.id] !== false}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [column.id]: !!value,
                      }))
                    }
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGenerateModalOpen(true)}
              title="Generate Cards"
            >
              <Sparkles className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              onClick={() => setIsAddModalOpen(true)}
              title="Add Card"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg">
              Loading...
            </span>
          </div>
        ) : (
          <CardList
            cards={cards}
            searchTerm=""
            onEditCard={handleEditCard}
            onDeleteCard={(id) => deleteCard(id)}
            onViewHistory={handleViewHistory}
            onPrioritizeCard={(id) => prioritizeCards([id])}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        )}
      </div>

      <div
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto min-w-[300px] transition-all duration-200",
          selectedIds.size > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-foreground text-background rounded-full shadow-lg px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold tabular-nums">
              {selectedIds.size}
            </span>
            <span className="text-sm opacity-80">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchPrioritize}
              className="text-background hover:bg-background/20 h-8"
            >
              <Zap className="w-4 h-4 mr-2" />
              Prioritize
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchDelete}
              className="text-red-300 hover:text-red-200 hover:bg-red-900/30 h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds(new Set())}
              className="text-background/60 hover:text-background hover:bg-transparent h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedCard(undefined);
        }}
        onAdd={(card) => (selectedCard ? updateCard(card) : addCard(card))}
        initialCard={selectedCard}
      />
      <GenerateCardsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={(cards) => addCardsBatch(cards)}
      />
      <CardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedCard(undefined);
        }}
        card={selectedCard}
      />
    </div>
  );
};
