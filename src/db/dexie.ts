import Dexie, { Table } from 'dexie';
import { Card, ReviewLog, UserSettings } from '@/types';
import { State } from 'ts-fsrs';

export interface LocalUser {
    id: string;
    username: string;
    passwordHash: string;
    created_at: string;
}

export interface LocalProfile {
    id: string;     username: string;
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
    user_id?: string;     grade: number;
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
    user_id?: string;     count: number;
}

export type LocalSettings = Partial<UserSettings> & {
    id: string;     geminiApiKey?: string;
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
    user_id?: string;     metric: string;
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
    users!: Table<LocalUser>; 
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
            // Batch processing: fetch all data once instead of iterating with .each()
            const allCards = await tx.table<Card>('cards').toArray();
            const allRevlogs = await tx.table<RevlogEntry>('revlog').toArray();

            // Build a map of card_id -> language for fast lookups
            const cardLanguageMap = new Map<string, string>();
            for (const card of allCards) {
                if (card.language) {
                    cardLanguageMap.set(card.id, card.language);
                }
            }

            // Calculate per-language stats in memory
            const languageStats = new Map<string, { totalXp: number; totalReviews: number }>();

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

            // Build aggregated stats for bulk insert
            const statsToInsert: AggregatedStat[] = [];
            const now = new Date().toISOString();

            // Per-language stats
            for (const [language, stats] of languageStats.entries()) {
                statsToInsert.push({
                    id: `${language}:total_xp`,
                    language: language || 'unknown',
                    metric: 'total_xp',
                    value: stats.totalXp,
                    updated_at: now
                });
                statsToInsert.push({
                    id: `${language}:total_reviews`,
                    language: language || 'unknown',
                    metric: 'total_reviews',
                    value: stats.totalReviews,
                    updated_at: now
                });
            }

            // Global stats (total of all revlogs)
            const globalXp = allRevlogs.length * 10;
            const globalReviews = allRevlogs.length;

            statsToInsert.push({
                id: 'global:total_xp',
                language: 'global',
                metric: 'total_xp',
                value: globalXp,
                updated_at: now
            });
            statsToInsert.push({
                id: 'global:total_reviews',
                language: 'global',
                metric: 'total_reviews',
                value: globalReviews,
                updated_at: now
            });

            // Single bulk insert for all stats
            if (statsToInsert.length > 0) {
                await tx.table<AggregatedStat>('aggregated_stats').bulkAdd(statsToInsert);
            }
        });

                this.version(4).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language, user_id',             profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username'         });

                this.version(5).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate]',
            revlog: 'id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]',
            history: '[date+language], [user_id+date+language], [user_id+language], date, language, user_id',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], [user_id+language+metric], updated_at',
            users: 'id, &username'
        });

                this.version(6).stores({
            cards: 'id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate], [user_id+language+status+dueDate], [user_id+language+isBookmarked+dueDate], [user_id+language+isLeech+dueDate]',
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
