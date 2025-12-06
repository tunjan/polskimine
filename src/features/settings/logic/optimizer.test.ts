import { exportRevlogToCSV } from './optimizer';
import { LinguaFlowDB } from '@/services/db/dexie';
import { State } from 'ts-fsrs';

// Mock Blob and URL.createObjectURL since they are browser APIs
global.Blob = class Blob {
    content: string[];
    options: any;
    constructor(content: string[], options: any) {
        this.content = content;
        this.options = options;
    }
} as any;

global.URL.createObjectURL = (blob: any) => 'blob:url';
global.document = {
    createElement: () => ({
        setAttribute: () => { },
        style: {},
        click: () => { },
    }),
    body: {
        appendChild: () => { },
        removeChild: () => { },
    }
} as any;

describe('exportRevlogToCSV', () => {
    it('exports correctly formatted CSV', async () => {
        const mockLogs = [
            {
                card_id: 'card1',
                created_at: '2023-01-01T12:00:00Z',
                grade: 3,
                state: State.Review
            },
            {
                card_id: 'card2',
                created_at: '2023-01-02T12:00:00Z',
                grade: 1,
                state: State.Learning
            }
        ];

        const mockDB = {
            revlog: {
                toArray: async () => mockLogs
            }
        } as unknown as LinguaFlowDB;

        // Spy on Blob constructor to check content
        const blobSpy = vi.spyOn(global, 'Blob');

        await exportRevlogToCSV(mockDB);

        expect(blobSpy).toHaveBeenCalled();
        const blobContent = blobSpy.mock.calls[0][0][0] as string;

        const lines = blobContent.split('\n');
        expect(lines[0]).toBe('card_id,review_time,review_rating,review_state,review_duration');

        // Check line 1
        // card1, timestamp, 3, 2 (Review), 0
        const row1 = lines[1].split(',');
        expect(row1[0]).toBe('card1');
        expect(new Date(parseInt(row1[1])).toISOString()).toBe('2023-01-01T12:00:00.000Z');
        expect(row1[2]).toBe('3');
        expect(row1[3]).toBe('2'); // Review state
        expect(row1[4]).toBe('0');

        // Check line 2
        // card2, timestamp, 1, 1 (Learning), 0
        const row2 = lines[2].split(',');
        expect(row2[3]).toBe('1'); // Learning state
    });
});
