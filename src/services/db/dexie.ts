import Dexie, { Table } from 'dexie';
import { Card, ReviewLog } from '@/types';
import { State } from 'ts-fsrs';

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
    count: number;
}

export interface LocalSettings {
    id: string;
    gemini_api_key?: string;
    google_tts_api_key?: string;
    azure_tts_api_key?: string;
    azure_region?: string;
}

export interface AggregatedStat {
    id: string;          // composite key: `${language}:${metric}` or `global:${metric}`
    language: string;    // language code or 'global'
    metric: string;      // 'total_xp', 'total_reviews', etc.
    value: number;       // the aggregated value
    updated_at: string;  // ISO timestamp
}

class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;
    aggregated_stats!: Table<AggregatedStat>;

    constructor() {
        super('linguaflow-dexie');

        // Version 2 schema (existing)
        this.version(2).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id'
        });

        // Version 3: Add aggregated_stats table
        this.version(3).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], updated_at'
        }).upgrade(async (tx) => {
            // Backfill aggregated stats from existing data
            console.log('[Migration] Starting aggregated_stats backfill...');

            // Get unique languages from cards
            const allCards = await tx.table<Card>('cards').toArray();
            const languages = Array.from(new Set(allCards.map(c => c.language)));

            // For each language, calculate XP and total reviews
            for (const language of languages) {
                const cardIds = new Set(
                    allCards.filter(c => c.language === language).map(c => c.id)
                );

                let totalXp = 0;
                let totalReviews = 0;

                // Count reviews for this language
                await tx.table<RevlogEntry>('revlog').each(log => {
                    if (cardIds.has(log.card_id)) {
                        totalXp += 10; // 10 XP per review
                        totalReviews++;
                    }
                });

                // Write aggregated stats
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

                console.log(`[Migration] Backfilled stats for ${language}: ${totalXp} XP, ${totalReviews} reviews`);
            }

            // Global stats
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

            console.log('[Migration] Aggregated stats backfill complete!');
        });
    }
}

export const db = new LinguaFlowDB();

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
