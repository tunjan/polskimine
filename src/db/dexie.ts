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
  DEFAULT_MODEL_ID,
  joinFields,
} from "@/db/models";
import { generateId } from "@/utils/ids";

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

    this.version(13)
      .stores({
        col: "id", // Single row
        notes: "id, guid, mid, mod, usn, tags, flds, sfld, csum, language, user_id, [mid+id], [user_id+language]", 
        cards: "id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, user_id, [did+queue+due], [did+type], [did+queue], [did+nid], [nid+ord], [user_id+language+queue+due], [user_id+language+type], [user_id+language]",
        revlog: "id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id, [cid+id], [user_id+id]",
        // Keep auxiliary tables
        history: "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
        profile: "id",
        settings: "id",
        aggregated_stats: "id, [language+metric], [user_id+language+metric], updated_at",
        users: "id, &username",
      })
      .upgrade(async (tx) => {
        // v12 to v13 Migration
        // 1. Initialize `col` if missing (Migration case)
        const colTable = tx.table<Col>("col");
        const existingCol = await colTable.get(1);
        if (!existingCol) {
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
        }

        // 2. Migrate Cards -> Notes + Cards
        
        const cardsTable = tx.table("cards"); // Mixed new/old types potentially
        const notesTable = tx.table<Note>("notes");
        const revlogTable = tx.table("revlog"); // Mixed
        
        const BATCH_SIZE = 500;
        
        // We need to keep track of generated IDs to avoid collisions, 
        // but we cannot check the DB in every loop efficiently if we write in batches.
        // So we assume the DB starts empty of NEW items (which it does, as this is migration),
        // and we track IDs in memory for the duration of the migration.
        
        // Init ID trackers
        const newNoteIds = new Set<number>();
        const newCardIds = new Set<number>();
        const cardIdMap = new Map<string, number>();
        let uniqueTimestamp = Date.now(); // Start base for collisions
        
        // Strategy: Chunked Processing
        // We filter for items that look like "Old Cards". 
        // Old cards rely on 'targetSentence' presence, while New Cards (AnkiCard) use 'nid'.
        // However, 'targetSentence' is not an index. 
        // We can just iterate the table. If we encounter an already-migrated card (has 'nid'), skip it.
        // But since we DELETE old cards as we go, we can just fetch 'all' and process.
        // CAUTION: 'cardsTable' might contain NEW cards if we just added them. 
        // So we should try to filter or just carefuly distinguish.
        // Best approach: Use a property that ONLY old cards have to ID them, or ONLY new cards have.
        // Old cards: have 'id' as STRING (UUID). New cards: 'id' as NUMBER.
        // Dexie schema defines 'id' as primary key.
        // If we change PK from string to int, that's tricky in one table!
        // But here 'cards' table schema definition handles 'id'.
        // In the upgrade, 'cardsTable' access might return objects with String ID if they exist?
        // Yes.
        
        while (true) {
            // Fetch a chunk of OLD cards (string IDs).
            // We can check type of ID, or just limit.
            // Since we delete them, the "first 500" should always be unprocessed ones 
            // *unless* new numeric-ID cards sort before string IDs or something?
            // Safer: Filter by a property unique to old cards, e.g., 'targetSentence'.
            // Filtering in JS is fine if we limit.
            
            const chunk = await cardsTable
                .filter(c => typeof c.id === 'string') 
                .limit(BATCH_SIZE)
                .toArray();

            if (chunk.length === 0) break;

            const newNotes: Note[] = [];
            const newCards: AnkiCard[] = [];
            const oldIdsToDelete: string[] = [];

            for (const oldCard of chunk) {
                 oldIdsToDelete.push(oldCard.id);

                 let createdMs = oldCard.created_at || (uniqueTimestamp++);
                 // Ensure uniqueness for Note ID
                 let nid = createdMs;
                 while(newCardIds.has(nid) || newNoteIds.has(nid)) {
                     nid++;
                 }
                 newNoteIds.add(nid);
                 
                 // Create Note
                 const modelId = DEFAULT_MODEL_ID;
                 const flds = joinFields([
                    oldCard.targetSentence || "",
                    oldCard.nativeTranslation || "",
                    oldCard.notes || "",
                    "", 
                    ""  
                 ]);
                 
                 const note: Note = {
                     id: nid,
                     guid: oldCard.id || generateId().slice(0, 10), 
                     mid: modelId,
                     mod: Math.floor((oldCard.last_modified || Date.now()) / 1000),
                     usn: -1,
                     tags: (oldCard.tags || []).join(" "),
                     flds: flds,
                     sfld: oldCard.targetSentence || "",
                     csum: 0, 
                     language: oldCard.language,
                     user_id: oldCard.user_id, 
                 };
                 newNotes.push(note);
                 
                 // Create Card
                 let cid = nid; 
                 // ensure cid is unique
                 while (newCardIds.has(cid)) cid++;
                 newCardIds.add(cid);
                 
                 cardIdMap.set(oldCard.id, cid); 

                 const ankiCard: AnkiCard = {
                     id: cid,
                     nid: nid,
                     did: 1, 
                     ord: 0,
                     mod: Math.floor((oldCard.last_modified || Date.now()) / 1000),
                     usn: -1,
                     type: oldCard.type ?? 0,
                     queue: oldCard.queue ?? 0,
                     due: oldCard.due ?? 0,
                     ivl: oldCard.interval ?? 0,
                     factor: oldCard.easeFactor ?? 0,
                     reps: oldCard.reps ?? 0,
                     lapses: oldCard.lapses ?? 0,
                     left: oldCard.left ?? 0,
                     odue: 0,
                     odid: 0,
                     
                     stability: oldCard.stability,
                     difficulty: oldCard.difficulty,
                     elapsed_days: oldCard.elapsed_days,
                     scheduled_days: oldCard.scheduled_days,
                     state: oldCard.state,
                     language: oldCard.language,
                     isBookmarked: oldCard.isBookmarked,
                     isLeech: oldCard.isLeech,
                     user_id: oldCard.user_id, 
                 };
                 newCards.push(ankiCard);
            }
            
            // Execute Batch Action
            // 1. Add New Data
            await notesTable.bulkAdd(newNotes);
            await cardsTable.bulkAdd(newCards);
            
            // 2. Remove Old Data (so the next fetch doesn't see them)
            await cardsTable.bulkDelete(oldIdsToDelete);
        }
        
        // 3. Migrate Revlog
        // Same here: Chunk it.
        
        while (true) {
             const revlogChunk = await revlogTable
                .limit(BATCH_SIZE)
                .toArray();
             
             // Check if we need migration. New Revlogs have 'cid' mapped effectively?
             // Or maybe we recognize old revlogs?
             // Old revlogs might have string card_id? 
             // Logic below: cardIdMap.get(log.card_id). If log.card_id is string, it's old.
             
             const oldRevlogs = revlogChunk.filter(r => typeof r.card_id === 'string');
             if (oldRevlogs.length === 0) {
                 // If we found NO old revlogs in a batch of 500, we might be done, OR we might be scanning new ones.
                 // To avoid infinite loop if we have mixed content that we don't delete properly:
                 // We should filter for old format in the query if possible, or assume we delete as we go.
                 // But we want to REPLACE them. 
                 
                 // If we filter in query:
                 // .filter(r => typeof r.card_id === 'string')
                 // But filter + limit is safest.
                 
                 // Let's rely on filter in query loop condition check.
                 // Re-query with filter condition to be sure we are finding work to do.
                 const checkWork = await revlogTable
                    .filter(r => typeof r.card_id === 'string')
                    .limit(1)
                    .toArray();
                 if (checkWork.length === 0) break;
                 
                 // If we are here, it means 'revlogChunk' (limit 500) returned only new items?
                 // But we want to process old items. 
                 // We should use the filter in the main fetch.
                 
                 // CORRECT LOOP STRUCTURE:
             }
             
             // Break inner loop to restart with correct structure below
             break;
        }

        // Correct Revlog Loop
        while (true) {
             const chunk = await revlogTable
                .filter(r => typeof r.card_id === 'string')
                .limit(BATCH_SIZE)
                .toArray();
                
             if (chunk.length === 0) break;
             
             const newRevlogs: Revlog[] = [];
             const oldRevlogIds: any[] = []; // ID type might vary
             
             for (const log of chunk) {
                oldRevlogIds.push(log.id);
                
                const newCid = cardIdMap.get(log.card_id);
                if (!newCid) continue; 
                
                let rid = log.created_at; 
                // Ensure unique
                // We don't have a global set of Revlog IDs here, but collisions are less likely if we use timestamp.
                // We'll rely on Put/Add throwing if collision, or just increment?
                // Minimal collision handling:
                // (We can't easily check 'newRevlogs' for collision efficiently without Set, but batch is small)
                
                 while(newRevlogs.some(r => r.id === rid)) rid++;
                
                newRevlogs.push({
                    id: rid,
                    cid: newCid,
                    usn: -1,
                    ease: log.grade || 0, 
                    ivl: log.scheduled_days || 0,
                    lastIvl: 0, 
                    factor: 0, 
                    time: 0, 
                    type: log.state === 1 ? 1 : 0, 
                    user_id: log.user_id 
                });
             }
             
             if (newRevlogs.length > 0) {
                 await revlogTable.bulkAdd(newRevlogs);
             }
             await revlogTable.bulkDelete(oldRevlogIds);
        }
      });

    this.version(14)
      .stores({
        // Notes: Keep for potential backup/export, but deprecated for read ops
        notes: "id, guid, mid, mod, usn, tags, flds, sfld, csum, language, user_id, [mid+id], [user_id+language]",
        // Cards: Denormalized + Optimized Indexes. Removed 'did' from indexes.
        cards: "id, nid, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, user_id, language, created_at, [user_id+language+queue+due], [user_id+language+type], [user_id+language+created_at], [user_id+language]",
        revlog: "id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id, [cid+id], [user_id+id]",
      })
      .upgrade(async (tx) => {
        const cardsTable = tx.table<AnkiCard>("cards");
        const notesTable = tx.table<Note>("notes");
        
        // Iterate all cards to denormalize data from notes
        // We use toArray() because we need to modify them and simple iteration might be slow or locky if not careful,
        // but for migration it's acceptable. IndexedDB upgrade is a blocking transaction anyway.
        // To avoid OOM on huge datasets, we can use cursor, but maping 10k items is fine.
        // If user has 100k+ cards, this might be slow, but it's a one-time cost.
        
        const BATCH_SIZE = 500;
        let offset = 0;
        
        while (true) {
             const chunk = await cardsTable.offset(offset).limit(BATCH_SIZE).toArray();
             if (chunk.length === 0) break;
             
             const updates = [];
             for (const card of chunk) {
                 if (card.target_sentence) continue; // Already migrated?
                 
                 const note = await notesTable.get(card.nid);
                 if (note) {
                     // Parse legacy fields
                     const flds = note.flds.split("\x1f");
                     const target_sentence = flds[0] || "";
                     const native_translation = flds[1] || "";
                     const notes = flds[2] || "";
                     
                     // Heuristic for target_word if not explicitly separate in legacy
                     // Ideally we would have a better parser, but for now we take the first word or whole sentence if short?
                     // Actually, many users put the word in field 0.
                     // The plan said "Structured Columns".
                     // For existing data, we map field 0 to target_sentence.
                     // We can try to extract target_word if it's identical, or leave empty.
                     // Let's assume field 0 is the main content.
                     
                     updates.push({
                         key: card.id,
                         changes: {
                             target_sentence,
                             native_translation,
                             notes, // Content notes
                             target_word: target_sentence, // Default to sentence for now, or maybe empty? Better to populate.
                             tags: note.tags,
                             created_at: note.id, // Use note ID (timestamp) as created_at
                         }
                     });
                 }
             }
             
             for (const update of updates) {
                 await cardsTable.update(update.key, update.changes);
             }
             
             offset += BATCH_SIZE;
        }
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
