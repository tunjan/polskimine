import React, { useEffect } from 'react';
import { X, Undo2 } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';

interface StudySessionProps {
  dueCards: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card, grade: Grade) => void;
  onExit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const StudySession: React.FC<StudySessionProps> = ({
  dueCards,
  onUpdateCard,
  onRecordReview,
  onExit,
  onUndo,
  canUndo,
}) => {
  const { settings } = useSettings();
  const {
    sessionCards,
    currentCard,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionComplete,
    handleGrade,
    handleUndo,
    progress,
  } = useStudySession({
    dueCards,
    settings,
    onUpdateCard,
    onRecordReview,
    canUndo,
    onUndo,
  });

  // Keyboard shortcuts (same as before)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard && !sessionComplete) return;
      
      if (!isFlipped && !sessionComplete && e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped && !sessionComplete) {
        if (e.code === 'Space' || e.key === '2') { e.preventDefault(); handleGrade('Good'); }
        else if (e.key === '1') { e.preventDefault(); handleGrade('Again'); }
        else if (e.key === '3') { e.preventDefault(); handleGrade('Easy'); }
        else if (e.key === '4') { e.preventDefault(); handleGrade('Hard'); }
      }

      if (e.key === 'z' && canUndo && onUndo) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionComplete, currentCard, isFlipped, canUndo, handleGrade, handleUndo, setIsFlipped, onUndo, onExit]);

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
        <h2 className="text-4xl md:text-6xl font-light tracking-tighter mb-8">Session Complete</h2>
        <div className="flex gap-8">
            <button onClick={onExit} className="text-sm font-mono uppercase tracking-widest hover:underline">Return Home</button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Minimal Progress Bar */}
      <div className="h-1 w-full bg-secondary/30">
        <div 
            className="h-full bg-primary transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Controls Overlay (Top) */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
         <div className="font-mono text-xs text-muted-foreground">
            {currentIndex + 1} / {sessionCards.length}
         </div>
         <div className="flex gap-4">
            {canUndo && (
                <button onClick={handleUndo} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                    <Undo2 size={20} />
                </button>
            )}
            <button onClick={onExit} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground">
                <X size={20} />
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </div>

      {/* Bottom Actions */}
      <div className="h-32 md:h-40 flex items-center justify-center px-6 pb-8">
        {!isFlipped ? (
             <button 
                onClick={() => setIsFlipped(true)}
                className="w-full max-w-md h-16 rounded-full border border-border hover:border-foreground hover:bg-secondary/10 transition-all text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
             >
                Reveal Answer
             </button>
        ) : (
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
                <button 
                    onClick={() => handleGrade('Again')}
                    className="group h-20 rounded-2xl bg-secondary/30 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex flex-col items-center justify-center gap-1"
                >
                    <span className="text-sm font-medium text-foreground group-hover:text-red-600">Again</span>
                    <span className="text-[10px] font-mono text-muted-foreground">1</span>
                </button>
                <button 
                    onClick={() => handleGrade('Good')}
                    className="group h-20 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/20"
                >
                    <span className="text-sm font-medium">Good</span>
                    <span className="text-[10px] font-mono opacity-70">Space</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};