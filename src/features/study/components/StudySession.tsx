import React, { useMemo, useCallback, useState } from 'react';
import { Card, Grade } from '@/types';
import { Progress } from '@/components/ui/progress';
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
    updateCardInSession,
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
    updateCardInSession(updatedCard);
  }, [currentCard, onUpdateCard, updateCardInSession]);

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
    if (isCramMode) return { label: 'CRAM', className: 'text-chart-5 border-chart-5/20 bg-chart-5/10' };

    const s = currentCard.state;

    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
      return { label: 'NEW', className: 'text-chart-1 border-chart-1/20 bg-chart-1/10' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
      return { label: 'LRN', className: 'text-chart-2 border-chart-2/20 bg-chart-2/10' };
    }
    if (s === 3) {
      return { label: 'LAPSE', className: 'text-destructive border-destructive/20 bg-destructive/10' };
    }
    return { label: 'REV', className: 'text-chart-3 border-chart-3/20 bg-chart-3/10' };
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

      <div className="relative h-2 w-full bg-card border-b border-primary/10 overflow-hidden">
        <Progress value={progress} className="h-full w-full rounded-none" />
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

