import { db, generateId, RevlogEntry } from '@/db/dexie';
import { ReviewLog, Card, Grade } from '@/types';
import { State } from 'ts-fsrs';
import { incrementStat } from './aggregatedStatsRepository';
import { getCurrentUserId } from './cardRepository';

const mapGradeToNumber = (grade: Grade): number => {
  switch (grade) {
    case 'Again': return 1;
    case 'Hard': return 2;
    case 'Good': return 3;
    case 'Easy': return 4;
  }
};

export const addReviewLog = async (
  card: Card,
  grade: Grade,
  elapsedDays: number,
  scheduledDays: number
) => {
  const userId = getCurrentUserId();

  const entry: RevlogEntry = {
    id: generateId(),
    card_id: card.id,
    user_id: userId || undefined,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  };

  await db.revlog.add(entry);

  await incrementStat(card.language || 'polish', 'total_xp', 10);
  await incrementStat(card.language || 'polish', 'total_reviews', 1);

  await incrementStat('global', 'total_xp', 10);
  await incrementStat('global', 'total_reviews', 1);
};


export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let logs = await db.revlog
    .where('user_id')
    .equals(userId)
    .toArray();

  if (language) {
    const cards = await db.cards
      .where('language')
      .equals(language)
      .filter(c => c.user_id === userId)
      .toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Explicitly map RevlogEntry to ReviewLog (removing user_id, converting state to number)
  return logs.map(log => ({
    id: log.id,
    card_id: log.card_id,
    grade: log.grade,
    state: typeof log.state === 'number' ? log.state : log.state,
    elapsed_days: log.elapsed_days,
    scheduled_days: log.scheduled_days,
    stability: log.stability,
    difficulty: log.difficulty,
    created_at: log.created_at,
  }));
};

