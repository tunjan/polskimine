import { supabase } from '@/lib/supabase';
import { ReviewLog, Card, Grade } from '@/types';
import { State } from 'ts-fsrs';

const mapGradeToNumber = (grade: Grade): number => {
  switch (grade) {
    case 'Again': return 1;
    case 'Hard': return 2;
    case 'Good': return 3;
    case 'Easy': return 4;
  }
};

export const addReviewLog = async (
  card: Card, 
  grade: Grade, 
  elapsedDays: number,
  scheduledDays: number
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('revlog').insert({
    user_id: user.id,
    card_id: card.id,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New, // State BEFORE review
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  });

  if (error) console.error('Failed to log review:', error);
};

export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // We need to filter by language. 
  // Since revlog doesn't have a language column (normalization), 
  // we join with cards.
  
  let query = supabase
    .from('revlog')
    .select('*, cards!inner(language)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }); // Time-series order is crucial

  if (language) {
    query = query.eq('cards.language', language);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data as unknown as ReviewLog[];
};
