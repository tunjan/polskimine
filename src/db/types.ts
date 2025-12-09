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
  created_at: string;
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
