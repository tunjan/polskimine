import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../types';
import { Volume2, FileText, BookOpen } from 'lucide-react';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  showTranslation?: boolean;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, isFlipped, autoPlayAudio = false, showTranslation = true }) => {
  const [hasVoice, setHasVoice] = useState(false);

  useEffect(() => {
    const checkVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      setHasVoice(voices.some(v => v.lang.startsWith('pl')));
    };
    
    checkVoice();
    window.speechSynthesis.onvoiceschanged = checkVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(card.targetSentence);
    utterance.lang = 'pl-PL';
    window.speechSynthesis.speak(utterance);
  }, [card.targetSentence]);

  // Auto-play audio when flipped if enabled
  useEffect(() => {
    if (isFlipped && autoPlayAudio && hasVoice) {
        speak();
    }
  }, [isFlipped, autoPlayAudio, hasVoice, speak]);
  
  const HighlightedSentence = useMemo(() => {
    // Common styling for the sentence text
    const sentenceClass = "text-2xl md:text-3xl font-medium text-center leading-tight text-gray-900 dark:text-gray-100 max-w-3xl transition-colors";

    if (!card.targetWord) {
      return (
        <p className={sentenceClass}>
          {card.targetSentence}
        </p>
      );
    }

    // Regex to find the word, preserving case and punctuation
    const escapedWord = escapeRegExp(card.targetWord);
    const parts = card.targetSentence.split(new RegExp(`(${escapedWord})`, 'gi'));
    
    return (
      <p className={sentenceClass}>
        {parts.map((part, i) => (
          part.toLowerCase() === card.targetWord!.toLowerCase() ? (
            <span key={i} className="text-polishRed font-semibold border-b-2 border-polishRed/20 pb-0.5">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        ))}
      </p>
    );
  }, [card.targetSentence, card.targetWord]);

  const statusColors = {
    new: 'bg-blue-400',
    learning: 'bg-amber-400',
    graduated: 'bg-emerald-400',
    known: 'bg-gray-300 dark:bg-gray-600'
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[400px] justify-center relative">
      
      {/* Status Indicator */}
      <div className="absolute top-0 w-full flex justify-center pointer-events-none">
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full ${statusColors[card.status]}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {card.status}
            </span>
         </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500">
        <div className="w-full flex flex-col items-center space-y-8">
          {HighlightedSentence}
          
          {hasVoice && (
            <button 
              onClick={speak}
              className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Listen"
            >
              <Volume2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Answer Area */}
      {isFlipped && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pb-8">
          <div className="w-full max-w-2xl mx-auto border-t border-gray-100 dark:border-gray-800 pt-8 grid grid-cols-1 gap-8 text-center transition-colors">
            
            {/* Translation */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">Meaning</span>
              <h3 className="text-xl text-gray-800 dark:text-gray-200 font-serif italic transition-colors">
                {showTranslation ? card.nativeTranslation : <span className="blur-sm select-none text-gray-300 dark:text-gray-700">Hidden</span>}
              </h3>
            </div>

            {/* Notes */}
            {card.notes && (
              <div className="space-y-2">
                 <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-wider">Notes</span>
                 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto transition-colors">
                    {card.notes}
                 </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
