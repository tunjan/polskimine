import { aiService } from '@/features/deck/services/ai';
import { Card, Difficulty, Language } from '@/types';

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

/**
 * Generate a personalized initial deck using Gemini AI via aiService
 * Uses parallel micro-batching for faster generation and better variety
 */
export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    if (!options.apiKey) {
        throw new Error('API Key is required for AI deck generation');
    }

    try {
        const totalCards = 50;
        const batchSize = 10;
        
        // Create 5 varied prompts to ensure diversity
        const topics = [
            "Greetings and Introductions",
            "Ordering Food and Drinks",
            "Travel and Directions",
            "Hobbies and Free Time",
            "Emergency and Health"
        ];

        // Fire 5 parallel requests for 10 cards each
        const promises = topics.map((topic) => 
            aiService.generateBatchCards({
                language: options.language,
                instructions: `Generate content for ${options.proficiencyLevel} level. Topic: ${topic}. Ensure sentences are practical and varied.`,
                count: batchSize,
                apiKey: options.apiKey!,
            })
        );

        // Wait for all batches to finish
        const results = await Promise.all(promises);
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