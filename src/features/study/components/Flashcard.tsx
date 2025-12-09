import React, { useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, Language, LanguageId } from "@/types";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useCardText } from "@/features/collection/hooks/useCardText";
import { Mic, Volume2 } from "lucide-react";
import { FuriganaRenderer } from "@/components/ui/furigana-renderer";
import { useTextSelection } from "@/features/study/hooks/useTextSelection";
import { AnalysisModal } from "@/features/study/components/AnalysisModal";
import { SelectionMenu } from "@/features/study/components/SelectionMenu";
import { useFlashcardAudio } from "@/features/study/hooks/useFlashcardAudio";
import { useAIAnalysis } from "@/features/study/hooks/useAIAnalysis";
import { useCardInteraction } from "@/features/study/hooks/useCardInteraction";
import { Button } from "@/components/ui/button";
import { useCardSentence } from "@/features/study/hooks/useCardSentence";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

export const Flashcard = React.memo<FlashcardProps>(
  ({
    card,
    isFlipped,
    autoPlayAudio = false,
    blindMode = false,
    showTranslation = true,
    language = LanguageId.Polish,
    onAddCard,
  }) => {
    const {
      geminiApiKey,
      showWholeSentenceOnFront,
      tts,
      playTargetWordAudioBeforeSentence,
    } = useSettingsStore(
      useShallow((s) => ({
        geminiApiKey: s.geminiApiKey,
        showWholeSentenceOnFront: s.showWholeSentenceOnFront,
        tts: s.tts,
        playTargetWordAudioBeforeSentence: s.playTargetWordAudioBeforeSentence,
      })),
    );
    const { displayedTranslation, isGaslit, processText } = useCardText(card);
    const { selection, handleMouseUp, clearSelection } = useTextSelection();

    useEffect(() => {
      clearSelection();
    }, [card.id, clearSelection]);

    const { isRevealed, handleReveal, handleKeyDown } = useCardInteraction({
      cardId: card.id,
      blindMode,
      isFlipped,
    });

    const { speak, playSlow } = useFlashcardAudio({
      card,
      language,
      tts,
      isFlipped,
      autoPlayAudio,
      playTargetWordAudioBeforeSentence,
    });

    const {
      isAnalyzing,
      analysisResult,
      isAnalysisOpen,
      setIsAnalysisOpen,
      isGeneratingCard,
      handleAnalyze,
      handleGenerateCard,
    } = useAIAnalysis({
      card,
      language,
      apiKey: geminiApiKey,
      selection,
      clearSelection,
      onAddCard,
    });

    const displayedSentence = processText(card.targetSentence);
    const cleanSentence = displayedSentence.replace(/<\/?b>/g, "");

    const fontSizeClass = useMemo(() => {
      const len = cleanSentence.length;
      if (len < 6) return "text-5xl md:text-7xl font-normal tracking-tight";
      if (len < 15) return "text-4xl md:text-6xl font-normal tracking-tight";
      if (len < 30) return "text-3xl md:text-5xl font-light";
      if (len < 60) return "text-2xl md:text-4xl font-light";
      return "text-xl md:text-3xl font-light";
    }, [displayedSentence]);

    const parsedContent = useCardSentence(card, language);

    const RenderedSentence = useMemo(() => {
      const baseClasses = cn(
        "text-center text-balance select-text leading-[1.3] text-foreground font-light",
        fontSizeClass,
      );

      if (!isRevealed) {
        return (
          <div
            onClick={handleReveal}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Reveal card content"
            className="cursor-pointer group flex flex-col items-center gap-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {blindMode ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-20 w-20 rounded-xl"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    speak();
                  }}
                >
                  <Mic
                    size={28}
                    strokeWidth={1}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  />
                </Button>
                <p
                  className={cn(
                    baseClasses,
                    "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-500",
                  )}
                >
                  {card.targetWord && !showWholeSentenceOnFront
                    ? processText(card.targetWord)
                    : cleanSentence}
                </p>
              </>
            ) : (
              <p className={baseClasses}>
                {card.targetWord && !showWholeSentenceOnFront
                  ? processText(card.targetWord)
                  : displayedSentence}
              </p>
            )}
          </div>
        );
      }

      if (!isFlipped && card.targetWord && !showWholeSentenceOnFront) {
        if (language === LanguageId.Japanese) {
          return (
            <FuriganaRenderer
              text={card.targetWord}
              className={baseClasses}
              processText={processText}
            />
          );
        }
        return <p className={baseClasses}>{processText(card.targetWord)}</p>;
      }

      if (parsedContent.type === "japanese") {
        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {parsedContent.segments.map((segment, i) => {
              const isTarget = parsedContent.targetIndices.has(i);
              if (segment.furigana) {
                return (
                  <ruby
                    key={i}
                    className="group/ruby"
                    style={{ rubyAlign: "center" }}
                  >
                    <span className={isTarget ? "text-primary/90" : ""}>
                      {processText(segment.text)}
                    </span>
                    <rt
                      className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center"
                      style={{ textAlign: "center" }}
                    >
                      {processText(segment.furigana)}
                    </rt>
                  </ruby>
                );
              }
              return (
                <span key={i} className={isTarget ? "text-primary/90" : ""}>
                  {processText(segment.text)}
                </span>
              );
            })}
          </div>
        );
      }

      if (parsedContent.type === "highlight") {
        return (
          <p className={baseClasses}>
            {parsedContent.segments.map((segment, i) =>
              segment.isTarget ? (
                <span key={i} className="text-primary/90 font-bold">
                  {processText(segment.text)}
                </span>
              ) : (
                <span key={i}>{processText(segment.text)}</span>
              ),
            )}
          </p>
        );
      }

      return <p className={baseClasses}>{displayedSentence}</p>;
    }, [
      isRevealed,
      isFlipped,
      blindMode,
      showWholeSentenceOnFront,
      fontSizeClass,
      parsedContent,
      handleReveal,
      handleKeyDown,
      speak,
      processText,
      card.targetWord,
      displayedSentence,
      language,
    ]);

    const containerClasses = cn(
      "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full",
    );

    return (
      <>
        <div
          className={containerClasses}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
        >
          <div
            className={cn(
              "w-full px-8 md:px-16 flex flex-col items-center z-10 transition-all duration-700 ease-out",
              isFlipped && "-translate-y-[80%]",
            )}
          >
            {RenderedSentence}

            {isRevealed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => speak()}
                className="mt-6 text-muted-foreground/40 hover:text-primary/70"
              >
                <Volume2
                  size={24}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-all duration-300",
                    playSlow && "text-primary",
                  )}
                />
              </Button>
            )}
          </div>

          {isFlipped && (
            <div className="absolute top-1/2 left-0 right-0 bottom-4 text-center flex flex-col items-center gap-3 z-0 pointer-events-none overflow-y-auto">
              {showTranslation && (
                <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {card.targetWord && (
                    <div className="flex flex-col items-center gap-0.5 mb-1">
                      <div className="flex items-center gap-2">
                        <FuriganaRenderer
                          text={card.targetWord}
                          className="text-xl md:text-2xl font-light text-primary/90"
                          processText={processText}
                        />
                      </div>
                      {card.targetWordTranslation && (
                        <span className="text-base text-muted-foreground/80 font-light italic">
                          {card.targetWordTranslation}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="max-w-3xl">
                    <p
                      className={cn(
                        "text-base md:text-xl text-foreground/70 font-light italic text-center leading-relaxed text-balance transition-colors duration-300",
                        isGaslit
                          ? "text-destructive/70"
                          : "group-hover:text-foreground/85",
                      )}
                    >
                      {processText(displayedTranslation)}
                    </p>
                  </div>
                  {isGaslit && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-6 -right-8 opacity-80"
                    >
                      Suspicious
                    </Badge>
                  )}
                </div>
              )}

              {card.notes && (
                <div className="mt-2 pointer-events-auto shrink-0 px-6">
                  <FuriganaRenderer
                    text={card.notes}
                    className="text-xs  font-light text-foreground text-center tracking-wide leading-relaxed block"
                    processText={processText}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {selection && (
          <SelectionMenu
            top={selection.top}
            left={selection.left}
            onAnalyze={handleAnalyze}
            onGenerateCard={onAddCard ? handleGenerateCard : undefined}
            isAnalyzing={isAnalyzing}
            isGeneratingCard={isGeneratingCard}
          />
        )}

        <AnalysisModal
          isOpen={isAnalysisOpen}
          onClose={setIsAnalysisOpen}
          result={analysisResult}
        />
      </>
    );
  },
);
