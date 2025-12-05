import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { db } from '@/services/db/dexie';
import { mapToCard } from '@/services/db/repositories/cardRepository';

export const useCardsQuery = (page = 0, pageSize = 50, searchTerm = '') => {
  const { settings } = useSettings();
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm],
    queryFn: async () => {
      // Get all cards for language
      let cards = await db.cards
        .where('language')
        .equals(language)
        .toArray();

      // Simple search filter if searchTerm provided
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        cards = cards.filter(c =>
          c.targetSentence?.toLowerCase().includes(term) ||
          c.nativeTranslation?.toLowerCase().includes(term) ||
          c.targetWord?.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term)
        );
      }

      // Sort by dueDate descending (newest first)
      cards.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

      // Paginate
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
