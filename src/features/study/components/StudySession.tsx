import React, { useMemo, useCallback, useState } from 'react';
import { Card, Grade } from '@/types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStudySession } from '../hooks/useStudySession';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { StudyHeader } from './StudyHeader';
import { StudyFooter } from './StudyFooter';
import { StudyCardArea } from './StudyCardArea';
import { StudySessionSummary } from './StudySessionSummary';
import { StudySessionWaiting } from './StudySessionWaiting';
import { useStudyShortcuts } from '../hooks/useStudyShortcuts';
import { useReviewIntervals } from '../hooks/useReviewIntervals';

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
  onRecordReview: (oldCard: Card, newCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
  onAddCard?: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = React.memo(({
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
  const settings = useSettingsStore(s => s.settings);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult, subtractXp } = useXpSession(dailyStreak, isCramMode);

  const lastXpEarnedRef = React.useRef<number>(0);

  const enhancedRecordReview = useCallback((card: Card, updatedCard: Card, grade: Grade) => {
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
    onRecordReview(card, updatedCard, grade, payload);
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

  const handleDelete = useCallback(async () => {
    if (!currentCard) return;
    if (confirm('Are you sure you want to delete this card?')) {
      setIsDeleting(true);
      try {
        await onDeleteCard(currentCard.id);
        removeCardFromSession(currentCard.id);
      } catch (error) {
        console.error("Failed to delete card", error);
      } finally {
        setIsDeleting(false);
      }
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

  const intervals = useReviewIntervals(currentCard, settings);

  useStudyShortcuts({
    currentCardId: currentCard?.id,
    sessionComplete,
    isFlipped,
    setIsFlipped,
    isProcessing,
    handleGrade,
    handleUndo: handleUndo,
    onExit,
    canUndo: !!canUndo,
    settings,
  });

  if (isWaiting) {
    return <StudySessionWaiting onExit={onExit} />;
  }

  if (sessionComplete) {
    return (
      <StudySessionSummary
        cardsReviewed={currentIndex}
        sessionXp={sessionXp}
        sessionStreak={sessionStreak}
        onComplete={onComplete}
        onExit={onExit}
      />
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
        isProcessing={isProcessing || isDeleting}
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
        intervals={intervals}
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
});

