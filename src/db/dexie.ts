import Dexie, { Table } from "dexie";
import {
  LocalUser,
  LocalProfile,
  HistoryEntry,
  LocalSettings,
  AggregatedStat,
  Col,
  Note,
  AnkiCard,
  Revlog,
} from "@/db/types";
import {
  getDefaultModel,
  getDefaultDeck,
  getDefaultConf,
} from "@/db/models";

export class LinguaFlowDB extends Dexie {
  col!: Table<Col>;
  notes!: Table<Note>;
  cards!: Table<AnkiCard>;
  revlog!: Table<Revlog>;
  history!: Table<HistoryEntry>;
  profile!: Table<LocalProfile>;
  settings!: Table<LocalSettings>;
  aggregated_stats!: Table<AggregatedStat>;
  users!: Table<LocalUser>;
  constructor() {
    super("linguaflow-dexie");

    this.version(1).stores({
      // Core Tables (consolidated from v14)
      notes: "id, guid, mid, mod, usn, tags, flds, sfld, csum, language, user_id, [mid+id], [user_id+language]",
      cards: "id, nid, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, user_id, language, created_at, [user_id+language+queue+due], [user_id+language+type], [user_id+language+created_at], [user_id+language]",
      revlog: "id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id, [cid+id], [user_id+id]",
      
      // Auxiliary Tables (from prev versions)
      col: "id", 
      history: "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats: "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.on("populate", () => this.initializeCol());
    
    this.cards.hook("deleting", (primKey) => {
      // primKey is now number
      return this.revlog.where("cid").equals(primKey).delete();
    });
  }

  async initializeCol() {
    const colTable = this.col;
    try {
      // Check if already exists (paranoid check)
      const existing = await colTable.get(1);
      if (existing) return;

      const defaultModel = getDefaultModel();
      const defaultDeck = getDefaultDeck();
      const defaultConf = getDefaultConf();
      
      await colTable.add({
        id: 1,
        crt: Math.floor(Date.now() / 1000),
        mod: Date.now(),
        scm: -1, 
        ver: 1,
        conf: JSON.stringify(defaultConf),
        models: JSON.stringify({ [defaultModel.id]: defaultModel }),
        decks: JSON.stringify({ [defaultDeck.id]: defaultDeck }),
        dconf: JSON.stringify({ 1: { id: 1, name: "Default", ...defaultConf } }), 
        tags: "{}",
      });
    } catch (e) {
      console.error("Failed to initialize col", e);
    }
  }
}

export const db = new LinguaFlowDB();
