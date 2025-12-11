import { createNewCard } from "./cardFactory";
import { LanguageId } from "@/types";

describe("createNewCard", () => {
  it("should include a created_at timestamp", () => {
    const card = createNewCard({
      language: LanguageId.Spanish,
      targetSentence: "Hola mundo",
      nativeTranslation: "Hello world",
      targetWord: "mundo",
      targetWordTranslation: "world",
      targetWordPartOfSpeech: "noun",
    });

    expect(card.created_at).toBeDefined();
    expect(typeof card.created_at).toBe("string");

    const date = new Date(card.created_at!);
    expect(date.toString()).not.toBe("Invalid Date");
  });
});
