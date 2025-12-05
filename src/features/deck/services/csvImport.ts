import { v4 as uuidv4 } from 'uuid';
import { Card, Language, LanguageId } from '@/types';
import Papa from 'papaparse';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const pickValue = (row: CsvRow, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = row[key];
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
};

const isLanguage = (value?: string): value is Language =>
    value === LanguageId.Polish || value === LanguageId.Norwegian || value === LanguageId.Japanese || value === LanguageId.Spanish;

const rowToCard = (row: CsvRow, fallbackLanguage: Language): Card | null => {
    const sentence = pickValue(row, ['target_sentence', 'sentence', 'text', 'front', 'prompt']);
    const translation = pickValue(row, ['native_translation', 'translation', 'back', 'answer']);

    if (!sentence || !translation) {
        return null;
    }

    const languageCandidate = pickValue(row, ['language', 'lang'])?.toLowerCase();
    const language = isLanguage(languageCandidate) ? languageCandidate : fallbackLanguage;
    const tagsRaw = pickValue(row, ['tags', 'tag_list', 'labels']);
    const notes = pickValue(row, ['notes', 'context', 'hint']) || '';
    const targetWord = pickValue(row, ['target_word', 'keyword', 'cloze']);
    const furigana = pickValue(row, ['furigana', 'reading', 'ruby']);

    return {
        id: uuidv4(),
        targetSentence: sentence,
        targetWord: targetWord || undefined,
        nativeTranslation: translation,
        notes,
        tags: tagsRaw
            ? tagsRaw
                .split(/[|;,]/)
                .map((tag) => tag.trim())
                .filter(Boolean)
            : undefined,
        furigana: furigana || undefined,
        language,
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
    };
};

export const parseCardsFromCsv = (payload: string, fallbackLanguage: Language): Card[] => {
    const sanitized = payload.trim();
    if (!sanitized) return [];

    const { data } = Papa.parse<Record<string, string>>(sanitized, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
    });

    const cards: Card[] = [];

    for (const row of data) {
        if (Object.values(row).every(val => !val || !val.trim())) continue;

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

export const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;
