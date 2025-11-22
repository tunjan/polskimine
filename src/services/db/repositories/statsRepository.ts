import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { supabase } from '@/lib/supabase';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User not logged in');
  }
  return userId;
};

export const getDashboardStats = async (language?: string) => {
  const userId = await ensureUser();
  let query = supabase
    .from('cards')
    .select('status, due_date')
    .eq('user_id', userId);

  if (language) {
    query = query.eq('language', language);
  }

  const { data: cardsData, error: cardsError } = await query;
  if (cardsError) throw cardsError;

  const cards = cardsData ?? [];

  // Language specific XP via RPC (returns 0 if no language or no data)
  let languageXp = 0;
  if (language) {
    const { data: xpData, error: xpError } = await supabase.rpc('get_user_language_xp', {
      target_language: language
    });
    if (!xpError && typeof xpData === 'number') {
      languageXp = xpData;
    }
  }

  // Metrics
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  cards.forEach((c: any) => {
    const status = c.status as keyof typeof counts;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  // Forecast
  const daysToShow = 14;
  const today = new Date();
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  cards.forEach((card: any) => {
    if (card.status === 'known' || card.status === 'new') return;
    const dueDate = parseISO(card.due_date);
    const diff = differenceInCalendarDays(dueDate, today);
    if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
  });

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  const userId = await ensureUser();
  let query = supabase
    .from('cards')
    .select('status, due_date, language')
    .eq('user_id', userId);

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cards = data ?? [];
  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  const due = cards.filter(
    (card) => card.status !== 'known' && card.due_date <= cutoffDate.toISOString()
  ).length;
  const learned = cards.filter((card) => card.status === 'graduated' || card.status === 'known').length;

  return { total: cards.length, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const userId = await ensureUser();
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  let query = supabase
    .from('activity_log')
    .select('activity_type, language')
    .eq('user_id', userId)
    .gte('created_at', rangeStart.toISOString())
    .lt('created_at', rangeEnd.toISOString());

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  let newCards = 0;
  let reviewCards = 0;

  (data ?? []).forEach((entry) => {
    if (entry.activity_type === 'new_card') {
      newCards++;
    } else {
      reviewCards++;
    }
  });

  return { newCards, reviewCards };
};