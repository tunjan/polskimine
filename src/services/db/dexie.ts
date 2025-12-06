import Dexie, { Table } from 'dexie';
import { Card, ReviewLog, UserSettings } from '@/types';
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

export type LocalSettings = Partial<UserSettings> & {
    id: string;
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
};

export interface AggregatedStat {
    id: string; language: string; metric: string; value: number; updated_at: string;
}

export class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;
    aggregated_stats!: Table<AggregatedStat>;

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

        this.cards.hook('deleting', (primKey, obj, transaction) => {
            return this.revlog.where('card_id').equals(primKey).delete();
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
