import { supabase } from '@/lib/supabase';
import { ReviewHistory } from '@/types';

type Language = keyof ReviewHistory | string;

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  let query = supabase
    .from('study_history')
    .select('date, count, language')
    .eq('user_id', user.id);

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch history', error);
    return {};
  }

  return (data || []).reduce<ReviewHistory>((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.count;
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