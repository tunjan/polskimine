import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Plus, Sparkles, BookOpen, Zap, Trash2 } from 'lucide-react';

import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardHistoryModal } from '@/features/deck/components/CardHistoryModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery } from '@/features/deck/hooks/useCardsQuery';
import { GamePanel, GameButton, GameDivider, GameLoader } from '@/components/ui/game-ui';
import { cn } from '@/lib/utils';

export const CardsRoute: React.FC = () => {
  const { settings } = useSettings();
  const { stats } = useDeck();
  const { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards } = useCardOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);

  const pageSize = 50;

  const { data, isLoading, isPlaceholderData } = useCardsQuery(page, pageSize, debouncedSearch);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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
  }, [page, debouncedSearch]);

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsAddModalOpen(true);
  };

  const handleViewHistory = (card: Card) => {
    setSelectedCard(card);
    setIsHistoryModalOpen(true);
  };

  const handleToggleSelect = useCallback((id: string, index: number, isShift: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isShift && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const idsInRange = cards.slice(start, end + 1).map(c => c.id);
        const shouldSelect = !prev.has(id);
        idsInRange.forEach(rangeId => shouldSelect ? next.add(rangeId) : next.delete(rangeId));
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setLastSelectedIndex(index);
      }
      return next;
    });
  }, [cards, lastSelectedIndex]);

  const handleBatchPrioritize = async () => {
    if (selectedIds.size === 0) return;
    await prioritizeCards(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} card${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      const ids = Array.from(selectedIds);
      await deleteCardsBatch(ids);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = useCallback(() => {
    const allCurrentPageIds = cards.map(c => c.id);
    const allSelected = allCurrentPageIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [cards, selectedIds]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div
      className="page-full-height flex flex-col h-full w-full bg-background text-foreground overflow-hidden relative"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20px 20px, var(--primary) 2px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* --- Genshin Header (Collapsible) --- */}
      <header className="relative shrink-0 z-20">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 pointer-events-none" />

        <div className="relative px-4 md:px-8 pt-6 pb-2">

          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-border/50 bg-card/50 rotate-45">
                <BookOpen className="w-4 h-4 text-primary -rotate-45" />
              </div>
              <div>
                <h1 className="text-lg font-medium tracking-wider text-foreground uppercase font-genshin-title">
                  Collection
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats.total} Cards</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="tabular-nums">{stats.learned} Mastered</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 pr-4 bg-card/50 border border-border/50 focus:border-primary/50 w-full sm:w-48 transition-all outline-none text-sm"
                />
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center border border-border/50 bg-card/50 hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all shrink-0"
                title="Generate Cards"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary transition-all shrink-0"
                title="Add Card"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      </header>

      {/* --- Main Content Area --- */}
      <div className="flex-1 min-h-0 flex flex-col relative bg-background/50">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16 animate-spin-slow">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-t-2 border-primary rounded-full" />
              </div>
              <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase animate-pulse">Loading...</p>
            </div>
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
          />
        )}
      </div>

      {/* --- Floating Selection Bar (Genshin Style) --- */}
      <div className={cn(
        "fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) w-[80%] md:w-auto",
        selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      )}>
        <div className="genshin-panel !p-0 flex items-center overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl bg-card/90 w-full">
          {/* Left: Count */}
          <div className="px-4 py-2 md:px-6 md:py-3 bg-primary/10 border-r border-border/50 flex items-center gap-3">
            <div className="w-2 h-2 rotate-45 bg-primary" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-medium leading-none text-primary tabular-nums font-editorial">
                {selectedIds.size}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold hidden sm:inline">Selected</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 px-2 md:px-4 py-2 flex items-center justify-around md:justify-end gap-1 md:gap-2">
            <button
              onClick={handleBatchPrioritize}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Prioritize</span>
            </button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-sm transition-colors"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedCard(undefined); }}
        onAdd={(card) => selectedCard ? updateCard(card) : addCard(card)}
        initialCard={selectedCard}
      />
      <GenerateCardsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={(cards) => addCardsBatch(cards)}
      />
      <CardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => { setIsHistoryModalOpen(false); setSelectedCard(undefined); }}
        card={selectedCard}
      />
    </div>
  );
};
