import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { Play, Sparkles, Loader2, BookOpen, Quote } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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

export const Flashcard: React.FC<FlashcardProps> = ({ 
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
  
  const hasSpokenRef = React.useRef<string | null>(null);
  

  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);


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
    setPlaySlow(false); // Reset to normal speed for new card
  }, [card.id]);

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

  const processText = (text: string) => {
      if (isCursedWith('uwu')) return uwuify(text);
      return text;
  };
  
  const speak = useCallback(() => {

    const effectiveRate = playSlow 
        ? Math.max(0.25, settings.tts.rate * 0.6) 
        : settings.tts.rate;

    const effectiveSettings = {
        ...settings.tts,
        rate: effectiveRate
    };

    ttsService.speak(card.targetSentence, language, effectiveSettings);
    

    setPlaySlow(prev => !prev);
  }, [card.targetSentence, language, settings.tts, playSlow]);

  useEffect(() => {
    if (hasSpokenRef.current !== card.id) {
      hasSpokenRef.current = null;
    }

    if (autoPlayAudio && hasSpokenRef.current !== card.id) {
      speak();
      hasSpokenRef.current = card.id;
    }
    
    return () => {
      ttsService.stop();
    };
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
    

    setSelection({
        text,
        top: rect.top - 50, 
        left: rect.left + (rect.width / 2)
    });
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
        toast.error("Please add your Gemini API Key in Settings to use this feature.");
        setSelection(null);
        return;
    }

    setIsAnalyzing(true);
    try {
        const result = await aiService.analyzeWord(
            selection.text, 
            card.targetSentence, 
            language, 
            settings.geminiApiKey
        );
        setAnalysisResult({ ...result, originalText: selection.text });
        setIsAnalysisOpen(true);
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    } catch (e) {
        toast.error("Failed to analyze text.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const displayedSentence = processText(card.targetSentence);


  const fontSizeClass = useMemo(() => {
    const cleanLength = language === 'japanese' && card.furigana 
        ? parseFurigana(card.furigana).reduce((acc, curr) => acc + curr.text.length, 0)
        : displayedSentence.length;

    if (cleanLength < 10) return "text-6xl md:text-8xl"; 
    if (cleanLength < 20) return "text-5xl md:text-7xl"; 
    if (cleanLength < 40) return "text-4xl md:text-6xl"; 
    if (cleanLength < 80) return "text-3xl md:text-5xl"; 
    return "text-2xl md:text-4xl"; 
  }, [displayedSentence, language, card.furigana]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
        "font-medium tracking-tight leading-tight text-center transition-all duration-500 text-balance max-w-5xl mx-auto",
        fontSizeClass
    );
    
    if (!isRevealed) {
      return (
        <div 
          onClick={() => setIsRevealed(true)}
          className="cursor-pointer group flex flex-col items-center gap-4"
        >
          <p className={cn(baseClasses, "blur-xl opacity-20 group-hover:opacity-30")}>
            {displayedSentence}
          </p>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click to Reveal
          </span>
        </div>
      );
    }

    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      return (
        <div className={cn(baseClasses, "flex flex-wrap justify-center items-end gap-x-[0.1em] leading-relaxed")}>
          {segments.map((segment, i) => {
            const isPartOfTarget = card.targetWord && (
              card.targetWord === segment.text || 
              card.targetWord.includes(segment.text) ||
              segment.text === card.targetWord
            );
            
            if (segment.furigana) {
              return (
                <div key={i} className="group flex flex-col items-center justify-end">
                  <span className="text-[0.5em] text-muted-foreground mb-[0.1em] select-none opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                      {processText(segment.furigana)}
                  </span>
                  <span className={isPartOfTarget ? "text-primary" : ""}>
                      {processText(segment.text)}
                  </span>
                </div>
              );
            }
            return (
              <span key={i} className={isPartOfTarget ? "text-primary" : ""}>
                  {processText(segment.text)}
              </span>
            );
          })}
        </div>
      );
    }

    if (card.targetWord) {
        const rawTarget = card.targetWord;
        const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(rawTarget)})`, 'gi'));
        
        if (parts.length === 1 && parts[0] === displayedSentence && isCursedWith('uwu')) {
             return <p className={baseClasses}>{displayedSentence}</p>;
        }

        return (
            <p className={baseClasses}>
                {parts.map((part, i) => 
                    part.toLowerCase() === rawTarget.toLowerCase() 
                    ? <span key={i} className="text-primary border-b-2 border-primary/30">{processText(part)}</span> 
                    : <span key={i}>{processText(part)}</span>
                )}
            </p>
        );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass]);

  const containerClasses = cn(
      "w-full max-w-6xl mx-auto flex flex-col items-center justify-center h-full transition-all duration-700",
      isCursedWith('rotate') && "rotate-180",
      isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
      isCursedWith('blur') && "animate-pulse blur-[1px]"
  );

  return (
    <>
        <div 
            className={containerClasses} 
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
        >
        {/* Main Content */}
        <div className="w-full px-6 flex flex-col items-center gap-8">
            {RenderedSentence}
            
            {/* Audio Control */}
            <button 
                onClick={speak}
                className="text-muted-foreground hover:text-foreground transition-colors p-4 rounded-full hover:bg-secondary/50 relative group"
            >
                <Play size={24} fill="currentColor" className={cn("transition-opacity", playSlow ? "opacity-100 text-primary" : "opacity-50")} />
                {playSlow && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-widest text-primary/70">Slow</span>}
            </button>
        </div>

        {/* Back Side / Answer */}
        {isFlipped && (
            <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
                <div className="h-px w-12 bg-border mb-4" />
                {showTranslation && (
                    <div className="relative">
                        <p className={cn(
                            "text-xl md:text-2xl text-muted-foreground font-light text-center max-w-2xl leading-relaxed text-balance",
                            isGaslit && "text-destructive animate-pulse"
                        )}>
                            {processText(displayedTranslation)}
                        </p>
                        {isGaslit && (
                            <p className="absolute -right-16 top-0 text-[8px] uppercase tracking-widest text-destructive -rotate-12 opacity-50">
                                Gaslit
                            </p>
                        )}
                    </div>
                )}
                {card.notes && (
                    <p className="text-sm font-mono text-muted-foreground/60 mt-2 max-w-md text-center">
                        {processText(card.notes)}
                    </p>
                )}
            </div>
        )}
        </div>

        {/* Floating Analyze Button */}
        {selection && (
            <div 
                className="fixed z-50 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200"
                style={{ top: selection.top, left: selection.left }}
                onMouseDown={(e) => e.preventDefault()}
            >
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-full shadow-xl hover:scale-105 transition-transform text-xs font-mono uppercase tracking-wider"
                >
                    {isAnalyzing ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <Sparkles size={12} />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Explain'}
                </button>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-foreground absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
            </div>
        )}

        {/* Analysis Result Modal */}
        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
            <DialogContent className="sm:max-w-lg bg-background border border-border p-0 overflow-hidden gap-0">
                <div className="p-6 md:p-8 border-b border-border/40 bg-secondary/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles size={14} />
                        </div>
                        <DialogTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            AI Analysis
                        </DialogTitle>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground leading-tight">
                            {analysisResult?.originalText}
                        </h2>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-background text-[11px] font-medium text-muted-foreground tracking-wide">
                            {analysisResult?.partOfSpeech}
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    <div className="space-y-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BookOpen size={12} /> Definition
                        </span>
                        <p className="text-base md:text-lg leading-relaxed text-foreground/90 font-light">
                            {analysisResult?.definition}
                        </p>
                    </div>

                    <div className="relative pl-4 border-l-2 border-primary/30 py-1">
                         <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-2">
                            <Quote size={10} /> Context Usage
                        </span>
                        <p className="text-sm md:text-base leading-relaxed text-muted-foreground italic">
                            "{analysisResult?.contextMeaning}"
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
};