import { supabase } from '@/lib/supabase';
import { Card, Difficulty, Language } from '@/types';

interface GeneratedCard {
    targetSentence: string;
    nativeTranslation: string;
    targetWord: string;
    notes: string;
    furigana?: string;
    language: Language;
    status: string;
    interval: number;
    easeFactor: number;
    tags: string[];
}

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

/**
 * Generate a personalized initial deck of 50 cards using Gemini AI
 */
export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    try {
        const { data, error } = await supabase.functions.invoke('generate-initial-deck', {
            body: {
                language: options.language,
                proficiencyLevel: options.proficiencyLevel,
                apiKey: options.apiKey,
            },
        });

        if (error) {
            console.error('Error generating initial deck:', error);
            throw new Error('Failed to generate deck. Please check your API key and try again.');
        }

        if (!data.cards || !Array.isArray(data.cards)) {
            throw new Error('Invalid response from deck generation service');
        }

        // Convert generated cards to full Card objects
        const cards: Card[] = data.cards.map((card: GeneratedCard) => ({
            id: crypto.randomUUID(),
            targetSentence: card.targetSentence,
            nativeTranslation: card.nativeTranslation,
            targetWord: card.targetWord,
            notes: card.notes,
            furigana: card.furigana,
            language: options.language,
            status: 'new' as const,
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date().toISOString(),
            tags: [options.proficiencyLevel],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw error;
    }
}
