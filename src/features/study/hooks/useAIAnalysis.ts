import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { aiService } from "@/lib/ai";
import { getCardByTargetWord } from "@/db/repositories/cardRepository";
import { db } from "@/db/dexie";
import { parseFurigana } from "@/lib/utils";
import { Card, Language, LanguageId } from "@/types";
import { useSettingsStore } from "@/stores/useSettingsStore";

interface UseAIAnalysisProps {
  card: Card;
  language: Language;
  apiKey?: string;
  selection: { text: string } | null;
  clearSelection: () => void;
  onAddCard?: (card: Card) => void;
  onUpdateCard?: (card: Card) => void;
}

export function useAIAnalysis({
  card,
  language,
  apiKey,
  selection,
  clearSelection,
  onAddCard,
  onUpdateCard,
}: UseAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    originalText: string;
    definition: string;
    partOfSpeech: string;
    exampleSentence: string;
    exampleSentenceTranslation: string;
  } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => {
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
  }, [card.id]);

  const handleAnalyze = async () => {
    if (!selection) return;
    if (!apiKey) {
      toast.error("API Key required.");
      clearSelection();
      return;
    }
    setIsAnalyzing(true);
    const proficiency =
      useSettingsStore.getState().proficiency[language] || "A1";
    try {
      const result = await aiService.analyzeWord(
        selection.text,
        card.targetSentence,
        language,
        apiKey,
        proficiency,
      );
      setAnalysisResult({ ...result, originalText: selection.text });
      setIsAnalysisOpen(true);
      clearSelection();
    } catch (e) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCard = async () => {
    if (!selection) return;
    if (!apiKey) {
      toast.error("API Key required.");
      clearSelection();
      return;
    }
    if (!onAddCard) {
      toast.error("Cannot add card from here.");
      clearSelection();
      return;
    }
    setIsGeneratingCard(true);
    try {
      const lemma = await aiService.lemmatizeWord(
        selection.text,
        language,
        apiKey,
      );

      const existingCard = await getCardByTargetWord(lemma, language);
      if (existingCard) {
        const isPrioritizable = existingCard.type === 0;
        toast.error(`Card already exists for "${lemma}"`, {
          action: isPrioritizable
            ? {
                label: "Prioritize",
                onClick: async () => {
                  try {
                    await db.cards
                      .where("id")
                      .equals(existingCard.id)
                      .modify({ due: 0, queue: 0 });                     toast.success(`"${lemma}" moved to top of queue`);
                  } catch (e) {
                    toast.error("Failed to prioritize card");
                  }
                },
              }
            : undefined,
          duration: 5000,
        });
        clearSelection();
        setIsGeneratingCard(false);
        return;
      }

      const proficiency =
        useSettingsStore.getState().proficiency[language] || "A1";

      const result = await aiService.generateSentenceForWord(
        lemma,
        language,
        apiKey,
        proficiency,
      );

      let targetSentence = result.targetSentence;
      if (language === LanguageId.Japanese && result.furigana) {
        targetSentence = parseFurigana(result.furigana)
          .map((s) => s.text)
          .join("");
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(4, 0, 0, 1);
      const newCard: Card = {
        id: uuidv4(),
        targetSentence,
        targetWord: lemma,
        targetWordTranslation: result.targetWordTranslation,
        targetWordPartOfSpeech: result.targetWordPartOfSpeech,
        nativeTranslation: result.nativeTranslation,
        notes: result.notes,
        furigana: result.furigana,
        language,
        type: 0,         queue: 0,
        due: 0,         last_modified: 0,
        left: 0,
        
        interval: 0,
        easeFactor: 2.5,
                reps: 0,
        lapses: 0,
      };

      onAddCard(newCard);
      toast.success(`Card created for "${lemma}" — scheduled for tomorrow`);
      clearSelection();
    } catch (e) {
      toast.error("Failed to generate card.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleModifyCard = async (type: "easier" | "harder") => {
    if (!apiKey) {
      toast.error("API Key required.");
      return;
    }
    if (!onUpdateCard) {
      toast.error("Modification not supported here.");
      return;
    }

    setIsModifying(true);
    try {
      const result = await aiService.modifyCard(
        {
          targetWord: card.targetWord ?? "",
          targetSentence: card.targetSentence,
          language: card.language,
        },
        type,
        apiKey,
      );

      const updatedCard: Card = {
        ...card,
        targetSentence:
          result.formattedSentence || result.targetWord || card.targetSentence,
        targetWord: result.targetWord || card.targetWord,
        targetWordTranslation:
          result.targetWordTranslation || card.targetWordTranslation,
        targetWordPartOfSpeech:
          result.targetWordPartOfSpeech || card.targetWordPartOfSpeech,
        nativeTranslation: result.translation || card.nativeTranslation,
        notes: result.notes || card.notes,
        furigana: result.furigana || card.furigana,
      };

      onUpdateCard(updatedCard);
      toast.success("Card modified successfully");
      setIsAnalysisOpen(false);
      clearSelection();
    } catch (e) {
      toast.error("Failed to modify card");
      console.error(e);
    } finally {
      setIsModifying(false);
    }
  };

  return {
    isAnalyzing,
    isModifying,
    analysisResult,
    isAnalysisOpen,
    setIsAnalysisOpen,
    isGeneratingCard,
    handleAnalyze,
    handleGenerateCard,
    handleModifyCard,
  };
}
