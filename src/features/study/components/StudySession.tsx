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
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-1000">
        <div className="text-center space-y-16 px-6">
          <div className="space-y-6">
             <h2 className="text-6xl md:text-8xl font-serif font-extralight tracking-tight text-foreground/90">Session Complete</h2>
             <p className="text-xs font-sans font-light uppercase tracking-[0.25em] text-muted-foreground/60">All cards reviewed</p>
          </div>
          <button 
            onClick={() => onComplete ? onComplete() : onExit()} 
            className="group relative px-10 py-5 bg-transparent hover:bg-primary/5 border border-border/60 hover:border-primary/40 transition-all duration-500 rounded-2xl"
          >
            <span className="relative z-10 text-sm font-sans font-light uppercase tracking-[0.2em] text-foreground/70 group-hover:text-primary/90 transition-colors duration-500">Continue</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden selection:bg-primary/10">
      
      {/* Elegant progress indicator */}
      <div className="h-0.5 w-full bg-muted/30">
        <div 
          className="h-full w-full bg-linear-to-r from-primary/60 via-primary/80 to-primary/60 transition-all duration-700 ease-out origin-left shadow-sm" 
          style={{ transform: `scaleX(${progress / 100})` }} 
        />
      </div>

      {/* Minimal header with refined typography */}
      <header className="h-16 md:h-20 px-4 md:px-16 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-2">
         
         {/* Queue statistics - refined presentation */}
         <div className="flex items-center gap-2 sm:gap-3 md:gap-8 text-[9px] font-sans font-light uppercase tracking-[0.2em] text-muted-foreground/70">
            <div className={clsx(
              "flex items-center gap-1.5 sm:gap-2 transition-all duration-500",
              currentStatus?.label === 'NEW' 
                ? "text-blue-500/90 opacity-100 font-normal scale-105" 
                : (counts.unseen > 0 ? "text-muted-foreground/80" : "opacity-60")
            )}>
                <span className={clsx(
                  "w-1.5 h-1.5 rounded-full bg-current",
                  currentStatus?.label === 'NEW' && "animate-pulse shadow-sm shadow-current"
                )} />
                <span className="hidden sm:inline">New</span>
                <span className="font-medium">{counts.unseen}</span>
            </div>
            <div className={clsx(
              "flex items-center gap-1.5 sm:gap-2 transition-all duration-500",
              currentStatus?.label === 'LRN' 
                ? "text-orange-500/90 opacity-100 font-normal scale-105" 
                : (counts.learning > 0 ? "text-muted-foreground/80" : "opacity-60")
            )}>
                <span className={clsx(
                  "w-1.5 h-1.5 rounded-full bg-current",
                  currentStatus?.label === 'LRN' && "animate-pulse shadow-sm shadow-current"
                )} />
                <span className="hidden sm:inline">Learning</span>
                <span className="font-medium">{counts.learning}</span>
            </div>
            <div className={clsx(
              "flex items-center gap-1.5 sm:gap-2 transition-all duration-500",
              currentStatus?.label === 'LAPSE' 
                ? "text-red-500/90 opacity-100 font-normal scale-105" 
                : (counts.lapse > 0 ? "text-muted-foreground/80" : "opacity-60")
            )}>
                <span className={clsx(
                  "w-1.5 h-1.5 rounded-full bg-current",
                  currentStatus?.label === 'LAPSE' && "animate-pulse shadow-sm shadow-current"
                )} />
                <span className="hidden sm:inline">Review</span>
                <span className="font-medium">{counts.lapse}</span>
            </div>
            <div className={clsx(
              "flex items-center gap-1.5 sm:gap-2 transition-all duration-500",
              currentStatus?.label === 'REV' 
                ? "text-green-500/90 opacity-100 font-normal scale-105" 
                : (counts.mature > 0 ? "text-muted-foreground/80" : "opacity-60")
            )}>
                <span className={clsx(
                  "w-1.5 h-1.5 rounded-full bg-current",
                  currentStatus?.label === 'REV' && "animate-pulse shadow-sm shadow-current"
                )} />
                <span className="hidden sm:inline">Mature</span>
                <span className="font-medium">{counts.mature}</span>
            </div>
         </div>

         {/* Meta info and controls - minimal and refined */}
         <div className="flex items-center gap-2 sm:gap-4 md:gap-10">
            <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2.5 text-xs font-sans font-light tracking-wide text-muted-foreground/85">
                    <span>{sessionXp} <span className="text-[10px] uppercase tracking-wider">XP</span></span>
                    {multiplierInfo.value > 1.0 && (
                        <span className="text-[9px] text-primary/85 font-medium">
                            ×{multiplierInfo.value.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-muted-foreground/50">
                <button 
                  onClick={handleMarkKnown} 
                  disabled={isProcessing} 
                  className="p-1.5 sm:p-2.5 hover:text-foreground/80 transition-all duration-500 rounded-lg hover:bg-muted/30" 
                  title="Archive"
                >
                    <Archive size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={1.5} />
                </button>
                {canUndo && (
                    <button 
                      onClick={handleUndo} 
                      className="p-1.5 sm:p-2.5 hover:text-foreground/80 transition-all duration-500 rounded-lg hover:bg-muted/30" 
                      title="Undo (Z)"
                    >
                        <Undo2 size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={1.5} />
                    </button>
                )}
                <button 
                  onClick={onExit} 
                  className="p-1.5 sm:p-2.5 hover:text-destructive/70 transition-all duration-500 rounded-lg hover:bg-destructive/5" 
                  title="Exit (Esc)"
                >
                    <X size={14} className="sm:w-[15px] sm:h-[15px]" strokeWidth={1.5} />
                </button>
            </div>
         </div>
      </header>

      {/* Central focus area - generous whitespace */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center py-8">
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

      {/* Refined answer controls */}
      <footer className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="h-24 md:h-28 w-full max-w-4xl mx-auto px-8 md:px-16">
          {!isFlipped ? (
               <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="w-full h-full flex items-center justify-center group"
               >
                <span className="text-[10px] font-sans font-light uppercase tracking-[0.25em] text-muted-foreground/30 group-hover:text-foreground/50 transition-colors duration-700">
                    Show Answer
                </span>
               </button>
          ) : (
              settings.binaryRatingMode ? (
                  <div className="grid grid-cols-2 h-full w-full gap-6 md:gap-16 items-center">
                      <AnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Good" 
                          shortcut="Space" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-4 h-full w-full gap-3 md:gap-6 items-center">
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
        danger: 'text-red-500/70',
        warning: 'text-orange-500/70',
        success: 'text-emerald-500/70',
        info: 'text-blue-500/70'
    };
    
    const hoverColorMap = {
        danger: 'group-hover:text-red-500',
        warning: 'group-hover:text-orange-500',
        success: 'group-hover:text-emerald-500',
        info: 'group-hover:text-blue-500'
    };
    
    const textColor = colorMap[intent];
    const hoverColor = hoverColorMap[intent];

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none transition-all duration-500",
                "rounded-2xl hover:bg-muted/20",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Label */}
            <span className={clsx(
                "text-sm md:text-base font-sans font-light uppercase tracking-[0.2em] transition-all duration-500",
                textColor,
                hoverColor,
                "group-hover:scale-110"
            )}>
                {label}
            </span>

            {/* Shortcut hint */}
            <span className="absolute bottom-0 text-[8px] font-sans font-light text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:bottom-3 tracking-wider">
                {shortcut}
            </span>
        </button>
    );
});