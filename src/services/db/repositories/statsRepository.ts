import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { db } from '@/services/db/dexie';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, parse } from 'date-fns';
import {
  getCardsForDashboard,
  getDashboardCounts,
  getDueCards
} from './cardRepository';

export const getDashboardStats = async (language?: string) => {
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  let languageXp = 0;

  if (language) {
    // Parallelize independent queries for speed
    // We use the new [language+status+interval] index for range queries on learning/graduated
    // and [language+status] for exact matches on new/known.

    const [newCount, knownCount, learningCount, graduatedCount] = await Promise.all([
      // Count 'new' cards
      db.cards.where({ language, status: 'new' }).count(),

      // Count 'known' cards (explicit status)
      db.cards.where({ language, status: 'known' }).count(),

      // Count 'learning' (status != new/known AND interval < 30)
      // We approximate "learning" as cards in 'review' status with small intervals,
      // OR cards in actual 'learning' status (if that status exists in your logic).
      // Assuming 'review' status with interval < 30 covers the user's "learning" definition usually:
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 0], [language, 'review', 30], true, false)
        .count(),

      // Count 'graduated' (status != new/known AND 30 <= interval < 180)
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 30], [language, 'review', 180], true, false)
        .count(),
    ]);

    // XP Calculation optimization:
    // Instead of iterating entire revlog, read from aggregated_stats table
    const xpStat = await db.aggregated_stats.get(`${language}:total_xp`);
    languageXp = xpStat?.value ?? 0;

    // Note: 'known' might also include cards with interval >= 180 that aren't explicitly status='known' yet?
    // The user's original logic had:
    // else if (interval < 180) counts.graduated++;
    // else counts.known++;
    // This implies that cards with interval >= 180 are treated as known even if status is 'review'.
    const implicitKnownCount = await db.cards.where('[language+status+interval]')
      .aboveOrEqual([language, 'review', 180])
      .count();

    counts.new = newCount;
    counts.learning = learningCount;
    counts.graduated = graduatedCount;
    counts.known = knownCount + implicitKnownCount;

  } else {
    // No language filter - slightly less efficient but still better than loading all
    // We can iterate 'status' index.

    const [newCount, knownCountByStatus] = await Promise.all([
      db.cards.where('status').equals('new').count(),
      db.cards.where('status').equals('known').count()
    ]);

    // For learning/graduated/implicitKnown, we have to scan 'review' status cards
    // since we don't have a global [status+interval] index (only language-prefixed).
    // We can iterate the 'status' index for 'review' and count based on interval.
    // This is still better than `toArray()` because we only deserialize 'review' cards.

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

    // Global XP - read from aggregated_stats
    const globalXpStat = await db.aggregated_stats.get('global:total_xp');
    languageXp = globalXpStat?.value ?? 0;
  }

  // Calculate forecast (Optimized)
  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  const endDate = addDays(today, daysToShow);

  // Use dueDate index
  let query = db.cards.where('dueDate').between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    // Filter by language in JS (efficient since result set is small - only immediate due cards)
    query = query.filter(c => c.language === language);
  }

  // Final filter for status
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

  // Fallback for global stats (if needed, or just sum up)
  // For now, keeping old logic for global or creating a global aggregator if needed.
  // Assuming 'language' is always passed for deck stats.
  // If no language, use old slow method or implement global counter.

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
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);


  let logsCollection = db.revlog.where('created_at').between(
    rangeStart.toISOString(),
    rangeEnd.toISOString(),
    true,
    false
  );

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    const cardIds = await db.cards.where('language').equals(language).primaryKeys();
    const cardIdSet = new Set(cardIds);

    await logsCollection.each(entry => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    await logsCollection.each(entry => {
      if (entry.state === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startDateIso = startDate.toISOString();

  const cardIds = await db.cards.where('language').equals(language).primaryKeys();
  const cardIdSet = new Set(cardIds);


  const logs = await db.revlog
    .where('created_at').aboveOrEqual(startDateIso)
    .filter(log => cardIdSet.has(log.card_id))
    .toArray();


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
