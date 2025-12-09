export const repairJSON = (jsonString: string): string => {
  let cleaned = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1");

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else {
    start = Math.max(firstBrace, firstBracket);
  }

  if (start !== -1) {
    cleaned = cleaned.substring(start);
  }

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);

  if (end !== -1) {
    cleaned = cleaned.substring(0, end + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
};

export const parseAIJSON = <T>(jsonString: string): T => {
  const repaired = repairJSON(jsonString);
  try {
    return JSON.parse(repaired) as T;
  } catch (e) {
    console.error("JSON Parse Error on:", jsonString, "\nRepaired:", repaired);
    throw new Error("Failed to parse AI output.");
  }
};
