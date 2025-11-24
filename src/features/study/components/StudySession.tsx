import React, { useEffect, useMemo, useCallback } from 'react';
import { X, Undo2, Archive } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: 'again',
  Hard: 'hard',
  Good: 'good',
  Easy: 'easy',
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === 0 || (state === undefined && card.status === 'new')) acc.unseen++;
      else if (state === 1 || (state === undefined && card.status === 'learning')) acc.learning++;
      else if (state === 3) acc.lapse++;
      else acc.mature++;
      return acc;
    },
    { unseen: 0, learning: 0, lapse: 0, mature: 0 }
  );
};

interface StudySessionProps {
  dueCards: Card[];
  reserveCards?: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
}

export const StudySession: React.FC<StudySessionProps> = ({
  dueCards,
  reserveCards = [],
  onUpdateCard,
  onRecordReview,
  onExit,
  onComplete,
  onUndo,
  canUndo,
  isCramMode = false,
  dailyStreak,
}) => {
  const { settings } = useSettings();
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult } = useXpSession(dailyStreak, isCramMode);

  const enhancedRecordReview = useCallback((card: Card, grade: Grade) => {
      const rating = mapGradeToRating(grade);
      const xpResult = processCardResult(rating); 
      const payload: CardXpPayload = {
        ...xpResult,
        rating,
        streakAfter: rating === 'again' ? 0 : sessionStreak + 1,
        isCramMode,
        dailyStreak,
        multiplierLabel: multiplierInfo.label
      };
      onRecordReview(card, grade, payload);
    }, [onRecordReview, processCardResult, sessionStreak, isCramMode, dailyStreak, multiplierInfo]);

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
    reserveCards,
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo,
  });

  const counts = useMemo(() => getQueueCounts(sessionCards.slice(currentIndex)), [sessionCards, currentIndex]);
  const totalRemaining = counts.unseen + counts.learning + counts.lapse + counts.mature;

  const currentStatus = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) return { label: 'CRAM', className: 'text-purple-500 border-purple-500/20 bg-purple-500/5' };

    const s = currentCard.state;
    // 0=New, 1=Learning, 2=Review, 3=Relearning
    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
        return { label: 'NEW', className: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
        return { label: 'LRN', className: 'text-orange-500 border-orange-500/20 bg-orange-500/5' };
    }
    if (s === 3) {
        return { label: 'LAPSE', className: 'text-red-500 border-red-500/20 bg-red-500/5' };
    }
    return { label: 'REV', className: 'text-green-500 border-green-500/20 bg-green-500/5' };
  }, [currentCard, isCramMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard && !sessionComplete) return;
      
      // Flip Logic
      if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) { 
        e.preventDefault(); 
        setIsFlipped(true); 
      }
      // Grade Logic
      else if (isFlipped && !sessionComplete && !isProcessing) {
        if (settings.binaryRatingMode) {
            // Binary Mode: 1=Fail, Space/2/3/4=Pass
            if (e.key === '1') { 
                e.preventDefault(); 
                handleGrade('Again'); 
            } else if (['2', '3', '4', 'Space', 'Enter'].includes(e.key) || e.code === 'Space') { 
                e.preventDefault(); 
                handleGrade('Good'); 
            }
        } else {
            // Standard Mode
            if (e.code === 'Space' || e.key === '3') { e.preventDefault(); handleGrade('Good'); }
            else if (e.key === '1') { e.preventDefault(); handleGrade('Again'); }
            else if (e.key === '2') { e.preventDefault(); handleGrade('Hard'); }
            else if (e.key === '4') { e.preventDefault(); handleGrade('Easy'); }
        }
      }

      if (e.key === 'z' && canUndo && onUndo) { e.preventDefault(); handleUndo(); }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, sessionComplete, isFlipped, isProcessing, handleGrade, handleUndo, canUndo, onUndo, onExit, settings.binaryRatingMode]);

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="text-center space-y-12">
          <div className="space-y-4">
             <h2 className="text-5xl md:text-8xl font-thin tracking-tighter">Session Clear</h2>
             <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">All cards reviewed</p>
          </div>
          <button onClick={() => onComplete ? onComplete() : onExit()} className="group relative px-8 py-4 bg-transparent hover:bg-primary/5 border border-border hover:border-primary transition-all rounded text-sm font-mono uppercase tracking-widest">
            <span className="relative z-10 group-hover:text-primary transition-colors">Finish & Claim</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden font-sans selection:bg-primary/10">
      
      {/* 1. Ultra-Minimal Progress Line */}
      <div className="h-px w-full bg-foreground/5">
        <div className="h-full w-full bg-foreground transition-transform duration-500 ease-out origin-left" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      {/* 2. Heads-Up Display (HUD) */}
      <header className="h-16 px-6 md:px-12 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)]">
         
         {/* Queue Stats (Left) */}
         <div className="flex items-center gap-3 md:gap-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'NEW' ? "text-blue-500 opacity-100 font-medium scale-105" : (counts.unseen > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'NEW' && "animate-pulse")} />
                <span className="hidden sm:inline">New</span>
                <span>{counts.unseen}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'LRN' ? "text-orange-500 opacity-100 font-medium scale-105" : (counts.learning > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'LRN' && "animate-pulse")} />
                <span className="hidden sm:inline">Lrn</span>
                <span>{counts.learning}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'LAPSE' ? "text-red-500 opacity-100 font-medium scale-105" : (counts.lapse > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'LAPSE' && "animate-pulse")} />
                <span className="hidden sm:inline">Lapse</span>
                <span>{counts.lapse}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'REV' ? "text-green-500 opacity-100 font-medium scale-105" : (counts.mature > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'REV' && "animate-pulse")} />
                <span className="hidden sm:inline">Rev</span>
                <span>{counts.mature}</span>
            </div>
         </div>

         {/* Meta & Tools (Right) */}
         <div className="flex items-center gap-6 md:gap-8">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-muted-foreground">
                    <span>{sessionXp} XP</span>
                    {multiplierInfo.value > 1.0 && (
                        <span className="text-[9px] text-primary opacity-80">
                            {multiplierInfo.value.toFixed(1)}x
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground/40">
                <button onClick={handleMarkKnown} disabled={isProcessing} className="p-2 hover:text-foreground transition-colors" title="Archive (K)">
                    <Archive size={14} strokeWidth={1.5} />
                </button>
                {canUndo && (
                    <button onClick={handleUndo} className="p-2 hover:text-foreground transition-colors" title="Undo (Z)">
                        <Undo2 size={14} strokeWidth={1.5} />
                    </button>
                )}
                <button onClick={onExit} className="p-2 hover:text-destructive transition-colors" title="Exit (Esc)">
                    <X size={14} strokeWidth={1.5} />
                </button>
            </div>
         </div>
      </header>

      {/* 3. The Stage (Flashcard) */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center">
         
         {/* Status Indicator Removed - Integrated into Header Stats */}

         <StudyFeedback feedback={feedback} />
         
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </main>

      {/* 4. Disciplined Controls (Bottom) */}
      <footer className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="h-20 md:h-24 w-full max-w-3xl mx-auto px-6">
          {!isFlipped ? (
               <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="w-full h-full flex items-center justify-center group"
               >
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/30 group-hover:text-foreground/60 transition-colors duration-500">
                    Tap to Reveal
                </span>
               </button>
          ) : (
              settings.binaryRatingMode ? (
                  <div className="grid grid-cols-2 h-full w-full gap-4 md:gap-12 items-center">
                      <AnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Good" 
                          shortcut="Spc" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-4 h-full w-full gap-2 md:gap-4 items-center">
                      <AnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Hard" 
                          shortcut="2" 
                          intent="warning"
                          onClick={() => handleGrade('Hard')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Good" 
                          shortcut="3" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Easy" 
                          shortcut="4" 
                          intent="info"
                          onClick={() => handleGrade('Easy')} 
                          disabled={isProcessing} 
                      />
                  </div>
              )
          )}
        </div>
      </footer>
    </div>
  );
};

const AnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: { 
    label: string; 
    shortcut: string; 
    intent: 'danger' | 'warning' | 'success' | 'info'; 
    onClick: () => void; 
    disabled: boolean;
}) => {
    const colorMap = {
        danger: 'text-red-500',
        warning: 'text-orange-500',
        success: 'text-emerald-500',
        info: 'text-blue-500'
    };
    
    const textColor = colorMap[intent];

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none transition-all duration-300",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Label */}
            <span className={clsx(
                "text-xs md:text-sm font-mono uppercase tracking-[0.25em] transition-all duration-300",
                "text-muted-foreground group-hover:scale-110",
                `group-hover:${textColor}`
            )}>
                {label}
            </span>

            {/* Shortcut Hint */}
            <span className="absolute -bottom-4 text-[9px] font-mono text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bottom-2">
                {shortcut}
            </span>
        </button>
    );
});