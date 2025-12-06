import { renderHook } from '@testing-library/react';
import { useReviewIntervals } from './useReviewIntervals';
import { Card, UserSettings } from '@/types';
import { formatInterval } from '@/utils/formatInterval';

// Mock FormatInterval
describe('formatInterval', () => {
    it('formats seconds', () => expect(formatInterval(30000)).toBe('<1m'));
    it('formats minutes', () => expect(formatInterval(65000)).toBe('1m'));
    it('formats hours', () => expect(formatInterval(3600000)).toBe('1h'));
    it('formats days', () => expect(formatInterval(86400000)).toBe('1d'));
    it('formats months', () => expect(formatInterval(2592000000)).toBe('1mo'));
});

// Mock Data
const mockCard: Card = {
    id: 'test',
    status: 'learning',
    learningStep: 0,
    dueDate: new Date().toISOString(),
    targetSentence: 'test',
    nativeTranslation: 'test',
    notes: '',
    interval: 0,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    language: 'polish',
    last_review: new Date().toISOString(),
    stability: 1,
    difficulty: 5
};

const mockSettings: UserSettings = {
    language: 'polish',
    dailyNewLimits: { polish: 20 } as any,
    dailyReviewLimits: { polish: 100 } as any,
    learningSteps: [1, 10],
    fsrs: {
        request_retention: 0.9,
        maximum_interval: 36500
    },
    tts: {} as any,
    autoPlayAudio: false,
    blindMode: false,
    showTranslationAfterFlip: true,
    ignoreLearningStepsWhenNoCards: false,
    binaryRatingMode: false,
    cardOrder: 'newFirst',
    geminiApiKey: ''
};

describe('useReviewIntervals', () => {
    it('returns intervals for all grades', () => {
        const { result } = renderHook(() => useReviewIntervals(mockCard, mockSettings));

        expect(result.current.Again).toBeDefined();
        expect(result.current.Good).toBeDefined();

        // With learning steps [1, 10]
        // Again -> Step 0 -> 1m
        // Good -> Step 1 -> 10m
        expect(result.current.Again).toMatch(/<1m|1m/);
        expect(result.current.Good).toBe('10m');
    });

    it('returns empty strings if no card', () => {
        const { result } = renderHook(() => useReviewIntervals(undefined, mockSettings));
        expect(result.current.Good).toBe('');
    });
});
