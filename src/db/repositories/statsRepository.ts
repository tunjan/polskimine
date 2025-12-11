import { getSRSDate } from "@/core/srs";
import { SRS_CONFIG } from "@/constants";
import { db } from "@/db/dexie";
import {
  differenceInCalendarDays,
  parseISO,
  addDays,
  format,
  subDays,
  startOfDay,
  parse,
} from "date-fns";
import { getDashboardCounts, getCurrentUserId } from "./cardRepository";
import { CardStatus } from "@/types/cardStatus";

export const getDashboardStats = async (
  language?: string,
  ignoreLearningSteps: boolean = false,
) => {
  const userId = getCurrentUserId();
  const counts = { new: 0, learning: 0, relearning: 0, review: 0, known: 0 };
  let languageXp = 0;

  if (language && userId) {
    const repoCounts = await getDashboardCounts(
      language as any,
      ignoreLearningSteps,
    );

    counts.new = repoCounts.new;
    counts.learning = repoCounts.learning;
    counts.relearning = repoCounts.relearning;
    counts.review = repoCounts.reviewDue;
    counts.known = repoCounts.known;

    const xpStat = await db.aggregated_stats.get(
      `${userId}:${language}:total_xp`,
    );
    languageXp = xpStat?.value ?? 0;
  } else if (language) {
    const [newCount, knownCount, learningCount] = await Promise.all([
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.NEW])
        .count(),
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.KNOWN])
        .count(),
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.LEARNING])
        .count(),
    ]);

    let review = 0;
    let implicitKnown = 0;

    await db.cards
      .where("[language+status]")
      .equals([language, CardStatus.REVIEW])
      .each((c) => {
        const interval = c.interval || 0;
        if (interval < 180) review++;
        else implicitKnown++;
      });

    counts.new = newCount;
    counts.learning = learningCount;
    counts.review = review;
    counts.known = knownCount + implicitKnown;

    const xpStat = await db.aggregated_stats
      .where({ language, metric: "total_xp" })
      .first();
    languageXp = xpStat?.value ?? 0;
  } else {
    const [newCount, knownCountByStatus, learningCount] = await Promise.all([
      db.cards.where("status").equals(CardStatus.NEW).count(),
      db.cards.where("status").equals(CardStatus.KNOWN).count(),
      db.cards.where("status").equals(CardStatus.LEARNING).count(),
    ]);

    let review = 0;
    let implicitKnown = 0;

    await db.cards
      .where("status")
      .equals(CardStatus.REVIEW)
      .each((c) => {
        const interval = c.interval || 0;
        if (interval < 180) review++;
        else implicitKnown++;
      });

    counts.new = newCount;
    counts.known = knownCountByStatus + implicitKnown;
    counts.learning = learningCount;
    counts.review = review;

    const globalXpStat = await db.aggregated_stats.get("global:total_xp");
    languageXp = globalXpStat?.value ?? 0;
  }

  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), "d"),
    fullDate: addDays(today, i).toISOString(),
    count: 0,
  }));

  const endDate = addDays(today, daysToShow);

  let query = db.cards
    .where("dueDate")
    .between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    query = query.filter((c) => c.language === language);
  }

  query = query.filter(
    (c) =>
      c.status !== CardStatus.NEW &&
      c.status !== CardStatus.KNOWN &&
      c.status !== CardStatus.SUSPENDED,
  );

  await query.each((card) => {
    if (!card.dueDate) return;
    const due = parseISO(card.dueDate);
    const diff = differenceInCalendarDays(due, today);
    if (diff >= 0 && diff < daysToShow) {
      forecast[diff].count++;
    }
  });

  const todayStats = await getTodayReviewStats(language);

  return { counts, forecast, languageXp, todayStats };
};

export const getStats = async (language?: string) => {
  if (language) {
    const counts = await getDashboardCounts(language as any);
    return {
      total: counts.total,
      due: counts.hueDue,
      learned: counts.review + counts.known,
    };
  }

  const now = new Date();
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);
  const cutoffIso = cutoffDate.toISOString();
  const nowISO = now.toISOString();
  const ONE_HOUR_IN_DAYS = 1 / 24;

  const total = await db.cards.count();
  const due = await db.cards
    .where("dueDate")
    .below(cutoffIso)
    .filter((c) => {
      if (c.status === CardStatus.KNOWN || c.status === CardStatus.SUSPENDED)
        return false;
      const isShortInterval = (c.interval || 0) < ONE_HOUR_IN_DAYS;
      if (isShortInterval) {
        return c.dueDate <= nowISO;
      }
      return true;
    })
    .count();
  const learned = await db.cards
    .where("status")
    .anyOf(CardStatus.REVIEW, CardStatus.KNOWN)
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

  const logs = await db.revlog
    .where("[user_id+created_at]")
    .between(
      [userId, rangeStart.toISOString()],
      [userId, rangeEnd.toISOString()],
      true,
      false,
    )
    .toArray();

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    const cardIds = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .primaryKeys();
    const cardIdSet = new Set(cardIds);

    logs.forEach((entry) => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    logs.forEach((entry) => {
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

  const cardIds = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .primaryKeys();
  const cardIdSet = new Set(cardIds);

  const logs = await db.revlog
    .where("[user_id+created_at]")
    .between([userId, startDateIso], [userId, "\uffff"], true, true)
    .filter((log) => cardIdSet.has(log.card_id))
    .toArray();

  const activityMap = new Map<
    string,
    { date: string; count: number; pass: number }
  >();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach((log) => {
    if (!log.created_at) return;

    const dateObj = new Date(log.created_at);
    if (isNaN(dateObj.getTime())) return;

    const dateKey = format(dateObj, "yyyy-MM-dd");
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++;
    }

    switch (log.grade) {
      case 1:
        gradeCounts.Again++;
        break;
      case 2:
        gradeCounts.Hard++;
        break;
      case 3:
        gradeCounts.Good++;
        break;
      case 4:
        gradeCounts.Easy++;
        break;
    }
  });

  const activityData = Array.from(activityMap.values());

  const retentionData = activityData.map((day) => {
    const dateObj = parse(day.date, "yyyy-MM-dd", new Date());
    return {
      date: format(dateObj, "MMM d"),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null,
    };
  });

  return {
    activity: activityData.map((d) => {
      const dateObj = parse(d.date, "yyyy-MM-dd", new Date());
      return { ...d, label: format(dateObj, "dd") };
    }),
    grades: [
      { name: "Again", value: gradeCounts.Again, color: "#ef4444" },
      { name: "Hard", value: gradeCounts.Hard, color: "#f97316" },
      { name: "Good", value: gradeCounts.Good, color: "#22c55e" },
      { name: "Easy", value: gradeCounts.Easy, color: "#3b82f6" },
    ],
    retention: retentionData,
  };
};
