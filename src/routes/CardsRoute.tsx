import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Plus, Sparkles, Zap, X, Trash2 } from 'lucide-react';
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

const StatItem = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-xl font-light tracking-tight tabular-nums">{value}</span>
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
            if (shouldSelect) {
                idsInRange.forEach(rangeId => next.add(rangeId));
            } else {
                idsInRange.forEach(rangeId => next.delete(rangeId));
            }
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
    if (confirm(`Are you sure you want to delete ${selectedIds.size} cards?`)) {
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            await deleteCard(id);
        }
        setSelectedIds(new Set());
        toast.success("Deleted selected cards");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full animate-in fade-in duration-700 relative">
        
        {/* Compact Header Stats Section */}
        <div className="pt-4 pb-4 border-b border-border/40 mb-4 shrink-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {settings.language} Database
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                        Index
                    </h1>
                </div>

                <div className="flex gap-8 pr-2">
                    <StatItem label="Total" value={stats.total} />
                    <div className="w-px bg-border/40 h-8 self-center hidden sm:block" />
                    <StatItem label="Learned" value={stats.learned} />
                </div>
            </div>
        </div>

        {/* Compact Controls */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-end mb-3 px-1 shrink-0">
            <div className="relative w-full md:max-w-md group">
                <Search size={14} className="absolute left-0 top-3 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input 
                    type="text"
                    placeholder="Search sentence or translation..."
                    className="w-full bg-transparent border-b border-border/60 py-2 pl-6 text-sm font-light outline-none focus:border-foreground transition-all placeholder:text-muted-foreground/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setIsGenerateModalOpen(true)} 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border hover:border-foreground/50 hover:bg-secondary/20 transition-all text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                    <Sparkles size={12} />
                    <span>AI Gen</span>
                </button>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all text-[10px] font-mono uppercase tracking-widest"
                >
                    <Plus size={12} />
                    <span>New Entry</span>
                </button>
            </div>
        </div>

        {/* Table / List Area - Grows to fill space */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-border/40 relative">
             <div className="hidden md:flex items-center px-1 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 border-b border-border/40 shrink-0">
                <div className="w-10 flex justify-center"></div>
                <div className="flex-1">Content</div>
                <div className="w-20 mr-4">Status</div>
                <div className="w-20 mr-4">Progress</div>
                <div className="w-24 mr-4 text-right">Schedule</div>
                <div className="w-10 mr-2"></div>
             </div>

             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Loading Index...</span>
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

        {/* Compact Pagination */}
        <div className="py-2 flex items-center justify-between border-t border-border/40 mt-auto shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {totalCount} entries
            </span>
            
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Page {page + 1}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
                        className="p-1.5 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>

        {/* Batch Action Floating Bar */}
        <div className={clsx(
            "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300",
            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        )}>
            <div className="bg-foreground text-background px-4 py-2.5 rounded-full shadow-xl flex items-center gap-6">
                <div className="flex items-center gap-3 pl-2">
                    <div className="w-5 h-5 bg-background text-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedIds.size}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">Selected</span>
                </div>
                
                <div className="h-4 w-px bg-background/20" />
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBatchPrioritize}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-background/20 transition-colors text-xs font-mono uppercase tracking-wider"
                    >
                        <Zap size={14} /> Learn
                    </button>
                    <button 
                        onClick={handleBatchDelete}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors text-xs font-mono uppercase tracking-wider"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>

                <div className="h-4 w-px bg-background/20" />

                <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="p-1 hover:bg-background/20 rounded-full transition-colors"
                >
                    <X size={14} />
                </button>
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