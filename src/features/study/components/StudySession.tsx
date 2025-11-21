import React, { useEffect, useRef } from 'react';
import { X, Undo2 } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { useStudySession } from '../hooks/useStudySession';

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
    isCurrentCardDue,
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

  const stateRef = useRef({
    sessionComplete,
    currentCard,
    isFlipped,
    canUndo,
    handleGrade,
    handleUndo,
    setIsFlipped
  });

  useEffect(() => {
    stateRef.current = {
      sessionComplete,
      currentCard,
      isFlipped,
      canUndo,
      handleGrade,
      handleUndo,
      setIsFlipped
    };
  }, [sessionComplete, currentCard, isFlipped, canUndo, handleGrade, handleUndo, setIsFlipped]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        sessionComplete,
        currentCard,
        isFlipped,
        canUndo,
        handleGrade,
        handleUndo,
        setIsFlipped
      } = stateRef.current;

      if (sessionComplete && e.key !== 'z') return; 
      if (!currentCard && !sessionComplete) return;

      if (!isFlipped && !sessionComplete) {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else if (!sessionComplete) {
        if (e.code === 'Space' || e.key === '2') {
          e.preventDefault();
          handleGrade('Good');
        } else if (e.key === '1') {
          e.preventDefault();
          handleGrade('Again');
        }
      }

      if (e.key === 'z' && canUndo) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  if (sessionComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Session Complete</h2>
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!currentCard) return null;
  if (!isCurrentCardDue)
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center text-muted-foreground animate-pulse">
        Waiting for review step...
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="w-full h-16 flex justify-between items-center px-8">
        <button onClick={onExit} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground tracking-widest">
                {currentIndex + 1} / {sessionCards.length}
            </span>
            {canUndo && (
                <button onClick={handleUndo} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Undo2 size={16} />
                </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </div>

      {/* Bottom Controls (Large touch targets, minimal visuals) */}
      <div className="h-24 w-full max-w-2xl mx-auto mb-8 px-6">
        {!isFlipped ? (
             <button 
                onClick={() => setIsFlipped(true)}
                className="w-full h-full flex items-center justify-center border border-border rounded-xl text-sm font-mono uppercase tracking-widest text-muted-foreground hover:bg-secondary/50 transition-colors"
             >
                Reveal
             </button>
        ) : (
            <div className="grid grid-cols-2 gap-4 h-full animate-in slide-in-from-bottom-2 fade-in duration-300">
                <button 
                    onClick={() => handleGrade('Again')}
                    className="flex flex-col items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors gap-1"
                >
                    <span className="font-semibold text-lg">Again</span>
                    <span className="text-[10px] font-mono opacity-70">1</span>
                </button>

                <button 
                    onClick={() => handleGrade('Good')}
                    className="flex flex-col items-center justify-center bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-opacity gap-1"
                >
                    <span className="font-semibold text-lg">Good</span>
                    <span className="text-[10px] font-mono opacity-70">Space</span>
                </button>
            </div>
        )}
      </div>
      
      {/* Progress Line at absolute bottom */}
      <div className="h-1 w-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};