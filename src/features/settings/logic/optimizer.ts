import { LinguaFlowDB } from '@/services/db/dexie';
import { State } from 'ts-fsrs';

export const exportRevlogToCSV = async (db: LinguaFlowDB): Promise<void> => {
    const revlogs = await db.revlog.toArray();

    // Header required by FSRS optimizer
    // card_id,review_time,review_rating,review_state,review_duration
    const header = ['card_id', 'review_time', 'review_rating', 'review_state', 'review_duration'].join(',');

    const rows = revlogs.map(log => {
        // Map State to FSRS standard: New=0, Learning=1, Review=2, Relearning=3
        // ts-fsrs State: New=0, Learning=1, Review=2, Relearning=3. Matches exactly.

        // review_rating: Manual=0, Again=1, Hard=2, Good=3, Easy=4
        // ts-fsrs Grade/Rating matches this (1-4).

        // review_duration: milliseconds usually. default to 0 if not tracked.
        const duration = 0;

        return [
            log.card_id,
            new Date(log.created_at).getTime(), // review_time in ms
            log.grade,
            log.state,
            duration
        ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `revlog_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
