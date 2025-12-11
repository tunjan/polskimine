import { db } from "@/db/dexie";
import { AggregatedStat } from "@/db/types";
import { getCurrentUserId } from "./cardRepository";

export const getAggregatedStat = async (
  language: string,
  metric: string,
): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId) return 0;

  const id = `${userId}:${language}:${metric}`;
  const stat = await db.aggregated_stats.get(id);
  return stat?.value ?? 0;
};

export const incrementStat = async (
  language: string,
  metric: string,
  delta: number,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const id = `${userId}:${language}:${metric}`;

  
  const updated = await db.aggregated_stats
    .where("id")
    .equals(id)
    .modify((s) => {
      s.value += delta;
      s.updated_at = new Date().toISOString();
    });

  if (updated === 0) {
    try {
      await db.aggregated_stats.add({
        id,
        language,
        user_id: userId,
        metric,
        value: delta,
        updated_at: new Date().toISOString(),
      });
    } catch (e: any) {
      if (e.name === "ConstraintError") {
        
        await db.aggregated_stats
          .where("id")
          .equals(id)
          .modify((s) => {
            s.value += delta;
            s.updated_at = new Date().toISOString();
          });
      } else {
        throw e;
      }
    }
  }
};

export const bulkSetStats = async (
  stats: Array<{ language: string; metric: string; value: number }>,
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const records: AggregatedStat[] = stats.map((s) => ({
    id: `${userId}:${s.language}:${s.metric}`,
    language: s.language,
    user_id: userId,
    metric: s.metric,
    value: s.value,
    updated_at: new Date().toISOString(),
  }));

  await db.aggregated_stats.bulkPut(records);
};

export const recalculateAllStats = async (language?: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cards = language
    ? await db.cards
        .where("[user_id+language]")
        .equals([userId, language])
        .toArray()
    : await db.cards.where("user_id").equals(userId).toArray();

  const cardIds = new Set(cards.map((c) => c.id));

  let totalXp = 0;
  let totalReviews = 0;

  const logs = await db.revlog.where("user_id").equals(userId).toArray();
  logs.forEach((log) => {
    if (!language || cardIds.has(log.card_id)) {
      totalXp += 10;
      totalReviews++;
    }
  });

  const statsToWrite: Array<{
    language: string;
    metric: string;
    value: number;
  }> = [];
  const lang = language || "global";

  statsToWrite.push(
    { language: lang, metric: "total_xp", value: totalXp },
    { language: lang, metric: "total_reviews", value: totalReviews },
  );

  await bulkSetStats(statsToWrite);
};
