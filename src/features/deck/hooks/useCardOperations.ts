import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types';
import {
  deleteCard as deleteCardFromRepo,
  saveCard,
  saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { useDeck } from '@/contexts/DeckContext';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

export const useCardOperations = (): CardOperations => {
  const { refreshDeckData } = useDeck();
  const queryClient = useQueryClient();

  const addCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card added successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to add card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const addCardsBatch = useCallback(
    async (cards: Card[]) => {
      try {
        await saveAllCards(cards);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${cards.length} cards added successfully`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to add cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const updateCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to update card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      try {
        await deleteCardFromRepo(id);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete card');
      }
    },
    [queryClient, refreshDeckData]
  );

  return { addCard, addCardsBatch, updateCard, deleteCard };
};