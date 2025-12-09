import { useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/types";
import {
  deleteCard as deleteCardFromRepo,
  deleteCardsBatch as deleteCardsBatchFromRepo,
  saveCard,
  saveAllCards,
} from "@/db/repositories/cardRepository";
import { useDeckActions } from "@/hooks/useDeckActions";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { db } from "@/db/dexie";

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card, options?: { silent?: boolean }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCardsBatch: (ids: string[]) => Promise<void>;
  prioritizeCards: (ids: string[]) => Promise<void>;
}

export const useCardOperations = (): CardOperations => {
  const { refreshDeckData } = useDeckActions();
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);

  const addCard = useCallback(
    async (card: Card) => {
      const previousQueries = new Map();

      try {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["cards", language] })
          .forEach((query) => {
            previousQueries.set(
              JSON.stringify(query.queryKey),
              query.state.data,
            );
          });

        queryClient.setQueriesData(
          { queryKey: ["cards", language] },
          (old: any) => {
            if (!old) return old;
            if (old.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [card, ...old.data],
                count: old.count + 1,
              };
            }
            if (Array.isArray(old)) {
              return [card, ...old];
            }
            return old;
          },
        );

        await saveCard(card);

        queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", language],
        });

        toast.success("Card added successfully");
      } catch (error) {
        console.error(error);

        previousQueries.forEach((data, key) => {
          queryClient.setQueryData(JSON.parse(key), data);
        });

        queryClient.invalidateQueries({ queryKey: ["cards", language] });

        toast.error("Failed to add card");
      }
    },
    [queryClient, language],
  );

  const addCardsBatch = useCallback(
    async (cards: Card[]) => {
      const previousQueries = new Map();

      try {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["cards", language] })
          .forEach((query) => {
            previousQueries.set(
              JSON.stringify(query.queryKey),
              query.state.data,
            );
          });

        queryClient.setQueriesData(
          { queryKey: ["cards", language] },
          (old: any) => {
            if (!old) return old;
            if (old.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: [...cards, ...old.data],
                count: old.count + cards.length,
              };
            }
            if (Array.isArray(old)) {
              return [...cards, ...old];
            }
            return old;
          },
        );

        await saveAllCards(cards);

        queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", language],
        });

        toast.success(`${cards.length} cards added successfully`);
      } catch (error) {
        console.error(error);

        previousQueries.forEach((data, key) => {
          queryClient.setQueryData(JSON.parse(key), data);
        });

        queryClient.invalidateQueries({ queryKey: ["cards", language] });

        toast.error("Failed to add cards");
      }
    },
    [queryClient, language],
  );

  const updateCard = useCallback(
    async (card: Card, options?: { silent?: boolean }) => {
      const previousQueries = new Map();

      try {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["cards", language] })
          .forEach((query) => {
            previousQueries.set(
              JSON.stringify(query.queryKey),
              query.state.data,
            );
          });

        queryClient.setQueriesData(
          { queryKey: ["cards", language] },
          (old: any) => {
            if (!old) return old;
            if (old.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: old.data.map((c: Card) => (c.id === card.id ? card : c)),
              };
            }
            if (Array.isArray(old)) {
              return old.map((c: Card) => (c.id === card.id ? card : c));
            }
            return old;
          },
        );

        await saveCard(card);

        queryClient.invalidateQueries({ queryKey: ["deckStats", language] });

        if (!options?.silent) {
          toast.success("Card updated successfully");
        }
      } catch (error) {
        console.error(error);

        previousQueries.forEach((data, key) => {
          queryClient.setQueryData(JSON.parse(key), data);
        });

        queryClient.invalidateQueries({ queryKey: ["cards", language] });

        toast.error("Failed to update card");
      }
    },
    [queryClient, language],
  );

  const deleteCard = useCallback(
    async (id: string) => {
      const previousQueries = new Map();

      try {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["cards", language] })
          .forEach((query) => {
            previousQueries.set(
              JSON.stringify(query.queryKey),
              query.state.data,
            );
          });

        queryClient.setQueriesData(
          { queryKey: ["cards", language] },
          (old: any) => {
            if (!old) return old;
            if (old.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: old.data.filter((c: Card) => c.id !== id),
                count: old.count - 1,
              };
            }
            if (Array.isArray(old)) {
              return old.filter((c: Card) => c.id !== id);
            }
            return old;
          },
        );

        await deleteCardFromRepo(id);

        queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", language],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboardCards", language],
        });

        toast.success("Card deleted");
      } catch (error) {
        console.error(error);

        previousQueries.forEach((data, key) => {
          queryClient.setQueryData(JSON.parse(key), data);
        });

        queryClient.invalidateQueries({ queryKey: ["cards", language] });

        toast.error("Failed to delete card");
      }
    },
    [queryClient, language],
  );

  const deleteCardsBatch = useCallback(
    async (ids: string[]) => {
      const previousQueries = new Map();

      try {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["cards", language] })
          .forEach((query) => {
            previousQueries.set(
              JSON.stringify(query.queryKey),
              query.state.data,
            );
          });

        queryClient.setQueriesData(
          { queryKey: ["cards", language] },
          (old: any) => {
            if (!old) return old;
            if (old.data && Array.isArray(old.data)) {
              return {
                ...old,
                data: old.data.filter((c: Card) => !ids.includes(c.id)),
                count: old.count - ids.length,
              };
            }
            if (Array.isArray(old)) {
              return old.filter((c: Card) => !ids.includes(c.id));
            }
            return old;
          },
        );

        await deleteCardsBatchFromRepo(ids);

        queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", language],
        });
        queryClient.invalidateQueries({
          queryKey: ["dashboardCards", language],
        });

        toast.success(`${ids.length} cards deleted`);
      } catch (error) {
        console.error(error);

        previousQueries.forEach((data, key) => {
          queryClient.setQueryData(JSON.parse(key), data);
        });

        queryClient.invalidateQueries({ queryKey: ["cards", language] });

        toast.error("Failed to delete cards");
      }
    },
    [queryClient, language],
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {
        await db.cards
          .where("id")
          .anyOf(ids)
          .modify({ dueDate: new Date(0).toISOString() });

        await queryClient.invalidateQueries({ queryKey: ["cards", language] });
        await queryClient.invalidateQueries({
          queryKey: ["dueCards", language],
        });
        refreshDeckData();

        toast.success(
          `${ids.length} card${ids.length === 1 ? "" : "s"} moved to top of queue`,
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to prioritize cards");
      }
    },
    [queryClient, refreshDeckData, language],
  );

  return {
    addCard,
    addCardsBatch,
    updateCard,
    deleteCard,
    deleteCardsBatch,
    prioritizeCards,
  };
};
