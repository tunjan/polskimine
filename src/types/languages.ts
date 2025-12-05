export const LanguageId = {
    Polish: 'polish',
    Norwegian: 'norwegian',
    Japanese: 'japanese',
    Spanish: 'spanish',
    German: 'german',
} as const;

export type Language = typeof LanguageId[keyof typeof LanguageId];

export const LANGUAGE_LABELS: Record<Language, string> = {
    [LanguageId.Polish]: 'Polish',
    [LanguageId.Norwegian]: 'Norwegian',
    [LanguageId.Japanese]: 'Japanese',
    [LanguageId.Spanish]: 'Spanish',
    [LanguageId.German]: 'German',
};
