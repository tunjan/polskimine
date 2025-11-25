import { aiService } from '@/features/deck/services/ai';
import { Card, Difficulty, Language } from '@/types';

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

/**
 * Generate a personalized initial deck using Gemini AI via aiService
 * Uses client-side logic to call the 'generate-card' function indirectly
 */
export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    if (!options.apiKey) {
        throw new Error('API Key is required for AI deck generation');
    }

    try {
        // Use aiService.generateBatchCards which uses the existing 'generate-card' edge function
        // We define a broad topic suitable for the user's level
        const topic = `Essential daily life phrases, greetings, and basic survival vocabulary for ${options.proficiencyLevel} level`;

        // We request 20 cards to ensure the AI response fits within timeouts/token limits
        // (50 cards often causes JSON parsing errors due to length)
        const generatedData = await aiService.generateBatchCards({
            language: options.language,
            difficulty: options.proficiencyLevel,
            topic: topic,
            count: 20, 
            apiKey: options.apiKey,
        });

        if (!generatedData || !Array.isArray(generatedData)) {
            throw new Error('Invalid response format from AI service');
        }

        // Convert raw AI response to full Card objects
        const cards: Card[] = generatedData.map((card: any) => ({
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
            tags: [options.proficiencyLevel, 'Starter', 'AI-Gen'],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw new Error(error.message || 'Failed to generate deck via AI service');
    }
}