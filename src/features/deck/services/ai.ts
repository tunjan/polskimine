import { supabase } from '@/lib/supabase';
import type { GameQuestion } from '@/types/multiplayer';

// Types for Gemini API interactions
interface GeminiRequestBody {
  prompt: string;
  apiKey: string;
  responseSchema?: GeminiResponseSchema;
}

interface GeminiResponseSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
}

interface GeminiSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  enum?: string[];
  description?: string;
}

// Type for generated card data from AI
interface GeneratedCardData {
  targetSentence: string;
  nativeTranslation: string;
  targetWord: string;
  targetWordTranslation: string;
  targetWordPartOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun';
  grammaticalCase?: string;
  gender?: string;
  notes: string;
  furigana?: string;
}

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: 'polish' | 'norwegian' | 'japanese' | 'spanish';
  learnedWords?: string[];
  proficiencyLevel?: string;
  difficultyMode?: 'beginner' | 'immersive';
}

function extractJSON(text: string): string {

  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1];
  }


  const firstOpenBrace = text.indexOf('{');
  const firstOpenBracket = text.indexOf('[');

  let firstOpen = -1;
  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    firstOpen = Math.min(firstOpenBrace, firstOpenBracket);
  } else {
    firstOpen = Math.max(firstOpenBrace, firstOpenBracket);
  }

  if (firstOpen !== -1) {

    const lastCloseBrace = text.lastIndexOf('}');
    const lastCloseBracket = text.lastIndexOf(']');
    const lastClose = Math.max(lastCloseBrace, lastCloseBracket);

    if (lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
    }
  }

  return text;
}

async function callGemini(prompt: string, apiKey: string, responseSchema?: GeminiResponseSchema): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please add it in Settings.');
  }

  const body: GeminiRequestBody = { prompt, apiKey };
  if (responseSchema) {
    body.responseSchema = responseSchema;
  }

  const { data, error } = await supabase.functions.invoke('generate-card', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) {
    console.error("AI Service Error:", error);

    try {
      const errorBody = error instanceof Response ? await error.json() : null;
      if (errorBody?.error) throw new Error(errorBody.error);
    } catch (_) {
      // Ignore parse errors
    }
    throw new Error('AI Service failed. Check console for details.');
  }

  return data.text;
}

export const aiService = {
  async translateText(text: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<string> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    const prompt = `Translate the following ${langName} text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(word: string, contextSentence: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    const prompt = `
      Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context"
      };
    }
  },

  async generateSentenceForWord(targetWord: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    targetSentence: string;
    nativeTranslation: string;
    targetWordTranslation: string;
    targetWordPartOfSpeech: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    
    let prompt = `
      Generate a natural, practical ${langName} sentence that uses the word "${targetWord}".
      The sentence should be useful for a language learner and demonstrate common usage of the word.
      
      Return a JSON object with:
      - targetSentence: A natural ${langName} sentence containing the word "${targetWord}".
      - nativeTranslation: The English translation of the sentence.
      - targetWordTranslation: English translation of the target word "${targetWord}".
      - targetWordPartOfSpeech: The part of speech (must be exactly one of: "noun", "verb", "adjective", "adverb", or "pronoun").
      - notes: Brief grammar notes about the word's usage in this sentence (max 1-2 sentences).
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は..."
      `;
    }

    prompt += `
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate sentence for word");
    }
  },

  async generateCardContent(sentence: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    translation: string;
    targetWord?: string;
    targetWordTranslation?: string;
    targetWordPartOfSpeech?: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));

    let prompt = `
      Analyze the following ${langName} sentence for a flashcard: "${sentence}".
      Return a JSON object with:
      - translation: The natural English translation.
      - targetWord: The key vocabulary word being taught in the sentence. MUST be one of: noun, verb, adjective, adverb, or pronoun.
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: The part of speech of the target word (noun, verb, adjective, adverb, or pronoun).
      - notes: Brief grammar notes, explaining any interesting cases, conjugations, or idioms used in the sentence. Keep it concise (max 2-3 sentences).
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
      `;
    }

    prompt += `
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        translation: "",
        notes: ""
      };
    }
  },

  async generateQuiz(prompt: string, apiKey: string): Promise<GameQuestion[]> {
    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      const parsed = JSON.parse(cleanResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse quiz response', e);
      return [];
    }
  },

  async generateBatchCards({ 
    instructions, 
    count, 
    language, 
    apiKey, 
    learnedWords, 
    proficiencyLevel = 'A1',
    difficultyMode = 'immersive' 
  }: BatchGenerationOptions & { apiKey: string }): Promise<GeneratedCardData[]> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));

    // Logic: If 'beginner' mode selected, force scaffolding
    const progressionRules = difficultyMode === 'beginner' 
      ? `
        CRITICAL PROGRESSION RULES (Zero-to-Hero):
        1. First 30% of cards: SINGLE WORDS ONLY (Nouns/Verbs). Max 1-2 words.
        2. Middle 40% of cards: SHORT PHRASES (Subject+Verb). Max 3-4 words.
        3. Last 30% of cards: SIMPLE SENTENCES. Max 5-6 words.
        
        Grammar Constraint: Strictly ${proficiencyLevel} level.
        `
      : `
        Constraint: Natural sentences suitable for ${proficiencyLevel} level. 
        Variety: Mix statements, questions, and mild imperatives.
        `;

    const knownWordsContext = learnedWords && learnedWords.length > 0
      ? `Avoid teaching these words (User already knows them): [${learnedWords.slice(0, 100).join(", ")}]`
      : "User has NO prior vocabulary. Start from scratch.";

    // Define the schema for a single card with proper typing
    const cardSchemaProperties: Record<string, GeminiSchemaProperty> = {
      targetSentence: { type: "STRING" },
      nativeTranslation: { type: "STRING" },
      targetWord: { type: "STRING" },
      targetWordTranslation: { type: "STRING" },
      targetWordPartOfSpeech: { 
        type: "STRING", 
        enum: ["noun", "verb", "adjective", "adverb", "pronoun"] 
      },
      grammaticalCase: { type: "STRING" },
      gender: { type: "STRING" },
      notes: { type: "STRING" }
    };

    const requiredFields = ["targetSentence", "nativeTranslation", "targetWord", "targetWordTranslation", "targetWordPartOfSpeech", "notes"];

    // Add furigana for Japanese
    if (language === 'japanese') {
      cardSchemaProperties.furigana = { type: "STRING" };
      requiredFields.push("furigana");
    }

    const cardSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: cardSchemaProperties,
      required: requiredFields
    };

    // Define response schema as array of cards
    const responseSchema: GeminiResponseSchema = {
      type: "ARRAY",
      items: cardSchema
    };

    let prompt = `
      Role: Expert ${langName} curriculum designer.
      Task: Generate a JSON Array of ${count} flashcards.
      Topic: "${instructions}"
      
      ${progressionRules}
      
      ${knownWordsContext}
      
      Output Format (JSON Array):
      [
        {
          "targetSentence": "...",
          "nativeTranslation": "...",
          "targetWord": "...",
          "targetWordTranslation": "...",
          "targetWordPartOfSpeech": "noun|verb|adjective|adverb|pronoun",
          "grammaticalCase": "nominative|genitive|...", 
          "gender": "masculine|feminine|neuter",
          "notes": "Explain the grammar of the target word in this specific context."${language === 'japanese' ? ',\n          "furigana": "Kanji[reading] format"' : ''}
        }
      ]

      IMPORTANT: Return ONLY the JSON Array. No markdown.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    try {
      // With response_schema, Gemini returns valid JSON directly - no need for extractJSON
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse AI batch response", e);
      throw new Error("Failed to generate valid cards");
    }
  }
};
