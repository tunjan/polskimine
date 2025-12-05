import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/services/db/dexie';
import { mapToCard } from '@/services/db/repositories/cardRepository';
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
      let cards = await db.cards
        .where('language')
        .equals(language)
        .toArray();

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

      cards.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedCards = cards.slice(start, end);

      return {
        data: paginatedCards,
        count: cards.length
      };
    },
    placeholderData: keepPreviousData,
  });
};
