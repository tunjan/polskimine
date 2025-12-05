import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { db } from '@/services/db/dexie';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, parse } from 'date-fns';

export const getDashboardStats = async (language?: string) => {
  // Get cards for the language
  let cards = await db.cards.toArray();

  if (language) {
    cards = cards.filter(c => c.language === language);
  }

  // Calculate counts client-side
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };

  cards.forEach((c) => {
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

  // Calculate forecast
  const daysToShow = 14;
  const today = new Date();
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  cards.forEach((card) => {
    if (card.status === 'known' || card.status === 'new') return;
    if (!card.dueDate) return;
    const dueDate = parseISO(card.dueDate);
    const diff = differenceInCalendarDays(dueDate, today);
    if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
  });

  // Calculate XP from review logs for this language
  let languageXp = 0;
  if (language) {
    const cardIds = new Set(cards.map(c => c.id));
    const logs = await db.revlog.toArray();
    languageXp = logs.filter(log => cardIds.has(log.card_id)).length * 10; // 10 XP per review
  }

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  let cards = await db.cards.toArray();

  if (language) {
    cards = cards.filter(c => c.language === language);
  }

  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const due = cards.filter(
    (card) => card.status !== 'known' && card.dueDate <= cutoffDate.toISOString()
  ).length;

  const learned = cards.filter((card) => card.status === 'graduated' || card.status === 'known').length;

  return { total: cards.length, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  // Get review logs for today
  const logs = await db.revlog
    .filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= rangeStart && logDate < rangeEnd;
    })
    .toArray();

  // If language filter, get card IDs for that language
  let filteredLogs = logs;
  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
    const cardIds = new Set(cards.map(c => c.id));
    filteredLogs = logs.filter(log => cardIds.has(log.card_id));
  }

  // Count new vs review (simplified - state 0 = new)
  let newCards = 0;
  let reviewCards = 0;

  filteredLogs.forEach((entry) => {
    if (entry.state === 0) {
      newCards++;
    } else {
      reviewCards++;
    }
  });

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const startDate = startOfDay(subDays(new Date(), days - 1));

  // Get cards for language
  const cards = await db.cards.where('language').equals(language).toArray();
  const cardIds = new Set(cards.map(c => c.id));

  // Get logs from start date, filtered by language cards
  const logs = await db.revlog
    .filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= startDate && cardIds.has(log.card_id);
    })
    .toArray();

  // Sort by date
  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Build activity data by day
  const activityMap = new Map<string, { date: string; count: number; pass: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach(log => {
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++; // Hard, Good, Easy = pass
    }

    // Count grades
    switch (log.grade) {
      case 1: gradeCounts.Again++; break;
      case 2: gradeCounts.Hard++; break;
      case 3: gradeCounts.Good++; break;
      case 4: gradeCounts.Easy++; break;
    }
  });

  const activityData = Array.from(activityMap.values());

  // Build retention data
  const retentionData = activityData.map((day) => {
    const dateObj = parse(day.date, 'yyyy-MM-dd', new Date());
    return {
      date: format(dateObj, 'MMM d'),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null
    };
  });

  return {
    activity: activityData.map((d) => {
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
