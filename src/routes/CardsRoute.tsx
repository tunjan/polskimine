import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles, X, Trash2, Zap, Search } from 'lucide-react';
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

// Minimalist Stat display
const StatMetric = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-0.5 md:gap-1 min-w-[60px] md:min-w-[80px]">
        <span className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">{label}</span>
        <span className="text-xl md:text-2xl font-light tracking-tighter tabular-nums leading-none">{value}</span>
    </div>
);

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
    // FIX: Use dvh for mobile to account for address bars. 
    // Subtract 10.5rem (mobile chrome + padding) and 6rem (desktop padding)
    <div className="flex flex-col h-[calc(100dvh-10.5rem)] md:h-[calc(100vh-6rem)] w-full max-w-[1600px] mx-auto animate-in fade-in duration-700 bg-background">
        
        {/* Header Section */}
        <header className="px-1 md:px-12 pt-2 md:pt-12 pb-4 md:pb-8 shrink-0 flex flex-col gap-6 md:gap-12">
            
            {/* Top Row: Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1 md:space-y-2">
                    <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-foreground" />
                         {settings.language} Database
                    </span>
                    <h1 className="text-3xl md:text-6xl font-light tracking-tighter text-foreground">
                        Index
                    </h1>
                </div>

                <div className="flex gap-6 md:gap-12 pb-1 border-t md:border-t-0 border-border/40 pt-4 md:pt-0">
                    <StatMetric label="Total" value={stats.total} />
                    <StatMetric label="Mastered" value={stats.learned} />
                    <StatMetric label="Active" value={stats.total - stats.learned} />
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6 border-b border-border/40 pb-4">
                {/* Search Input */}
                <div className="relative w-full md:max-w-sm">
                    <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search index..."
                        className="w-full bg-transparent border-none py-2 pl-6 pr-4 text-sm font-normal outline-none placeholder:text-muted-foreground/40 placeholder:uppercase placeholder:text-xs placeholder:tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-end">
                    <button 
                        onClick={() => setIsGenerateModalOpen(true)} 
                        className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Sparkles size={12} />
                        <span>AI Gen</span>
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                    >
                        <Plus size={12} />
                        <span>Add</span>
                    </button>
                </div>
            </div>
        </header>

        {/* List Area */}
        <div className="flex-1 min-h-0 flex flex-col relative px-0 md:px-6">
             {/* Table Headers - Hidden on mobile */}
             <div className="hidden md:flex items-center px-4 py-3 border-b border-border/40 shrink-0">
                <div className="w-12"></div>
                <div className="flex-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">Content</div>
                <div className="w-24 px-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">Status</div>
                <div className="w-24 px-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">Stats</div>
                <div className="w-32 px-4 text-right text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">Schedule</div>
                <div className="w-12"></div>
             </div>

             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="h-px w-12 bg-foreground" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Retrieving Data</span>
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

        {/* Footer / Pagination */}
        <div className="px-2 md:px-12 py-3 md:py-4 flex items-center justify-between border-t border-border/40 shrink-0 bg-background z-10">
            <div className="flex items-center gap-3 md:gap-4">
                 <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {totalCount} Records
                </span>
                <div className="h-3 w-px bg-border/60" />
                <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Pg {page + 1}
                </span>
            </div>
            
            <div className="flex gap-1">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-border hover:bg-secondary/20 disabled:opacity-20 transition-all"
                >
                    <ChevronLeft size={14} />
                </button>
                <button
                    onClick={() => {
                        if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                            setPage(p => p + 1);
                        }
                    }}
                    disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                    className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-border hover:bg-secondary/20 disabled:opacity-20 transition-all"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>

        {/* Floating Batch Actions Bar */}
        <div className={clsx(
            "absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ease-out w-[90%] md:w-auto",
            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
            <div className="bg-foreground text-background pl-6 pr-2 py-2 rounded-sm shadow-2xl flex items-center justify-between md:justify-start gap-4 md:gap-8">
                <span className="text-xs font-mono uppercase tracking-widest whitespace-nowrap">
                    {selectedIds.size} Selected
                </span>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleBatchPrioritize}
                        className="h-8 px-3 md:px-4 flex items-center gap-2 hover:bg-background/20 transition-colors text-xs font-mono uppercase tracking-wider rounded-sm"
                    >
                        <Zap size={12} /> <span className="hidden md:inline">Prioritize</span>
                    </button>
                    <button 
                        onClick={handleBatchDelete}
                        className="h-8 px-3 md:px-4 flex items-center gap-2 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors text-xs font-mono uppercase tracking-wider rounded-sm"
                    >
                        <Trash2 size={12} /> <span className="hidden md:inline">Delete</span>
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="w-8 h-8 flex items-center justify-center hover:bg-background/20 rounded-sm ml-2"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>

        {/* Modals */}
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