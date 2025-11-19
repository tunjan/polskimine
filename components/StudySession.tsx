import React, { useState, useEffect } from 'react';
import { Card, Grade } from '../types';
import { Flashcard } from './Flashcard';
import { Button } from './ui/Button';
import { calculateNextReview } from '../services/srs';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface StudySessionProps {
  dueCards: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: () => void;
  onExit: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ dueCards, onUpdateCard, onRecordReview, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  useEffect(() => {
    if (dueCards.length === 0) {
      setSessionComplete(true);
    }
  }, [dueCards]);

  const currentCard = dueCards[currentIndex];

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  const handleGrade = (grade: Grade) => {
    const updatedCard = calculateNextReview(currentCard, grade);
    onUpdateCard(updatedCard);
    onRecordReview();

    if (currentIndex < dueCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in duration-300 min-h-[300px]">
        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mb-6">
          <RotateCcw size={24} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Queue Cleared</h2>
        <p className="text-gray-500 mb-8 font-mono text-sm">
          No more cards due for review.
        </p>
        <Button onClick={onExit} size="lg" variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  if (!currentCard) return <div className="p-10 text-center font-mono text-sm">Loading...</div>;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 h-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <button 
          onClick={onExit}
          className="flex items-center text-gray-400 hover:text-gray-900 transition-colors text-xs font-mono uppercase tracking-wide"
        >
          <ArrowLeft size={14} className="mr-2" /> Quit
        </button>
        <div className="text-xs font-mono text-gray-400">
          {currentIndex + 1} / {dueCards.length}
        </div>
      </div>

      {/* Card Area - Fill available space but don't force scroll */}
      <div className="flex-1 flex items-start justify-center mb-4 pt-2">
        <Flashcard card={currentCard} isFlipped={isFlipped} />
      </div>

      {/* Controls Area */}
      <div className="h-auto min-h-[80px] flex items-end justify-center pb-2">
        {!isFlipped ? (
          <Button 
            onClick={handleFlip} 
            size="lg" 
            variant="primary"
            className="w-full max-w-sm"
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2 w-full max-w-2xl animate-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => handleGrade('Again')}
              className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-md hover:border-red-500 hover:bg-red-50 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-900 group-hover:text-red-700">Again</span>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">Retry</span>
            </button>
            
            <button 
              onClick={() => handleGrade('Hard')}
              className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Hard</span>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">1.2x</span>
            </button>

            <button 
              onClick={() => handleGrade('Good')}
              className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Good</span>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">2.5x</span>
            </button>

            <button 
              onClick={() => handleGrade('Easy')}
              className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Easy</span>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">3.5x</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};