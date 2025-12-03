import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { supabase } from '@/lib/supabase';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, isSameDay, parse } from 'date-fns';

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
  // Added 'interval' to the selection
  let query = supabase
    .from('cards')
    .select('status, due_date, interval')
    .eq('user_id', userId);

  if (language) {
    query = query.eq('language', language);
  }

  const { data: cardsData, error: cardsError } = await query;
  if (cardsError) throw cardsError;

  const cards = cardsData ?? [];

  let languageXp = 0;
  if (language) {
    const { data: xpData, error: xpError } = await supabase.rpc('get_user_language_xp', {
      target_language: language
    });
    if (!xpError && typeof xpData === 'number') {
      languageXp = xpData;
    }
  }

  // New Bucketing Logic
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  
  cards.forEach((c: any) => {
    // 1. Unseen: Not yet reviewed
    if (c.status === 'new') {
      counts.new++;
      return;
    }

    // 2. Explicitly Known (Manually archived)
    if (c.status === 'known') {
      counts.known++;
      return;
    }

    // 3. Bucket by Interval
    const interval = c.interval || 0;

    if (interval < 30) {
      // Learning: < 30 days
      counts.learning++;
    } else if (interval < 180) {
      // Mature: 30 - 180 days
      // We map this to 'graduated' key which corresponds to 'Mature' label in UI
      counts.graduated++;
    } else {
      // Known: > 180 days
      counts.known++;
    }
  });

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

  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

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

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = await ensureUser();
  const startDate = startOfDay(subDays(new Date(), days - 1)).toISOString();

  // 1. Get card IDs for the language to filter logs manually
  // This avoids issues with inner joins if the foreign key relationship is not perfectly inferred
  const { data: cardsData, error: cardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .eq('language', language);

  if (cardsError) throw cardsError;
  const cardIds = new Set((cardsData ?? []).map(c => c.id));

  // 2. Get logs for the user in date range
  const { data: logsData, error } = await supabase
    .from('revlog')
    .select('created_at, grade, card_id')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // 3. Filter logs in memory
  const logs = (logsData ?? []).filter(log => cardIds.has(log.card_id));

  // Process Data for Charts
  const activityMap = new Map<string, { date: string; count: number; pass: number; fail: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
  
  // Initialize last 30 days with 0
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    activityMap.set(key, { 
      date: key, 
      count: 0, 
      pass: 0, 
      fail: 0 
    });
  }

  logs.forEach((log: any) => {
    const dayKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    const entry = activityMap.get(dayKey);
    
    if (entry) {
      entry.count++;
      // Grade 1 = Fail, 2,3,4 = Pass
      if (log.grade === 1) entry.fail++;
      else entry.pass++;
    }

    if (log.grade === 1) gradeCounts.Again++;
    else if (log.grade === 2) gradeCounts.Hard++;
    else if (log.grade === 3) gradeCounts.Good++;
    else if (log.grade === 4) gradeCounts.Easy++;
  });

  // Sort by date ascending
  const activityData = Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate Retention Rate
  const retentionData = activityData.map(day => {
    const dateObj = parse(day.date, 'yyyy-MM-dd', new Date());
    return {
      date: format(dateObj, 'MMM d'),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null
    };
  });

  return {
    activity: activityData.map(d => {
      const dateObj = parse(d.date, 'yyyy-MM-dd', new Date());
      return { ...d, label: format(dateObj, 'dd') };
    }),
    grades: [
      { name: 'Again', value: gradeCounts.Again, color: '#ef4444' }, // red-500
      { name: 'Hard', value: gradeCounts.Hard, color: '#f97316' },  // orange-500
      { name: 'Good', value: gradeCounts.Good, color: '#22c55e' },  // green-500
      { name: 'Easy', value: gradeCounts.Easy, color: '#3b82f6' },  // blue-500
    ],
    retention: retentionData
  };
};