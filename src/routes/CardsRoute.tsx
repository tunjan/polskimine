import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Plus, Sparkles, ChevronUp, ChevronDown, List, LayoutList, BookOpen, Zap, Trash2 } from 'lucide-react';
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
  const { addCard, addCardsBatch, deleteCard, deleteCardsBatch, prioritizeCards } = useCardOperations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [compactView, setCompactView] = useState(true);
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div 
      className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen w-full bg-background text-foreground"
      style={{ fontFamily: 'var(--font-serif)' }}
    >
        
        {/* --- Game-Styled Header (Collapsible) --- */}
        <header className="relative px-8 md:px-8 lg:px-8 shrink-0 border-b border-border/50 bg-background z-20 transition-all duration-500 ease-out">
            {/* Bottom corner accents */}

            
            {/* Collapsed Header - Compact View */}
            {!isHeaderExpanded && (
              <div className="py-4">
                {/* Mobile Layout - Stacked */}
                <div className="md:hidden space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
                        <h1 className="text-lg font-light tracking-tight text-foreground truncate" style={{ fontFamily: 'var(--font-serif)' }}>
                          Your Collection
                        </h1>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-ui tracking-wide mt-1">
                        <span className="tabular-nums">{stats.total} cards</span>
                        <span className="w-1 h-1 rotate-45 bg-border/60" />
                        <span className="tabular-nums">{stats.learned} mastered</span>
                      </div>
                    </div>
                    
                    {/* Mobile Actions - Game Styled */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setCompactView(!compactView)}
                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 transition-all"
                        title={compactView ? "Expanded view" : "Compact view"}
                      >
                        {compactView ? <LayoutList size={16} strokeWidth={1.5} /> : <List size={16} strokeWidth={1.5} />}
                      </button>
                      <button 
                        onClick={() => setIsGenerateModalOpen(true)} 
                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-card border border-border/50 hover:border-border transition-all"
                        title="Generate cards"
                      >
                        <Sparkles size={16} strokeWidth={1.5} />
                      </button>
                      <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all"
                        title="Add card"
                      >
                        <Plus size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setIsHeaderExpanded(true)}
                        className="w-9 h-9 flex items-center justify-center text-muted-foreground/60 hover:text-foreground bg-card border border-border/50 hover:border-border transition-all"
                        aria-label="Expand header"
                      >
                        <ChevronDown size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Search - Game Styled */}
                  <div className="relative w-full group">
                    <Search 
                      size={14} 
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" 
                      strokeWidth={1.5}
                    />
                    <input 
                      type="text"
                      placeholder="Search..."
                      className="w-full bg-card/50 border border-border/60 py-2.5 pl-8 pr-8 text-sm font-light outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-card transition-all"
                      style={{ fontFamily: 'var(--font-sans)' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                      <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                      <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                    </span>
                    <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                      <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                      <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                    </span>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout - Single Row */}
                <div className="hidden md:flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <span className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
                    <h1 className="text-xl font-light tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                      Your Collection
                    </h1>
                    <span className="w-px h-4 bg-border/50" />
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-ui tracking-wide">
                      <span className="tabular-nums">{stats.total} cards</span>
                      <span className="w-1 h-1 rotate-45 bg-border/60" />
                      <span className="tabular-nums">{stats.learned} mastered</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search - Compact Game Styled */}
                    <div className="relative w-full max-w-xs group">
                      <Search 
                        size={14} 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" 
                        strokeWidth={1.5}
                      />
                      <input 
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-card/50 border border-border/60 py-2 pl-8 pr-8 text-sm font-light outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-card transition-all"
                        style={{ fontFamily: 'var(--font-sans)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>

                    {/* Compact Actions - Game Styled */}
                    <button 
                      onClick={() => setCompactView(!compactView)}
                      className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 transition-all"
                      title={compactView ? "Expanded view" : "Compact view"}
                    >
                      {compactView ? <LayoutList size={16} strokeWidth={1.5} /> : <List size={16} strokeWidth={1.5} />}
                    </button>
                    <button 
                      onClick={() => setIsGenerateModalOpen(true)} 
                      className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-card border border-border/50 hover:border-border transition-all"
                      title="Generate cards"
                    >
                      <Sparkles size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-all"
                      title="Add card"
                    >
                      <Plus size={16} strokeWidth={2} />
                    </button>

                    {/* Expand Button */}
                    <button
                      onClick={() => setIsHeaderExpanded(true)}
                      className="w-9 h-9 flex items-center justify-center text-muted-foreground/60 hover:text-foreground bg-card border border-border/50 hover:border-border transition-all"
                      aria-label="Expand header"
                    >
                      <ChevronDown size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Header - Full View */}
            {isHeaderExpanded && (
              <div className="pt-4 md:pt-4 pb-8">
                {/* Title Section with Game Accents */}
                <div className="mb-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-2 h-2 rotate-45 bg-primary/60" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-ui">
                          Card Collection
                        </p>
                        <span className="flex-1 max-w-[100px] h-px bg-gradient-to-r from-border/60 to-transparent" />
                      </div>
                      <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                        Your Collection
                      </h1>
                    </div>
                    
                    {/* Game-Styled Stats Panel */}
                    <div className="relative flex items-center gap-6 px-5 py-3 bg-card/60 border border-border/50">
                      {/* Corner decorations */}
                      <span className="absolute -top-px -left-px w-2.5 h-2.5 pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-2.5 h-2.5 pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl text-foreground font-light tabular-nums">{stats.total}</span>
                          <span className="text-xs text-muted-foreground font-ui tracking-wide">cards</span>
                        </div>
                      </div>
                      
                      <span className="w-px h-6 bg-border/50" />
                      
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary/60" strokeWidth={1.5} />
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl text-foreground font-light tabular-nums">{stats.learned}</span>
                          <span className="text-xs text-muted-foreground font-ui tracking-wide">mastered</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  

                </div>

                {/* Controls - Game Styled */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  {/* Search - Game Styled */}
                  <div className="relative w-full md:max-w-md group">
                    <div className="relative">
                      <Search 
                        size={18} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" 
                        strokeWidth={1.5}
                      />
                      <input 
                        type="text"
                        placeholder="Search your cards..."
                        className="w-full bg-card/50 border border-border/60 py-3.5 pl-10 pr-10 text-base font-light outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-card transition-all"
                        style={{ fontFamily: 'var(--font-sans)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {/* Corner accents on focus */}
                      <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                      </span>
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                      >
                        <X size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {/* Action Buttons - Game Styled */}
                  <div className="flex items-center md:gap-3 w-full md:w-auto justify-between md:justify-end">
                    <button 
                      onClick={() => setCompactView(!compactView)}
                      className={cn(
                        "relative group/btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                        "border border-border/60 bg-card/50 text-muted-foreground",
                        "hover:border-primary/50 hover:bg-card hover:text-foreground"
                      )}
                      title={compactView ? "Expanded view" : "Compact view"}
                    >
                      <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      {compactView ? <LayoutList size={14} strokeWidth={1.5} /> : <List size={14} strokeWidth={1.5} />}
                      <span className="hidden sm:inline">{compactView ? "Expanded" : "Compact"}</span>
                    </button>
                    <button 
                      onClick={() => setIsGenerateModalOpen(true)} 
                      className={cn(
                        "relative group/btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                        "border border-border/60 bg-card/50 text-muted-foreground",
                        "hover:border-primary/50 hover:bg-card hover:text-foreground"
                      )}
                    >
                      <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                      </span>
                      <Sparkles size={14} strokeWidth={1.5} />
                      <span className="hidden sm:inline">Generate</span>
                    </button>
                    <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className={cn(
                        "relative group/btn inline-flex items-center justify-center w-10 h-10 transition-all duration-200",
                        "border border-primary bg-primary/10 text-foreground",
                        "hover:bg-primary/30"
                      )}
                    >
                      <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-0.5 bg-foreground/50" />
                        <span className="absolute top-0 left-0 h-full w-0.5 bg-foreground/50" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-foreground/50" />
                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-foreground/50" />
                      </span>
                      <Plus size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collapse Toggle Button - Game Styled */}
            {isHeaderExpanded && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => setIsHeaderExpanded(false)}
                  className="relative w-8 h-8 flex items-center justify-center bg-background border border-border text-muted-foreground/60 hover:text-foreground hover:border-primary/50 transition-all duration-200 group"
                  aria-label="Collapse header"
                >
                  <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                    <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                  </span>
                  <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                    <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
                  </span>
                  <ChevronUp size={14} strokeWidth={2} />
                </button>
              </div>
            )}
        </header>

        {/* --- Main Content Area --- */}
        <div className="flex-1 min-h-0 flex flex-col relative bg-background">
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <GameLoader size="md" text="Loading" />
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
                    compactView={compactView}
                />
             )}
        </div>

        {/* --- Game-Styled Footer with Pagination --- */}
        <div className="relative px-8 md:px-16 lg:px-24 py-5 flex md:flex-col md:flex-row items-center justify-between border-t border-border/40 shrink-0 bg-background z-10 gap-4">
          {/* Decorative corner accents */}

          
          <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-sans)' }}>
            <div className="relative px-4 py-2 bg-card/60 border border-border/50">
              {/* Mini corner accents */}
              <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/40" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/40" />
              </span>
              <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.1em] font-ui">Page</span>
                <span className="text-xl font-light text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                  {page + 1}
                </span>
                <span className="text-sm text-muted-foreground/40 font-light">
                  / {totalPages}
                </span>
              </div>
            </div>
            <span className="hidden md:block w-1 h-1 rotate-45 bg-border/60" />
            <span className="hidden md:block text-xs text-muted-foreground/50 font-ui tracking-wide">
              {totalCount} total cards
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn(
                "relative group/btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                "border border-border/60 bg-card/50",
                "hover:border-primary/50 hover:bg-card",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-card/50"
              )}
            >
              {/* Hover corner accents */}
              <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
              </span>
              <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
              </span>
              <ChevronLeft size={14} strokeWidth={2} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => {
                if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                  setPage(p => p + 1);
                }
              }}
              disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
              className={cn(
                "relative group/btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                "border border-border/60 bg-card/50",
                "hover:border-primary/50 hover:bg-card",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-card/50"
              )}
            >
              {/* Hover corner accents */}
              <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
              </span>
              <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/50" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/50" />
              </span>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* --- Floating Selection Actions - Game Styled --- */}
        <div className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
          selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
          <div className="relative bg-card/95 border border-border px-8 py-5 flex items-center gap-6"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            {/* Corner decorations */}
            <span className="absolute -top-px -left-px w-4 h-4 pointer-events-none">
              <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
              <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
            </span>
            <span className="absolute -top-px -right-px w-4 h-4 pointer-events-none">
              <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
              <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
            </span>
            <span className="absolute -bottom-px -left-px w-4 h-4 pointer-events-none">
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
              <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
            </span>
            <span className="absolute -bottom-px -right-px w-4 h-4 pointer-events-none">
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
              <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
            </span>
            
            {/* Selection count */}
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-foreground tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                  {selectedIds.size}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-ui">
                  selected
                </span>
              </div>
            </div>
            
            {/* Decorative separator */}
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rotate-45 bg-border/60" />
              <span className="w-px h-8 bg-border/60" />
              <span className="w-1 h-1 rotate-45 bg-border/60" />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBatchPrioritize}
                className={cn(
                  "relative group/action inline-flex items-center gap-2 px-4 py-2 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                  "border border-amber-700/40 bg-amber-600/10 text-amber-600 dark:text-amber-400",
                  "hover:border-amber-700/60 hover:bg-amber-600/20"
                )}
              >
                <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-600/60" />
                  <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-600/60" />
                </span>
                <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-600/60" />
                  <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-600/60" />
                </span>
                <Zap size={14} strokeWidth={2} />
                Prioritize
              </button>
              <button 
                onClick={handleBatchDelete}
                className={cn(
                  "relative group/action inline-flex items-center gap-2 px-4 py-2 text-xs font-ui uppercase tracking-[0.1em] transition-all duration-200",
                  "border border-destructive/40 bg-destructive/10 text-destructive",
                  "hover:border-destructive/60 hover:bg-destructive/20"
                )}
              >
                <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute top-0 left-0 w-full h-0.5 bg-destructive/60" />
                  <span className="absolute top-0 left-0 h-full w-0.5 bg-destructive/60" />
                </span>
                <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-destructive/60" />
                  <span className="absolute bottom-0 right-0 h-full w-0.5 bg-destructive/60" />
                </span>
                <Trash2 size={14} strokeWidth={2} />
                Delete
              </button>
            </div>
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 w-8 h-8 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-card border border-transparent hover:border-border/50 transition-all"
              aria-label="Clear selection"
            >
              <X size={16} strokeWidth={2} />
            </button>
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
