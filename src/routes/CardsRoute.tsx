import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery } from '@/features/deck/hooks/useCardsQuery';

export const CardsRoute: React.FC = () => {
  const { settings } = useSettings();
  const { addCard, deleteCard } = useCardOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const { data, isLoading, isPlaceholderData } = useCardsQuery(page, pageSize, debouncedSearch);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsAddModalOpen(true);
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
  };

  const handleAddCard = (card: Card) => {
    addCard(card);
  };

  const handleBatchAddCards = async (newCards: Card[]) => {
    for (const card of newCards) {
        await addCard(card);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <h1 className="text-3xl font-light tracking-tight">Index</h1>
            <div className="flex gap-3">
                <button onClick={() => setIsGenerateModalOpen(true)} className="text-xs font-mono uppercase tracking-widest border border-border hover:border-foreground px-4 py-2 rounded-md transition-colors">
                    AI Gen
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-foreground text-background px-4 py-2 rounded-md text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity">
                    Add Entry
                </button>
            </div>
        </div>
        
        <div className="relative">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
                type="text"
                placeholder="Search your deck..."
                className="w-full bg-transparent border-b border-border py-3 pl-8 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50 font-light"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <CardList
            cards={cards}
            searchTerm="" // Search is handled by query now
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
          />
          
          <div className="flex items-center justify-between pt-4 pb-1 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              Showing {cards.length > 0 ? page * pageSize + 1 : 0} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded-md hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                    setPage(p => p + 1);
                  }
                }}
                disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                className="p-1 rounded-md hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingCard(undefined); }}
        onAdd={handleAddCard}
        initialCard={editingCard}
      />

      <GenerateCardsModal 
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={handleBatchAddCards}
      />
    </div>
  );
};