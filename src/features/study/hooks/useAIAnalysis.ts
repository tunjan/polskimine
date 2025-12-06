import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/features/deck/services/ai';
import { getCardByTargetWord } from '@/services/db/repositories/cardRepository';
import { db } from '@/services/db/dexie';
import { parseFurigana } from '@/lib/utils';
import { Card, Language, LanguageId } from '@/types';

interface UseAIAnalysisProps {
    card: Card;
    language: Language;
    apiKey?: string;
    selection: { text: string } | null;
    clearSelection: () => void;
    onAddCard?: (card: Card) => void;
}

export function useAIAnalysis({
    card,
    language,
    apiKey,
    selection,
    clearSelection,
    onAddCard
}: UseAIAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        originalText: string;
        definition: string;
        partOfSpeech: string;
        contextMeaning: string
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
        try {
            const result = await aiService.analyzeWord(selection.text, card.targetSentence, language, apiKey);
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
            const lemma = await aiService.lemmatizeWord(selection.text, language, apiKey);

            const existingCard = await getCardByTargetWord(lemma, language);
            if (existingCard) {
                const isPrioritizable = existingCard.status === 'new';
                toast.error(`Card already exists for "${lemma}"`, {
                    action: isPrioritizable ? {
                        label: 'Prioritize',
                        onClick: async () => {
                            try {
                                await db.cards.where('id').equals(existingCard.id).modify({ dueDate: new Date(0).toISOString() });
                                toast.success(`"${lemma}" moved to top of queue`);
                            } catch (e) {
                                toast.error('Failed to prioritize card');
                            }
                        }
                    } : undefined,
                    duration: 5000
                });
                clearSelection();
                setIsGeneratingCard(false);
                return;
            }

            const result = await aiService.generateSentenceForWord(lemma, language, apiKey);

            let targetSentence = result.targetSentence;
            if (language === LanguageId.Japanese && result.furigana) {
                targetSentence = parseFurigana(result.furigana).map(s => s.text).join("");
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
                status: 'new',
                interval: 0,
                easeFactor: 2.5,
                dueDate: tomorrow.toISOString(),
                reps: 0,
                lapses: 0,
                tags: ['AI-Gen', 'From-Study']
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

    return {
        isAnalyzing,
        analysisResult,
        isAnalysisOpen,
        setIsAnalysisOpen,
        isGeneratingCard,
        handleAnalyze,
        handleGenerateCard
    };
}
