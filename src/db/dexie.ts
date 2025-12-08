import Dexie, { Table } from 'dexie';
import { Card, ReviewLog, UserSettings } from '@/types';
import { State } from 'ts-fsrs';

// User account for authentication
export interface LocalUser {
    id: string;
    username: string;
    passwordHash: string;
    created_at: string;
}

export interface LocalProfile {
    id: string; // This is the user_id
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
    user_id?: string; // Added for multi-user
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
    user_id?: string; // Added for multi-user
    count: number;
}

export type LocalSettings = Partial<UserSettings> & {
    id: string; // This is the user_id
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
    user_id?: string; // Added for multi-user
    metric: string;
    value: number;
    updated_at: string;
}

export class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;
    aggregated_stats!: Table<AggregatedStat>;
    users!: Table<LocalUser>; // New users table

    constructor() {
        super('linguaflow-dexie');

        this.version(2).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id'
        });

        this.version(3).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], updated_at'
        }).upgrade(async (tx) => {

            const allCards = await tx.table<Card>('cards').toArray();
            const languages = Array.from(new Set(allCards.map(c => c.language)));

            for (const language of languages) {
                const cardIds = new Set(
                    allCards.filter(c => c.language === language).map(c => c.id)
                );

                let totalXp = 0;
                let totalReviews = 0;

                await tx.table<RevlogEntry>('revlog').each(log => {
                    if (cardIds.has(log.card_id)) {
                        totalXp += 10; totalReviews++;
                    }
                });

                await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                    {
                        id: `${language}:total_xp`,
                        language,
                        metric: 'total_xp',
                        value: totalXp,
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: `${language}:total_reviews`,
                        language,
                        metric: 'total_reviews',
                        value: totalReviews,
                        updated_at: new Date().toISOString()
                    }
                ]);

            }

            let globalXp = 0;
            let globalReviews = 0;
            await tx.table<RevlogEntry>('revlog').each(() => {
                globalXp += 10;
                globalReviews++;
            });

            await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                {
                    id: 'global:total_xp',
                    language: 'global',
                    metric: 'total_xp',
                    value: globalXp,
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'global:total_reviews',
                    language: 'global',
                    metric: 'total_reviews',
                    value: globalReviews,
                    updated_at: new Date().toISOString()
                }
            ]);

        });

        // Version 4: Multi-user support
        this.version(4).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language, user_id', // Keep original primary key
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username' // &username makes it unique
        });

        // Version 5: Optimized indexes for efficient queries
        this.version(5).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]',
            history: '[date+language], [user_id+date+language], [user_id+language], date, language, user_id',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username'
        });

        this.cards.hook('deleting', (primKey, obj, transaction) => {
            return this.revlog.where('card_id').equals(primKey).delete();
        });
    }
}

export const db = new LinguaFlowDB();

// Password hashing utility using SHA-256
export const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
