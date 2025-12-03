import { supabase } from '@/lib/supabase';
import { ReviewHistory } from '@/types';
import { format } from 'date-fns';

type Language = keyof ReviewHistory | string;

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // 1. Get card IDs for the language if specified
  let cardIds: Set<string> | null = null;
  if (language) {
    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('language', language);
    
    if (!cardsError && cardsData) {
      cardIds = new Set(cardsData.map(c => c.id));
    }
  }

  // 2. Get all revlogs for user
  const { data, error } = await supabase
    .from('revlog')
    .select('created_at, card_id')
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Failed to fetch history', error);
    return {};
  }

  // 3. Filter and aggregate
  return (data || []).reduce<ReviewHistory>((acc, entry) => {
    // If language is specified, check if card_id is in the set
    if (cardIds && !cardIds.has(entry.card_id)) {
      return acc;
    }

    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = 'polish'
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.rpc('increment_study_history', { 
    p_user_id: user.id, 
    p_date: date, 
    p_language: language, 
    p_delta: delta 
  });
  
  if (error) console.error('Failed to sync history', error);
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = 'polish') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    user_id: user.id,
    date,
    language,
    count
  }));

  if (entries.length === 0) return;

  const { error } = await supabase
    .from('study_history')
    .upsert(entries, { onConflict: 'user_id, date, language' });

  if (error) {
    console.error('Failed to save full history', error);
    throw error;
  }
};

export const clearHistory = async (language?: Language) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let query = supabase
    .from('study_history')
    .delete()
    .eq('user_id', user.id);

  if (language) {
    query = query.eq('language', language);
  }

  const { error } = await query;

  if (error) {
    console.error('Failed to clear history', error);
    throw error;
  }
};