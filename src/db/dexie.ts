import Dexie, { Table } from "dexie";
import { Card } from "@/types";
import {
  LocalUser,
  LocalProfile,
  RevlogEntry,
  HistoryEntry,
  LocalSettings,
  AggregatedStat,
} from "@/db/types";

export class LinguaFlowDB extends Dexie {
  cards!: Table<Card>;
  revlog!: Table<RevlogEntry>;
  history!: Table<HistoryEntry>;
  profile!: Table<LocalProfile>;
  settings!: Table<LocalSettings>;
  aggregated_stats!: Table<AggregatedStat>;
  users!: Table<LocalUser>;
  constructor() {
    super("linguaflow-dexie");

    this.version(3)
      .stores({
        cards:
          "id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]",
        revlog: "id, card_id, created_at, [card_id+created_at]",
        history: "[date+language], date, language",
        profile: "id",
        settings: "id",
        aggregated_stats: "id, [language+metric], updated_at",
      })
      .upgrade(async (tx) => {
        const allCards = await tx.table<Card>("cards").toArray();
        const allRevlogs = await tx.table<RevlogEntry>("revlog").toArray();

        const cardLanguageMap = new Map<string, string>();
        for (const card of allCards) {
          if (card.language) {
            cardLanguageMap.set(card.id, card.language);
          }
        }

        const languageStats = new Map<
          string,
          { totalXp: number; totalReviews: number }
        >();

        for (const log of allRevlogs) {
          const language = cardLanguageMap.get(log.card_id);
          if (language) {
            if (!languageStats.has(language)) {
              languageStats.set(language, { totalXp: 0, totalReviews: 0 });
            }
            const stats = languageStats.get(language)!;
            stats.totalXp += 10;
            stats.totalReviews++;
          }
        }

        const statsToInsert: AggregatedStat[] = [];
        const now = new Date().toISOString();

        for (const [language, stats] of languageStats.entries()) {
          statsToInsert.push({
            id: `${language}:total_xp`,
            language: language || "unknown",
            metric: "total_xp",
            value: stats.totalXp,
            updated_at: now,
          });
          statsToInsert.push({
            id: `${language}:total_reviews`,
            language: language || "unknown",
            metric: "total_reviews",
            value: stats.totalReviews,
            updated_at: now,
          });
        }

        const globalXp = allRevlogs.length * 10;
        const globalReviews = allRevlogs.length;

        statsToInsert.push({
          id: "global:total_xp",
          language: "global",
          metric: "total_xp",
          value: globalXp,
          updated_at: now,
        });
        statsToInsert.push({
          id: "global:total_reviews",
          language: "global",
          metric: "total_reviews",
          value: globalReviews,
          updated_at: now,
        });

        if (statsToInsert.length > 0) {
          await tx
            .table<AggregatedStat>("aggregated_stats")
            .bulkAdd(statsToInsert);
        }
      });

    this.version(8).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, user_id, created_at, [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate], [user_id+language+status+dueDate], [user_id+language+isBookmarked+dueDate], [user_id+language+isLeech+dueDate]",
      revlog:
        "id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]",
      history:
        "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats:
        "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.version(9).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, user_id, created_at, first_review, [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate], [user_id+language+status+dueDate], [user_id+language+isBookmarked+dueDate], [user_id+language+isLeech+dueDate]",
      revlog:
        "id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]",
      history:
        "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats:
        "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.cards.hook("deleting", (primKey, obj) => {
      return this.revlog.where("card_id").equals(primKey).delete();
    });
  }
}

export const db = new LinguaFlowDB();
