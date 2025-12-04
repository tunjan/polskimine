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
        const instructions = `Generate content for ${options.proficiencyLevel} level. Topic: Essential daily life phrases, greetings, and basic survival vocabulary.`;

        // We request 5 batches of 10 cards to ensure variety and avoid timeouts
        const batchCount = 5;
        const cardsPerBatch = 10;
        
        const batchPromises = Array.from({ length: batchCount }).map(() => 
            aiService.generateBatchCards({
                language: options.language,
                instructions: instructions,
                count: cardsPerBatch,
                apiKey: options.apiKey!,
            })
        );

        const results = await Promise.all(batchPromises);
        const generatedData = results.flat();

        if (!generatedData || !Array.isArray(generatedData)) {
            throw new Error('Invalid response format from AI service');
        }

        // Convert raw AI response to full Card objects
        const now = Date.now();
        const cards: Card[] = generatedData.map((card: any, index: number) => ({
            id: crypto.randomUUID(),
            targetSentence: card.targetSentence,
            nativeTranslation: card.nativeTranslation,
            targetWord: card.targetWord,
            targetWordTranslation: card.targetWordTranslation,
            targetWordPartOfSpeech: card.targetWordPartOfSpeech,
            notes: card.notes,
            furigana: card.furigana,
            language: options.language,
            status: 'new' as const,
            interval: 0,
            easeFactor: 2.5,
            // Stagger due dates by 1 second to ensure they are reviewed in the generated order
            dueDate: new Date(now + index * 1000).toISOString(),
            tags: [options.proficiencyLevel, 'Starter', 'AI-Gen'],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw new Error(error.message || 'Failed to generate deck via AI service');
    }
}