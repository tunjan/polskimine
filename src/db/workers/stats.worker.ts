import { format, subDays } from "date-fns";

interface Log {
  created_at: string;
  grade: number;
  card_id: string;
}

interface ActivityWorkerInput {
  action: "calculate_activity";
  logs: Log[];
  days: number;
  cardIds: string[];
}

interface StreakWorkerInput {
  action: "calculate_streaks";
  history: Record<string, number>;
  todayStr: string;
  yesterdayStr: string;
}

type WorkerInput = ActivityWorkerInput | StreakWorkerInput;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const input = e.data;

  if (input.action === "calculate_activity") {
    const { logs, days, cardIds } = input;
    const cardIdSet = new Set(cardIds);

    const filteredLogs = logs.filter((log) => cardIdSet.has(log.card_id));

    const activityMap = new Map<
      string,
      { date: string; count: number; pass: number; fail: number }
    >();
    const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      activityMap.set(key, {
        date: key,
        count: 0,
        pass: 0,
        fail: 0,
      });
    }

    filteredLogs.forEach((log) => {
      const date = new Date(log.created_at);
      const key = format(date, "yyyy-MM-dd");

      if (activityMap.has(key)) {
        const entry = activityMap.get(key)!;
        entry.count++;
        if (log.grade === 1) {
          entry.fail++;
        } else {
          entry.pass++;
        }
      }

      if (log.grade === 1) gradeCounts.Again++;
      else if (log.grade === 2) gradeCounts.Hard++;
      else if (log.grade === 3) gradeCounts.Good++;
      else if (log.grade === 4) gradeCounts.Easy++;
    });

    const activityData = Array.from(activityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    self.postMessage({
      activityData,
      gradeCounts,
      totalReviews: filteredLogs.length,
    });
  } else if (input.action === "calculate_streaks") {
    const { history, todayStr, yesterdayStr } = input;

    if (!history || Object.keys(history).length === 0) {
      self.postMessage({
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0,
      });
      return;
    }

    const sortedDates = Object.keys(history).sort();

    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === "number" ? val : 0),
      0,
    );

    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    let currentStreak = 0;

    const hasToday = history[todayStr];
    const hasYesterday = history[yesterdayStr];

    if (hasToday || hasYesterday) {
      currentStreak = 1;

      const dateSet = new Set(sortedDates);

      const startDateStr = hasToday ? todayStr : yesterdayStr;
      let checkDate = new Date(startDateStr);
      checkDate.setDate(checkDate.getDate() - 1);

      const maxDays = Math.min(sortedDates.length, 3650);

      for (let i = 0; i < maxDays; i++) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, "0");
        const day = String(checkDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    self.postMessage({
      currentStreak,
      longestStreak,
      totalReviews,
    });
  }
};
