import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { X, Undo2, Archive, Pencil, Trash2 } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';
import { AddCardModal } from '@/features/deck/components/AddCardModal';

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
  onDeleteCard: (id: string) => void;
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
  onDeleteCard,
  onRecordReview,
  onExit,
  onComplete,
  onUndo,
  canUndo,
  isCramMode = false,
  dailyStreak,
}) => {
  const { settings } = useSettings();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
        {/* Decorative corner accents */}
        <span className="absolute top-4 left-4 w-8 h-8 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/40" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/40" />
        </span>
        <span className="absolute top-4 right-4 w-8 h-8 pointer-events-none">
          <span className="absolute top-0 right-0 w-full h-0.5 bg-primary/40" />
          <span className="absolute top-0 right-0 h-full w-0.5 bg-primary/40" />
        </span>
        <span className="absolute bottom-4 left-4 w-8 h-8 pointer-events-none">
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/40" />
          <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/40" />
        </span>
        <span className="absolute bottom-4 right-4 w-8 h-8 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
        </span>
        
        <div className="text-center space-y-12 px-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-primary/40" />
              <span className="w-2 h-2 rotate-45 bg-primary/60" />
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-primary/40" />
            </div>
            <h2 className="text-5xl md:text-7xl font-light tracking-tight text-foreground">Session Complete</h2>
            <p className="text-[10px] font-ui uppercase tracking-[0.25em] text-muted-foreground/60">All cards reviewed</p>
          </div>
          <button 
            onClick={() => onComplete ? onComplete() : onExit()} 
            className="group relative px-10 py-4 bg-card hover:bg-primary/5 border border-border hover:border-primary/40 transition-all duration-300"
          >
            {/* Button corner accents */}
            <span className="absolute -top-px -left-px w-2 h-2 border-l border-t border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -top-px -right-px w-2 h-2 border-r border-t border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -left-px w-2 h-2 border-l border-b border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -right-px w-2 h-2 border-r border-b border-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-sm font-ui uppercase tracking-[0.15em] text-foreground/70 group-hover:text-primary transition-colors duration-300">Continue</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      
      {/* Game-styled progress bar */}
      <div className="relative h-1 w-full bg-muted/30 border-b border-border/20">
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
        <span className="absolute top-0 right-0 w-1 h-full bg-primary/40" />
        <div 
          className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-all duration-700 ease-out origin-left" 
          style={{ transform: `scaleX(${progress / 100})` }} 
        />
        {/* Progress shine effect */}
        <div 
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }} 
        />
      </div>

      {/* Game-styled header */}
      <header className="relative h-16 md:h-20 px-4 md:px-12 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-2 border-b border-border/10">
         {/* Left corner accent */}
         <span className="absolute top-0 left-0 w-3 h-3 pointer-events-none">
           <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/30" />
           <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/30" />
         </span>
         
         {/* Queue statistics - game UI style */}
         <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <GameQueueStat 
              label="New" 
              count={counts.unseen} 
              isActive={currentStatus?.label === 'NEW'}
              color="blue"
            />
            <GameQueueStat 
              label="Learning" 
              count={counts.learning} 
              isActive={currentStatus?.label === 'LRN'}
              color="orange"
            />
            <GameQueueStat 
              label="Lapse" 
              count={counts.lapse} 
              isActive={currentStatus?.label === 'LAPSE'}
              color="red"
            />
            <GameQueueStat 
              label="Review" 
              count={counts.mature} 
              isActive={currentStatus?.label === 'REV'}
              color="green"
            />
         </div>

         {/* Meta info and controls - game styled */}
         <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            {/* XP display */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-card/50 border border-border/30">
                <span className="w-1 h-1 rotate-45 bg-primary/60" />
                <span className="text-xs font-ui tracking-wide text-foreground/80">
                    {sessionXp} <span className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</span>
                </span>
                {multiplierInfo.value > 1.0 && (
                    <span className="text-[10px] text-primary font-medium px-1.5 py-0.5 bg-primary/10 border border-primary/20">
                        ×{multiplierInfo.value.toFixed(1)}
                    </span>
                )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
                <GameActionButton 
                  icon={<Pencil size={14} strokeWidth={1.5} />} 
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={isProcessing}
                  title="Edit Card"
                />
                <GameActionButton 
                  icon={<Trash2 size={14} strokeWidth={1.5} />} 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this card?')) {
                        onDeleteCard(currentCard.id);
                    }
                  }}
                  disabled={isProcessing}
                  title="Delete Card"
                  variant="danger"
                />
                <GameActionButton 
                  icon={<Archive size={14} strokeWidth={1.5} />} 
                  onClick={handleMarkKnown}
                  disabled={isProcessing}
                  title="Archive"
                />
                {canUndo && (
                    <GameActionButton 
                      icon={<Undo2 size={14} strokeWidth={1.5} />} 
                      onClick={handleUndo}
                      title="Undo (Z)"
                    />
                )}
                <GameActionButton 
                  icon={<X size={14} strokeWidth={1.5} />} 
                  onClick={onExit}
                  title="Exit (Esc)"
                  variant="danger"
                />
            </div>
         </div>
         
         {/* Right corner accent */}
         <span className="absolute top-0 right-0 w-3 h-3 pointer-events-none">
           <span className="absolute top-0 right-0 w-full h-0.5 bg-primary/30" />
           <span className="absolute top-0 right-0 h-full w-0.5 bg-primary/30" />
         </span>
      </header>

      {/* Central focus area - game styled */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center py-8">
         {/* Decorative side accents */}
         <span className="absolute left-4 top-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-border/30 to-transparent hidden md:block" />
         <span className="absolute right-4 top-1/2 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-border/30 to-transparent hidden md:block" />
         
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

      {/* Game-styled answer controls */}
      <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] border-t border-border/10">
        {/* Corner accents */}
        <span className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none">
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/30" />
          <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/30" />
        </span>
        <span className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/30" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/30" />
        </span>
        
        <div className="h-24 md:h-28 w-full max-w-4xl mx-auto px-8 md:px-16">
          {!isFlipped ? (
               <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="group relative w-full h-full flex items-center justify-center"
               >
                <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors mr-3" />
                <span className="text-[10px] font-ui uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-foreground/60 transition-colors duration-300">
                    Show Answer
                </span>
                <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/40 transition-colors ml-3" />
               </button>
          ) : (
              settings.binaryRatingMode ? (
                  <div className="grid grid-cols-2 h-full w-full gap-4 md:gap-8 items-center py-3">
                      <GameAnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <GameAnswerButton 
                          label="Good" 
                          shortcut="Space" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-4 h-full w-full gap-2 md:gap-4 items-center py-3">
                      <GameAnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <GameAnswerButton 
                          label="Hard" 
                          shortcut="2" 
                          intent="warning"
                          onClick={() => handleGrade('Hard')} 
                          disabled={isProcessing} 
                      />
                      <GameAnswerButton 
                          label="Good" 
                          shortcut="3" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                      <GameAnswerButton 
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

      <AddCardModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onAdd={(updatedCard) => {
            onUpdateCard(updatedCard);
            setIsEditModalOpen(false);
        }}
        initialCard={currentCard}
      />
    </div>
  );
};

// Game-styled Queue Stat component
const GameQueueStat = React.memo(({ label, count, isActive, color }: {
  label: string;
  count: number;
  isActive: boolean;
  color: 'blue' | 'orange' | 'red' | 'green';
}) => {
  const colorMap = {
    blue: { active: 'text-blue-500 border-blue-500/30 bg-blue-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
    orange: { active: 'text-orange-500 border-orange-500/30 bg-orange-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
    red: { active: 'text-red-500 border-red-500/30 bg-red-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
    green: { active: 'text-green-500 border-green-500/30 bg-green-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
  };
  const colors = colorMap[color];
  
  return (
    <div className={clsx(
      "relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 border transition-all duration-300",
      isActive ? colors.active : colors.inactive,
      count === 0 && !isActive && "opacity-40"
    )}>
      {/* Diamond indicator */}
      <span className={clsx(
        "w-1.5 h-1.5 rotate-45 transition-colors",
        isActive ? "bg-current animate-pulse" : "bg-current/40"
      )} />
      <span className="hidden sm:inline text-[9px] font-ui uppercase tracking-wider">{label}</span>
      <span className="text-xs font-ui font-medium tabular-nums">{count}</span>
    </div>
  );
});

// Game-styled Action Button component
const GameActionButton = React.memo(({ icon, onClick, disabled, title, variant = 'default' }: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: 'default' | 'danger';
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={clsx(
      "relative p-2 border border-transparent transition-all duration-200",
      "text-muted-foreground/50 hover:text-foreground",
      variant === 'danger' && "hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5",
      variant === 'default' && "hover:border-border/40 hover:bg-card/50",
      disabled && "opacity-30 cursor-not-allowed"
    )}
  >
    {icon}
  </button>
));

// Game-styled Answer Button component
const GameAnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: { 
    label: string; 
    shortcut: string; 
    intent: 'danger' | 'warning' | 'success' | 'info'; 
    onClick: () => void; 
    disabled: boolean;
}) => {
    const colorMap = {
        danger: { text: 'text-red-500/70', hover: 'hover:text-red-500', border: 'hover:border-red-500/30', bg: 'hover:bg-red-500/5', accent: 'bg-red-500' },
        warning: { text: 'text-orange-500/70', hover: 'hover:text-orange-500', border: 'hover:border-orange-500/30', bg: 'hover:bg-orange-500/5', accent: 'bg-orange-500' },
        success: { text: 'text-emerald-500/70', hover: 'hover:text-emerald-500', border: 'hover:border-emerald-500/30', bg: 'hover:bg-emerald-500/5', accent: 'bg-emerald-500' },
        info: { text: 'text-blue-500/70', hover: 'hover:text-blue-500', border: 'hover:border-blue-500/30', bg: 'hover:bg-blue-500/5', accent: 'bg-blue-500' }
    };
    const colors = colorMap[intent];

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none",
                "border border-border/20 bg-card/30 transition-all duration-200",
                colors.border, colors.bg,
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Corner accents on hover */}
            <span className={clsx("absolute -top-px -left-px w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute top-0 left-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute top-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -top-px -right-px w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute top-0 right-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute top-0 right-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -left-px w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute bottom-0 left-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute bottom-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute bottom-0 right-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute bottom-0 right-0 h-full w-px", colors.accent)} />
            </span>
            
            {/* Diamond accent */}
            <span className={clsx(
              "w-1 h-1 rotate-45 mb-2 opacity-40 group-hover:opacity-100 transition-opacity",
              colors.accent
            )} />
            
            {/* Label */}
            <span className={clsx(
                "text-sm font-ui uppercase tracking-[0.15em] transition-all duration-200",
                colors.text, colors.hover
            )}>
                {label}
            </span>

            {/* Shortcut hint */}
            <span className="absolute bottom-2 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-200 tracking-wider">
                {shortcut}
            </span>
        </button>
    );
});