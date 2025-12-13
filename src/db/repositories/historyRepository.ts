import { db } from "@/db/dexie";
import { ReviewHistory, Language, LanguageId } from "@/types";
import { format } from "date-fns";
import { getCurrentUserId } from "./cardRepository";

export const getHistory = async (
  language?: Language,
): Promise<ReviewHistory> => {
  const userId = getCurrentUserId();
  if (!userId) return {};

  let entries;
  if (language) {
    entries = await db.history
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();
  } else {
    // If no language specified, we need to aggregate counts per date across all languages?
    // Or just return all entries?
    // ReviewHistory is Record<string, count>.
    // If we have multiple languages for same date, we sum them.
    entries = await db.history.where("user_id").equals(userId).toArray();
  }

  return entries.reduce<ReviewHistory>((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.count;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = LanguageId.Polish,
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const updated = await db.history
    .where("[user_id+date+language]")
    .equals([userId, date, language])
    .modify((h) => {
      h.count += delta;
    });

  if (updated === 0) {
    try {
      await db.history.add({
        date,
        language,
        user_id: userId,
        count: delta,
      });
    } catch (e: any) {
      if (e.name === "ConstraintError") {
        await db.history
          .where("[user_id+date+language]")
          .equals([userId, date, language])
          .modify((h) => {
            h.count += delta;
          });
      } else {
        throw e;
      }
    }
  }
};

export const saveFullHistory = async (
  history: ReviewHistory,
  language: Language = LanguageId.Polish,
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    user_id: userId,
    count: typeof count === "number" ? count : 0,
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  if (language) {
    const historyToDelete = await db.history
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  } else {
    const historyToDelete = await db.history
      .where("user_id")
      .equals(userId)
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  }
};
