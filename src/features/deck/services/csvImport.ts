import { v4 as uuidv4 } from 'uuid';
import { Card, Language } from '@/types';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const detectDelimiter = (sample: string) => {
    if (sample.includes('\t')) return '\t';
    const commaCount = (sample.match(/,/g) || []).length;
    const semicolonCount = (sample.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
};

const parseCsvLine = (line: string, delimiter: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current);
    return cells;
};

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
    value === 'polish' || value === 'norwegian' || value === 'japanese' || value === 'spanish';

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
    // Strip BOM (Byte Order Mark) that Excel and other tools may add to CSV files
    const sanitized = payload.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    if (!sanitized) return [];

    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];

        if (char === '"') {
            if (inQuotes && sanitized[i + 1] === '"') {
                current += '""';
                i++;
            } else {
                inQuotes = !inQuotes;
                current += char;
            }
        } else if (char === '\n' && !inQuotes) {
            if (current.trim().length > 0) {
                lines.push(current);
            }
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim().length > 0) {
        lines.push(current);
    }

    if (lines.length < 2) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const cards: Card[] = [];

    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        const values = parseCsvLine(rawLine, delimiter);
        if (values.every((value) => !value.trim())) continue;

        const row: CsvRow = {};
        headers.forEach((header, index) => {
            if (!header) return;
            row[header] = values[index]?.trim() ?? '';
        });

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

export const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;
