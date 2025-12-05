export const LanguageId = {
    Polish: 'polish',
    Norwegian: 'norwegian',
    Japanese: 'japanese',
    Spanish: 'spanish',
} as const;

export type Language = typeof LanguageId[keyof typeof LanguageId];

export const LANGUAGE_LABELS: Record<Language, string> = {
    [LanguageId.Polish]: 'Polish',
    [LanguageId.Norwegian]: 'Norwegian',
    [LanguageId.Japanese]: 'Japanese',
    [LanguageId.Spanish]: 'Spanish',
};
