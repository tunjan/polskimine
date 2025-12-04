import { supabase } from '@/lib/supabase';
import type { GameQuestion } from '@/types/multiplayer';

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: 'polish' | 'norwegian' | 'japanese' | 'spanish';
  learnedWords?: string[];
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

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please add it in Settings.');
  }


  const { data, error } = await supabase.functions.invoke('generate-card', {
    body: JSON.stringify({ prompt, apiKey }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) {
    console.error("AI Service Error:", error);

    try {
      const body = error instanceof Response ? await error.json() : null;
      if (body?.error) throw new Error(body.error);
    } catch (_) {

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

  async generateBatchCards({ instructions, count, language, apiKey, learnedWords }: BatchGenerationOptions & { apiKey: string }): Promise<any[]> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));

    const learnedWordsStr = learnedWords && learnedWords.length > 0 ? learnedWords.join(", ") : "";

    let prompt = `
      Role: You are an expert ${langName} linguist and teacher.
      Task: Generate ${count} flashcards for a student.
      
      Topic/Context: "${instructions}"
      
      Constraints:
      1. VARIETY: No two sentences may start with the same word. Mix statements, questions, and exclamations.
      2. LENGTH: Sentences must be between 4 and 12 words long.
      3. RELEVANCE: Sentences must be practical for daily life (no abstract poetry).
      4. NEGATIVE CONSTRAINTS: Do NOT use repetitive patterns like "I [verb]" or "He [verb]". Do NOT use the word 'very' more than once.
      
      Input Data (User's Known Vocabulary):
      [${learnedWordsStr}]
      
      Instruction for "i+1" Learning:
      - Construct sentences primarily using the "Input Data" above.
      - Introduce EXACTLY ONE new word (the "targetWord") per sentence.
      - The "targetWord" must be the most difficult word in the sentence.
      
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
          "notes": "Explain the grammar of the target word in this specific context."
        }
      ]
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は..."
      `;
    }

    prompt += `
      Strictly return ONLY the JSON array. No markdown code blocks, no introduction.
    `;

    const result = await callGemini(prompt, apiKey);

    try {
      const cleanResult = extractJSON(result);
      const parsed = JSON.parse(cleanResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse AI batch response", e);
      throw new Error("Failed to generate valid cards");
    }
  }
};