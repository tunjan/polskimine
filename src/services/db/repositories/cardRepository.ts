import { Card } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { supabase } from '@/lib/supabase';

type Language = Card['language'];

const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User not logged in');
  }
  return userId;
};

export const mapToCard = (data: any): Card => ({
  id: data.id,
  targetSentence: data.target_sentence,
  targetWord: data.target_word || undefined,
  nativeTranslation: data.native_translation,
  furigana: data.furigana || undefined,
  notes: data.notes ?? '',
  tags: data.tags ?? undefined,
  language: data.language,
  status: data.status,
  interval: data.interval ?? 0,
  easeFactor: data.ease_factor ?? 2.5,
  dueDate: data.due_date,
  stability: data.stability ?? undefined,
  difficulty: data.difficulty ?? undefined,
  elapsed_days: data.elapsed_days ?? undefined,
  scheduled_days: data.scheduled_days ?? undefined,
  reps: data.reps ?? undefined,
  lapses: data.lapses ?? undefined,
  state: data.state ?? undefined,
  last_review: data.last_review ?? undefined,
  first_review: data.first_review ?? undefined,
  learningStep: data.learning_step ?? undefined,
  leechCount: data.leech_count ?? undefined,
  isLeech: data.is_leech ?? false,
});

const mapToDB = (card: Card, userId: string) => ({
  id: card.id,
  user_id: userId,
  target_sentence: card.targetSentence,
  target_word: card.targetWord ?? null,
  native_translation: card.nativeTranslation,
  furigana: card.furigana ?? null,
  notes: card.notes ?? '',
  language: card.language || 'polish',
  status: card.status,
  interval: card.interval ?? 0,
  ease_factor: card.easeFactor ?? 2.5,
  due_date: card.dueDate,
  stability: card.stability ?? 0,
  difficulty: card.difficulty ?? 0,
  elapsed_days: card.elapsed_days ?? 0,
  scheduled_days: card.scheduled_days ?? 0,
  reps: card.reps ?? 0,
  lapses: card.lapses ?? 0,
  state: card.state ?? null,
  last_review: card.last_review ?? null,
  first_review: card.first_review ?? null,
  learning_step: card.learningStep ?? null,
  leech_count: card.leechCount ?? 0,
  is_leech: card.isLeech ?? false,
  tags: card.tags ?? null,
});

export const getCards = async (): Promise<Card[]> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getAllCardsByLanguage = async (language: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const saveCard = async (card: Card) => {
  const userId = await ensureUser();
  const payload = mapToDB(card, userId);
  const { error } = await supabase.from('cards').upsert(payload);
  if (error) throw error;
};

export const deleteCard = async (id: string) => {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = await ensureUser();
  const payload = cards.map((card) => mapToDB(card, userId));
  const { error } = await supabase.from('cards').upsert(payload);
  if (error) throw error;
};

export const clearAllCards = async () => {
  const userId = await ensureUser();
  const { error } = await supabase.from('cards').delete().eq('user_id', userId);
  if (error) throw error;
};

export const getDueCards = async (now: Date = new Date(), language?: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  let query = supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'known')
    .lte('due_date', cutoffDate.toISOString())
    .order('due_date', { ascending: true });

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  let query = supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'known');

  if (language) {
    query = query.eq('language', language);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error } = await query.limit(Math.max(limit, 50));
  if (error) throw error;

  const cards = (data ?? []).map(mapToCard);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = await ensureUser();
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('language', language)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = await ensureUser();
  let query = supabase.from('cards').select('tags').eq('user_id', userId);
  
  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const uniqueTags = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.tags) {
      row.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};