
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dexie from "dexie";
import { AnkiCard, Note } from "@/db/types";
import { DEFAULT_MODEL_ID, joinFields } from "@/db/models";

// Mock Data
const MOCK_NOTE: Note = {
    id: 100,
    guid: "abc",
    mid: DEFAULT_MODEL_ID,
    mod: 123,
    usn: -1,
    tags: "tag1",
    flds: "Target Sentence\x1fTranslation\x1fNote Content\x1f\x1f",
    sfld: "Target Sentence",
    csum: 0,
    language: "pol",
    user_id: "user1"
};

const MOCK_CARD: AnkiCard = {
    id: 200,
    nid: 100,
    did: 1,
    ord: 0,
    mod: 123,
    usn: -1,
    type: 0,
    queue: 0,
    due: 0,
    ivl: 0,
    factor: 0,
    reps: 0,
    lapses: 0,
    left: 0,
    odue: 0,
    odid: 0,
    language: "pol",
    user_id: "user1"
};

describe("Database Migration v13 -> v14", () => {
    let db: any;

    afterEach(async () => {
        if (db) {
            await db.delete();
            db = null;
        }
    });

    it("should migrate split cards/notes to denormalized cards", async () => {
        // 1. Setup V13 DB
        const dbName = "TestDB_Migration_v13_v14";
        await Dexie.delete(dbName);
        
        db = new Dexie(dbName);
        db.version(13).stores({
            col: "id",
            notes: "id, guid, mid, mod, usn, tags, flds, sfld, csum, language, user_id, [mid+id], [user_id+language]",
            cards: "id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, user_id, [did+queue+due], [did+type], [did+queue], [did+nid], [nid+ord], [user_id+language+queue+due], [user_id+language+type], [user_id+language]",
            revlog: "id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id, [cid+id], [user_id+id]"
        });

        await db.open();
        await db.notes.add(MOCK_NOTE);
        await db.cards.add(MOCK_CARD);
        console.log("Seeded V13 Data");
        db.close();

        // 2. Open as V14 (Trigger Migration)
        db = new Dexie(dbName);
        
        // Define V14 Schema (Proposed)
        db.version(14).stores({
            col: "id",
            // Notes kept but deprecated for reads if desired, or just used for export
            notes: "id", 
            // Cards denormalized. Removed 'did'. Added content fields.
            cards: "id, nid, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, user_id, language, created_at, [user_id+language+queue+due], [user_id+language+type], [user_id+language+created_at]",
            revlog: "id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id, [cid+id], [user_id+id]"
        }).upgrade(async (tx: any) => {
            const cardsTable = tx.table("cards");
            const notesTable = tx.table("notes");
            
            // We need to fetch all cards and join with notes
            // Since we can't do complex joins in upgrade easily across tables if they are not loaded, 
            // but Dexie upgrade transaction allows accessing existing data.
            
            // Note: In a real upgrade, we iterate cards.
            const allCards = await cardsTable.toArray();
            const corrections = [];
            
            for (const card of allCards) {
                const note = await notesTable.get(card.nid);
                if (note) {
                   const flds = note.flds.split("\x1f");
                   corrections.push({
                       key: card.id,
                       changes: {
                           target_sentence: flds[0] || "",
                           native_translation: flds[1] || "",
                           notes: flds[2] || "",
                           target_word: flds[0].split(" ")[0], // Simple heuristic for test
                           tags: note.tags,
                           // Remove did logic if implicit
                       }
                   });
                }
            }
            
            // Apply bulk updates
            for (const correction of corrections) {
                await cardsTable.update(correction.key, correction.changes);
            }
        });

        await db.open();

        // 3. Verify
        const migratedCard = await db.cards.get(200);
        expect(migratedCard).toBeDefined();
        expect(migratedCard.target_sentence).toBe("Target Sentence");
        expect(migratedCard.native_translation).toBe("Translation");
        expect(migratedCard.notes).toBe("Note Content");
        expect(migratedCard).toHaveProperty("did"); // It still exists on the object unless deleted, but indexes changed.
        
        console.log("Migration Success:", migratedCard);
    });
});
