import { getSRSDate } from '@/core/srs';
import { SRS_CONFIG } from '@/constants';
import { db } from '@/db/dexie';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, parse } from 'date-fns';
import {
  getCardsForDashboard,
  getDashboardCounts,
  getDueCards,
  getCurrentUserId
} from './cardRepository';

export const getDashboardStats = async (language?: string) => {
  const userId = getCurrentUserId();
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  let languageXp = 0;

  if (language && userId) {
    // Use optimized composite index queries with user_id
    const [newCount, knownCount, learningCount, graduatedCount] = await Promise.all([
      db.cards.where('[user_id+language+status]').equals([userId, language, 'new']).count(),
      db.cards.where('[user_id+language+status]').equals([userId, language, 'known']).count(),
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 0], [language, 'review', 30], true, false)
        .filter(c => c.user_id === userId)
        .count(),
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 30], [language, 'review', 180], true, false)
        .filter(c => c.user_id === userId)
        .count(),
    ]);

    const xpStat = await db.aggregated_stats.get(`${userId}:${language}:total_xp`);
    languageXp = xpStat?.value ?? 0;

    const implicitKnownCount = await db.cards.where('[language+status+interval]')
      .aboveOrEqual([language, 'review', 180])
      .filter(c => c.user_id === userId)
      .count();

    counts.new = newCount;
    counts.learning = learningCount;
    counts.graduated = graduatedCount;
    counts.known = knownCount + implicitKnownCount;

  } else {

    const [newCount, knownCountByStatus] = await Promise.all([
      db.cards.where('status').equals('new').count(),
      db.cards.where('status').equals('known').count()
    ]);


    let learning = 0;
    let graduated = 0;
    let implicitKnown = 0;

    await db.cards.where('status').equals('review').each(c => {
      const interval = c.interval || 0;
      if (interval < 30) learning++;
      else if (interval < 180) graduated++;
      else implicitKnown++;
    });

    counts.new = newCount;
    counts.known = knownCountByStatus + implicitKnown;
    counts.learning = learning;
    counts.graduated = graduated;

    const globalXpStat = await db.aggregated_stats.get('global:total_xp');
    languageXp = globalXpStat?.value ?? 0;
  }

  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  const endDate = addDays(today, daysToShow);

  let query = db.cards.where('dueDate').between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    query = query.filter(c => c.language === language);
  }

  query = query.filter(c => c.status !== 'new' && c.status !== 'known');

  await query.each(card => {
    if (!card.dueDate) return;
    const due = parseISO(card.dueDate);
    const diff = differenceInCalendarDays(due, today);
    if (diff >= 0 && diff < daysToShow) {
      forecast[diff].count++;
    }
  });

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  if (language) {
    const counts = await getDashboardCounts(language as any);
    return {
      total: counts.total,
      due: counts.hueDue,
      learned: counts.learned
    };
  }


  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);
  const cutoffIso = cutoffDate.toISOString();

  const total = await db.cards.count();
  const due = await db.cards
    .where('dueDate').below(cutoffIso)
    .filter(c => c.status !== 'known')
    .count();
  const learned = await db.cards
    .where('status').anyOf('graduated', 'known')
    .count();

  return { total, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const userId = getCurrentUserId();
  if (!userId) return { newCards: 0, reviewCards: 0 };

  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  // Use user_id+created_at composite index for efficient filtering
  const logs = await db.revlog
    .where('[user_id+created_at]')
    .between(
      [userId, rangeStart.toISOString()],
      [userId, rangeEnd.toISOString()],
      true,
      false
    )
    .toArray();

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    // Get card IDs for this language using composite index
    const cardIds = await db.cards
      .where('[user_id+language]')
      .equals([userId, language])
      .primaryKeys();
    const cardIdSet = new Set(cardIds);

    logs.forEach(entry => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    logs.forEach(entry => {
      if (entry.state === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = getCurrentUserId();
  if (!userId) return { activity: [], grades: [], retention: [] };

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startDateIso = startDate.toISOString();

  // Use composite index for efficient user+language card lookup
  const cardIds = await db.cards
    .where('[user_id+language]')
    .equals([userId, language])
    .primaryKeys();
  const cardIdSet = new Set(cardIds);

  // Use composite index for user+created_at range query
  const logs = await db.revlog
    .where('[user_id+created_at]')
    .between([userId, startDateIso], [userId, '\uffff'], true, true)
    .filter(log => cardIdSet.has(log.card_id))
    .toArray();


  const activityMap = new Map<string, { date: string; count: number; pass: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach(log => {
    // Validate date string first
    if (!log.created_at) return;

    const dateObj = new Date(log.created_at);
    // distinct check for Invalid Date
    if (isNaN(dateObj.getTime())) return;

    const dateKey = format(dateObj, 'yyyy-MM-dd');
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++;
    }

    switch (log.grade) {
      case 1: gradeCounts.Again++; break;
      case 2: gradeCounts.Hard++; break;
      case 3: gradeCounts.Good++; break;
      case 4: gradeCounts.Easy++; break;
    }
  });

  const activityData = Array.from(activityMap.values());

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
