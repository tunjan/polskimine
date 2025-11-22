import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { Play } from 'lucide-react';

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
  
  const hasSpokenRef = React.useRef<string | null>(null);
  
  // Gaslight State
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => { setIsRevealed(!blindMode); }, [card.id, blindMode]);
  useEffect(() => { if (isFlipped) setIsRevealed(true); }, [isFlipped]);
  
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
    ttsService.speak(card.targetSentence, language, settings.tts);
  }, [card.targetSentence, language, settings.tts]);

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

  const displayedSentence = processText(card.targetSentence);

  // --- DYNAMIC FONT SCALING ---
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
                  {/* FIX: Changed opacity-70 to opacity-0 so it is hidden by default */}
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
    <div className={containerClasses}>
      {/* Main Content */}
      <div className="w-full px-6 flex flex-col items-center gap-8">
        {RenderedSentence}
        
        {/* Audio Control */}
        <button 
            onClick={speak}
            className="text-muted-foreground hover:text-foreground transition-colors p-4 rounded-full hover:bg-secondary/50"
        >
                <Play size={24} fill="currentColor" className="opacity-50" />
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
  );
};