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
    if (len < 6) return "text-7xl md:text-9xl tracking-tighter font-medium"; 
    if (len < 15) return "text-6xl md:text-8xl tracking-tighter font-medium"; 
    if (len < 30) return "text-5xl md:text-7xl tracking-tight font-normal"; 
    if (len < 60) return "text-4xl md:text-6xl tracking-tight font-light"; 
    return "text-3xl md:text-5xl font-light"; 
  }, [displayedSentence]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
        "text-center transition-all duration-700 text-balance select-text leading-[1.1] text-foreground font-sans",
        fontSizeClass
    );
    
    if (!isRevealed) {
      return (
        <div onClick={() => setIsRevealed(true)} className="cursor-pointer group flex flex-col items-center gap-6">
            {blindMode && (
                <button onClick={(e) => { e.stopPropagation(); speak(); }} className="p-4 rounded-full border border-foreground/10 hover:border-foreground/30 transition-colors mb-4">
                    <Mic size={32} strokeWidth={1} />
                </button>
            )}
            <p className={cn(baseClasses, "blur-2xl opacity-10 group-hover:opacity-20 scale-95 group-hover:scale-100 transition-transform duration-700")}>
                {displayedSentence}
            </p>
        </div>
      );
    }

    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      return (
        <div className={cn(baseClasses, "flex flex-wrap justify-center items-end gap-x-[0.2em]")}>
          {segments.map((segment, i) => {
            const isTarget = card.targetWord && (card.targetWord === segment.text || card.targetWord.includes(segment.text));
            if (segment.furigana) {
              return (
                <div key={i} className="group flex flex-col items-center justify-end">
                  <span className="text-[0.4em] text-muted-foreground mb-[0.2em] select-none opacity-0 group-hover:opacity-100 transition-opacity leading-none font-mono">
                      {processText(segment.furigana)}
                  </span>
                  <span className={isTarget ? "text-primary font-bold" : ""}>{processText(segment.text)}</span>
                </div>
              );
            }
            return <span key={i} className={isTarget ? "text-primary font-bold" : ""}>{processText(segment.text)}</span>;
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
                    ? <span key={i} className="text-primary font-bold">{processText(part)}</span> 
                    : <span key={i}>{processText(part)}</span>
                )}
            </p>
        );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass, blindMode, speak]);

  const containerClasses = cn(
      "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full transition-all duration-700",
      isCursedWith('rotate') && "rotate-180",
      isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
      isCursedWith('blur') && "animate-pulse blur-[1px]"
  );

  return (
    <>
        <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
            {/* Question Block: Stays stationary because it's the only item in the flex flow */}
            <div className="w-full px-6 flex flex-col items-center gap-8 z-10">
                {RenderedSentence}
                
                {isRevealed && (
                    <button 
                        onClick={speak}
                        className="group flex items-center gap-2 text-muted-foreground/40 hover:text-foreground transition-all duration-300"
                    >
                        <Volume2 size={24} className={cn("transition-all", playSlow && "text-primary")} />
                    </button>
                )}
            </div>

            {/* Answer Reveal: Absolute positioning removes it from flex flow, preventing shift */}
            {isFlipped && (
                <div className="absolute top-1/2 left-0 right-0 pt-32 md:pt-40 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 z-0 pointer-events-none">
                    
                    {showTranslation && (
                        <div className="relative group pointer-events-auto px-6">
                            <p className={cn(
                                "text-lg md:text-xl text-foreground/90 font-serif italic text-center max-w-2xl leading-relaxed text-balance transition-colors duration-300",
                                isGaslit ? "text-destructive/80" : "group-hover:text-foreground"
                            )}>
                                {processText(displayedTranslation)}
                            </p>
                            {isGaslit && <span className="absolute -top-4 -right-8 text-[8px] font-mono uppercase text-destructive tracking-widest rotate-12">Sus</span>}
                        </div>
                    )}
                    
                    {card.notes && (
                        <p className="text-xs font-mono text-muted-foreground/70 max-w-md text-center tracking-widest uppercase pointer-events-auto mt-4">
                            {processText(card.notes)}
                        </p>
                    )}
                </div>
            )}
        </div>

        {/* Floating Context Menu */}
        {selection && (
            <div 
                className="fixed z-50 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200"
                style={{ top: selection.top, left: selection.left }}
                onMouseDown={(e) => e.preventDefault()}
            >
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="bg-foreground text-background px-4 py-2 rounded-full shadow-2xl hover:scale-105 transition-transform text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
                >
                    {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Explain
                </button>
            </div>
        )}

        {/* Analysis Modal */}
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            <DialogContent className="sm:max-w-lg bg-background border border-border p-8 md:p-12 shadow-2xl">
                <div className="space-y-8">
                    <div className="space-y-2 border-b border-border pb-6">
                         <div className="flex justify-between items-start">
                             <h2 className="text-3xl font-light">{analysisResult?.originalText}</h2>
                             <span className="text-[10px] font-mono uppercase border border-border px-2 py-1 rounded text-muted-foreground">
                                {analysisResult?.partOfSpeech}
                             </span>
                         </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Definition</span>
                            <p className="text-lg font-light leading-relaxed">{analysisResult?.definition}</p>
                        </div>
                        <div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                <Quote size={10} /> In Context
                            </span>
                            <p className="text-sm text-muted-foreground font-light italic border-l-2 border-primary/20 pl-4 py-1">
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