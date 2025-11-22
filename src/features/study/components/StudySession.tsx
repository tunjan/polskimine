import React, { useEffect, useMemo, useRef } from 'react';
import { X, Undo2, Archive } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getCardStatus = (card: Card) => {
  // FSRS State: New=0, Learning=1, Review=2, Relearning=3
  if (card.state === 0 || (card.state === undefined && card.status === 'new')) 
    return { text: 'Unseen', className: 'text-blue-500' };
  if (card.state === 1 || (card.state === undefined && card.status === 'learning')) 
    return { text: 'Learning', className: 'text-orange-500' };
  if (card.state === 3) 
    return { text: 'Lapse', className: 'text-red-500' };
  return { text: 'Mature', className: 'text-green-500' };
};

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === 0 || (state === undefined && card.status === 'new')) {
        acc.unseen++;
      } else if (state === 1 || (state === undefined && card.status === 'learning')) {
        acc.learning++;
      } else if (state === 3) {
        acc.lapse++;
      } else {
        acc.mature++;
      }
      return acc;
    },
    { unseen: 0, learning: 0, lapse: 0, mature: 0 }
  );
};

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
    handleMarkKnown,
    handleUndo,
    progress,
    isProcessing,
  } = useStudySession({
    dueCards,
    settings,
    onUpdateCard,
    onRecordReview,
    canUndo,
    onUndo,
  });

  // Calculate remaining counts
  const counts = useMemo(() => {
    return getQueueCounts(sessionCards.slice(currentIndex));
  }, [sessionCards, currentIndex]);

  // Use refs to hold current state values to prevent event listener rebinding on every render
  // This eliminates thrashing on keyboard listener detach/attach cycles
  const stateRef = useRef({ 
    isFlipped, 
    sessionComplete, 
    currentCard,
    canUndo,
    isProcessing,
  });

  // Use refs to hold callback references to prevent listener re-attachment
  const handleGradeRef = useRef(handleGrade);
  const handleMarkKnownRef = useRef(handleMarkKnown);
  const handleUndoRef = useRef(handleUndo);
  const onUndoRef = useRef(onUndo);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    stateRef.current = { isFlipped, sessionComplete, currentCard, canUndo, isProcessing };
  }, [isFlipped, sessionComplete, currentCard, canUndo, isProcessing]);

  useEffect(() => {
    handleGradeRef.current = handleGrade;
    handleMarkKnownRef.current = handleMarkKnown;
    handleUndoRef.current = handleUndo;
    onUndoRef.current = onUndo;
    onExitRef.current = onExit;
  }, [handleGrade, handleMarkKnown, handleUndo, onUndo, onExit]);

  // Keyboard shortcuts - use refs to avoid rebinding listener on every state change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state.currentCard && !state.sessionComplete) return;
      
      if (!state.isFlipped && !state.sessionComplete && e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(true);
      } else if (state.isFlipped && !state.sessionComplete && !state.isProcessing) {
        if (e.code === 'Space' || e.key === '2') { e.preventDefault(); handleGradeRef.current('Good'); }
        else if (e.key === '1') { e.preventDefault(); handleGradeRef.current('Again'); }
        else if (e.key === '3') { e.preventDefault(); handleGradeRef.current('Easy'); }
        else if (e.key === '4') { e.preventDefault(); handleGradeRef.current('Hard'); }
      }

      // Mark Known Hotkey (K)
      if (e.code === 'KeyK' && !state.sessionComplete && !state.isProcessing) {
        e.preventDefault();
        handleMarkKnownRef.current();
      }

      if (e.key === 'z' && state.canUndo && onUndoRef.current) {
        e.preventDefault();
        handleUndoRef.current();
      }
      if (e.key === 'Escape') onExitRef.current();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className="h-1 w-full bg-secondary/30 shrink-0">
        <div 
            className="h-full bg-primary transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
        />
      </div>

      {/* Controls Overlay (Top) */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
         <div className="flex items-center gap-4 font-mono text-xs pointer-events-auto">
            {/* New System Counters: Unseen / Lapse / Learning / Mature */}
            <div className="flex gap-6 font-bold">
              <span className="text-blue-500" title="Unseen">{counts.unseen}</span>
              <span className="text-red-500" title="Lapse">{counts.lapse}</span>
              <span className="text-orange-500" title="Learning">{counts.learning}</span>
              <span className="text-green-500" title="Mature">{counts.mature}</span>
            </div>

            {/* Separator */}
            <span className="text-muted-foreground/30">|</span>

            {/* Current Card Status Label */}
            {(() => {
                 const status = getCardStatus(currentCard);
                 return (
                     <span className={clsx("font-bold uppercase tracking-wider", status.className)}>
                         {status.text}
                     </span>
                 );
             })()}
         </div>

         <div className="flex gap-4 pointer-events-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleMarkKnown} 
                    disabled={isProcessing}
                    className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Archive size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as Known (K)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {canUndo && (
                <button onClick={handleUndo} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Undo2 size={20} />
                </button>
            )}
            <button onClick={onExit} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
            </button>
         </div>
      </div>

      {/* Main Content - Flex-1 to take up all available space */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative">
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </div>

      {/* Bottom Actions - Fixed Height */}
      <div className="h-32 md:h-40 shrink-0 flex items-center justify-center px-6 pb-8">
        {!isFlipped ? (
             <button 
              onClick={() => setIsFlipped(true)}
              disabled={isProcessing}
              className="w-full max-w-md h-14 rounded-md border border-border/50 hover:border-foreground/50 hover:bg-secondary/50 transition-all text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
             >
              {isProcessing ? 'Processing...' : 'Reveal Answer'}
             </button>
        ) : (
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
              <button 
                onClick={() => handleGrade('Again')}
                disabled={isProcessing}
                className="group h-16 rounded-md border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground group-hover:text-red-500">Again</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">1</span>
              </button>
              <button 
                onClick={() => handleGrade('Good')}
                disabled={isProcessing}
                className="group h-16 rounded-md border border-primary/30 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-foreground group-hover:text-primary">Good</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">Space</span>
              </button>
            </div>
        )}
      </div>
    </div>
  );
};