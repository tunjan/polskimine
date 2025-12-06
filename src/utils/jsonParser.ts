export const repairJSON = (jsonString: string): string => {
    // Remove markdown code blocks if present
    let cleaned = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1');

    // Remove any text before the first '{' or '['
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        start = Math.min(firstBrace, firstBracket);
    } else {
        start = Math.max(firstBrace, firstBracket);
    }

    if (start !== -1) {
        cleaned = cleaned.substring(start);
    }

    // Remove any text after the last '}' or ']'
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (end !== -1) {
        cleaned = cleaned.substring(0, end + 1);
    }

    // Attempt basic repairs
    // 1. Trailing commas (e.g. "a": 1, } -> "a": 1 })
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // 2. Unquoted keys (e.g. { key: "value" } -> { "key": "value" })
    // CAUTION: This regex is simple and might catch false positives in strings. 
    // Ideally we assume LLM produces valid JSON structure but might mess up minor syntax.
    // cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

    return cleaned;
};

export const parseAIJSON = <T>(jsonString: string): T => {
    const repaired = repairJSON(jsonString);
    try {
        return JSON.parse(repaired) as T;
    } catch (e) {
        // Fallback: try to parse with a more lenient parser if we had one (e.g. json5)
        // For now, re-throw with context
        console.error("JSON Parse Error on:", jsonString, "\nRepaired:", repaired);
        throw new Error("Failed to parse AI output.");
    }
};
