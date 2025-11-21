import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { PlayCircle, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { user } = useAuth();
  const [isRevealed, setIsRevealed] = useState(!blindMode);
  const [activeCurse, setActiveCurse] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState({
    sentence: card.targetSentence,
    translation: card.nativeTranslation,
  });
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    setIsRevealed(!blindMode);
  }, [card.id, blindMode]);

  useEffect(() => {
    if (isFlipped) setIsRevealed(true);
  }, [isFlipped]);
  
  const speak = useCallback(() => {
    ttsService.speak(card.targetSentence, language, settings.tts);
  }, [card.targetSentence, language, settings.tts]);

  useEffect(() => {
    if (autoPlayAudio) speak();
    // Only run when the card ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    return () => ttsService.stop();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const checkCurses = async () => {
      const { data, error } = await supabase
        .from('active_curses')
        .select('curse_type, expires_at')
        .eq('victim_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch curses', error);
        return;
      }

      setActiveCurse(data?.curse_type ?? null);
    };

    checkCurses();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let sentence = card.targetSentence;
    let translation = card.nativeTranslation;

    if (activeCurse === 'uwu') {
      sentence = uwuify(sentence);
      translation = uwuify(translation);
    }

    setDisplayData({ sentence, translation });
  }, [activeCurse, card.targetSentence, card.nativeTranslation]);

  useEffect(() => {
    if (!isFlipped || activeCurse !== 'gaslight') return;

    if (Math.random() >= 0.3) return;

    const fakeAnswer = FAKE_ANSWERS[Math.floor(Math.random() * FAKE_ANSWERS.length)];
    setDisplayData(prev => ({ ...prev, translation: fakeAnswer }));

    let glitchTimeout: ReturnType<typeof setTimeout> | null = null;
    const revealTimeout = setTimeout(() => {
      setIsGlitching(true);
      glitchTimeout = setTimeout(() => {
        setDisplayData(prev => ({ ...prev, translation: card.nativeTranslation }));
        setIsGlitching(false);
      }, 300);
    }, 1500);

    return () => {
      clearTimeout(revealTimeout);
      if (glitchTimeout) clearTimeout(glitchTimeout);
      setIsGlitching(false);
      setDisplayData(prev => ({ ...prev, translation: card.nativeTranslation }));
    };
  }, [isFlipped, activeCurse, card.nativeTranslation]);

  const getContainerStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (activeCurse === 'comic_sans') {
      style.fontFamily = '"Comic Sans MS", "Chalkboard SE", sans-serif';
    }

    if (activeCurse === 'blur') {
      style.animation = 'drunkenBlur 3s infinite ease-in-out';
    }

    if (activeCurse === 'rotate') {
      style.transform = 'rotate(180deg)';
    }

    return style;
  };

  const displayedSentence = displayData.sentence;
  const displayedTranslation = displayData.translation;

  // High-impact typography for the sentence
  const HighlightedSentence = useMemo(() => {
    // Base font classes: smaller on mobile (3xl), larger on desktop (6xl)
    const fontClasses = "text-3xl md:text-6xl font-medium tracking-tight text-center leading-snug";

    if (!isRevealed) {
      return (
        <button 
          onClick={() => setIsRevealed(true)}
          className="group relative cursor-pointer appearance-none bg-transparent border-none w-full text-center"
          type="button"
          aria-label="Reveal sentence"
        >
          <p className={`${fontClasses} blur-lg select-none opacity-50 transition-all duration-300 group-hover:opacity-70 group-hover:blur-md`}>
            {displayedSentence}
          </p>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Eye className="w-8 h-8 text-foreground/50" />
          </div>
        </button>
      );
    }

    // Japanese Mode with Furigana
    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      
      return (
        // Changed: Added 'items-end' to align Kanji base with Kana baseline
        <p className={`${fontClasses} flex flex-wrap justify-center items-end gap-1`}>
          {segments.map((segment, i) => {
            const text = segment.text.replace(/\s/g, '');
            if (!text && !segment.furigana) return null;

            const isTarget = card.targetWord && text === card.targetWord;
            
            if (segment.furigana) {
              return (
                <ruby key={i} className="group">
                  <span className={isTarget ? "border-b-2 border-foreground pb-1" : ""}>{text}</span>
                  <rt className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm md:text-xl text-muted-foreground font-normal select-none">{segment.furigana}</rt>
                </ruby>
              );
            } else {
               if (!card.targetWord) return <span key={i} className="opacity-80">{text}</span>;

               const parts = text.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
               return (
                 <span key={i} className="opacity-80">
                   {parts.map((part, j) => (
                     part.toLowerCase() === card.targetWord!.toLowerCase() ? (
                       <span key={j} className="border-b-2 border-foreground pb-1 inline-block text-foreground opacity-100">{part}</span>
                     ) : part
                   ))}
                 </span>
               );
            }
          })}
        </p>
      );
    }

    if (!card.targetWord) return <p className={fontClasses}>{displayedSentence}</p>;
    
    const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
    return (
      <p className={fontClasses}>
        {parts.map((part, i) => (
          part.toLowerCase() === card.targetWord!.toLowerCase() ? (
            <span key={i} className="border-b-2 border-foreground pb-1 inline-block">{part}</span>
          ) : <span key={i} className="opacity-80">{part}</span>
        ))}
      </p>
    );
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language]);

  return (
    <div
      className={`w-full max-w-3xl flex flex-col items-center justify-center gap-8 md:gap-16 min-h-[40vh] ${isGlitching ? 'glitch-effect' : ''}`}
      style={getContainerStyle()}
    >
      
      {card.isLeech && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} />
                <span>Leech</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You've struggled with this card many times.</p>
              <p>Consider rewriting or deleting it to avoid frustration.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Front Side */}
      <div className="flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-500 px-4">
        {HighlightedSentence}
        
        <button 
          onClick={speak}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 opacity-50 hover:opacity-100"
        >
            <PlayCircle size={24} strokeWidth={1} />
        </button>
      </div>

      {/* Back Side (Answer) */}
      {isFlipped && (
        <div className="flex flex-col items-center gap-4 text-center animate-in slide-in-from-bottom-4 fade-in duration-500 border-t border-border/50 pt-8 md:pt-12 w-full md:w-3/4 px-4">
            <div className="font-serif text-xl md:text-3xl italic text-muted-foreground">
              {showTranslation ? displayedTranslation : <span className="blur-md">Hidden</span>}
            </div>
            
            {(card.notes || card.furigana) && (
                <div className="pt-4 flex flex-col gap-2 text-xs md:text-sm font-mono text-muted-foreground/70">
                    {card.furigana && <span>{card.furigana}</span>}
                    {card.notes && <span>{card.notes}</span>}
                </div>
            )}
        </div>
      )}
    </div>
  );
};