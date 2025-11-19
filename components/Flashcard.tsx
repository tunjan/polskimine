import React, { useMemo } from 'react';
import { Card } from '../types';
import { Volume2, FileText, BookOpen } from 'lucide-react';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, isFlipped }) => {
  
  const HighlightedSentence = useMemo(() => {
    // Regex to find the word, preserving case and punctuation
    const parts = card.targetSentence.split(new RegExp(`(${card.targetWord})`, 'gi'));
    
    return (
      <p className="text-3xl md:text-4xl font-medium text-center leading-tight text-gray-900 max-w-3xl">
        {parts.map((part, i) => (
          part.toLowerCase() === card.targetWord.toLowerCase() ? (
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

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(card.targetSentence);
    utterance.lang = 'pl-PL';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden min-h-[500px]">
      
      {/* Card Header (Subtle meta info) */}
      <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
         <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
                card.status === 'learning' ? 'bg-blue-400' :
                card.status === 'review' ? 'bg-amber-400' :
                'bg-emerald-400'
            }`}></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">{card.status} MODE</span>
         </div>
         <span className="text-[10px] font-mono text-gray-300">ID: {card.id.slice(0, 6)}</span>
      </div>

      {/* Card Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Half: The Question */}
        <div className={`flex-1 flex flex-col items-center justify-center p-8 md:p-12 transition-all duration-500 ${isFlipped ? 'flex-[0.6] border-b border-gray-100' : 'flex-1'}`}>
          <div className="w-full flex flex-col items-center space-y-8">
            {HighlightedSentence}
            
            <button 
              onClick={speak}
              className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-all"
              title="Listen"
            >
              <Volume2 size={14} />
              <span>PLAY AUDIO</span>
            </button>
          </div>
        </div>

        {/* Bottom Half: The Answer (Revealed) */}
        {isFlipped && (
          <div className="flex-[0.8] bg-gray-50/30 animate-in slide-in-from-bottom-4 fade-in duration-300 p-8 md:p-12 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Translation Column */}
              <div className="flex flex-col gap-3 text-center md:text-left items-center md:items-start">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <BookOpen size={14} />
                    <span className="text-xs font-mono uppercase tracking-widest">Meaning</span>
                </div>
                <h3 className="text-xl md:text-2xl text-gray-800 leading-relaxed font-serif italic">
                  "{card.nativeTranslation}"
                </h3>
              </div>

              {/* Notes Column */}
              <div className="flex flex-col gap-3 text-center md:text-left items-center md:items-start">
                 <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <FileText size={14} />
                    <span className="text-xs font-mono uppercase tracking-widest">Grammar Notes</span>
                 </div>
                 <div className="text-sm text-gray-600 font-mono leading-relaxed border-l-2 border-gray-200 pl-4 py-1">
                    {card.notes || "No notes available."}
                 </div>
                 <div className="mt-4 text-xs text-gray-400 font-mono">
                    Target: <span className="text-gray-900">{card.targetWord}</span>
                 </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};