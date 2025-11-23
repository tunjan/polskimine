import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Undo2, Archive, Zap } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      
      {/* 1. Ultra-Minimal Progress Line */}
      <div className="h-[2px] w-full bg-secondary/20">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* 2. Heads-Up Display (HUD) */}
      <header className="h-14 px-4 md:px-6 flex justify-between items-center select-none shrink-0">
         
         {/* Queue Stats (Left) */}
         <div className="flex gap-3 md:gap-4 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest items-center">
            {/* Compact Labels on Mobile */}
            <span title="New" className={clsx("transition-colors", counts.unseen > 0 && "text-blue-500/80")}>
                <span className="hidden sm:inline">New </span><span className="sm:hidden">N:</span>{counts.unseen}
            </span>
            <span title="Learn" className={clsx("transition-colors", counts.learning > 0 && "text-orange-500/80")}>
                <span className="hidden sm:inline">Lrn </span><span className="sm:hidden">L:</span>{counts.learning}
            </span>
            <span title="Review" className={clsx("transition-colors", counts.mature > 0 && "text-green-500/80")}>
                <span className="hidden sm:inline">Rev </span><span className="sm:hidden">R:</span>{counts.mature}
            </span>
         </div>

         {/* Meta & Tools (Right) */}
         <div className="flex items-center gap-4 md:gap-6">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-muted-foreground">
                    <span>{sessionXp} XP</span>
                    {multiplierInfo.value > 1.0 && (
                        <span className="text-[9px] text-primary hidden sm:inline">
                            {multiplierInfo.value.toFixed(2)}x
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground/50">
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
      <main className="flex-1 w-full relative flex flex-col">
         
         {/* Status Indicator - Moved inside Main to prevent overlap */}
         <div className="w-full flex justify-center py-2 shrink-0 min-h-[30px]">
            {currentStatus && (
                <div className={clsx(
                    "px-2 py-0.5 rounded-[2px] border text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-300 select-none",
                    currentStatus.className
                )}>
                    {currentStatus.label}
                </div>
            )}
         </div>

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
      <footer className="h-24 md:h-32 shrink-0 border-t border-border/20 bg-background/50 backdrop-blur-sm">
        {!isFlipped ? (
             <button 
              onClick={() => setIsFlipped(true)}
              disabled={isProcessing}
              className="w-full h-full text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-secondary/10 transition-colors"
             >
              Tap to Reveal
             </button>
        ) : (
            settings.binaryRatingMode ? (
                // Binary Mode Layout
                <div className="grid grid-cols-2 h-full w-full divide-x divide-border/20">
                    <AnswerButton 
                        label="Again" 
                        sub="1" 
                        colorClass="hover:bg-red-500/5 hover:text-red-500" 
                        onClick={() => handleGrade('Again')} 
                        disabled={isProcessing} 
                    />
                    <AnswerButton 
                        label="Good" 
                        sub="Space" 
                        colorClass="hover:bg-green-500/5 hover:text-green-500" 
                        onClick={() => handleGrade('Good')} 
                        disabled={isProcessing} 
                    />
                </div>
            ) : (
                // Standard Mode Layout
                <div className="grid grid-cols-4 h-full w-full divide-x divide-border/20">
                    <AnswerButton 
                        label="Again" 
                        sub="1" 
                        colorClass="hover:bg-red-500/5 hover:text-red-500" 
                        onClick={() => handleGrade('Again')} 
                        disabled={isProcessing} 
                    />
                    <AnswerButton 
                        label="Hard" 
                        sub="2" 
                        colorClass="hover:bg-orange-500/5 hover:text-orange-500" 
                        onClick={() => handleGrade('Hard')} 
                        disabled={isProcessing} 
                    />
                    <AnswerButton 
                        label="Good" 
                        sub="3" 
                        colorClass="hover:bg-green-500/5 hover:text-green-500" 
                        onClick={() => handleGrade('Good')} 
                        disabled={isProcessing} 
                    />
                    <AnswerButton 
                        label="Easy" 
                        sub="4" 
                        colorClass="hover:bg-blue-500/5 hover:text-blue-500" 
                        onClick={() => handleGrade('Easy')} 
                        disabled={isProcessing} 
                    />
                </div>
            )
        )}
      </footer>
    </div>
  );
};

const AnswerButton = ({ label, sub, colorClass, onClick, disabled }: any) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={clsx(
            "flex flex-col items-center justify-center gap-1 transition-all duration-200 group relative overflow-hidden",
            colorClass,
            disabled && "opacity-50 cursor-not-allowed"
        )}
    >
        <span className="text-xs font-mono uppercase tracking-widest z-10">{label}</span>
        <span className="text-[9px] font-mono text-muted-foreground/30 absolute bottom-4 md:bottom-8 group-hover:opacity-0 transition-opacity">{sub}</span>
    </button>
);