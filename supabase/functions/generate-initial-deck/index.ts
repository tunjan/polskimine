import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

interface GenerateInitialDeckRequest {
    language: 'polish' | 'norwegian' | 'japanese' | 'spanish';
    proficiencyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    apiKey?: string;
}

const LEVEL_DESCRIPTIONS = {
    A1: 'beginner - basic phrases, greetings, simple present tense',
    A2: 'elementary - everyday expressions, simple past, basic questions',
    B1: 'intermediate - connected text, express opinions, common idioms',
    B2: 'upper intermediate - complex topics, abstract ideas, nuanced expressions',
    C1: 'advanced - sophisticated vocabulary, idiomatic expressions, subtle meanings',
    C2: 'mastery - near-native fluency, literary expressions, specialized vocabulary'
};

function extractJSON(text: string): string {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
        return jsonBlockMatch[1];
    }

    // Find first { or [ and last } or ]
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

serve(async (req) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const { language, proficiencyLevel, apiKey } = await req.json() as GenerateInitialDeckRequest;

        // Get API key from request or environment
        const geminiApiKey = apiKey || Deno.env.get('GEMINI_API_KEY');

        if (!geminiApiKey) {
            return new Response(
                JSON.stringify({ error: 'Gemini API Key is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                }
            );
        }

        const languageName = language === 'norwegian' ? 'Norwegian' :
            (language === 'japanese' ? 'Japanese' :
                (language === 'spanish' ? 'Spanish' : 'Polish'));

        const levelDescription = LEVEL_DESCRIPTIONS[proficiencyLevel];

        // Construct prompt for Gemini
        let prompt = `Generate 50 flashcard sentences for a ${proficiencyLevel} level ${languageName} learner.

Level description: ${levelDescription}


Requirements:
- Cover essential vocabulary and grammar for ${proficiencyLevel} level
- Mix everyday situations: greetings, food, travel, work, hobbies, weather
- Gradually increase complexity across the 50 cards
- Focus on practical, useful sentences
- Include common verbs, adjectives, and nouns for this level

Return a JSON array of exactly 50 objects. Each object MUST have ALL of these fields:
- targetSentence: A sentence in ${languageName}
- nativeTranslation: English translation
- targetWord: The key vocabulary word being taught. MUST be one of: noun, verb, adjective, adverb, or pronoun.
- targetWordTranslation: English translation of ONLY the target word (not the sentence)
- targetWordPartOfSpeech: The part of speech of the target word (must be exactly one of: "noun", "verb", "adjective", "adverb", or "pronoun")
- notes: Brief grammar note (1 sentence, keep it simple)

EXAMPLE FORMAT:
{
  "targetSentence": "Kot śpi na krześle.",
  "nativeTranslation": "The cat is sleeping on the chair.",
  "targetWord": "kot",
  "targetWordTranslation": "cat",
  "targetWordPartOfSpeech": "noun",
  "notes": "Nominative case masculine animate noun."
}
`;

        if (language === 'japanese') {
            prompt += `- furigana: The sentence with furigana in format "Kanji[reading]". Example: "私[わたし]は日本語[にほんご]を勉強[べんきょう]しています。"\n`;
        }

        prompt += `\nReturn ONLY the JSON array. No markdown formatting, no explanations.`;

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8000,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return new Response(
                JSON.stringify({ error: 'Failed to generate deck. Please check your API key.' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                }
            );
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No text generated from Gemini');
        }

        // Parse the JSON response
        const cleanedText = extractJSON(generatedText);
        const cards = JSON.parse(cleanedText);

        if (!Array.isArray(cards)) {
            throw new Error('Response is not an array');
        }

        // Validate and format cards
        const formattedCards = cards.slice(0, 50).map((card: any) => ({
            targetSentence: card.targetSentence || '',
            nativeTranslation: card.nativeTranslation || '',
            targetWord: card.targetWord || '',
            targetWordTranslation: card.targetWordTranslation || '',
            targetWordPartOfSpeech: card.targetWordPartOfSpeech || '',
            notes: card.notes || '',
            furigana: language === 'japanese' ? (card.furigana || '') : undefined,
            language,
            status: 'new',
            interval: 0,
            easeFactor: 2.5,
            tags: [proficiencyLevel]
        }));

        return new Response(
            JSON.stringify({ cards: formattedCards }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
        );

    } catch (error: any) {
        console.error('Error generating initial deck:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            }
        );
    }
});

