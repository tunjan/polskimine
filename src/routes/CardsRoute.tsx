import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Plus, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardHistoryModal } from '@/features/deck/components/CardHistoryModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery } from '@/features/deck/hooks/useCardsQuery';
import { toast } from 'sonner';
import clsx from 'clsx';

export const CardsRoute: React.FC = () => {
  const { settings } = useSettings();
  const { stats } = useDeck();
  const { addCard, addCardsBatch, deleteCard, prioritizeCards } = useCardOperations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
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
        for (const id of ids) await deleteCard(id);
        setSelectedIds(new Set());
        toast.success(`Deleted ${ids.length} card${ids.length === 1 ? '' : 's'}`);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div 
      className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen w-full bg-background text-foreground"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
        
        {/* --- Warm, Editorial Header (Collapsible) --- */}
        <header className="px-8 md:px-16 lg:px-24 shrink-0 border-b border-border/30 bg-background z-20 transition-all duration-500 ease-out relative">
            
            {/* Collapsed Header - Compact View */}
            {!isHeaderExpanded && (
              <div className="py-4">
                {/* Mobile Layout - Stacked */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-light tracking-tight text-foreground truncate" style={{ fontFamily: 'var(--font-serif)' }}>
                        Your Collection
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-light mt-1" style={{ fontFamily: 'var(--font-sans)' }}>
                        <span className="tabular-nums">{stats.total} cards</span>
                        <span>•</span>
                        <span className="tabular-nums">{stats.learned} mastered</span>
                      </div>
                    </div>
                    
                    {/* Mobile Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsGenerateModalOpen(true)} 
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-300"
                        title="Generate cards"
                      >
                        <Sparkles size={18} strokeWidth={1.5} />
                      </button>
                      <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="p-2 rounded-full text-[oklch(0.99_0.005_85)] bg-[oklch(0.52_0.12_35)] hover:bg-[oklch(0.48_0.12_35)] transition-all duration-300 shadow-sm"
                        title="Add card"
                      >
                        <Plus size={18} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setIsHeaderExpanded(true)}
                        className="p-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all duration-300"
                        aria-label="Expand header"
                      >
                        <ChevronDown size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Search - Full Width */}
                  <div className="relative w-full group">
                    <Search 
                      size={16} 
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-muted-foreground transition-colors" 
                      strokeWidth={1.5}
                    />
                    <input 
                      type="text"
                      placeholder="Search..."
                      className="w-full bg-transparent border-b border-border py-2 pl-6 pr-8 text-sm font-light outline-none placeholder:text-muted-foreground/40 focus:border-foreground/40 transition-colors"
                      style={{ fontFamily: 'var(--font-sans)' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout - Single Row */}
                <div className="hidden md:flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <h1 className="text-xl font-light tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                      Your Collection
                    </h1>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      <span className="tabular-nums">{stats.total} cards</span>
                      <div className="w-px h-3 bg-border" />
                      <span className="tabular-nums">{stats.learned} mastered</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Search - Compact */}
                    <div className="relative w-full max-w-xs group">
                      <Search 
                        size={16} 
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-muted-foreground transition-colors" 
                        strokeWidth={1.5}
                      />
                      <input 
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-transparent border-b border-border py-2 pl-6 pr-8 text-sm font-light outline-none placeholder:text-muted-foreground/40 focus:border-foreground/40 transition-colors"
                        style={{ fontFamily: 'var(--font-sans)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>

                    {/* Compact Actions */}
                    <button 
                      onClick={() => setIsGenerateModalOpen(true)} 
                      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-300"
                      title="Generate cards"
                    >
                      <Sparkles size={18} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="p-2 rounded-full text-[oklch(0.99_0.005_85)] bg-[oklch(0.52_0.12_35)] hover:bg-[oklch(0.48_0.12_35)] transition-all duration-300 shadow-sm"
                      title="Add card"
                    >
                      <Plus size={18} strokeWidth={2} />
                    </button>

                    {/* Expand Button */}
                    <button
                      onClick={() => setIsHeaderExpanded(true)}
                      className="p-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-all duration-300"
                      aria-label="Expand header"
                    >
                      <ChevronDown size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Header - Full View */}
            {isHeaderExpanded && (
              <div className="pt-12 md:pt-16 pb-8">
                {/* Title Section - Literary Feel */}
                <div className="mb-12">
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-6 mb-4">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                      Your Collection
                    </h1>
                    
                    {/* Elegant Stats Summary */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground font-light" style={{ fontFamily: 'var(--font-sans)' }}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-foreground font-light tabular-nums">{stats.total}</span>
                        <span>cards</span>
                      </div>
                      <div className="w-px h-4 bg-border" />
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-foreground font-light tabular-nums">{stats.learned}</span>
                        <span>mastered</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl" style={{ fontFamily: 'var(--font-sans)' }}>
                    Studying {settings.language}
                  </p>
                </div>

                {/* Controls - Refined and Spacious */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  {/* Search - Clean, Underlined */}
                  <div className="relative w-full md:max-w-md group">
                    <Search 
                      size={18} 
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-muted-foreground transition-colors" 
                      strokeWidth={1.5}
                    />
                    <input 
                      type="text"
                      placeholder="Search your cards..."
                      className="w-full bg-transparent border-b border-border py-3.5 pl-8 pr-10 text-base font-light outline-none placeholder:text-muted-foreground/40 focus:border-foreground/40 transition-colors"
                      style={{ fontFamily: 'var(--font-sans)' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <X size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Action Buttons - Soft, Rounded */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => setIsGenerateModalOpen(true)} 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-light tracking-wide text-muted-foreground border border-border hover:border-muted-foreground/40 hover:text-foreground transition-all duration-300"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <Sparkles size={16} strokeWidth={1.5} />
                      Generate
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium tracking-wide text-[oklch(0.99_0.005_85)] border border-[oklch(0.52_0.12_35)] bg-[oklch(0.52_0.12_35)] hover:bg-[oklch(0.48_0.12_35)] transition-all duration-300 shadow-sm"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <Plus size={16} strokeWidth={2} />
                      Add Card
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collapse Toggle Button - Centered at bottom of expanded header */}
            {isHeaderExpanded && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <button
                  onClick={() => setIsHeaderExpanded(false)}
                  className="p-1.5 rounded-full bg-background border border-border text-muted-foreground/60 hover:text-foreground hover:border-muted-foreground/40 transition-all duration-300 shadow-sm"
                  aria-label="Collapse header"
                >
                  <ChevronUp size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
        </header>

        {/* --- Main Content Area --- */}
        <div className="flex-1 min-h-0 flex flex-col relative bg-background">
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-px h-16 bg-border/30 mx-auto" />
                    <span 
                      className="text-base font-light text-muted-foreground/60 tracking-tight animate-pulse"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Loading your collection...
                    </span>
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
                />
             )}
        </div>

        {/* --- Refined Footer with Pagination --- */}
        <div className="px-8 md:px-16 lg:px-24 py-6 flex flex-col md:flex-row items-center justify-between border-t border-border/30 shrink-0 bg-background z-10 gap-4">
          <div className="flex items-baseline gap-3" style={{ fontFamily: 'var(--font-sans)' }}>
            <span className="text-sm text-muted-foreground font-light">
              Page
            </span>
            <span className="text-lg font-light text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
              {page + 1}
            </span>
            <span className="text-sm text-muted-foreground/40 font-light">
              of {totalPages}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light tracking-wide text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground transition-all duration-300"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
              Previous
            </button>
            <button
              onClick={() => {
                if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                  setPage(p => p + 1);
                }
              }}
              disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light tracking-wide text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground transition-all duration-300"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Next
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* --- Floating Selection Actions - Warm & Elegant --- */}
        <div className={clsx(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
          selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
          <div 
            className="bg-card border border-border rounded-3xl shadow-2xl px-8 py-5 flex items-center gap-8"
            style={{ 
              backdropFilter: 'blur(20px)',
              backgroundColor: 'oklch(0.99 0.005 85 / 0.95)'
            }}
          >
            <div className="flex items-baseline gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="text-2xl font-light text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                {selectedIds.size}
              </span>
              <span className="text-sm text-muted-foreground font-light">
                selected
              </span>
            </div>
            
            <div className="w-px h-8 bg-border/40" />
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBatchPrioritize}
                className="text-sm font-light tracking-wide text-foreground hover:text-[oklch(0.52_0.12_35)] transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Prioritize all
              </button>
              <button 
                onClick={handleBatchDelete}
                className="text-sm font-light tracking-wide text-destructive hover:text-destructive/80 transition-colors"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Delete all
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="ml-2 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Clear selection"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Global Modals */}
        <AddCardModal 
          isOpen={isAddModalOpen}
          onClose={() => { setIsAddModalOpen(false); setSelectedCard(undefined); }}
          onAdd={(card) => addCard(card)}
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