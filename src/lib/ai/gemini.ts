import { LanguageId } from "@/types";
import { parseAIJSON } from "../../utils/jsonParser";
import { z } from "zod";

const LemmatizeSchema = z.object({
  lemma: z.string(),
});

const AnalyzeWordSchema = z.object({
  definition: z.string(),
  partOfSpeech: z.string(),
  exampleSentence: z.string(),
  exampleSentenceTranslation: z.string(),
});

const GenerateSentenceSchema = z.object({
  targetSentence: z.string(),
  nativeTranslation: z.string(),
  targetWordTranslation: z.string(),
  targetWordPartOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
  ]),
  notes: z.string(),
  furigana: z.string().optional(),
});

const GenerateCardSchema = z.object({
  translation: z.string(),
  targetWord: z.string().optional(),
  targetWordTranslation: z.string().optional(),
  targetWordPartOfSpeech: z
    .enum([
      "noun",
      "verb",
      "adjective",
      "adverb",
      "pronoun",
      "preposition",
      "conjunction",
      "interjection",
    ])
    .optional(),
  notes: z.string(),
  furigana: z.string().optional(),
  formattedSentence: z.string().optional(),
});

const GeneratedCardDataSchema = z.object({
  targetSentence: z.string(),
  nativeTranslation: z.string(),
  targetWord: z.string(),
  targetWordTranslation: z.string(),
  targetWordPartOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
  ]),
  grammaticalCase: z.string().optional(),
  gender: z.string().optional(),
  notes: z.string(),
  furigana: z.string().optional(),
});

type GeneratedCardData = z.infer<typeof GeneratedCardDataSchema>;

interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: GeminiResponseSchema;
    temperature?: number;
  };
}

interface GeminiSchemaProperty {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY";
  enum?: string[];
  description?: string;
}

interface GeminiResponseSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN";
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
}

export type WordType =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection";

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: (typeof LanguageId)[keyof typeof LanguageId];
  learnedWords?: string[];
  proficiencyLevel?: string;
  difficultyMode?: "beginner" | "immersive";
  wordTypeFilters?: WordType[];
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

async function callGemini(
  prompt: string,
  apiKey: string,
  responseSchema?: GeminiResponseSchema,
  retries = 3,
): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please add it in Settings.");
  }

  const body: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (responseSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema,
    };
  }

  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          const text = await response.text();
          throw new Error(
            `Gemini API Error: ${response.status} ${response.statusText} - ${text}`,
          );
        }
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", errorData);
        throw new Error(
          errorData.error?.message || "AI Service failed. Check your API key.",
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No response from AI");
      }
      return text;
    } catch (e) {
      console.warn(`Gemini attempt ${i + 1} failed:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < retries - 1) {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini after multiple attempts");
}

function getLangName(
  language: (typeof LanguageId)[keyof typeof LanguageId],
): string {
  switch (language) {
    case LanguageId.Norwegian:
      return "Norwegian";
    case LanguageId.Japanese:
      return "Japanese";
    case LanguageId.Spanish:
      return "Spanish";
    case LanguageId.German:
      return "German";
    case LanguageId.Polish:
    default:
      return "Polish";
  }
}

export const aiService = {
  async lemmatizeWord(
    word: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string,
  ): Promise<string> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        lemma: { type: "STRING" },
      },
      required: ["lemma"],
    };

    const prompt = `
      Role: Expert ${langName} linguist.
      Task: Convert the ${langName} word "${word}" to its dictionary/base form (lemma).
      
      Rules:
      - For verbs: return the infinitive form
      - For nouns: return the nominative singular form
      - For adjectives: return the masculine nominative singular form (or base form for languages without gender)
      - For adverbs: return the base form
      - If already in base form, return as-is
      - Return ONLY the lemma, nothing else
      
      Output: { "lemma": "the base form" }
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      const data = LemmatizeSchema.parse(parsed);
      return data.lemma;
    } catch (e) {
      console.error("Failed to parse lemmatize response", e);
      return word;
    }
  },

  async translateText(
    text: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string,
  ): Promise<string> {
    const langName = getLangName(language);
    const prompt = `
      Role: Expert Translator.
      Task: Translate the following ${langName} text to English.
      Constraint: Provide ONLY the direct English translation. No detailed explanations, no markdown, no conversational filler.
      
      Text: "${text}"
    `;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(
    word: string,
    contextSentence: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string,
    proficiencyLevel: string = "A1",
  ): Promise<z.infer<typeof AnalyzeWordSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        definition: { type: "STRING" },
        partOfSpeech: { type: "STRING" },
        exampleSentence: { type: "STRING" },
        exampleSentenceTranslation: { type: "STRING" },
      },
      required: [
        "definition",
        "partOfSpeech",
        "exampleSentence",
        "exampleSentenceTranslation",
      ],
    };

    const prompt = `
      Role: Expert Language Tutor.
      Task: Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      
      Requirements:
      - definition: A concise, context-relevant English definition (max 10 words).
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) AND the specific grammatical form/case used in the sentence if applicable.
      - exampleSentence: A simple sentence using the word "${word}" to demonstrate usage, appropriate for ${proficiencyLevel} level students.
      - exampleSentenceTranslation: The English translation of the example sentence.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return AnalyzeWordSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        exampleSentence: "Could not generate example",
        exampleSentenceTranslation: "",
      };
    }
  },

  async generateSentenceForWord(
    targetWord: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string,
    proficiencyLevel: string = "A1",
  ): Promise<z.infer<typeof GenerateSentenceSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        targetSentence: { type: "STRING" },
        nativeTranslation: { type: "STRING" },
        targetWordTranslation: { type: "STRING" },
        targetWordPartOfSpeech: {
          type: "STRING",
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"],
        },
        notes: { type: "STRING" },
        ...(language === LanguageId.Japanese
          ? { furigana: { type: "STRING" } }
          : {}),
      },
      required: [
        "targetSentence",
        "nativeTranslation",
        "targetWordTranslation",
        "targetWordPartOfSpeech",
        "notes",
      ],
    };

    let prompt = `
      Role: Native Speaker & Language Teacher.
      Task: Generate a practical, natural ${langName} sentence using the word "${targetWord}".
      
      Guidelines:
      - The sentence must be natural and grammatically correct.
      - Useful for a learner (${proficiencyLevel} level).
      - Context should make the meaning of "${targetWord}" clear.
      
      Fields:
      - targetSentence: A natural ${langName} sentence containing "${targetWord}". Wrap the target word in <b> tags. Example: "This is a <b>test</b>."
      - nativeTranslation: Natural English translation.
      - targetWordTranslation: English translation of "${targetWord}".
      - targetWordPartOfSpeech: Exactly one of: "noun", "verb", "adjective", "adverb", "pronoun".
      - notes: A brief, helpful grammar note about how the word is functioning in this specific sentence (e.g. case usage, conjugation). Max 2 sentences.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL targetSentence with furigana in the format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。" (Ensure the brackets are correct).
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return GenerateSentenceSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      throw new Error("Failed to generate sentence for word");
    }
  },

  async generateCardContent(
    sentence: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string,
  ): Promise<z.infer<typeof GenerateCardSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        translation: { type: "STRING" },
        targetWord: { type: "STRING" },
        targetWordTranslation: { type: "STRING" },
        targetWordPartOfSpeech: {
          type: "STRING",
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"],
        },
        notes: { type: "STRING" },
        formattedSentence: { type: "STRING" },
        ...(language === LanguageId.Japanese
          ? { furigana: { type: "STRING" } }
          : {}),
      },
      required: [
        "translation",
        "targetWord",
        "targetWordTranslation",
        "targetWordPartOfSpeech",
        "notes",
        "formattedSentence",
      ],
    };

    let prompt = `
      Role: Expert Language Teacher.
      Task: Create a high-quality flashcard from this ${langName} sentence: "${sentence}".
      
      Fields:
      - translation: Natural, idiomatic English translation.
      - targetWord: The most important word to learn from this sentence.
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: One of: noun, verb, adjective, adverb, pronoun.
      - notes: Concise grammar explanation (max 2 sentences) specific to this sentence's structure or the target word's usage.
      - formattedSentence: The original sentence with the target word wrapped in <b> tags.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL sentence with furigana in format "Kanji[reading]" for ALL Kanji.
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
          `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return GenerateCardSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        translation: "",
        notes: "",
      };
    }
  },

  async generateBatchCards({
    instructions,
    count,
    language,
    apiKey,
    learnedWords,
    proficiencyLevel = "A1",
    difficultyMode = "immersive",
    wordTypeFilters,
  }: BatchGenerationOptions & { apiKey: string }): Promise<
    GeneratedCardData[]
  > {
    const langName = getLangName(language);

    const hasLearnedWords = learnedWords && learnedWords.length > 0;

    let progressionRules = "";

    if (difficultyMode === "beginner") {
      if (hasLearnedWords) {
        progressionRules = `
        CRITICAL PROGRESSION RULES(Continued Learning):
        This is a SEQUENTIAL LESSON extending the user's existing knowledge.

        User ALREADY KNOWS: ${learnedWords!.length} words.
        
        1. ** NO SINGLE WORDS **: Do NOT generate cards with just 1 word.
        2. ** Contextual Learning **: Combine[Known Word]+[NEW Word].
        3. ** Progression **:
    - Cards 1 - ${Math.ceil(count / 2)}: Simple phrases using * mostly * known words + 1 NEW word.
            - Cards ${Math.ceil(count / 2) + 1} -${count}: Complete simple sentences.
        
        INTERNAL STATE REQUIREMENT:
    - Track "Introduced Vocabulary".
        - ** Constraint **: A card should NOT contain more than 1 unknown word(a word that is NOT in "LearnedWords" and NOT in "Introduced Vocabulary").
        `;
      } else {
        progressionRules = `
        CRITICAL PROGRESSION RULES(Zero - to - Hero):
        This is a SEQUENTIAL LESSON.Card N must build upon Cards 1...(N - 1).

        1. ** Card 1 - 2 **: Foundation.ABSOLUTE BASICS. 1 - 2 words max.
        2. ** Card 3 - ${Math.ceil(count / 2)}**: Simple combinations.Reuse words from Cards 1 - 2.
    3. ** Card ${Math.ceil(count / 2) + 1} -${count}**: Basic sentences.STRICTLY REUSE specific vocabulary from previous cards + introduce ONLY 1 new word per card.
        
        INTERNAL STATE REQUIREMENT:
    - Track the "Introduced Vocabulary" list internally as you generate.
        `;
      }
    } else {
      const iPlusOneRule = hasLearnedWords
        ? `- ** Comprehensible Input **: Prioritize using words from "Known Vocabulary" to construct the sentence, ensuring the context is understood, while teaching the NEW "targetWord".`
        : "";

      progressionRules = `
    CRITICAL: Each card MUST contain a COMPLETE, NATURAL SENTENCE.
        - The sentence must demonstrate vivid, real usage of the target vocabulary word.
        - NEVER return just the word alone — always wrap it in a meaningful context.
      ${iPlusOneRule}
    - Sentence complexity should match ${proficiencyLevel} level.
        - Variety: Mix statements, questions, and imperatives.
        - ** DIVERSITY REQUIREMENT **: Generate ${count} DISTINCT target words. 
        - ** CONSTRAINT **: Do NOT use the same "targetWord" more than once in this batch.
        `;
    }

    const shuffledLearnedWords = learnedWords
      ? [...learnedWords].sort(() => 0.5 - Math.random()).slice(0, 1000)
      : [];

    const knownWordsContext = hasLearnedWords
      ? `
        KNOWN VOCABULARY(User knows ${learnedWords!.length} words, showing ${shuffledLearnedWords.length} sample):
    [${shuffledLearnedWords.join(", ")}]
        
        Use these known words to provide context.The "targetWord" MUST be a NEW word not in this list.
        `
      : "User has NO prior vocabulary. Start from scratch.";

    const allWordTypes: WordType[] = [
      "noun",
      "verb",
      "adjective",
      "adverb",
      "pronoun",
      "preposition",
      "conjunction",
      "interjection",
    ];
    const wordTypesForSchema =
      wordTypeFilters && wordTypeFilters.length > 0
        ? wordTypeFilters
        : allWordTypes;

    const cardSchemaProperties: Record<string, GeminiSchemaProperty> = {
      targetSentence: {
        type: "STRING",
        description: `A natural ${langName} sentence utilizing the target word. Wrap the target word in <b> tags.`,
      },
      nativeTranslation: {
        type: "STRING",
        description: "Natural English translation.",
      },
      targetWord: {
        type: "STRING",
        description: "The main word being taught (lemma form preferred).",
      },
      targetWordTranslation: { type: "STRING" },
      targetWordPartOfSpeech: {
        type: "STRING",
        enum: wordTypesForSchema,
      },
      grammaticalCase: { type: "STRING" },
      gender: { type: "STRING" },
      notes: {
        type: "STRING",
        description: "Brief grammar note (max 2 sentences).",
      },
    };

    const requiredFields = [
      "targetSentence",
      "nativeTranslation",
      "targetWord",
      "targetWordTranslation",
      "targetWordPartOfSpeech",
      "notes",
    ];

    if (language === LanguageId.Japanese) {
      cardSchemaProperties.furigana = {
        type: "STRING",
        description:
          "The FULL targetSentence with kanji readings in Kanji[reading] format for ALL kanji characters",
      };
      requiredFields.push("furigana");
    }

    const cardSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: cardSchemaProperties,
      required: requiredFields,
    };

    const responseSchema: GeminiResponseSchema = {
      type: "ARRAY",
      items: cardSchema,
    };

    const prompt = `
    Role: Expert ${langName} curriculum designer.
      Task: Generate a set of ${count} high - quality flashcards.
        Topic: "${instructions}"
      
      ${progressionRules}
      
      ${
        wordTypeFilters && wordTypeFilters.length > 0
          ? `
      WORD TYPE CONSTRAINT:
      - The "targetWord" in EACH card MUST be one of: ${wordTypeFilters.join(", ")}.
      `
          : ""
      }
      
      Style Guidelines:
    - Tone: Natural, friendly, helpful.
      - ** Vocabulary Strategy **:
    - Repeats of * learned * words is encouraged for context.
          - ** Target Words **: MUST BE UNIQUE.
      - Content: Tangible, visual, and concrete concepts first.

      ${knownWordsContext}

    IMPORTANT: Generate exactly ${count} cards.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    try {
      const parsed = parseAIJSON(result);

      if (!Array.isArray(parsed)) {
        console.warn("Gemini did not return an array:", parsed);
        return [];
      }

      const validCards: GeneratedCardData[] = [];
      for (const item of parsed) {
        const validation = GeneratedCardDataSchema.safeParse(item);
        if (validation.success) {
          validCards.push(validation.data);
        } else {
          console.warn(
            "Skipping invalid card from batch:",
            item,
            validation.error,
          );
        }
      }

      const filtered = validCards.filter((c) => {
        const matchesType =
          !wordTypeFilters ||
          wordTypeFilters.length === 0 ||
          (c.targetWordPartOfSpeech &&
            wordTypeFilters.includes(c.targetWordPartOfSpeech as WordType));
        return matchesType;
      });

      const seenWords = new Set<string>();
      const uniqueCards: GeneratedCardData[] = [];

      for (const card of filtered) {
        const normalizedWord = card.targetWord.trim().toLowerCase();
        if (!seenWords.has(normalizedWord)) {
          seenWords.add(normalizedWord);
          uniqueCards.push(card);
        }
      }

      return uniqueCards;
    } catch (e) {
      console.error("Failed to parse AI batch response", e, "\nRaw:", result);
      throw new Error("Failed to generate valid cards");
    }
  },

  async modifyCard(
    card: {
      targetWord: string;
      targetSentence: string;
      language: (typeof LanguageId)[keyof typeof LanguageId];
    },
    modificationType: "easier" | "harder",
    apiKey: string,
  ): Promise<z.infer<typeof GenerateCardSchema>> {
    const langName = getLangName(card.language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        translation: { type: "STRING" },
        targetWord: { type: "STRING" },
        targetWordTranslation: { type: "STRING" },
        targetWordPartOfSpeech: {
          type: "STRING",
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"],
        },
        notes: { type: "STRING" },
        formattedSentence: { type: "STRING" },
        ...(card.language === LanguageId.Japanese
          ? { furigana: { type: "STRING" } }
          : {}),
      },
      required: [
        "translation",
        "targetWord",
        "targetWordTranslation",
        "targetWordPartOfSpeech",
        "notes",
        "formattedSentence",
      ],
    };

    let prompt = `
      Role: Expert Language Teacher.
      Task: Modify a flashcard to make the sentence ${modificationType.toUpperCase()}.
      
      Original Card Info:
      - Target Word: "${card.targetWord}" (MUST KEEP THIS WORD)
      - Current Sentence: "${card.targetSentence}"
      
      Modification Goal: ${
        modificationType === "easier"
          ? "Create a SLIGHTLY simpler sentence. Use clearer sentence structure while keeping natural flow. Aim for one CEFR level lower if possible."
          : "Create a SLIGHTLY more advanced sentence. Incorporate more natural/idiomatic phrasing or slightly more complex grammar, but do NOT make it obscure or archaic. Aim for one CEFR level higher."
      }
      
      Fields:
      - translation: Natural English translation of the NEW sentence.
      - targetWord: The target word "${card.targetWord}".
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: Part of speech for the target word in the new sentence.
      - notes: Concise grammar note about the new sentence structure.
      - formattedSentence: The new sentence with the target word wrapped in <b> tags.
    `;

    if (card.language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL new sentence with furigana in format "Kanji[reading]" for ALL Kanji.
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return GenerateCardSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI modify response", e, "\nRaw:", result);
      throw new Error("Failed to modify card");
    }
  },
};
