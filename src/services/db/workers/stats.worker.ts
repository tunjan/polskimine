import { format, subDays } from 'date-fns';

interface Log {
  created_at: string;
  grade: number;
  card_id: string;
}

interface WorkerInput {
  logs: Log[];
  days: number;
  cardIds: string[];
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { logs, days, cardIds } = e.data;
  const cardIdSet = new Set(cardIds);

  // Filter logs
  const filteredLogs = logs.filter(log => cardIdSet.has(log.card_id));

  const activityMap = new Map<string, { date: string; count: number; pass: number; fail: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = subDays(now, i);
    const key = format(d, 'yyyy-MM-dd');
    activityMap.set(key, { 
      date: key, 
      count: 0, 
      pass: 0, 
      fail: 0 
    });
  }

  filteredLogs.forEach(log => {
    const date = new Date(log.created_at);
    const key = format(date, 'yyyy-MM-dd');
    
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
    a.date.localeCompare(b.date)
  );

  self.postMessage({
    activityData,
    gradeCounts,
    totalReviews: filteredLogs.length
  });
};
