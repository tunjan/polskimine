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
    <div className="flex flex-col gap-6 md:gap-8" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Index</h2>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setIsGenerateModalOpen(true)} 
                className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary hover:opacity-80 transition-opacity px-3 py-1.5 rounded-full bg-primary/10"
            >
                <Sparkles size={14} /> 
                <span>AI Generator</span>
            </button>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
            type="text"
            placeholder="Filter entries..."
            className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 pl-6 text-sm outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-300"
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
          
          <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              Showing {cards.length > 0 ? page * pageSize + 1 : 0} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
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
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
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