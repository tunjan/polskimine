import json
import uuid
import time
import sys
from datetime import datetime

# Utility to generate integer IDs from UUIDs or sequences
# Anki IDs are typically timestamps (milliseconds). We will simulate this.
# To ensure uniqueness, we can use a base timestamp and increment.
current_timestamp_ms = int(time.time() * 1000)
id_counter = 0

def generate_id():
    global id_counter
    # Use a fixed base to start to make it look like valid timestamps but unique
    # Starting from 2023-01-01 for generated IDs if needed, but better to follow creation time if available
    base = 1672531200000 
    id_counter += 1
    return base + id_counter

def uuid_to_int(uuid_str):
    """Deterministically convert UUID to a large integer (within 53 bits for JS safety if needed, 
    but Anki uses 64-bit int logic, though JS Numbers are doubles. 
    Safe integer in JS is 2^53 - 1. Timestamps fit in this."""
    # We will just map UUIDs to new Integer IDs and keep a dictionary.
    # We don't need to hash it, just assign a new ID.
    pass

uuid_map = {}
def get_int_id(uuid_str):
    if uuid_str not in uuid_map:
        uuid_map[uuid_str] = generate_id()
    return uuid_map[uuid_str]

def convert_timestamp(iso_str):
    if not iso_str:
        return 0
    try:
        dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
        return int(dt.timestamp() * 1000)
    except ValueError:
        return 0

def migrate(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    dexie_export = {
        "formatName": "dexie",
        "formatVersion": 1,
        "data": {
            "databaseName": "linguaflow-dexie",
            "databaseVersion": 1,
            "tables": [],
            "data": []
        }
    }

    # Prepare data containers
    notes = []
    cards = []
    revlogs = []
    history = []
    aggregated_stats = []
    
    # Defaults
    default_mid = 1001 # Random Model ID
    default_did = 1    # Default Deck ID
    user_id = "user_default" 
    
    table_data = {
        "notes": [],
        "cards": [],
        "revlog": [],
        "history": [],
        "aggregated_stats": [],
        "settings": [],
        "profile": [],
        "col": []
    }

    # 1. Process Cards and Notes
    print(f"Processing {len(data.get('cards', []))} cards...")
    for card in data.get('cards', []):
        original_id = card.get('id')
        # We try to use 'created_at' for ID if possible to preserve ordering, else generate
        created_at_ts = convert_timestamp(card.get('created_at')) or generate_id()
        
        # Ensure ID uniqueness (simple collision handling)
        while created_at_ts in [c['id'] for c in table_data['cards']] or created_at_ts in [n['id'] for n in table_data['notes']]:
             created_at_ts += 1
        
        new_card_id = created_at_ts
        new_note_id = created_at_ts # One-to-one mapping for simplicity
        
        uuid_map[original_id] = new_card_id

        # Note Field
        note = {
            "id": new_note_id,
            "guid": original_id, # Keep UUID in guid
            "mid": default_mid,
            "mod": convert_timestamp(card.get('lastSynced')) // 1000 or int(time.time()),
            "usn": -1,
            "tags": "",
            "flds": "", # Could serialize fields here if needed, but we have denormalized fields in Card for v14
            "sfld": card.get('targetSentence', ''),
            "csum": 0,
            "language": card.get('language'),
            "user_id": user_id
        }
        table_data['notes'].append(note)

        # Card Field
        # Map status/state
        # FSRS status: New=0, Learning=1, Review=2, Relearning=3
        # Input status: "review", "new", etc.
        status_map = {"new": 0, "learning": 1, "review": 2, "relearning": 3}
        queue_map = {"new": 0, "learning": 1, "review": 2, "suspended": -1, "buried": -2}
        
        state_val = card.get('state', 0)
        # Verify state matches status if possible, otherwise rely on 'state' from JSON which seems to be FSRS state
        
        anki_card = {
            "id": new_card_id,
            "nid": new_note_id,
            "did": default_did,
            "ord": 0,
            "mod": convert_timestamp(card.get('lastSynced')) // 1000 or int(time.time()),
            "usn": -1,
            "type": state_val, # Using state as type/queue approx
            "queue": state_val if state_val != 0 else 0, # New cards queue 0
            "due": convert_timestamp(card.get('dueDate', '')) // 1000 or 0, # Due date in seconds? Anki uses days for review, timestamp for learning?
            # Warning: Anki 'due' is somewhat complex. 
            # Review cards: due = days since creation? Or absolute days?
            # v3 scheduler: due is an absolute timestamp (seconds) for learning, days for review.
            # We will perform a simplification: store timestamp for everything to be safe or check status.
            # If status == 2 (Review), due is typically days. 
            # However, looking at dexie.ts/types.ts, it doesn't specify. 
            # We'll stick to the input 'dueDate' timestamp for now, but convert to appropriate format if needed.
            # Let's use milliseconds? No, Anki typically uses seconds.
            "ivl": card.get('interval', 0),
            "factor": int(card.get('easeFactor', 2.5) * 1000),
            "reps": card.get('reps', 0),
            "lapses": card.get('lapses', 0),
            "left": 0,
            "odue": 0,
            "odid": 0,
            
            # FSRS fields being ported directly
            "stability": card.get('stability'),
            "difficulty": card.get('difficulty'),
            "elapsed_days": card.get('elapsed_days'),
            "scheduled_days": card.get('scheduled_days'),
            "state": state_val,
            
            "language": card.get('language'),
            "isBookmarked": card.get('isBookmarked', False),
            "isLeech": card.get('isLeech', False),
            "user_id": user_id,
            
            # Denormalized
            "target_sentence": card.get('targetSentence'),
            "native_translation": card.get('nativeTranslation'),
            "notes": card.get('notes'),
            "target_word": card.get('targetWord'),
            "target_word_translation": card.get('targetWordTranslation'),
            "target_word_part_of_speech": card.get('targetWordPartOfSpeech'),
            "tags": "",
            "created_at": created_at_ts
        }
        
        # Adjust 'due' based on state
        # If 'review' (2), due is often days since collection creation. 
        # But if the app uses full timestamps in 'dueDate', we should probably stick to that or convert.
        # Let's use the timestampSeconds from dueDate.
        if card.get('dueDate'):
             anki_card['due'] = convert_timestamp(card.get('dueDate')) // 1000

        table_data['cards'].append(anki_card)

    # 2. Process Revlog
    print(f"Processing {len(data.get('revlog', []))} logs...")
    history_tracker = {} # (date, language) -> count

    for log in data.get('revlog', []):
        cid = uuid_map.get(log.get('card_id'))
        if not cid:
            # Card might have been deleted but log remains? Skip or mock.
            continue
            
        lid = generate_id()
        # Ensure unique revlog ID
        while lid in [r['id'] for r in table_data['revlog']]:
            lid += 1
            
        created_at = convert_timestamp(log.get('created_at'))
        
        revlog_entry = {
            "id": lid,
            "cid": cid,
            "usn": -1,
            "ease": log.get('grade', 0), # button pressed
            "ivl": 0, # Not in input revlog prominently, maybe scheduled_days?
            "lastIvl": 0,
            "factor": 0,
            "time": 0, # Time taken (ms) - not in input
            "type": log.get('state', 0), # New/Lrn/Rev
            "user_id": user_id,
            # Extra fields if schema allows, check types.ts. Dexie schema has:
            # id, cid, usn, ease, ivl, lastIvl, factor, time, type, user_id
            # It seems 'created_at' is used as 'id' in Anki revlogs which is the timestamp.
            # So 'id' already captures time.
        }
        # Overwrite id with actual creation time if available to fix ordering
        if created_at:
             revlog_entry['id'] = created_at
             
        table_data['revlog'].append(revlog_entry)

        # 3. Build History from Revlog
        # To support Heatmap: need count of reviews per day per language.
        # We need the language of the card.
        # Find card language
        card_lang = next((c['language'] for c in table_data['cards'] if c['id'] == cid), None)
        if card_lang:
            # Format date as YYYY-MM-DD
            date_str = datetime.fromtimestamp(revlog_entry['id'] / 1000).strftime('%Y-%m-%d')
            key = (date_str, card_lang)
            history_tracker[key] = history_tracker.get(key, 0) + 1

    # Convert History Tracker to List
    print(f"Generating history entries...")
    for (date_str, lang), count in history_tracker.items():
        table_data['history'].append({
            "date": date_str,
            "language": lang,
            "user_id": user_id,
            "count": count,
            # Composite keys are handled by Dexie stores, just provide fields
        })

    # 4. Settings & Profile
    print("Migrating settings and profile...")
    if 'profile' in data:
        p = data['profile']
        table_data['profile'].append({
            "id": p.get('id', 'default'),
            "username": "User", # Placeholder
            "xp": p.get('xp', 0),
            "points": p.get('points', 0),
            "level": p.get('level', 1),
            "language_level": p.get('language_level', 'A1'),
            "initial_deck_generated": p.get('initial_deck_generated', False),
            "created_at": p.get('created_at'),
            "updated_at": p.get('updated_at')
        })

    if 'settings' in data:
        s = data['settings']
        table_data['settings'].append({
            "id": "global_settings", # Or specific ID if needed
            "geminiApiKey": s.get('geminiApiKey'),
            "googleTtsApiKey": s.get('tts', {}).get('googleApiKey', '') if s.get('tts') else '',
             # ... copy other fields as needed
        })
        
    if 'aggregatedStats' in data:
        for stat in data['aggregatedStats']:
            table_data['aggregated_stats'].append({
                "id": stat.get('id', str(uuid.uuid4())),
                "language": stat.get('language'),
                "metric": stat.get('metric'),
                "value": stat.get('value'),
                "updated_at": stat.get('updated_at'),
                 "user_id": user_id
            })

    # 5. Col (Collection) - Required for Dexie initialization check
    table_data['col'].append({
        "id": 1,
        "crt": int(time.time()),
        "mod": int(time.time()),
        "scm": int(time.time()),
        "ver": 1,
        "conf": "{}",
        "models": "{}",
        "decks": "{}",
        "dconf": "{}",
        "tags": "{}"
    })

    # Final Assembly
    data_list = []
    for table_name, rows in table_data.items():
        data_list.append({
            "tableName": table_name,
            "inbound": True,
            "rows": rows
        })
    
    dexie_export['data']['data'] = data_list
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dexie_export, f, indent=2, ensure_ascii=False)
    
    print(f"Migration complete. Output saved to {output_file}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python migrate_db.py <input_json> <output_json>")
    else:
        migrate(sys.argv[1], sys.argv[2])
