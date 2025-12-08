import { useState } from "react";
import { aiService, WordType } from "@/lib/ai";
import { useSettingsStore, SettingsState } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";

import {
  getLearnedWords,
  getAllTargetWords,
} from "@/db/repositories/cardRepository";
import { Card as CardType } from "@/types";
import { toast } from "sonner";
import { createNewCardWithOffset } from "@/features/collection/utils/cardFactory";

interface UseCardGeneratorProps {
  onClose: () => void;
  onAddCards: (cards: CardType[]) => void;
}

export const useCardGenerator = ({
  onClose,
  onAddCards,
}: UseCardGeneratorProps) => {
  const { language, geminiApiKey, proficiency } = useSettingsStore(
    useShallow((s: SettingsState) => ({
      language: s.language,
      geminiApiKey: s.geminiApiKey,
      proficiency: s.proficiency,
    })),
  );

  const [step, setStep] = useState<"config" | "preview">("config");
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [count, setCount] = useState([5]);
  const [useLearnedWords, setUseLearnedWords] = useState(true);
  const [difficultyMode, setDifficultyMode] = useState<
    "beginner" | "immersive"
  >("immersive");
  const [selectedLevel, setSelectedLevel] = useState<string>(
    proficiency?.[language] || "A1",
  );
  const [selectedWordTypes, setSelectedWordTypes] = useState<WordType[]>([]);

  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );

  const reset = () => {
    onClose();
    setTimeout(() => {
      setStep("config");
      setInstructions("");
      setGeneratedData([]);
      setSelectedWordTypes([]);
      setLoading(false);
    }, 200);
  };

  const toggleWordType = (type: WordType) => {
    setSelectedWordTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleTopicClick = (topic: string) => {
    setInstructions((prev) => (prev ? `${prev} ${topic}` : topic));
  };

  const generateCards = async (customInstructions?: string) => {
    const finalInstructions = customInstructions || instructions;

    if (!finalInstructions) {
      toast.error("Please enter specific topic or instructions");
      return;
    }
    if (!geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings");
      return;
    }

    setLoading(true);
    try {
      let learnedWords: string[] = [];
      try {
        if (useLearnedWords) {
          learnedWords = await getLearnedWords(language);
        }
      } catch (e) {
        console.warn("Failed to fetch learned words", e);
      }

      // Fetch ALL words to check for duplicates (including "New" cards)
      const allWords = await getAllTargetWords(language).catch(() => []);

      const results = await aiService.generateBatchCards({
        instructions: finalInstructions,
        count: count[0],
        language: language,
        apiKey: geminiApiKey,
        learnedWords: useLearnedWords ? learnedWords : undefined,
        proficiencyLevel: selectedLevel,
        difficultyMode,
        wordTypeFilters:
          selectedWordTypes.length > 0 ? selectedWordTypes : undefined,
      });

      const existingWordSet = new Set(allWords.map((w) => w.toLowerCase()));
      const uniqueResults = results.filter((card: any) => {
        return (
          card.targetWord && !existingWordSet.has(card.targetWord.toLowerCase())
        );
      });

      if (uniqueResults.length === 0 && results.length > 0) {
        toast.warning(
          "All generated words were duplicates. Try a harder difficulty or different topic.",
        );
        return;
      }

      if (uniqueResults.length < results.length) {
        toast.info(
          `Filtered ${results.length - uniqueResults.length} known duplicates.`,
        );
      }

      setGeneratedData(uniqueResults);
      setSelectedIndices(new Set(uniqueResults.map((_: any, i: number) => i)));
      setStep("preview");
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error(e.message || "Failed to generate cards");
    } finally {
      setLoading(false);
    }
  };

  const handleSmartLesson = async () => {
    setLoading(true);
    try {
      const learnedWords = await getLearnedWords(language).catch(() => []);

      let prompt = "";
      let mode: "beginner" | "immersive" = difficultyMode;

      if (learnedWords.length === 0) {
        prompt =
          "Basic intro conversation for a complete beginner. Greetings and simple questions.";
        mode = "beginner";
      } else {
        const reviewWords = learnedWords
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);
        prompt = `Create a lesson reviewing these words: ${reviewWords.join(", ")}. Create new sentences using these in different contexts.`;
      }

      setInstructions(prompt);
      setDifficultyMode(mode);

      await generateCards(prompt);
    } catch (e) {
      setLoading(false);
      console.error("Smart lesson failed", e);
    }
  };

  const handleSave = () => {
    // Stagger due dates by 1 second per card for controlled introduction
    const DUE_DATE_OFFSET_MS = 1000;

    const cardsToSave: CardType[] = generatedData
      .filter((_, i) => selectedIndices.has(i))
      .map((item, index) =>
        createNewCardWithOffset(
          {
            language,
            targetSentence: item.targetSentence,
            nativeTranslation: item.nativeTranslation,
            targetWord: item.targetWord,
            targetWordTranslation: item.targetWordTranslation,
            targetWordPartOfSpeech: item.targetWordPartOfSpeech,
            notes: item.notes || "",
            furigana: item.furigana,

          },
          index * DUE_DATE_OFFSET_MS,
        ),
      );

    onAddCards(cardsToSave);
    toast.success(`Saved ${cardsToSave.length} new cards!`);
    reset();
  };

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSelectedIndices(newSet);
  };

  const selectAll = () =>
    setSelectedIndices(new Set(generatedData.map((_, i) => i)));
  const clearSelection = () => setSelectedIndices(new Set());

  return {
    step,
    setStep,
    loading,
    instructions,
    setInstructions,
    count,
    setCount,
    useLearnedWords,
    setUseLearnedWords,
    difficultyMode,
    setDifficultyMode,
    selectedLevel,
    setSelectedLevel,
    selectedWordTypes,
    setSelectedWordTypes,
    toggleWordType,
    handleTopicClick,
    generateCards,
    handleSmartLesson,
    handleSave,
    toggleSelection,
    selectAll,
    clearSelection,
    reset,
    generatedData,
    selectedIndices,
    setSelectedIndices,
  };
};
