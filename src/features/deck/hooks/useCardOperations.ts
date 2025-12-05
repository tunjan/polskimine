import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types';
import {
  deleteCard as deleteCardFromRepo,
  deleteCardsBatch as deleteCardsBatchFromRepo,
  saveCard,
  saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { useDeck } from '@/contexts/DeckContext';
import { db } from '@/services/db/dexie';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card, options?: { silent?: boolean }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCardsBatch: (ids: string[]) => Promise<void>;
  prioritizeCards: (ids: string[]) => Promise<void>;
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
    async (card: Card, options?: { silent?: boolean }) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        if (!options?.silent) {
          toast.success('Card updated successfully');
        }
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

  const deleteCardsBatch = useCallback(
    async (ids: string[]) => {
      try {
        await deleteCardsBatchFromRepo(ids);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${ids.length} cards deleted`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {
        await db.cards
          .where('id')
          .anyOf(ids)
          .modify({ dueDate: new Date(0).toISOString() });

        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        await queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        refreshDeckData();
        toast.success(`${ids.length} card${ids.length === 1 ? '' : 's'} moved to top of queue`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to prioritize cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  return { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards };
};
