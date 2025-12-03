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

    let prompt = `
      Generate ${count} flashcards for a ${langName} learner.
      Instructions: "${instructions}".
      
      IMPORTANT: Ensure variety in sentence structure. Do NOT use repetitive patterns like "I [verb]" or "He [verb]" for all sentences. Mix different subjects, tenses, and sentence types (questions, statements, negations).
    `;

    if (learnedWords && learnedWords.length > 0) {
      const learnedWordsStr = learnedWords.slice(0, 100).join(", ");
      prompt += `
      
      PROGRESSIVE LEARNING (i+1):
      The user has already learned the following words: ${learnedWordsStr}.
      Please try to use these known words in the sentences to reinforce them, while introducing ONE new key concept/word per sentence (the targetWord).
      The goal is to build upon foundational knowledge. Start with simple sentences if the user is a beginner, and progress to more complex ones using the known vocabulary.
      Focus on high-frequency words and concepts (Pareto principle).
      `;
    }

    prompt += `
      Return a JSON ARRAY of objects. Each object MUST have ALL of these fields:
      - targetSentence: A sentence in ${langName} appropriate for the requested level/topic.
      - nativeTranslation: English translation of the sentence.
      - targetWord: The key vocabulary word being taught in the sentence. MUST be one of: noun, verb, adjective, adverb, or pronoun.
      - targetWordTranslation: English translation of ONLY the target word (not the sentence).
      - targetWordPartOfSpeech: The part of speech of the target word (must be exactly one of: "noun", "verb", "adjective", "adverb", or "pronoun").
      - notes: Brief grammar explanation or context (max 1 sentence).
      
      EXAMPLE FORMAT:
      {
        "targetSentence": "Kot śpi na krześle.",
        "nativeTranslation": "The cat is sleeping on the chair.",
        "targetWord": "kot",
        "targetWordTranslation": "cat",
        "targetWordPartOfSpeech": "noun",
        "notes": "Nominative case, masculine animate noun."
      }
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