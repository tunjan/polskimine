import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/services/db/dexie';
import { mapToCard, getCurrentUserId } from '@/services/db/repositories/cardRepository';
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
  const settings = useSettingsStore(s => s.settings);
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return { data: [], count: 0 };

      // Use composite index for user+language
      let collection = db.cards
        .where('[user_id+language]')
        .equals([userId, language]);

      // Get total count before filtering (for pagination)
      let cards = await collection.toArray();

      // Apply search filter in memory (text search not indexable)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        cards = cards.filter(c =>
          c.targetSentence?.toLowerCase().includes(term) ||
          c.nativeTranslation?.toLowerCase().includes(term) ||
          c.targetWord?.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        cards = cards.filter(c => c.status === filters.status);
      }

      // Apply bookmarked filter
      if (filters.bookmarked) {
        cards = cards.filter(c => c.isBookmarked === true);
      }

      // Apply leech filter
      if (filters.leech) {
        cards = cards.filter(c => c.isLeech === true);
      }

      // Sort by dueDate descending
      cards.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

      const totalCount = cards.length;

      // Apply pagination
      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedCards = cards.slice(start, end);

      return {
        data: paginatedCards,
        count: totalCount
      };
    },
    placeholderData: keepPreviousData,
  });
};
