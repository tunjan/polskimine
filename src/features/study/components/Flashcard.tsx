import React, { useMemo, useEffect } from 'react';
import { Card, Language, LanguageId } from '@/types';
import { escapeRegExp, parseFurigana, cn, findInflectedWordInSentence } from '@/lib/utils';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardText } from '@/features/deck/hooks/useCardText';
import { Mic, Volume2 } from 'lucide-react';
import { FuriganaRenderer } from '@/components/ui/furigana-renderer';
import { useTextSelection } from '@/features/study/hooks/useTextSelection';
import { AnalysisModal } from '@/features/study/components/AnalysisModal';
import { SelectionMenu } from '@/features/study/components/SelectionMenu';
import { useFlashcardAudio } from '@/features/study/hooks/useFlashcardAudio';
import { useAIAnalysis } from '@/features/study/hooks/useAIAnalysis';
import { useCardInteraction } from '@/features/study/hooks/useCardInteraction';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = LanguageId.Polish,
  onAddCard
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { displayedTranslation, isGaslit, processText } = useCardText(card);
  const { selection, handleMouseUp, clearSelection } = useTextSelection();

  // Reset selection on card change
  useEffect(() => {
    clearSelection();
  }, [card.id, clearSelection]);

  // Use Custom Hooks
  const { isRevealed, setIsRevealed, handleReveal, handleKeyDown } = useCardInteraction({
    cardId: card.id,
    blindMode,
    isFlipped
  });

  const { speak, playSlow } = useFlashcardAudio({
    card,
    language,
    settings,
    isFlipped,
    autoPlayAudio
  });

  const {
    isAnalyzing,
    analysisResult,
    isAnalysisOpen,
    setIsAnalysisOpen,
    isGeneratingCard,
    handleAnalyze,
    handleGenerateCard
  } = useAIAnalysis({
    card,
    language,
    apiKey: settings.geminiApiKey,
    selection,
    clearSelection,
    onAddCard
  });

  const displayedSentence = processText(card.targetSentence);

  const fontSizeClass = useMemo(() => {
    const len = displayedSentence.length;
    if (len < 6) return "text-5xl md:text-7xl tracking-tight font-light";
    if (len < 15) return "text-4xl md:text-6xl tracking-tight font-light";
    if (len < 30) return "text-3xl md:text-5xl tracking-tight font-extralight";
    if (len < 60) return "text-2xl md:text-4xl tracking-normal font-extralight";
    return "text-xl md:text-3xl font-extralight tracking-normal";
  }, [displayedSentence]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
      "text-center text-balance select-text leading-[1.3] text-foreground font-light",
      fontSizeClass
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
          {blindMode && (
            <button
              onClick={(e) => { e.stopPropagation(); speak(); }}
              className="relative p-6 bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group/btn"
            >
              {/* Corner accents */}
              <span className="absolute -top-px -left-px w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
              </span>
              <span className="absolute -bottom-px -right-px w-2 h-2">
                <span className="absolute bottom-0 right-0 w-full h-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
                <span className="absolute bottom-0 right-0 h-full w-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
              </span>
              <Mic size={28} strokeWidth={1} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
            </button>
          )}
          <p className={cn(baseClasses, "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-500")}>
            {(card.targetWord && !settings.showWholeSentenceOnFront) ? processText(card.targetWord) : displayedSentence}
          </p>
        </div>
      );
    }

    if (!isFlipped && card.targetWord && !settings.showWholeSentenceOnFront) {
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

    // Logic to highlight target text or render Japanese logic
    const hasFuriganaInDedicatedField = card.furigana && /\[.+?\]/.test(card.furigana);
    const hasFuriganaInSentence = card.targetSentence && /\[.+?\]/.test(card.targetSentence);

    let furiganaSource: string | undefined;
    if (hasFuriganaInDedicatedField) {
      const furiganaPlainText = parseFurigana(card.furigana!).map(s => s.text).join('');
      const sentencePlainText = card.targetSentence || '';
      if (furiganaPlainText.length >= sentencePlainText.length * 0.5) {
        furiganaSource = card.furigana;
      }
    }
    if (!furiganaSource && hasFuriganaInSentence) {
      furiganaSource = card.targetSentence;
    }
    if (!furiganaSource) {
      furiganaSource = card.targetSentence;
    }

    // If Japanese and using furigana...
    if (language === LanguageId.Japanese && furiganaSource) {
      const segments = parseFurigana(furiganaSource);
      const hasFurigana = segments.some(s => s.furigana);

      if (hasFurigana) {
        const targetWordPlain = card.targetWord
          ? parseFurigana(card.targetWord).map(s => s.text).join('')
          : null;

        const segmentTexts = segments.map(s => s.text);
        const fullText = segmentTexts.join('');
        const targetIndices = new Set<number>();

        if (targetWordPlain) {
          // First try exact match, then try inflected form match
          let targetStart = fullText.indexOf(targetWordPlain);
          let matchedWordLength = targetWordPlain.length;

          if (targetStart === -1) {
            // Try to find inflected form
            const matchedWord = findInflectedWordInSentence(targetWordPlain, fullText);
            if (matchedWord) {
              targetStart = fullText.indexOf(matchedWord);
              matchedWordLength = matchedWord.length;
            }
          }

          if (targetStart !== -1) {
            const targetEnd = targetStart + matchedWordLength;
            let charIndex = 0;
            for (let i = 0; i < segments.length; i++) {
              const segmentStart = charIndex;
              const segmentEnd = charIndex + segments[i].text.length;
              if (segmentStart < targetEnd && segmentEnd > targetStart) {
                targetIndices.add(i);
              }
              charIndex = segmentEnd;
            }
          }
        }

        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {segments.map((segment, i) => {
              const isTarget = targetIndices.has(i);
              if (segment.furigana) {
                return (
                  <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
                    <span className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>
                    <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                      {processText(segment.furigana)}
                    </rt>
                  </ruby>
                );
              }
              return <span key={i} className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>;
            })}
          </div>
        );
      }
    }

    if (card.targetWord) {
      const targetWordPlain = parseFurigana(card.targetWord).map(s => s.text).join('');

      // Find the actual word in the sentence (handles inflected forms like godzina -> godzinie)
      const matchedWord = findInflectedWordInSentence(targetWordPlain, displayedSentence);

      if (matchedWord) {
        // Use the matched word for highlighting (case-insensitive)
        const wordBoundaryRegex = new RegExp(`(\\b${escapeRegExp(matchedWord)}\\b)`, 'gi');
        const parts = displayedSentence.split(wordBoundaryRegex);
        return (
          <p className={baseClasses}>
            {parts.map((part, i) =>
              part.toLowerCase() === matchedWord.toLowerCase()
                ? <span key={i} className="text-primary/90 font-bold">{processText(part)}</span>
                : <span key={i}>{processText(part)}</span>
            )}
          </p>
        );
      }

      // Fallback: no match found, just display the sentence without highlighting
      return <p className={baseClasses}>{displayedSentence}</p>;
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, fontSizeClass, blindMode, speak, isFlipped, card.targetSentence, processText, settings.showWholeSentenceOnFront, handleReveal, handleKeyDown]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        {/* Genshin-styled ornate frame */}
        <div className={cn(
          "absolute inset-4 md:inset-12 pointer-events-none transition-all duration-700",
          isFlipped && ""
        )}>

        </div>

        {/* Main content */}
        <div className={cn(
          "w-full px-8 md:px-16 flex flex-col items-center z-10 transition-all duration-700 ease-out",
          isFlipped && "-translate-y-[80%]"
        )}>
          {RenderedSentence}

          {isRevealed && (
            <button
              onClick={speak}
              className="group relative flex items-center justify-center text-muted-foreground/40 hover:text-primary/70 transition-all duration-300 mt-6"
            >
              <Volume2 size={20} strokeWidth={1.5} className={cn("transition-all duration-300", playSlow && "text-primary")} />
            </button>
          )}
        </div>

        {/* Translation reveal with enhanced game-styled animation */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 bottom-4 text-center flex flex-col items-center gap-3 z-0 pointer-events-none overflow-y-auto">

            {/* Decorative divider - Genshin style */}
            <div className="flex items-center gap-3 my-3 animate-in fade-in duration-500">
              <span className="w-12 h-px bg-linear-to-r from-transparent to-amber-600/80" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-600/80" />
              <span className="w-1 h-1 rotate-45 bg-amber-600/80" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-600/80" />
              <span className="w-12 h-px bg-linear-to-l from-transparent to-amber-600/80" />
            </div>

            {showTranslation && (
              <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards">
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
                      <span className="text-base text-muted-foreground/80 font-light italic">{card.targetWordTranslation}</span>
                    )}
                  </div>
                )}

                <div className="max-w-3xl">
                  <p className={cn(
                    "text-base md:text-xl text-foreground/70 font-light italic text-center leading-relaxed text-balance transition-colors duration-300",
                    isGaslit ? "text-destructive/70" : "group-hover:text-foreground/85"
                  )}>
                    {processText(displayedTranslation)}
                  </p>
                </div>
                {isGaslit && (
                  <span className="absolute -top-5 -right-6 text-[10px] font-ui font-medium uppercase text-destructive/60 tracking-widest rotate-12 opacity-70">
                    Suspicious
                  </span>
                )}
              </div>
            )}

            {card.notes && (
              <div className="mt-2 pointer-events-auto shrink-0 px-6">
                <FuriganaRenderer
                  text={card.notes}
                  className="text-xs font-ui font-light text-foreground text-center tracking-wide leading-relaxed block"
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
});
