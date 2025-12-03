import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { Play, Sparkles, Quote, Mic, Volume2, Plus } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/game-ui';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { aiService } from '@/features/deck/services/ai';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

// Helper to render text with furigana support (shows furigana on hover)
const FuriganaText: React.FC<{
  text: string;
  className?: string;
  processText?: (text: string) => string;
}> = ({ text, className = '', processText = (t) => t }) => {
  const segments = parseFurigana(text);
  const hasFurigana = segments.some(s => s.furigana);
  
  if (!hasFurigana) {
    return <span className={className}>{processText(text)}</span>;
  }
  
  return (
    <span className={cn(className, "leading-[1.6]")}>
      {segments.map((segment, i) => {
        if (segment.furigana) {
          return (
            <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
              <span>{processText(segment.text)}</span>
              <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                {processText(segment.furigana)}
              </rt>
            </ruby>
          );
        }
        return <span key={i}>{processText(segment.text)}</span>;
      })}
    </span>
  );
};

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = 'polish',
  onAddCard
}) => {
  const { settings } = useSettings();
  const { isCursedWith } = useSabotage();
  const [isRevealed, setIsRevealed] = useState(!blindMode);
  const [playSlow, setPlaySlow] = useState(false);
  const playSlowRef = React.useRef(playSlow);
  const hasSpokenRef = React.useRef<string | null>(null);
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  // Analysis State
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ originalText: string; definition: string; partOfSpeech: string; contextMeaning: string } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  
  // Generate Card State
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => { setIsRevealed(!blindMode); }, [card.id, blindMode]);
  useEffect(() => { if (isFlipped) setIsRevealed(true); }, [isFlipped]);

  useEffect(() => {
    setSelection(null);
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
    setPlaySlow(false);
  }, [card.id]);

  useEffect(() => {
    playSlowRef.current = playSlow;
  }, [playSlow]);

  useEffect(() => {
    if (isCursedWith('gaslight') && Math.random() > 0.5) {
      const randomFake = FAKE_ANSWERS[Math.floor(Math.random() * FAKE_ANSWERS.length)];
      setDisplayedTranslation(randomFake);
      setIsGaslit(true);
    } else {
      setDisplayedTranslation(card.nativeTranslation);
      setIsGaslit(false);
    }
  }, [card.id, isCursedWith]);

  const processText = (text: string) => isCursedWith('uwu') ? uwuify(text) : text;

  const getPlainTextForTTS = useCallback((text: string): string => {
    const segments = parseFurigana(text);
    return segments.map(s => s.text).join('');
  }, []);

  const speak = useCallback(() => {
    const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
    const effectiveSettings = { ...settings.tts, rate: effectiveRate };
    const plainText = getPlainTextForTTS(card.targetSentence);
    ttsService.speak(plainText, language, effectiveSettings);
    setPlaySlow(prev => !prev);
  }, [card.targetSentence, language, settings.tts, getPlainTextForTTS]);

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [card.id]);

  useEffect(() => {
    if (hasSpokenRef.current !== card.id) {
      hasSpokenRef.current = null;
    }
    if (autoPlayAudio && hasSpokenRef.current !== card.id) {
      speak();
      hasSpokenRef.current = card.id;
    }
  }, [card.id, autoPlayAudio, speak]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelection({ text, top: rect.top - 60, left: rect.left + (rect.width / 2) });
  }, []);

  useEffect(() => {
    const clear = () => setSelection(null);
    window.addEventListener('resize', clear);
    window.addEventListener('scroll', clear, true);
    return () => {
      window.removeEventListener('resize', clear);
      window.removeEventListener('scroll', clear, true);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!selection) return;
    if (!settings.geminiApiKey) {
      toast.error("API Key required.");
      setSelection(null);
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeWord(selection.text, card.targetSentence, language, settings.geminiApiKey);
      setAnalysisResult({ ...result, originalText: selection.text });
      setIsAnalysisOpen(true);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCard = async () => {
    if (!selection) return;
    if (!settings.geminiApiKey) {
      toast.error("API Key required.");
      setSelection(null);
      return;
    }
    if (!onAddCard) {
      toast.error("Cannot add card from here.");
      setSelection(null);
      return;
    }
    setIsGeneratingCard(true);
    try {
      const result = await aiService.generateSentenceForWord(selection.text, language, settings.geminiApiKey);
      
      let targetSentence = result.targetSentence;
      if (language === 'japanese' && result.furigana) {
        targetSentence = parseFurigana(result.furigana).map(s => s.text).join("");
      }

      const newCard: Card = {
        id: uuidv4(),
        targetSentence,
        targetWord: selection.text,
        targetWordTranslation: result.targetWordTranslation,
        targetWordPartOfSpeech: result.targetWordPartOfSpeech,
        nativeTranslation: result.nativeTranslation,
        notes: result.notes,
        furigana: result.furigana,
        language,
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        tags: ['AI-Gen', 'From-Study']
      };

      onAddCard(newCard);
      toast.success(`Card created for "${selection.text}"`);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      toast.error("Failed to generate card.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

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
        <div onClick={() => setIsRevealed(true)} className="cursor-pointer group flex flex-col items-center gap-8">
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
            {card.targetWord ? processText(card.targetWord) : displayedSentence}
          </p>
        </div>
      );
    }

    // If not flipped (Front), show target word if available
    if (!isFlipped && card.targetWord) {
      // For Japanese, parse furigana from the targetWord (it may contain furigana markup)
      if (language === 'japanese') {
        const segments = parseFurigana(card.targetWord);
        const hasFurigana = segments.some(s => s.furigana);
        if (hasFurigana) {
          return (
            <FuriganaText 
              text={card.targetWord} 
              className={baseClasses}
              processText={processText}
            />
          );
        }
      }
      return <p className={baseClasses}>{processText(card.targetWord)}</p>;
    }

    const furiganaSource = card.furigana || card.targetSentence;
    if (language === 'japanese' && furiganaSource) {
      const segments = parseFurigana(furiganaSource);
      const hasFurigana = segments.some(s => s.furigana);
      
      if (hasFurigana) {
        // Extract plain text from targetWord for comparison (remove furigana markup)
        const targetWordPlain = card.targetWord 
          ? parseFurigana(card.targetWord).map(s => s.text).join('')
          : null;
        
        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {segments.map((segment, i) => {
              const isTarget = targetWordPlain && (targetWordPlain === segment.text || targetWordPlain.includes(segment.text) || segment.text.includes(targetWordPlain));
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
      // Extract plain text from targetWord for comparison (remove furigana markup)
      const targetWordPlain = parseFurigana(card.targetWord).map(s => s.text).join('');
      const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(targetWordPlain)})`, 'gi'));
      return (
        <p className={baseClasses}>
          {parts.map((part, i) =>
            part.toLowerCase() === targetWordPlain.toLowerCase()
              ? <span key={i} className="text-primary/90 font-bold">{processText(part)}</span>
              : <span key={i}>{processText(part)}</span>
          )}
        </p>
      );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass, blindMode, speak, isFlipped]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full",
    isCursedWith('rotate') && "rotate-180",
    isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
    isCursedWith('blur') && "animate-pulse blur-[1px]"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        {/* Game-styled decorative frame */}
        <div className="absolute inset-8 md:inset-16 pointer-events-none">
          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-6 h-6">
            <span className="absolute top-0 left-0 w-full h-px bg-border/20" />
            <span className="absolute top-0 left-0 h-full w-px bg-border/20" />
          </span>
          <span className="absolute top-0 right-0 w-6 h-6">
            <span className="absolute top-0 right-0 w-full h-px bg-border/20" />
            <span className="absolute top-0 right-0 h-full w-px bg-border/20" />
          </span>
          <span className="absolute bottom-0 left-0 w-6 h-6">
            <span className="absolute bottom-0 left-0 w-full h-px bg-border/20" />
            <span className="absolute bottom-0 left-0 h-full w-px bg-border/20" />
          </span>
          <span className="absolute bottom-0 right-0 w-6 h-6">
            <span className="absolute bottom-0 right-0 w-full h-px bg-border/20" />
            <span className="absolute bottom-0 right-0 h-full w-px bg-border/20" />
          </span>
        </div>

        {/* Main content */}
        <div className="w-full px-8 md:px-16 flex flex-col items-center gap-6 md:gap-6 z-10">
          {RenderedSentence}

          {isRevealed && (
            <button
              onClick={speak}
              className="group relative flex items-center justify-center text-muted-foreground/40 hover:text-primary/70 transition-all duration-300 mt-4 p-3 border border-transparent hover:border-primary/20 hover:bg-primary/5"
            >
              {/* Corner accents on hover */}
              <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute top-0 left-0 w-full h-px bg-primary/40" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary/40" />
              </span>
              <span className="absolute -bottom-px -right-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute bottom-0 right-0 w-full h-px bg-primary/40" />
                <span className="absolute bottom-0 right-0 h-full w-px bg-primary/40" />
              </span>
              <Volume2 size={20} strokeWidth={1.5} className={cn("transition-all duration-300", playSlow && "text-primary")} />
            </button>
          )}
        </div>

        {/* Translation reveal with game-styled animation */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 bottom-4 pt-12 md:pt-16 flex flex-col items-center gap-3 z-0 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto">


            {showTranslation && (
              <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1">
                {card.targetWord && (
                  <div className="flex flex-col items-center gap-0.5 mb-1">
                    <div className="flex items-center gap-2">
                      <FuriganaText 
                        text={card.targetWord}
                        className="text-xl md:text-2xl font-light text-primary/90"
                        processText={processText}
                      />
                      {card.targetWordPartOfSpeech && (
                        <span className="text-[9px] font-ui font-medium uppercase border border-border/60 px-1.5 py-0.5 text-muted-foreground/80 tracking-widest">
                          {card.targetWordPartOfSpeech}
                        </span>
                      )}
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
                  <span className="absolute -top-5 -right-6 text-[8px] font-ui font-medium uppercase text-destructive/60 tracking-widest rotate-12 opacity-70">
                    Suspicious
                  </span>
                )}
              </div>
            )}

            {card.notes && (
              <div className="mt-2 pointer-events-auto shrink-0">
                <FuriganaText 
                  text={card.notes}
                  className="text-xs font-ui font-light text-foreground text-center tracking-wide leading-relaxed block"
                  processText={processText}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game-styled floating selection menu */}
      {selection && (
        <div
          className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
          style={{ top: selection.top, left: selection.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isGeneratingCard}
            className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
          >
            {/* Corner accents */}
            <span className="absolute -top-px -left-px w-2 h-2">
              <span className="absolute top-0 left-0 w-full h-px bg-primary" />
              <span className="absolute top-0 left-0 h-full w-px bg-primary" />
            </span>
            <span className="absolute -bottom-px -right-px w-2 h-2">
              <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
              <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
            </span>
            {isAnalyzing ? <ButtonLoader /> : <Sparkles size={11} strokeWidth={2} className="text-primary" />}
            <span>Analyze</span>
          </button>
          {onAddCard && (
            <button
              onClick={handleGenerateCard}
              disabled={isAnalyzing || isGeneratingCard}
              className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
            >
              {/* Corner accents */}
              <span className="absolute -top-px -left-px w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary" />
              </span>
              <span className="absolute -bottom-px -right-px w-2 h-2">
                <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
              </span>
              {isGeneratingCard ? <ButtonLoader /> : <Plus size={11} strokeWidth={2} className="text-primary" />}
              <span>Create Card</span>
            </button>
          )}
        </div>
      )}

      {/* Game-styled analysis modal */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="sm:max-w-xl bg-card border border-border p-0 overflow-hidden">
          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-4 h-4 pointer-events-none">
            <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
            <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
          </span>
          <span className="absolute top-0 right-0 w-4 h-4 pointer-events-none">
            <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
            <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
          </span>
          <span className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none">
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
          </span>
          <span className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none">
            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
          </span>

          <div className="p-8 md:p-10 space-y-8">
            {/* Header */}
            <div className="space-y-3 border-b border-border/40 pb-6">
              <div className="flex justify-between items-start gap-6">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rotate-45 bg-primary/60" />
                  <h2 className="text-3xl md:text-4xl font-light tracking-tight">{analysisResult?.originalText}</h2>
                </div>
                <span className="text-[9px] font-ui font-medium uppercase border border-border/60 px-3 py-1.5 text-muted-foreground/80 tracking-[0.15em] whitespace-nowrap">
                  {analysisResult?.partOfSpeech}
                </span>
              </div>
            </div>

            {/* Content sections */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-1 rotate-45 bg-primary/40" />
                  <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Definition</span>
                </div>
                <p className="text-lg font-light leading-relaxed text-foreground/90">{analysisResult?.definition}</p>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Quote size={11} strokeWidth={1.5} className="text-muted-foreground/50" />
                  <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">In This Context</span>
                </div>
                <div className="relative pl-4 border-l-2 border-primary/20">
                  <p className="text-base italic text-muted-foreground/75 leading-relaxed">
                    {analysisResult?.contextMeaning}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});