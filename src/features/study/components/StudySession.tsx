import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Undo2, Archive, Zap } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, XP_CONFIG, CardRating } from '@/features/xp/xpUtils';

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: 'again',
  Hard: 'hard',
  Good: 'good',
  Easy: 'easy',
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];



const getCardStatus = (card: Card) => {

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
  reserveCards?: Card[]; // Added prop
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
}

export const StudySession: React.FC<StudySessionProps> = ({
  dueCards,
  reserveCards = [], // Default empty
  onUpdateCard,
  onRecordReview,
  onExit,
  onComplete,
  onUndo,
  canUndo,
  isCramMode = false,
}) => {
  const { settings } = useSettings();
  const { sessionXp, sessionStreak, processCardResult } = useXpSession(isCramMode);
  const getDisplayedBaseXp = (grade: Grade) => {
    const rating = mapGradeToRating(grade);
    if (isCramMode) {
      return rating === 'again' ? 0 : XP_CONFIG.CRAM_CORRECT;
    }
    return XP_CONFIG.BASE[rating];
  };

  const enhancedRecordReview = useCallback(
    (card: Card, grade: Grade) => {
      const rating = mapGradeToRating(grade);
      const reward = processCardResult(rating);
      onRecordReview(card, grade, reward);
    },
    [onRecordReview, processCardResult]
  );

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
    reserveCards, // Pass to hook
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo,
  });

  const counts = useMemo(() => {
    return getQueueCounts(sessionCards.slice(currentIndex));
  }, [sessionCards, currentIndex]);

  const stateRef = useRef({ 
    isFlipped, 
    sessionComplete, 
    currentCard,
    canUndo,
    isProcessing,
  });

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
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-light tracking-tighter">Session Complete</h2>
          <p className="text-muted-foreground">Queue cleared for now.</p>
          
          <button 
            onClick={() => onComplete ? onComplete() : onExit()}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-sm font-mono uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Finish & Claim Rewards
          </button>
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
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
         <div className="flex items-center gap-2 md:gap-4 font-mono text-xs pointer-events-auto">
            {/* Counters */}
            <div className="flex gap-3 md:gap-6 font-bold bg-background/90 backdrop-blur border border-border/50 px-3 py-2 md:py-0 rounded-md md:rounded-none md:border-none md:bg-transparent shadow-sm md:shadow-none">
              <span className="text-blue-500" title="Unseen">{counts.unseen}</span>
              <span className="text-red-500" title="Lapse">{counts.lapse}</span>
              <span className="text-orange-500" title="Learning">{counts.learning}</span>
              <span className="text-green-500" title="Mature">{counts.mature}</span>
            </div>

            {/* Status Label */}
            <div className="hidden sm:flex items-center gap-4">
                <span className="text-muted-foreground/30">|</span>
                {(() => {
                     const status = getCardStatus(currentCard);
                     return (
                         <span className={clsx("font-bold uppercase tracking-wider", status.className)}>
                             {status.text}
                         </span>
                     );
                 })()}
            </div>
            <div className="hidden md:flex items-center gap-3 text-muted-foreground/80">
              <span>Streak <span className="text-foreground">{sessionStreak}</span></span>
              <span className="text-muted-foreground/30">|</span>
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Zap size={14} className="text-primary" />
                {sessionXp} XP
              </span>
            </div>
         </div>

         {/* Action Buttons */}
         <div className="flex gap-2 md:gap-4 pointer-events-auto bg-background/90 backdrop-blur border border-border/50 p-1 rounded-md md:rounded-none md:border-none md:bg-transparent md:p-0 shadow-sm md:shadow-none">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleMarkKnown} 
                    disabled={isProcessing}
                    className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Archive size={18} className="md:w-5 md:h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as Known (K)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {canUndo && (
                <button onClick={handleUndo} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Undo2 size={18} className="md:w-5 md:h-5" />
                </button>
            )}
            <button onClick={onExit} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} className="md:w-5 md:h-5" />
            </button>
         </div>
      </div>

      {/* Main Content */}
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

      {/* Bottom Actions */}
      <div className="h-32 md:h-40 shrink-0 flex flex-col items-center justify-center gap-2 px-4 md:px-6 pb-6 md:pb-8">
        <div className="w-full max-w-lg flex items-center justify-between text-[11px] font-mono text-muted-foreground md:hidden">
          <span>Streak <span className="text-foreground">{sessionStreak}</span></span>
          <span className="flex items-center gap-1 text-primary font-semibold">
            <Zap size={14} className="text-primary" />
            {sessionXp} XP
          </span>
        </div>
        {!isFlipped ? (
             <button 
              onClick={() => setIsFlipped(true)}
              disabled={isProcessing}
              className="w-full max-w-md h-14 rounded-md border border-border/50 hover:border-foreground/50 hover:bg-secondary/50 transition-all text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
             >
              {isProcessing ? 'Processing...' : 'Reveal Answer'}
             </button>
        ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
              <button 
                onClick={() => handleGrade('Again')}
                disabled={isProcessing}
                className="group h-16 rounded-md border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground group-hover:text-red-500">Again</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">+{getDisplayedBaseXp('Again')} XP</span>
              </button>
              <button 
                onClick={() => handleGrade('Good')}
                disabled={isProcessing}
                className="group h-16 rounded-md border border-primary/30 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xs font-mono uppercase tracking-wider text-foreground group-hover:text-primary">Good</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">+{getDisplayedBaseXp('Good')} XP</span>
              </button>
            </div>
        )}
      </div>
    </div>
  );
};