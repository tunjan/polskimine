import React, { useState, useEffect } from 'react';
import { Card, Grade } from '../types';
import { Flashcard } from './Flashcard';
import { Button } from './ui/Button';
import { calculateNextReview } from '../services/srs';
import { ArrowLeft, RotateCcw, Undo2, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const ShortcutBadge: React.FC<{ keys: string }> = ({ keys }) => (
  <span className="border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono uppercase tracking-tight text-gray-500">
    {keys}
  </span>
);

interface StudySessionProps {
  dueCards: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card) => void;
  onExit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onMarkKnown: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ dueCards, onUpdateCard, onRecordReview, onExit, onUndo, canUndo, onMarkKnown }) => {
  const { settings } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  
  useEffect(() => {
    if (dueCards.length === 0) {
      setSessionComplete(true);
    }
  }, [dueCards]);

  const handleUndo = () => {
    if (canUndo && onUndo) {
        onUndo();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(true); // Show answer side to re-grade
            setSessionComplete(false);
        } else if (sessionComplete) {
             // If we were done, go back to last card
             setSessionComplete(false);
             setCurrentIndex(dueCards.length - 1);
             setIsFlipped(true);
        }
    }
  };

  const handleMarkKnown = () => {
    onMarkKnown(currentCard);
    if (currentIndex < dueCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete) return;

      if (!isFlipped) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          handleFlip();
        }
      } else {
        switch (e.key) {
          case '1': handleGrade('Again'); break;
          case '2': handleGrade('Good'); break;
          case ' ': // Space to default to Good
            e.preventDefault();
            handleGrade('Good'); 
            break;
          case 'z': // Undo shortcut
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                handleUndo();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionComplete, currentIndex, dueCards, canUndo, onUndo]); // Dependencies for closure

  const currentCard = dueCards[currentIndex];

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  const handleGrade = (grade: Grade) => {
    const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
    onUpdateCard(updatedCard);
    onRecordReview(currentCard);

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
        <div className="flex gap-4">
            <Button onClick={onExit} size="lg" variant="outline">Back to Dashboard</Button>
            {canUndo && (
                <Button onClick={handleUndo} size="lg" variant="secondary">Undo Last</Button>
            )}
        </div>
      </div>
    );
  }

  if (!currentCard) return <div className="p-10 text-center font-mono text-sm">Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 h-full px-4">
      {/* Minimal Header */}
      <div className="flex justify-between items-center py-6">
        <button 
          onClick={onExit}
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="Quit session"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-gray-400">
            {currentIndex + 1} / {dueCards.length}
            </div>
            {canUndo && (
                <button 
                    onClick={handleUndo}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                    title="Undo"
                >
                    <Undo2 size={18} />
                </button>
            )}
            <button 
                onClick={handleMarkKnown}
                className="text-gray-400 hover:text-emerald-600 transition-colors"
                title="Mark Known"
            >
                <CheckCircle2 size={18} />
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 pb-12">
        
        <div className="w-full flex justify-center mb-12">
          <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio}
            showTranslation={settings.showTranslationAfterFlip}
          />
        </div>

        {/* Controls */}
        <div className="w-full max-w-xl">
          <div className={`transition-all duration-300 ${isFlipped ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
            <Button 
              onClick={handleFlip} 
              size="lg" 
              className="w-full h-14 text-base shadow-sm"
            >
              Show Answer
            </Button>
          </div>
          
          <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'}`}>
            <button 
              onClick={() => handleGrade('Again')}
              className="flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group bg-white"
            >
              <span className="text-sm font-medium text-gray-700 mb-1 group-hover:text-red-700">Again</span>
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-red-500">1</span>
            </button>

            <button 
              onClick={() => handleGrade('Good')}
              className="flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white"
            >
              <span className="text-sm font-medium text-gray-700 mb-1 group-hover:text-emerald-700">Good</span>
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-emerald-500">Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
