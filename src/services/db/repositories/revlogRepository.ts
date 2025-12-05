import { db, generateId, RevlogEntry } from '@/services/db/dexie';
import { ReviewLog, Card, Grade } from '@/types';
import { State } from 'ts-fsrs';

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
  const entry: RevlogEntry = {
    id: generateId(),
    card_id: card.id,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  };

  await db.revlog.add(entry);
};

export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  // Get all review logs
  let logs = await db.revlog.toArray();

  // If language specified, filter by cards in that language
  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  // Sort by created_at ascending
  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return logs as unknown as ReviewLog[];
};
