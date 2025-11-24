import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
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
    if (confirm(`Irreversibly delete ${selectedIds.size} cards?`)) {
        const ids = Array.from(selectedIds);
        for (const id of ids) await deleteCard(id);
        setSelectedIds(new Set());
        toast.success("Deleted selected cards");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen w-full bg-background text-foreground animate-in fade-in duration-700">
        
        {/* --- Header: The Command Center --- */}
        <header className="px-6 md:px-12 pt-8 md:pt-12 pb-6 shrink-0 flex flex-col gap-8 bg-background z-20">
            
            {/* Top Row: Title & System Info */}
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                        Index <span className="text-zinc-300 dark:text-zinc-700 font-extralight">/</span> {settings.language}
                    </h1>
                </div>

                {/* Minimalist Data Display */}
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>CNT: <strong className="text-foreground font-medium">{stats.total}</strong></span>
                    <span className="text-zinc-300">|</span>
                    <span>MST: <strong className="text-foreground font-medium">{stats.learned}</strong></span>
                    <span className="text-zinc-300">|</span>
                    <span>ACT: <strong className="text-foreground font-medium">{stats.total - stats.learned}</strong></span>
                </div>
            </div>

            {/* Controls Row: Inputs over Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                {/* Search: Underlined, no box */}
                <div className="relative w-full md:max-w-md group">
                    <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-foreground transition-colors" />
                    <input 
                        type="text"
                        placeholder="FILTER DATABASE..."
                        className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 py-3 pl-6 pr-4 text-sm font-mono outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 placeholder:text-[10px] placeholder:tracking-widest focus:border-foreground transition-colors rounded-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Actions: Text Links */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-end pb-2">
                    <button 
                        onClick={() => setIsGenerateModalOpen(true)} 
                        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Generate
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="text-[10px] font-mono uppercase tracking-widest text-foreground border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                    >
                        Add Entry
                    </button>
                </div>
            </div>
        </header>

        {/* --- List Header (Sticky) --- */}
        <div className="hidden md:flex items-center px-6 md:px-12 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="w-10"></div> {/* Checkbox spacer */}
            <div className="flex-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400">Content</div>
            <div className="w-32 px-4 text-[9px] font-mono uppercase tracking-widest text-zinc-400">Status</div>
            <div className="w-20 px-4 text-right text-[9px] font-mono uppercase tracking-widest text-zinc-400">Reps</div>
            <div className="w-32 px-4 text-right text-[9px] font-mono uppercase tracking-widest text-zinc-400">Schedule</div>
            <div className="w-12"></div> {/* Action spacer */}
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 min-h-0 flex flex-col relative px-0 md:px-12 bg-background">
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 animate-pulse">Loading Index</span>
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

        {/* --- Footer / Pagination --- */}
        <div className="px-6 md:px-12 py-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-background z-10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                {page + 1} <span className="text-zinc-200 dark:text-zinc-700">/</span> {Math.ceil(totalCount / pageSize)}
            </span>
            
            <div className="flex gap-4">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                    Prev
                </button>
                <button
                    onClick={() => {
                        if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                            setPage(p => p + 1);
                        }
                    }}
                    disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>

        {/* --- Floating Action Bar (Batch Operations) --- */}
        <div className={clsx(
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
            <div className="bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-6 py-3 shadow-2xl flex items-center gap-8">
                <span className="text-[10px] font-mono uppercase tracking-widest">
                    {selectedIds.size} Selected
                </span>
                
                <div className="flex items-center gap-6 h-full border-l border-zinc-700 dark:border-zinc-200 pl-6">
                    <button 
                        onClick={handleBatchPrioritize}
                        className="text-[10px] font-mono uppercase tracking-widest hover:text-white dark:hover:text-black transition-colors"
                    >
                        Prioritize
                    </button>
                    <button 
                        onClick={handleBatchDelete}
                        className="text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                    >
                        Delete
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
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