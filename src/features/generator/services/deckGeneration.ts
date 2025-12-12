import { aiService } from "@/lib/ai";
import { Card, CardStatus, Difficulty, Language } from "@/types";

export interface GenerateInitialDeckOptions {
  language: Language;
  proficiencyLevel: Difficulty;
  apiKey?: string;
}

export async function generateInitialDeck(
  options: GenerateInitialDeckOptions,
): Promise<Card[]> {
  if (!options.apiKey) {
    throw new Error("API Key is required for AI deck generation");
  }

  try {
    const totalCards = 50;
    const batchSize = 10;

    const topics = [
      "Casual Greetings & Meeting New Friends (informal)",
      "Ordering Coffee, Pastries & Restaurant Basics",
      "Navigating the City & Public Transport Survival",
      "Talking about Hobbies, Movies & Weekend Plans",
    ];

    const promises = topics.map((topic) =>
      aiService.generateBatchCards({
        language: options.language,
        instructions: `Generate content for ${options.proficiencyLevel} level. Topic: ${topic}. Ensure sentences are practical and varied.`,
        count: batchSize,
        apiKey: options.apiKey!,
      }),
    );

    const results = await Promise.all(promises);
    const generatedData = results.flat();

    if (!generatedData || !Array.isArray(generatedData)) {
      throw new Error("Invalid response format from AI service");
    }

    const now = Date.now();
    const cards: Card[] = generatedData.map((card: any, index: number) => ({
      id: crypto.randomUUID(),
      targetSentence: card.targetSentence,
      nativeTranslation: card.nativeTranslation,
      targetWord: card.targetWord,
      targetWordTranslation: card.targetWordTranslation,
      targetWordPartOfSpeech: card.targetWordPartOfSpeech,
      gender: card.gender,
      grammaticalCase: card.grammaticalCase,
      notes: card.notes,
      furigana: card.furigana,
      language: options.language,
      status: CardStatus.NEW,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date(now + index * 1000).toISOString(),
      tags: [options.proficiencyLevel, "Starter", "AI-Gen"],
    }));

    return cards;
  } catch (error: any) {
    console.error("Failed to generate initial deck:", error);
    throw new Error(error.message || "Failed to generate deck via AI service");
  }
}
