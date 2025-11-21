import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { mapToCard } from '@/services/db/repositories/cardRepository';

export const useCardsQuery = (page = 0, pageSize = 50, searchTerm = '') => {
  const { settings } = useSettings();
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('cards')
        .select('*', { count: 'exact' })
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`target_sentence.ilike.%${searchTerm}%,native_translation.ilike.%${searchTerm}%`);
      }
      
      const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      return {
        data: (data ?? []).map(mapToCard),
        count: count ?? 0
      };
    },
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
  });
};