import Dexie, { Table } from 'dexie';
import { Card, ReviewLog } from '@/types';
import { State } from 'ts-fsrs';

// Profile for local user (singleton)
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

// Review log entry for Dexie
export interface RevlogEntry {
    id: string;
    card_id: string;
    grade: number;
    state: State;
    elapsed_days: number;
    scheduled_days: number;
    stability: number;
    difficulty: number;
    created_at: string;
}

// Study history entry
export interface HistoryEntry {
    date: string;
    language: string;
    count: number;
}

// Settings stored locally
export interface LocalSettings {
    id: string;
    gemini_api_key?: string;
    google_tts_api_key?: string;
    azure_tts_api_key?: string;
    azure_region?: string;
}

class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;

    constructor() {
        super('linguaflow-dexie');

        this.version(1).stores({
            // Card indexes for efficient queries
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status]',

            // Review log for SRS history
            revlog: 'id, card_id, created_at, [card_id+created_at]',

            // Study history by date and language
            history: '[date+language], date, language',

            // Profile singleton (id = 'local')
            profile: 'id',

            // Settings singleton (id = 'local')
            settings: 'id'
        });
    }
}

// Single DB instance
export const db = new LinguaFlowDB();

// Helper to generate UUIDs with fallback for environments without crypto.randomUUID
export const generateId = (): string => {
    // Use native crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback: generate UUID v4 using crypto.getRandomValues
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Set version (4) and variant (RFC4122)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    // Last resort fallback using Math.random (less secure but works everywhere)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
