import Dexie from 'dexie';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/db/dexie';
import { getCurrentUserId } from '@/db/repositories/cardRepository';
import { CardStatus } from '@/types';

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
  const language = useSettingsStore(s => s.settings.language);

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return { data: [], count: 0 };

      // Use composite index for user+language+dueDate for automatic sorting
      // We scan the index range for this user/language
      let collection = db.cards
        .where('[user_id+language+dueDate]')
        .between(
          [userId, language, Dexie.minKey],
          [userId, language, Dexie.maxKey],
          true,
          true
        )
        .reverse(); // Descending order by dueDate

      // Apply filtering (Dexie executes this lazily during iteration/counting)
      // This avoids loading all objects into an array first
      if (searchTerm || (filters.status && filters.status !== 'all') || filters.bookmarked || filters.leech) {
        collection = collection.filter(c => {
          // Status filter
          if (filters.status && filters.status !== 'all' && c.status !== filters.status) {
            return false;
          }

          // Bookmarked filter
          if (filters.bookmarked && !c.isBookmarked) {
            return false;
          }

          // Leech filter
          if (filters.leech && !c.isLeech) {
            return false;
          }

          // Search filter
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

      // Get count of matching items (scans index/data as needed but doesn't hold all in RAM)
      const totalCount = await collection.count();

      // Get paginated data
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
