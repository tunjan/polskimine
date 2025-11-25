import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { Play, Sparkles, Loader2, Quote, Mic, Volume2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { aiService } from '@/features/deck/services/ai';
import { toast } from 'sonner';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
}

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = 'polish'
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

  const speak = useCallback(() => {
    const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
    const effectiveSettings = { ...settings.tts, rate: effectiveRate };
    ttsService.speak(card.targetSentence, language, effectiveSettings);
    setPlaySlow(prev => !prev);
  }, [card.targetSentence, language, settings.tts]);

  // --- FIX START ---
  // Split effects to prevent stopping audio when 'speak' identity changes due to playSlow toggle

  // 1. Cleanup Effect: Only stop audio when the card changes or component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [card.id]);

  // 2. AutoPlay Effect: Triggers audio but doesn't handle cleanup
  useEffect(() => {
    if (hasSpokenRef.current !== card.id) {
      hasSpokenRef.current = null;
    }
    if (autoPlayAudio && hasSpokenRef.current !== card.id) {
      speak();
      hasSpokenRef.current = card.id;
    }
  }, [card.id, autoPlayAudio, speak]);
  // --- FIX END ---

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

  const displayedSentence = processText(card.targetSentence);

  const fontSizeClass = useMemo(() => {
    const len = displayedSentence.length;
    if (len < 6) return "text-7xl md:text-9xl tracking-tight font-light";
    if (len < 15) return "text-6xl md:text-8xl tracking-tight font-light";
    if (len < 30) return "text-5xl md:text-7xl tracking-tight font-extralight";
    if (len < 60) return "text-4xl md:text-6xl tracking-normal font-extralight";
    return "text-3xl md:text-5xl font-extralight tracking-normal";
  }, [displayedSentence]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
      "text-center text-balance select-text leading-[1.3] text-foreground",
      "font-serif",
      fontSizeClass
    );

    if (!isRevealed) {
      return (
        <div onClick={() => setIsRevealed(true)} className="cursor-pointer group flex flex-col items-center gap-8">
          {blindMode && (
            <button 
              onClick={(e) => { e.stopPropagation(); speak(); }} 
              className="p-6 rounded-full bg-muted/30 hover:bg-muted/50 transition-all duration-500 mb-6"
            >
              <Mic size={28} strokeWidth={1} className="text-muted-foreground" />
            </button>
          )}
          <p className={cn(baseClasses, "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-700")}>
            {displayedSentence}
          </p>
        </div>
      );
    }

    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      return (
        <div className={cn(baseClasses, "flex flex-wrap justify-center items-end gap-x-[0.25em]")}>
          {segments.map((segment, i) => {
            const isTarget = card.targetWord && (card.targetWord === segment.text || card.targetWord.includes(segment.text));
            if (segment.furigana) {
              return (
                <div key={i} className="group/ruby flex flex-col items-center justify-end">
                  <span className="text-[0.38em] text-muted-foreground/70 mb-[0.3em] select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 leading-none font-sans font-light tracking-wide">
                    {processText(segment.furigana)}
                  </span>
                  <span className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>
                </div>
              );
            }
            return <span key={i} className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>;
          })}
        </div>
      );
    }

    if (card.targetWord) {
      const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
      return (
        <p className={baseClasses}>
          {parts.map((part, i) =>
            part.toLowerCase() === card.targetWord?.toLowerCase()
              ? <span key={i} className="text-primary/90 font-normal">{processText(part)}</span>
              : <span key={i}>{processText(part)}</span>
          )}
        </p>
      );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass, blindMode, speak]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full",
    isCursedWith('rotate') && "rotate-180",
    isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
    isCursedWith('blur') && "animate-pulse blur-[1px]"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        {/* Main content with generous vertical spacing */}
        <div className="w-full px-8 md:px-16 flex flex-col items-center gap-12 md:gap-16 z-10">
          {RenderedSentence}

          {isRevealed && (
            <button
              onClick={speak}
              className="group flex items-center justify-center text-muted-foreground/50 hover:text-foreground/70 transition-all duration-500 mt-4"
            >
              <div className="flex items-center gap-3">
                <Volume2 size={20} strokeWidth={1.5} className={cn("transition-all duration-500", playSlow && "text-primary/70", "group-hover:-translate-x-8")} />
                <span className="text-[9px] font-sans font-light uppercase tracking-[0.2em] opacity-0 group-hover:opacity-60 transition-all duration-500 absolute left-1/2 -translate-x-1/2 group-hover:translate-x-3">Listen</span>
              </div>
            </button>
          )}
        </div>

        {/* Translation reveal with elegant fade-in */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 pt-36 md:pt-48 flex flex-col items-center gap-6 z-0 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {showTranslation && (
              <div className="relative group pointer-events-auto px-8 md:px-16">
                <div className="max-w-3xl">
                  <p className={cn(
                    "text-xl md:text-2xl text-foreground/75 font-serif italic text-center leading-relaxed text-balance transition-colors duration-500",
                    isGaslit ? "text-destructive/70" : "group-hover:text-foreground/85"
                  )}>
                    {processText(displayedTranslation)}
                  </p>
                </div>
                {isGaslit && (
                  <span className="absolute -top-5 -right-6 text-[8px] font-sans font-medium uppercase text-destructive/60 tracking-widest rotate-12 opacity-70">
                    Suspicious
                  </span>
                )}
              </div>
            )}

            {card.notes && (
              <div className="mt-8 px-8 md:px-16 pointer-events-auto">
                <p className="text-xs font-sans font-light text-muted-foreground/60 max-w-xl text-center tracking-wide leading-relaxed">
                  {processText(card.notes)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating selection menu - refined and minimal */}
      {selection && (
        <div
          className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ top: selection.top, left: selection.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-foreground/95 text-background px-5 py-2.5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 text-[10px] font-sans font-medium uppercase tracking-[0.15em] flex items-center gap-2.5 backdrop-blur-sm"
          >
            {isAnalyzing ? <Loader2 size={11} strokeWidth={2} className="animate-spin" /> : <Sparkles size={11} strokeWidth={2} />}
            <span>Analyze</span>
          </button>
        </div>
      )}

      {/* Analysis modal - editorial magazine style */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="sm:max-w-xl bg-background border border-border/50 p-10 md:p-14 shadow-2xl rounded-3xl">
          <div className="space-y-10">
            {/* Header */}
            <div className="space-y-3 border-b border-border/40 pb-7">
              <div className="flex justify-between items-start gap-6">
                <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight">{analysisResult?.originalText}</h2>
                <span className="text-[9px] font-sans font-medium uppercase border border-border/60 px-3 py-1.5 rounded-full text-muted-foreground/80 tracking-[0.15em] whitespace-nowrap mt-2">
                  {analysisResult?.partOfSpeech}
                </span>
              </div>
            </div>

            {/* Content sections */}
            <div className="space-y-8">
              <div>
                <span className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground/60 mb-3 block">Definition</span>
                <p className="text-lg md:text-xl font-serif font-light leading-relaxed text-foreground/90">{analysisResult?.definition}</p>
              </div>
              
              <div className="pt-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <Quote size={11} strokeWidth={1.5} className="text-muted-foreground/50" />
                  <span className="text-[8px] font-sans font-medium uppercase tracking-[0.25em] text-muted-foreground/60">In This Context</span>
                </div>
                <p className="text-base font-serif italic text-muted-foreground/75 border-l-2 border-primary/20 pl-5 py-2 leading-relaxed">
                  {analysisResult?.contextMeaning}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});