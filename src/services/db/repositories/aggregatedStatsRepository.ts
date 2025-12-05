import { db } from '@/services/db/dexie';

export interface AggregatedStat {
    id: string;          // composite key: `${language}:${metric}` or `global:${metric}`
    language: string;    // language code or 'global'
    metric: string;      // 'total_xp', 'total_reviews', etc.
    value: number;       // the aggregated value
    updated_at: string;  // ISO timestamp
}

/**
 * Get an aggregated stat value for a specific language and metric
 */
export const getAggregatedStat = async (language: string, metric: string): Promise<number> => {
    const id = `${language}:${metric}`;
    const stat = await db.aggregated_stats.get(id);
    return stat?.value ?? 0;
};

/**
 * Increment an aggregated stat by a delta value
 */
export const incrementStat = async (language: string, metric: string, delta: number): Promise<void> => {
    const id = `${language}:${metric}`;
    const existing = await db.aggregated_stats.get(id);

    if (existing) {
        await db.aggregated_stats.update(id, {
            value: existing.value + delta,
            updated_at: new Date().toISOString()
        });
    } else {
        await db.aggregated_stats.add({
            id,
            language,
            metric,
            value: delta,
            updated_at: new Date().toISOString()
        });
    }
};

/**
 * Set multiple stats in a single transaction
 */
export const bulkSetStats = async (stats: Array<{ language: string; metric: string; value: number }>): Promise<void> => {
    const records: AggregatedStat[] = stats.map(s => ({
        id: `${s.language}:${s.metric}`,
        language: s.language,
        metric: s.metric,
        value: s.value,
        updated_at: new Date().toISOString()
    }));

    await db.aggregated_stats.bulkPut(records);
};

/**
 * Recalculate all stats from scratch for a language (or globally)
 * Used for migration and repair operations
 */
export const recalculateAllStats = async (language?: string): Promise<void> => {
    // Get all cards for the language
    const cards = language
        ? await db.cards.where('language').equals(language).toArray()
        : await db.cards.toArray();

    const cardIds = new Set(cards.map(c => c.id));

    // Calculate XP from revlog
    let totalXp = 0;
    let totalReviews = 0;

    await db.revlog.each(log => {
        if (!language || cardIds.has(log.card_id)) {
            totalXp += 10; // 10 XP per review
            totalReviews++;
        }
    });

    // Prepare stats to write
    const statsToWrite: Array<{ language: string; metric: string; value: number }> = [];
    const lang = language || 'global';

    statsToWrite.push(
        { language: lang, metric: 'total_xp', value: totalXp },
        { language: lang, metric: 'total_reviews', value: totalReviews }
    );

    await bulkSetStats(statsToWrite);
};
