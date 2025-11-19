import React, { useState, useEffect } from 'react';
import { Card, Grade } from '../types';
import { Flashcard } from './Flashcard';
import { Button } from './ui/Button';
import { calculateNextReview } from '../services/srs';
import { ArrowLeft, RotateCcw, Undo2, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

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
          case '2': handleGrade('Hard'); break;
          case '3': handleGrade('Good'); break;
          case '4': handleGrade('Easy'); break;
          case ' ': // Space to default to Good or just ignore? Anki uses Space for Good usually.
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
    const updatedCard = calculateNextReview(currentCard, grade, settings.srs);
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
    <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 h-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
            <button 
            onClick={onExit}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-xs font-mono uppercase tracking-wide p-2 -ml-2 rounded-md hover:bg-gray-100"
            aria-label="Quit session"
            >
            <ArrowLeft size={14} className="mr-2" /> Quit
            </button>
            {canUndo && (
                <button 
                    onClick={handleUndo}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-xs font-mono uppercase tracking-wide p-2 rounded-md hover:bg-gray-100"
                    title="Undo last review (Cmd/Ctrl + Z)"
                    aria-label="Undo last review"
                >
                    <Undo2 size={14} className="mr-2" /> Undo
                </button>
            )}
            <button 
                onClick={handleMarkKnown}
                className="flex items-center text-gray-500 hover:text-emerald-600 transition-colors text-xs font-mono uppercase tracking-wide p-2 rounded-md hover:bg-emerald-50"
                title="Mark as known (never see again)"
            >
                <CheckCircle2 size={14} className="mr-2" /> Mark Known
            </button>
        </div>
        <div className="text-xs font-mono text-gray-500">
          {currentIndex + 1} / {dueCards.length}
        </div>
      </div>

      {/* Main Content Area - Centered vertically with controls close to card */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 pb-12">
        
        <div className="w-full flex justify-center mb-8">
          <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio}
            showTranslation={settings.showTranslationAfterFlip}
          />
        </div>

        {/* Controls Area */}
        <div className="w-full flex justify-center h-12">
          {!isFlipped ? (
            <Button 
              onClick={handleFlip} 
              size="lg" 
              variant="primary"
              className="w-full max-w-sm shadow-lg min-h-[50px]"
            >
              Reveal Answer <span className="hidden md:inline-block ml-2 text-xs opacity-60 font-mono border border-white/30 px-1 rounded">SPACE</span>
            </Button>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl animate-in slide-in-from-bottom-2 duration-200">
              <button 
                onClick={() => handleGrade('Again')}
                className="flex flex-col items-center justify-center p-3 min-h-[64px] border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all shadow-sm hover:shadow-md group bg-white"
              >
                <span className="text-sm font-bold text-gray-700 group-hover:text-red-700">Again</span>
                <span className="text-[10px] font-mono text-gray-500 mt-0.5">1</span>
              </button>
              
              <button 
                onClick={() => handleGrade('Hard')}
                className="flex flex-col items-center justify-center p-3 min-h-[64px] border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all shadow-sm hover:shadow-md group bg-white"
              >
                <span className="text-sm font-bold text-gray-700 group-hover:text-orange-700">Hard</span>
                <span className="text-[10px] font-mono text-gray-500 mt-0.5">2</span>
              </button>

              <button 
                onClick={() => handleGrade('Good')}
                className="flex flex-col items-center justify-center p-3 min-h-[64px] border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md group bg-white"
              >
                <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">Good</span>
                <span className="text-[10px] font-mono text-gray-500 mt-0.5">3 / SPC</span>
              </button>

              <button 
                onClick={() => handleGrade('Easy')}
                className="flex flex-col items-center justify-center p-3 min-h-[64px] border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md group bg-white"
              >
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">Easy</span>
                <span className="text-[10px] font-mono text-gray-500 mt-0.5">4</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
