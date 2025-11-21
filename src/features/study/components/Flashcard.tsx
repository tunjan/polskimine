import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { Play } from 'lucide-react';
import { uwuify } from '@/lib/memeUtils';

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
  const [isRevealed, setIsRevealed] = useState(!blindMode);
  
  useEffect(() => { setIsRevealed(!blindMode); }, [card.id, blindMode]);
  useEffect(() => { if (isFlipped) setIsRevealed(true); }, [isFlipped]);
  
  const speak = useCallback(() => {
    ttsService.speak(card.targetSentence, language, settings.tts);
  }, [card.targetSentence, language, settings.tts]);

  useEffect(() => {
    if (autoPlayAudio) speak();
  }, [card.id]);

  const displayedSentence = card.targetSentence;

  const RenderedSentence = useMemo(() => {
    const baseClasses = "text-4xl md:text-7xl font-medium tracking-tight leading-tight text-center transition-all duration-500";
    
    if (!isRevealed) {
      return (
        <div 
          onClick={() => setIsRevealed(true)}
          className="cursor-pointer group flex flex-col items-center gap-4"
        >
          <p className={`${baseClasses} blur-xl opacity-20 group-hover:opacity-30`}>
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
        <div className={`${baseClasses} flex flex-wrap justify-center items-end gap-x-1`}>
          {segments.map((segment, i) => (
            segment.furigana ? (
              <div key={i} className="group flex flex-col items-center">
                <span className="text-sm md:text-lg text-muted-foreground mb-1 select-none opacity-0 group-hover:opacity-100 transition-opacity">{segment.furigana}</span>
                <span className={card.targetWord === segment.text ? "text-primary" : ""}>{segment.text}</span>
              </div>
            ) : (
              <span key={i} className={card.targetWord === segment.text ? "text-primary" : ""}>{segment.text}</span>
            )
          ))}
        </div>
      );
    }

    if (card.targetWord) {
        const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
        return (
            <p className={baseClasses}>
                {parts.map((part, i) => 
                    part.toLowerCase() === card.targetWord!.toLowerCase() 
                    ? <span key={i} className="text-primary border-b-2 border-primary/30">{part}</span> 
                    : <span key={i}>{part}</span>
                )}
            </p>
        );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] py-12">
      {/* Main Content */}
      <div className="w-full px-6 mb-8">
        {RenderedSentence}
      </div>

      {/* Audio Control */}
      <button 
          onClick={speak}
          className="text-muted-foreground hover:text-foreground transition-colors p-4 rounded-full hover:bg-secondary/50"
      >
            <Play size={24} fill="currentColor" className="opacity-50" />
      </button>

      {/* Back Side / Answer */}
      <div className={`mt-16 transition-all flex flex-col items-center gap-4 ${isFlipped ? 'duration-500 opacity-100 translate-y-0' : 'duration-0 opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="h-px w-12 bg-border mb-4" />
        {showTranslation && (
            <p className="text-xl md:text-2xl text-muted-foreground font-light text-center max-w-2xl leading-relaxed">
                {card.nativeTranslation}
            </p>
        )}
        {card.notes && (
            <p className="text-sm font-mono text-muted-foreground/60 mt-2 max-w-md text-center">
                {card.notes}
            </p>
        )}
      </div>
    </div>
  );
};
