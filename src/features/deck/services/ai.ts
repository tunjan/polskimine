import { supabase } from '@/lib/supabase';

interface BatchGenerationOptions {
  difficulty: string;
  topic: string;
  count: number;
  language: 'polish' | 'norwegian' | 'japanese';
}

function extractJSON(text: string): string {
  // Remove Markdown code blocks if present
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(markdownRegex);
  if (match) {
    return match[1];
  }
  
  // Fallback: Try to find first { or [ and last } or ]
  const firstOpen = text.search(/[{[]/);
  const lastClose = text.search(/[}\]]$/); 
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
  }

  // Ideally, just return text and let JSON.parse throw, 
  // but clean up common markdown artifacts first.
  return text.replace(/```json/g, '').replace(/```/g, '');
}

async function callGemini(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-card', {
    body: { prompt }
  });

  if (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to fetch from Gemini API');
  }

  return data.text;
}

export const aiService = {
  async translateText(text: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<string> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    const prompt = `Translate the following ${langName} text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt);
  },

  async analyzeWord(word: string, contextSentence: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    const prompt = `
      Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;
    
    const result = await callGemini(prompt);
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

  async generateCardContent(sentence: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<{
    translation: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    
    let prompt = `
      Analyze the following ${langName} sentence for a flashcard: "${sentence}".
      Return a JSON object with:
      - translation: The natural English translation.
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

    const result = await callGemini(prompt);
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

  async generateBatchCards({ difficulty, topic, count, language }: BatchGenerationOptions): Promise<any[]> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    
    let prompt = `
      Generate ${count} flashcards for a ${difficulty} level ${langName} learner.
      The topic is: "${topic}".
      
      Return a JSON ARRAY of objects. Each object must have:
      - targetSentence: A sentence in ${langName} appropriate for ${difficulty} level.
      - nativeTranslation: English translation.
      - targetWord: The key vocabulary word being taught in the sentence.
      - notes: Brief grammar explanation or context (max 1 sentence).
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は..."
      `;
    }

    prompt += `
      Strictly return ONLY the JSON array. No markdown code blocks, no introduction.
    `;

    const result = await callGemini(prompt);
    
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