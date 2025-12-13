import { getSRSDate } from "@/core/srs";
import { SRS_CONFIG } from "@/constants";
import { db } from "@/db/dexie";
import {
  addDays,
  format,
  subDays,
  startOfDay,
  parse,
} from "date-fns";
import { getDashboardCounts, getCurrentUserId } from "./cardRepository";




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
        const [newCount, reviewCount, learningCount, relearningCount] = await Promise.all([
      db.cards.where("[language+type]").equals([language, 0]).count(),       db.cards.where("[language+type]").equals([language, 2]).count(),       db.cards.where("[language+type]").equals([language, 1]).count(),       db.cards.where("[language+type]").equals([language, 3]).count(),     ]);

                    
        counts.new = newCount;
    counts.learning = learningCount;
    counts.relearning = relearningCount;
    counts.review = reviewCount;             
                
    let young = 0;
    let mature = 0;
    await db.cards
       .where("[language+type]")
       .equals([language, 2])
       .each(c => {
          if ((c.interval || 0) < 21) young++;           else mature++;
       });

    counts.review = young; 
    counts.known = mature;
    
        
    const xpStat = await db.aggregated_stats
      .where({ language, metric: "total_xp" })
      .first();
    languageXp = xpStat?.value ?? 0;
  } else {
        const [newCount, learningCount, relearningCount] = await Promise.all([
      db.cards.where("type").equals(0).count(),
      db.cards.where("type").equals(1).count(),
      db.cards.where("type").equals(3).count(),
    ]);
    
    let young = 0;
    let mature = 0;
    await db.cards.where("type").equals(2).each(c => {
       if ((c.interval || 0) < 21) young++;
       else mature++;
    });

    counts.new = newCount;
    counts.learning = learningCount;
    counts.relearning = relearningCount;
    counts.review = young;
    counts.known = mature;

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
        
  const todayDays = Math.floor(today.getTime() / (24 * 60 * 60 * 1000));
  const endDays = todayDays + daysToShow;
  
      
  const userIdFiltered = getCurrentUserId();
  
  if (language && userIdFiltered) {
          await db.cards
       .where("[user_id+language+queue+due]")
       .between(
         [userIdFiltered, language, 2, todayDays], 
         [userIdFiltered, language, 2, endDays], 
         true, false
       )
       .each(c => {
           const diff = c.due - todayDays;
           if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
       });
       
          await db.cards
       .where("[user_id+language+queue+due]")
       .between(
         [userIdFiltered, language, 3, todayDays], 
         [userIdFiltered, language, 3, endDays], 
         true, false
       )
       .each(c => {
           const diff = c.due - todayDays;
           if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
       });
  } else {
      const ranges = [
          { queue: 2, start: todayDays, end: endDays },
          { queue: 3, start: todayDays, end: endDays }
      ];

      for (const range of ranges) {
          
          
          
          
          
          await db.cards
            .where("[did+queue+due]")
            .between(
                [1, range.queue, range.start],
                [1, range.queue, range.end],
                true,
                false
            )
            .each(c => {
                 if (language && c.language !== language) return;
                 const diff = c.due - todayDays;
                 if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
            });
      }
  }

  const todayStats = await getTodayReviewStats(language);

  return { counts, forecast, languageXp, todayStats };
};

export const getStats = async (language?: string) => {
  if (language) {
    const counts = await getDashboardCounts(language as any);
    return {
      total: counts.total,
      due: counts.hueDue,
      learned: counts.review + counts.known,     };
  }

  const now = new Date();
    const total = await db.cards.count();
  
        const nowSeconds = Math.floor(now.getTime() / 1000);
  const nowDays = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  
  const due = await db.cards.filter(c => {
     if (c.queue < 0) return false;      if (c.queue === 1 && c.due <= nowSeconds) return true;
     if ((c.queue === 2 || c.queue === 3) && c.due <= nowDays) return true;
     return false;
  }).count();

        const learned = await db.cards
    .where("type")
    .equals(2) 
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
  
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();

        const logs = await db.revlog
    .where("[user_id+id]")
    .between(
      [userId, startMs],
      [userId, endMs],
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
      if (cardIdSet.has(entry.cid)) {
        if (entry.type === 0) newCards++;         else reviewCards++;
      }
    });
  } else {
    logs.forEach((entry) => {
      if (entry.type === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = getCurrentUserId();
  if (!userId) return { activity: [], grades: [], retention: [] };

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startMs = startDate.getTime();

  const cardIds = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .primaryKeys();
  const cardIdSet = new Set(cardIds);

  const logs = await db.revlog
    .where("[user_id+id]")
    .between([userId, startMs], [userId, Number.MAX_SAFE_INTEGER], true, true)
    .filter((log) => cardIdSet.has(log.cid))
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
        const dateObj = new Date(log.id);
    const dateKey = format(dateObj, "yyyy-MM-dd");
    const dayData = activityMap.get(dateKey);
    
                
    if (dayData) {
      dayData.count++;
      if (log.ease >= 2) dayData.pass++;
    }

    switch (log.ease) {
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
