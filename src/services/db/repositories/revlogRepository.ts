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
    state: card.state ?? State.New, 
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

  
  const { data, error } = await supabase
    .from('revlog')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  
  const logs = (data || []).filter(log => {
    if (cardIds && !cardIds.has(log.card_id)) return false;
    return true;
  });
  
  return logs as unknown as ReviewLog[];
};
