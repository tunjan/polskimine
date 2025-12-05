// Direct Gemini API calls - no Supabase edge functions

// Types for Gemini API interactions
interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: any;
  };
}

interface GeminiSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  enum?: string[];
  description?: string;
}

interface GeminiResponseSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
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

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

  const body: GeminiRequestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  if (responseSchema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema
    };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorData);
    throw new Error(errorData.error?.message || 'AI Service failed. Check your API key.');
  }

  const data = await response.json();

  // Extract text from response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  return text;
}

export const aiService = {
  async translateText(text: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<string> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    const prompt = `
      Role: Expert Translator.
      Task: Translate the following ${langName} text to English.
      Constraint: Provide ONLY the direct English translation. No detailed explanations, no markdown, no conversational filler.
      
      Text: "${text}"
    `;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(word: string, contextSentence: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));

    // Define strict schema
    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        definition: { type: 'STRING' },
        partOfSpeech: { type: 'STRING' },
        contextMeaning: { type: 'STRING' }
      },
      required: ['definition', 'partOfSpeech', 'contextMeaning']
    };

    const prompt = `
      Role: Expert Language Tutor.
      Task: Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      
      Requirements:
      - definition: A concise, context-relevant English definition (max 10 words).
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) AND the specific grammatical form/case used in the sentence if applicable.
      - contextMeaning: The specific nuance or meaning of the word *exactly* as it is used in this sentence.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return JSON.parse(result);
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

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        targetSentence: { type: 'STRING' },
        nativeTranslation: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === 'japanese' ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['targetSentence', 'nativeTranslation', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
    };

    let prompt = `
      Role: Native Speaker & Language Teacher.
      Task: Generate a practical, natural ${langName} sentence using the word "${targetWord}".
      
      Guidelines:
      - The sentence must be colloquially natural but grammatically correct.
      - Useful for a learner (A2/B1 level).
      - Context should make the meaning of "${targetWord}" clear.
      
      Fields:
      - targetSentence: A natural ${langName} sentence containing "${targetWord}".
      - nativeTranslation: Natural English translation.
      - targetWordTranslation: English translation of "${targetWord}".
      - targetWordPartOfSpeech: Exactly one of: "noun", "verb", "adjective", "adverb", "pronoun".
      - notes: A brief, helpful grammar note about how the word is functioning in this specific sentence (e.g. case usage, conjugation). Max 2 sentences.
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The FULL targetSentence with furigana in the format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。" (Ensure the brackets are correct).
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      throw new Error("Failed to generate sentence for word");
    }
    // Removed old catch block that used extractJSON
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

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        translation: { type: 'STRING' },
        targetWord: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === 'japanese' ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['translation', 'targetWord', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
    };

    let prompt = `
      Role: Expert Language Teacher.
      Task: Create a high-quality flashcard from this ${langName} sentence: "${sentence}".
      
      Fields:
      - translation: Natural, idiomatic English translation.
      - targetWord: The single most important vocabulary word in the sentence (lemma form if possible, or the word as is if more appropriate for beginners).
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: One of: noun, verb, adjective, adverb, pronoun.
      - notes: Concise grammar explanation (max 2 sentences). specific to this sentence's structure or the target word's usage.
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The FULL sentence with furigana in format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        translation: "",
        notes: ""
      };
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

    const hasLearnedWords = learnedWords && learnedWords.length > 0;

    let progressionRules = '';

    if (difficultyMode === 'beginner') {
      if (hasLearnedWords) {
        // CONTINUOUS PROGRESSION (Day 2+)
        progressionRules = `
        CRITICAL PROGRESSION RULES (Continued Learning / Duolingo Style):
        This is a SEQUENTIAL LESSON extending the user's existing knowledge.

        User ALREADY KNOWS: ${learnedWords!.length} words.
        
        1.  **NO SINGLE WORDS**: Do NOT generate cards with just 1 word. The user is past that stage.
        2.  **Contextual Learning**: precise target is to combine [Previously Learned Word] + [NEW Word].
        3.  **Progression**:
            - Cards 1-5: Simple 2-3 word phrases using *mostly* known words + 1 NEW word.
            - Cards 6-10: Complete simple sentences (Subject-Verb-Object). 
        
        INTERNAL STATE REQUIREMENT:
        - Track "Introduced Vocabulary".
        - **Constraint**: A card should NOT contain more than 1 unknown word (a word that is NOT in "LearnedWords" and NOT in "Introduced Vocabulary").
        `;
      } else {
        // DAY 1 (Absolute Beginner)
        progressionRules = `
        CRITICAL PROGRESSION RULES (Zero-to-Hero / Duolingo Style):
        This is a SEQUENTIAL LESSON. Card N must build upon Cards 1...(N-1).

        1.  **Card 1-2**: Foundation. ABSOLUTE BASICS. 1-2 words max. (e.g., "Mother", "Water", "Yes").
        2.  **Card 3-5**: very Simple combinations. Max 2-3 words. Reuse words from Cards 1-2. (e.g., "My mother", "Yes, water").
        3.  **Card 6-10**: Basic sentences. Max 3-5 words. STRICTLY REUSE specific vocabulary from previous cards + introduce ONLY 1 new word per card.
        
        INTERNAL STATE REQUIREMENT:
        - Track the "Introduced Vocabulary" list internally as you generate.
        - **Constraint**: A card should not contain more than 1 unknown word (a word not in learned/introduced list).
        `;
      }
    } else {
      // Immersive Mode
      progressionRules = `
        CRITICAL: Each card MUST contain a COMPLETE, NATURAL SENTENCE in targetSentence.
        - The sentence must demonstrate vivid, real usage of the target vocabulary word.
        - Never return just the word alone — always wrap it in a meaningful context.
        - Sentence complexity should match ${proficiencyLevel} level.
        - Variety: Mix statements, questions, and mild imperatives. Avoid repetitive sentence structures (e.g., don't start every sentence with "I").
        `;
    }

    const knownWordsContext = learnedWords && learnedWords.length > 0
      ? `
        KNOWN VOCABULARY (For Context Only - DO NOT Teach These Again):
        [${learnedWords.slice(0, 150).join(", ")}]... (and potentially others).
        
        Use these known words to build sentences, but the "targetWord" (the one being taught) to be a NEW word.
        `
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
      cardSchemaProperties.furigana = {
        type: "STRING",
        description: "The FULL targetSentence with kanji readings in Kanji[reading] format for ALL kanji characters"
      };
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
      Role: Expert ${langName} curriculum designer & Native Speaker.
      Task: Generate a JSON Array of ${count} high-quality flashcards.
      Topic: "${instructions}"
      
      ${progressionRules}
      
      Style Guidelines:
      - Tone: Natural, friendly, helpful.
      - **Vocabulary Strategy**: CUMULATIVE. Repetition is good. If you taught "Apple" in card 1, use "Apple" in card 3 ("Red apple").
      - Avoid: Complex grammar, rare words, or throwing the user into the deep end.
      - Content: tangible, visual, and concrete concepts first (objects, family, basic actions).
      
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
          "notes": "Explain the grammar of the target word in this specific context."${language === 'japanese' ? ',\n          "furigana": "The FULL targetSentence with Kanji[reading] format for ALL kanji. Example: 私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています"' : ''}
        }
      ]

      IMPORTANT: Return ONLY the JSON Array. No markdown.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    try {
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse AI batch response", e);
      throw new Error("Failed to generate valid cards");
    }
  }
};
