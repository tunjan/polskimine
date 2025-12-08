import Dexie from 'dexie';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/db/dexie';
import { getCurrentUserId } from '@/db/repositories/cardRepository';
import { CardStatus, Card } from '@/types';

export interface CardFilters {
  status?: CardStatus | 'all';
  bookmarked?: boolean;
  leech?: boolean;
}

export const useCardsQuery = (
  page = 0,
  pageSize = 50,
  searchTerm = '',
  filters: CardFilters = {}
) => {
  const language = useSettingsStore(s => s.language);

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return { data: [], count: 0 };

      let collection: Dexie.Collection<Card, string>;

            if (filters.leech) {
                collection = db.cards
          .where('[user_id+language+isLeech+dueDate]')
          .between(
            [userId, language, 1, Dexie.minKey],             [userId, language, 1, Dexie.maxKey],
            true, true
          )
          .reverse();
      }
            else if (filters.bookmarked) {
                collection = db.cards
          .where('[user_id+language+isBookmarked+dueDate]')
          .between(
            [userId, language, 1, Dexie.minKey],
            [userId, language, 1, Dexie.maxKey],
            true, true
          )
          .reverse();
      }
            else if (filters.status && filters.status !== 'all') {
                collection = db.cards
          .where('[user_id+language+status+dueDate]')
          .between(
            [userId, language, filters.status, Dexie.minKey],
            [userId, language, filters.status, Dexie.maxKey],
            true, true
          )
          .reverse();
      }
            else {
                collection = db.cards
          .where('[user_id+language+dueDate]')
          .between(
            [userId, language, Dexie.minKey],
            [userId, language, Dexie.maxKey],
            true, true
          )
          .reverse();
      }

                                          
      const requiresRefine = 
           (filters.leech && (filters.bookmarked || (filters.status && filters.status !== 'all'))) ||
           (filters.bookmarked && (filters.status && filters.status !== 'all'));

      if (requiresRefine || searchTerm) {
        collection = collection.filter(c => {
                                                    
                          if (filters.status && filters.status !== 'all' && c.status !== filters.status) return false;
             if (filters.bookmarked && !c.isBookmarked) return false;
             if (filters.leech && !c.isLeech) return false;

                          if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                  c.targetSentence?.toLowerCase().includes(term) ||
                  c.nativeTranslation?.toLowerCase().includes(term) ||
                  c.targetWord?.toLowerCase().includes(term) ||
                  c.notes?.toLowerCase().includes(term)
                );
             }
             return true;
        });
      }

      const totalCount = await collection.count();

      const start = page * pageSize;
      const paginatedCards = await collection
        .offset(start)
        .limit(pageSize)
        .toArray();

      return {
        data: paginatedCards,
        count: totalCount
      };
    },
    placeholderData: keepPreviousData,
  });
};
