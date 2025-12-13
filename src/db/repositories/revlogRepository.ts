import { db } from "@/db/dexie";
import { Revlog } from "@/db/types";
import { ReviewLog, Card, Grade } from "@/types";
import { State } from "ts-fsrs";
import { incrementStat } from "./aggregatedStatsRepository";
import { getCurrentUserId } from "./cardRepository";

const mapGradeToEase = (grade: Grade): number => {
  switch (grade) {
    case "Again":
      return 1;
    case "Hard":
      return 2;
    case "Good":
      return 3;
    case "Easy":
      return 4;
  }
};

const mapEaseToGrade = (ease: number): number => {
    switch (ease) {
        case 1: return 1;
        case 2: return 2;
        case 3: return 3;
        case 4: return 4;
        default: return 3;
    }
}

const mapStateToReviewType = (state: State): number => {
    switch (state) {
        case State.New: return 0;         case State.Learning: return 1;         case State.Review: return 2;         case State.Relearning: return 3;         default: return 0;     }
};

export const addReviewLog = async (
  card: Card,
  grade: Grade,
  _elapsedDays: number,
  scheduledDays: number,
) => {
  const userId = getCurrentUserId();
  const cid = parseInt(card.id);
  if (isNaN(cid)) return; 
  const now = Date.now();
  
        
  const entry: Revlog = {
    id: now,
    cid: cid,
    usn: -1,
    ease: mapGradeToEase(grade),
    ivl: scheduledDays,                 lastIvl: 0,     factor: card.easeFactor,
    time: 0,     type: mapStateToReviewType(card.state || State.New),
    user_id: userId || undefined,
  };

  await db.revlog.add(entry);

  await incrementStat(card.language || "polish", "total_xp", 10);
  await incrementStat(card.language || "polish", "total_reviews", 1);

  await incrementStat("global", "total_xp", 10);
  await incrementStat("global", "total_reviews", 1);
};

export const getAllReviewLogs = async (
  language?: string,
): Promise<ReviewLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let logs = await db.revlog.where("user_id").equals(userId).toArray();

  if (language) {
                const cards = await db.cards
       .where("[user_id+language]")
       .equals([userId, language])
       .toArray();
       
    const cardIdSet = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIdSet.has(log.cid));
  }
  
    logs.sort((a, b) => a.id - b.id);

  return logs.map((log) => ({
    id: log.id.toString(),     card_id: log.cid.toString(),
    grade: mapEaseToGrade(log.ease),
    state: log.type === 1 ? State.Review : (log.type === 2 ? State.Relearning : State.Learning),     elapsed_days: 0,     scheduled_days: log.ivl,
    stability: 0,
    difficulty: 0,
    created_at: new Date(log.id).toISOString(),
  }));
};

export const getReviewLogsForCard = async (
  cardId: string,
): Promise<ReviewLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cid = parseInt(cardId);
  if (isNaN(cid)) return [];

  const logs = await db.revlog
    .where("cid")     .equals(cid)
        .toArray();

  logs.sort((a, b) => a.id - b.id);

  return logs.map((log) => ({
    id: log.id.toString(),
    card_id: log.cid.toString(),
    grade: mapEaseToGrade(log.ease),
    state: log.type === 1 ? State.Review : (log.type === 2 ? State.Relearning : State.Learning),
    elapsed_days: 0,
    scheduled_days: log.ivl,
    stability: 0,
    difficulty: 0,
    created_at: new Date(log.id).toISOString(),
  }));
};
