import { UserSettings } from "@/types";
import { State } from "ts-fsrs";

export interface LocalUser {
  id: string;
  username: string;
  passwordHash: string;
  created_at: string;
}

export interface LocalProfile {
  id: string;
  username: string;
  xp: number;
  points: number;
  level: number;
  language_level?: string;
  initial_deck_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevlogEntry {
  id: string;
  card_id: string;
  user_id?: string;
  grade: number;
  state: State;
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: number;
}

export interface HistoryEntry {
  date: string;
  language: string;
  user_id?: string;
  count: number;
}

export type LocalSettings = Partial<UserSettings> & {
  id: string;
  geminiApiKey?: string;
  googleTtsApiKey?: string;
  azureTtsApiKey?: string;
  azureRegion?: string;
  deviceId?: string;
  syncPath?: string;
  lastSync?: string;
};

export interface AggregatedStat {
  id: string;
  language: string;
  user_id?: string;
  metric: string;
  value: number;
  updated_at: string;
}

export interface Col {
  id: number;   crt: number;   mod: number;   scm: number;   ver: number;   conf: string;   models: string;   decks: string;   dconf: string;   tags: string; }

export interface Note {
  id: number;   guid: string;
  mid: number;   mod: number;   usn: number;   tags: string;   flds: string;   sfld: string;   csum: number;     language?: string;   user_id?: string;
}

export interface AnkiCard {
  id: number;   nid: number;   did: number;   ord: number;   mod: number;   usn: number;

  type: number;   queue: number;   due: number;   ivl: number;   factor: number;   reps: number;
  lapses: number;
  left: number;   odue: number;   odid: number;   
  interval?: number;
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  state?: number;   
    language?: string;
  isBookmarked?: boolean;
  isLeech?: boolean;
  user_id?: string;

  // Denormalized Fields (v14+)
  target_sentence?: string;
  native_translation?: string;
  notes?: string; 
  target_word?: string;
  tags?: string;
  created_at?: number;
}

export interface Revlog {
  id: number;   cid: number;   usn: number;
  ease: number;   ivl: number;   lastIvl: number;
  factor: number;
  time: number;   type: number;   user_id?: string;
}

