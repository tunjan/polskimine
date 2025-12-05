import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Trophy, Target, Zap, Sparkles } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useStudySession } from '../hooks/useStudySession';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { StudyHeader } from './StudyHeader';
import { StudyFooter } from './StudyFooter';
import { StudyCardArea } from './StudyCardArea';

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
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult, subtractXp } = useXpSession(dailyStreak, isCramMode);

  const lastXpEarnedRef = React.useRef<number>(0);

  const enhancedRecordReview = useCallback((card: Card, grade: Grade) => {
    const rating = mapGradeToRating(grade);
    const xpResult = processCardResult(rating);
    lastXpEarnedRef.current = xpResult.totalXp;
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

  const handleUndoWithXp = useCallback(() => {
    if (onUndo && lastXpEarnedRef.current > 0) {
      subtractXp(lastXpEarnedRef.current);
      lastXpEarnedRef.current = 0;
    }
    onUndo?.();
  }, [onUndo, subtractXp]);

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
    removeCardFromSession,
  } = useStudySession({
    dueCards,
    reserveCards,
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo: handleUndoWithXp,
  });

  const handleBookmark = useCallback((pressed: boolean) => {
    if (!currentCard) return;
    const updatedCard = { ...currentCard, isBookmarked: pressed };
    onUpdateCard(updatedCard);
  }, [currentCard, onUpdateCard]);

  const handleDelete = useCallback(() => {
    if (!currentCard) return;
    if (confirm('Are you sure you want to delete this card?')) {
      // First update the session state to show the next card
      removeCardFromSession(currentCard.id);
      // Then delete from the database
      onDeleteCard(currentCard.id);
    }
  }, [currentCard, removeCardFromSession, onDeleteCard]);

  const counts = useMemo(() => getQueueCounts(sessionCards.slice(currentIndex)), [sessionCards, currentIndex]);

  const currentStatus = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) return { label: 'CRAM', className: 'text-purple-500 border-purple-500/20 bg-purple-500/5' };

    const s = currentCard.state;

    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
      return { label: 'NEW', className: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
      return { label: 'LRN', className: 'text-amber-500 border-amber-500/20 bg-amber-500/5' };
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


        {/* Decorative corner accents - Genshin style */}
        <span className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute top-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute top-4 right-4 w-10 h-10 pointer-events-none">
          <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none">
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>

        <div className="text-center space-y-10 px-6 max-w-lg mx-auto">


          {/* Header */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-20 h-px bg-linear-to-r from-transparent to-amber-500/40" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
              <span className="w-2 h-2 rotate-45 bg-amber-500/60" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
              <span className="w-20 h-px bg-linear-to-l from-transparent to-amber-500/40" />
            </div>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight text-foreground">Session Complete</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
            <div className="relative p-4 border border-amber-600/20 bg-card/30">
              <span className="absolute top-0 left-0 w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-amber-500/40" />
                <span className="absolute top-0 left-0 h-full w-px bg-amber-500/40" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Target size={16} className="text-amber-500/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{cardsReviewed}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Cards</span>
              </div>
            </div>

            <div className="relative p-4 border-2 border-amber-500/40 bg-amber-500/5">
              <span className="absolute top-0 left-0 w-3 h-3">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500" />
              </span>
              <span className="absolute bottom-0 right-0 w-3 h-3">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Zap size={16} className="text-amber-500" strokeWidth={1.5} />
                <span className="text-2xl font-light text-amber-500 tabular-nums">+{sessionXp}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-amber-500/60">XP Earned</span>
              </div>
            </div>

            <div className="relative p-4 border border-amber-600/20 bg-card/30">
              <span className="absolute top-0 right-0 w-2 h-2">
                <span className="absolute top-0 right-0 w-full h-px bg-amber-500/40" />
                <span className="absolute top-0 right-0 h-full w-px bg-amber-500/40" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Sparkles size={16} className="text-amber-500/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{sessionStreak}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Best Streak</span>
              </div>
            </div>
          </div>

          {/* Continue button - Genshin style */}
          <button
            onClick={() => onComplete ? onComplete() : onExit()}
            className="group relative px-12 py-4 bg-card hover:bg-amber-500/5 border-2 border-amber-700/20 hover:border-amber-500/40 transition-all animate-in fade-in duration-700 delay-700"
          >
            {/* Button corner accents */}
            <span className="absolute -top-px -left-px w-3 h-3 border-l-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -top-px -right-px w-3 h-3 border-r-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -left-px w-3 h-3 border-l-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -right-px w-3 h-3 border-r-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-sm font-ui uppercase tracking-[0.15em] text-foreground/70 group-hover:text-amber-500 transition-colors duration-300">Continue</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">

      {/* Genshin-styled progress bar */}
      <div className="relative h-2 w-full bg-card border-b border-amber-600/10 overflow-hidden">
        {/* Decorative end caps */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-amber-500/40 z-10" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-amber-500/40 z-10" />

        {/* Progress fill with amber gradient */}
        <div
          className="absolute h-full bg-linear-to-r from-amber-600/80 via-amber-500/60 to-amber-400/40 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Animated shine overlay */}
        <div
          className="absolute top-0 h-full bg-linear-to-r from-transparent via-white/20 to-transparent w-12 transition-all duration-700"
          style={{
            left: `${Math.max(0, progress - 6)}%`,
            opacity: progress > 0 ? 1 : 0
          }}
        />
        {/* Progress end glow point */}
        {progress > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-amber-500 shadow-[0_0_8px_2px] shadow-amber-500/50 transition-all duration-700"
            style={{ left: `calc(${progress}% - 3px)` }}
          />
        )}
      </div>

      <StudyHeader
        counts={counts}
        currentStatus={currentStatus}
        sessionXp={sessionXp}
        multiplierInfo={multiplierInfo}
        isProcessing={isProcessing}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDelete}
        onArchive={handleMarkKnown}
        onUndo={handleUndo}
        onExit={onExit}
        canUndo={!!canUndo}
        isBookmarked={currentCard?.isBookmarked}
        onBookmark={handleBookmark}
      />

      <StudyCardArea
        feedback={feedback}
        currentCard={currentCard}
        isFlipped={isFlipped}
        autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
        blindMode={settings.blindMode}
        showTranslation={settings.showTranslationAfterFlip}
        language={settings.language}
        onAddCard={onAddCard}
      />

      <StudyFooter
        isFlipped={isFlipped}
        setIsFlipped={setIsFlipped}
        isProcessing={isProcessing}
        binaryRatingMode={settings.binaryRatingMode}
        onGrade={handleGrade}
      />

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
