const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return undefined;
};

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local');
  }

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export const aiService = {
  async translateText(text: string): Promise<string> {
    const prompt = `Translate the following Polish text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt);
  },

  async analyzeWord(word: string, contextSentence: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const prompt = `
      Analyze the Polish word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;
    
    const result = await callGemini(prompt);
    try {
      const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
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

  async generateCardContent(sentence: string): Promise<{
    translation: string;
    notes: string;
  }> {
    const prompt = `
      Analyze the following Polish sentence for a flashcard: "${sentence}".
      Return a JSON object with:
      - translation: The natural English translation.
      - notes: Brief grammar notes, explaining any interesting cases, conjugations, or idioms used in the sentence. Keep it concise (max 2-3 sentences).
      
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt);
    try {
      const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        translation: "",
        notes: ""
      };
    }
  }
};
