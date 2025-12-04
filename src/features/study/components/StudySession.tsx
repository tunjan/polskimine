import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { X, Undo2, Archive, Pencil, Trash2, Zap, Sparkles, Trophy, Target, TrendingUp } from 'lucide-react';
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
  onAddCard?: (card: Card) => void;
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
  onAddCard,
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
    isWaiting,
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
    
    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
        return { label: 'NEW', className: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
        return { label: 'LRN', className: 'text-orange-500 border-orange-500/20 bg-orange-500/5' };
    }
    if (s === 3) {
        return { label: 'LAPSE', className: 'text-red-500 border-red-500/20 bg-red-500/5' };
    }
    return { label: 'REV', className: 'text-green-700 border-green-700/20 bg-green-700/5' };
  }, [currentCard, isCramMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard && !sessionComplete) return;
      
      
      if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) { 
        e.preventDefault(); 
        setIsFlipped(true); 
      }
      
      else if (isFlipped && !sessionComplete && !isProcessing) {
        if (settings.binaryRatingMode) {
            
            if (e.key === '1') { 
                e.preventDefault(); 
                handleGrade('Again'); 
            } else if (['2', '3', '4', 'Space', 'Enter'].includes(e.key) || e.code === 'Space') { 
                e.preventDefault(); 
                handleGrade('Good'); 
            }
        } else {
            
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

  if (isWaiting) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
        <div className="text-center space-y-6 px-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-light tracking-tight text-foreground">Waiting for learning steps...</h2>
            <p className="text-sm text-muted-foreground">Cards are cooling down. Take a short break.</p>
          </div>
          <button 
            onClick={onExit}
            className="px-6 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Exit Session
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const cardsReviewed = currentIndex;
    
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-1000 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <span 
              key={i}
              className="absolute w-1 h-1 rotate-45 bg-primary/30"
              style={{
                left: `${10 + (i % 4) * 25}%`,
                top: `${20 + Math.floor(i / 4) * 30}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
        
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
        
        <div className="text-center space-y-10 px-6 max-w-lg mx-auto">
          {/* Trophy icon with glow */}
          <div className="relative inline-flex items-center justify-center animate-in zoom-in duration-700">
            <div className="absolute inset-0 blur-xl bg-primary/20 scale-150" />
            <div className="relative w-16 h-16 flex items-center justify-center border-2 border-primary/30 rotate-45">
              <Trophy size={28} className="text-primary -rotate-45" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Header */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-16 h-px bg-linear-to-r from-transparent to-primary/40" />
              <span className="w-2 h-2 rotate-45 bg-primary/60 animate-pulse" />
              <span className="w-16 h-px bg-linear-to-l from-transparent to-primary/40" />
            </div>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight text-foreground">Session Complete</h2>
            <p className="text-[10px] font-ui uppercase tracking-[0.25em] text-muted-foreground/60">Well done!</p>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
            <div className="relative p-4 border border-border/30 bg-card/30">
              <span className="absolute top-0 left-0 w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-primary/30" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary/30" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Target size={16} className="text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{cardsReviewed}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Cards</span>
              </div>
            </div>
            
            <div className="relative p-4 border border-primary/30 bg-primary/5">
              <span className="absolute top-0 left-0 w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary" />
              </span>
              <span className="absolute bottom-0 right-0 w-2 h-2">
                <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Zap size={16} className="text-primary" strokeWidth={1.5} />
                <span className="text-2xl font-light text-primary tabular-nums">+{sessionXp}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-primary/60">XP Earned</span>
              </div>
            </div>
            
            <div className="relative p-4 border border-border/30 bg-card/30">
              <span className="absolute top-0 right-0 w-2 h-2">
                <span className="absolute top-0 right-0 w-full h-px bg-primary/30" />
                <span className="absolute top-0 right-0 h-full w-px bg-primary/30" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Sparkles size={16} className="text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{sessionStreak}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Best Streak</span>
              </div>
            </div>
          </div>
          
          {/* Continue button */}
          <button 
            onClick={() => onComplete ? onComplete() : onExit()} 
            className="group relative px-12 py-4 bg-card hover:bg-primary/5 border border-border hover:border-primary/40 transition-all animate-in fade-in duration-700 delay-700"
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
      
      {/* Game-styled progress bar with glow */}
      <div className="relative h-1.5 w-full bg-muted/30 border-b border-border/20 overflow-hidden">
        {/* Progress fill with glow */}
        <div 
          className="absolute h-full bg-linear-to-r from-primary/70 via-primary to-primary/70 transition-all duration-700 ease-out animate-progress-glow" 
          style={{ width: `${progress}%` }} 
        />
        {/* Animated shine overlay */}
        <div 
          className="absolute top-0 h-full bg-linear-to-r from-transparent via-white/30 to-transparent w-16 transition-all duration-700"
          style={{ 
            left: `${Math.max(0, progress - 8)}%`,
            opacity: progress > 0 ? 1 : 0
          }} 
        />
        {/* Progress end glow point */}
        {progress > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/50 transition-all duration-700"
            style={{ left: `calc(${progress}% - 4px)` }} 
          />
        )}
      </div>

      {/* Game-styled header */}
      <header className="relative h-16 md:h-20 px-4 md:px-12 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-2 border-b border-border/10">
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

            {/* Enhanced XP display */}
            <div className="hidden sm:flex items-center gap-3  relative overflow-hidden group">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 " />
                
                {/* XP icon with glow */}
                <div className="relative">
                  <Zap size={14} strokeWidth={2} className="text-primary fill-primary/20" />
                  <div className="absolute inset-0 blur-[2px] opacity-50">
                    <Zap size={14} strokeWidth={2} className="text-primary" />
                  </div>
                </div>
                
                {/* XP value */}
                <span className="relative text-sm font-ui font-medium tracking-wide text-foreground tabular-nums">
                    {sessionXp}
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 ml-1">XP</span>
                </span>
                
                {/* Multiplier badge */}
                {multiplierInfo.value > 1.0 && (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-semibold px-2 py-0.5  animate-pulse">
                        <TrendingUp size={10} strokeWidth={2.5} />
                        <span>×{multiplierInfo.value.toFixed(1)}</span>
                    </div>
                )}
                
                {/* Corner accents */}

            </div>
         </div>

         

         {/* Meta info and controls - game styled */}
         <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
                <GameActionButton 
                  icon={<Pencil size={14} strokeWidth={1.5} />} 
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={isProcessing}
                  title="Edit Card"
                  aria-label="Edit Card"
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
                  aria-label="Delete Card"
                  variant="danger"
                />
                <GameActionButton 
                  icon={<Archive size={14} strokeWidth={1.5} />} 
                  onClick={handleMarkKnown}
                  disabled={isProcessing}
                  title="Archive"
                  aria-label="Archive"
                />
                {canUndo && (
                    <GameActionButton 
                      icon={<Undo2 size={14} strokeWidth={1.5} />} 
                      onClick={handleUndo}
                      title="Undo (Z)"
                      aria-label="Undo"
                    />
                )}
                <GameActionButton 
                  icon={<X size={14} strokeWidth={1.5} />} 
                  onClick={onExit}
                  title="Exit (Esc)"
                  aria-label="Exit"
                  variant="danger"
                />
            </div>
         </div>
         

      </header>

      {/* Central focus area - game styled */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center py-8">
         {/* Decorative side accents */}
         <span className="absolute left-4 top-1/2 -translate-y-1/2 w-px h-32 bg-linear-to-b from-transparent via-border/30 to-transparent hidden md:block" />
         <span className="absolute right-4 top-1/2 -translate-y-1/2 w-px h-32 bg-linear-to-b from-transparent via-border/30 to-transparent hidden md:block" />
         
         <StudyFeedback feedback={feedback} />
         
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
            onAddCard={onAddCard}
          />
      </main>

      {/* Game-styled answer controls */}
      <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] border-t border-border/10">

        
        <div className="h-24 md:h-28 w-full max-w-4xl mx-auto px-8 md:px-16">
          {!isFlipped ? (
               <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="group relative w-full h-full flex items-center justify-center border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
               >
                {/* Corner accents on hover */}
                <span className="absolute -top-px -left-px w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="absolute top-0 left-0 w-full h-px bg-primary/50" />
                  <span className="absolute top-0 left-0 h-full w-px bg-primary/50" />
                </span>
                <span className="absolute -bottom-px -right-px w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="absolute bottom-0 right-0 w-full h-px bg-primary/50" />
                  <span className="absolute bottom-0 right-0 h-full w-px bg-primary/50" />
                </span>
                
                <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/60 transition-colors mr-3" />
                <span className="text-[11px] font-ui uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-primary/80 transition-colors duration-300">
                    Show Answer
                </span>
                <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/60 transition-colors ml-3" />
                
                {/* Subtle keyboard hint */}
                <span className="absolute bottom-3 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-300 tracking-wider">
                  SPACE
                </span>
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
    green: { active: 'text-green-700 border-green-700/30 bg-green-700/5', inactive: 'text-muted-foreground/60 border-border/30' },
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


const GameAnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: { 
    label: string; 
    shortcut: string; 
    intent: 'danger' | 'warning' | 'success' | 'info'; 
    onClick: () => void; 
    disabled: boolean;
}) => {
    const [isPressed, setIsPressed] = useState(false);
    
    const colorMap = {
        danger: { 
          text: 'text-red-500/70', 
          hover: 'hover:text-red-500', 
          border: 'hover:border-red-500/40', 
          bg: 'hover:bg-red-500/5', 
          accent: 'bg-red-500',
          glow: 'shadow-red-500/20',
          gradient: 'from-red-500/10 to-transparent'
        },
        warning: { 
          text: 'text-orange-500/70', 
          hover: 'hover:text-orange-500', 
          border: 'hover:border-orange-500/40', 
          bg: 'hover:bg-orange-500/5', 
          accent: 'bg-orange-500',
          glow: 'shadow-orange-500/20',
          gradient: 'from-orange-500/10 to-transparent'
        },
        success: { 
          text: 'text-pine-500/70', 
          hover: 'hover:text-pine-500', 
          border: 'hover:border-pine-500/40', 
          bg: 'hover:bg-pine-500/5', 
          accent: 'bg-pine-500',
          glow: 'shadow-pine-500/20',
          gradient: 'from-pine-500/10 to-transparent'
        },
        info: { 
          text: 'text-blue-500/70', 
          hover: 'hover:text-blue-500', 
          border: 'hover:border-blue-500/40', 
          bg: 'hover:bg-blue-500/5', 
          accent: 'bg-blue-500',
          glow: 'shadow-blue-500/20',
          gradient: 'from-blue-500/10 to-transparent'
        }
    };
    const colors = colorMap[intent];

    const handleClick = () => {
        if (disabled) return;
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        onClick();
    };

    return (
        <button 
            onClick={handleClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none overflow-hidden",
                "border border-border/20 bg-card/30 transition-all duration-200",
                colors.border, colors.bg,
                "hover:shadow-lg",
                colors.glow,
                isPressed && "scale-95",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Gradient background on hover */}
            <div className={clsx(
              "absolute inset-0 bg-linear-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              colors.gradient
            )} />
            
            {/* Corner accents on hover */}
            <span className={clsx("absolute -top-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute top-0 left-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute top-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -top-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute top-0 right-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute top-0 right-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute bottom-0 left-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute bottom-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
              <span className={clsx("absolute bottom-0 right-0 w-full h-px", colors.accent)} />
              <span className={clsx("absolute bottom-0 right-0 h-full w-px", colors.accent)} />
            </span>
            
            {/* Diamond accent with glow */}
            <div className="relative mb-2">
              <span className={clsx(
                "w-1.5 h-1.5 rotate-45 opacity-40 group-hover:opacity-100 transition-all duration-200 block",
                colors.accent
              )} />
              <span className={clsx(
                "absolute inset-0 w-1.5 h-1.5 rotate-45 opacity-0 group-hover:opacity-60 blur-sm transition-opacity",
                colors.accent
              )} />
            </div>
            
            {/* Label */}
            <span className={clsx(
                "relative text-sm font-ui uppercase tracking-[0.15em] transition-all duration-200",
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
