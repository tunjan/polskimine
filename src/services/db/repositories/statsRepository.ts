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
  
  if (language) {
    const { data, error } = await supabase.rpc('get_dashboard_stats', { target_language: language });
    if (!error && data) {
      // Process forecast to match UI expectations
      const daysToShow = 14;
      const today = new Date();
      const forecastMap = new Map(
        (data.forecast || []).map((f: any) => [f.date, f.count])
      );

      const forecast = new Array(daysToShow).fill(0).map((_, i) => {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          day: format(date, 'd'),
          fullDate: date.toISOString(),
          count: forecastMap.get(dateStr) || 0
        };
      });

      return {
        counts: data.counts,
        forecast,
        languageXp: data.languageXp
      };
    }
    // Fallback to client-side calculation if RPC fails
    console.warn('RPC get_dashboard_stats failed or not found, falling back to client-side calculation', error);
  }

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

  
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  
  cards.forEach((c: any) => {
    
    if (c.status === 'new') {
      counts.new++;
      return;
    }

    
    if (c.status === 'known') {
      counts.known++;
      return;
    }

    
    const interval = c.interval || 0;

    if (interval < 30) {
      
      counts.learning++;
    } else if (interval < 180) {
      
      
      counts.graduated++;
    } else {
      
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

  
  
  const { data: cardsData, error: cardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .eq('language', language);

  if (cardsError) throw cardsError;
  const cardIds = new Set((cardsData ?? []).map(c => c.id));

  
  const { data: logsData, error } = await supabase
    .from('revlog')
    .select('created_at, grade, card_id')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  
  const { activityData, gradeCounts } = await new Promise<any>((resolve, reject) => {
    const worker = new Worker(new URL('../workers/stats.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (e) => {
      reject(e);
      worker.terminate();
    };
    worker.postMessage({
      logs: logsData ?? [],
      days,
      cardIds: Array.from(cardIds)
    });
  });

  
  const retentionData = activityData.map((day: any) => {
    const dateObj = parse(day.date, 'yyyy-MM-dd', new Date());
    return {
      date: format(dateObj, 'MMM d'),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null
    };
  });

  return {
    activity: activityData.map((d: any) => {
      const dateObj = parse(d.date, 'yyyy-MM-dd', new Date());
      return { ...d, label: format(dateObj, 'dd') };
    }),
    grades: [
      { name: 'Again', value: gradeCounts.Again, color: '#ef4444' }, 
      { name: 'Hard', value: gradeCounts.Hard, color: '#f97316' },  
      { name: 'Good', value: gradeCounts.Good, color: '#22c55e' },  
      { name: 'Easy', value: gradeCounts.Easy, color: '#3b82f6' },  
    ],
    retention: retentionData
  };
};