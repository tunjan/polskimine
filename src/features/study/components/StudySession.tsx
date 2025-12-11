import React, { useMemo, useCallback, useState } from "react";
import { Card, Grade } from "@/types";
import { Progress } from "@/components/ui/progress";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useStudyQueue } from "../hooks/useStudyQueue";
import { AddCardModal } from "@/features/collection/components/AddCardModal";
import { StudyHeader } from "./StudyHeader";
import { StudyFooter } from "./StudyFooter";
import { StudyCardArea } from "./StudyCardArea";
import { StudySessionSummary } from "./StudySessionSummary";
import { StudySessionWaiting } from "./StudySessionWaiting";
import { useStudyShortcuts } from "../hooks/useStudyShortcuts";
import { useReviewIntervals } from "../hooks/useReviewIntervals";

interface StudySessionProps {
  dueCards: Card[];
  reserveCards?: Card[];
  onUpdateCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onRecordReview: (
    oldCard: Card,
    newCard: Card,
    grade: Grade,
    xpPayload?: any,
  ) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
  onAddCard?: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = React.memo(
  ({
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
    const {
      autoPlayAudio,
      blindMode,
      showTranslationAfterFlip,
      language,
      binaryRatingMode,
      cardOrder,
      learningSteps,
      fsrs,
      ignoreLearningStepsWhenNoCards,
      relearnSteps,
      leechThreshold,
      leechAction,

      newCardGatherOrder,
      newCardSortOrder,
      newReviewOrder,
      interdayLearningOrder,
      reviewSortOrder,
    } = useSettingsStore(
      useShallow((s) => ({
        autoPlayAudio: s.autoPlayAudio,
        blindMode: s.blindMode,
        showTranslationAfterFlip: s.showTranslationAfterFlip,
        language: s.language,
        binaryRatingMode: s.binaryRatingMode,
        cardOrder: s.cardOrder,
        learningSteps: s.learningSteps,
        fsrs: s.fsrs,
        ignoreLearningStepsWhenNoCards: s.ignoreLearningStepsWhenNoCards,
        relearnSteps: s.relearnSteps,
        leechThreshold: s.leechThreshold,
        leechAction: s.leechAction,

        newCardGatherOrder: s.newCardGatherOrder,
        newCardSortOrder: s.newCardSortOrder,
        newReviewOrder: s.newReviewOrder,
        interdayLearningOrder: s.interdayLearningOrder,
        reviewSortOrder: s.reviewSortOrder,
      })),
    );

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { currentCard, stats, actions, uiState } = useStudyQueue({
      dueCards,
      reserveCards,
      cardOrder,
      displaySettings: {
        newCardGatherOrder,
        newCardSortOrder,
        newReviewOrder,
        interdayLearningOrder,
        reviewSortOrder,
      },
      ignoreLearningStepsWhenNoCards: !!ignoreLearningStepsWhenNoCards,
      fsrs,
      learningSteps,
      lapsesSettings: {
        relearnSteps,
        leechThreshold,
        leechAction,
      },
      onUpdateCard,
      onRecordReview,
      canUndo,
      onUndo,
      dailyStreak,
      isCramMode,
    });

    const handleBookmark = useCallback(
      (pressed: boolean) => {
        if (!currentCard) return;
        const updatedCard = { ...currentCard, isBookmarked: pressed };
        onUpdateCard(updatedCard);
        actions.updateCard(updatedCard);
      },
      [currentCard, onUpdateCard, actions],
    );

    const handleDelete = useCallback(async () => {
      if (!currentCard) return;
      if (confirm("Are you sure you want to delete this card?")) {
        setIsDeleting(true);
        try {
          await onDeleteCard(currentCard.id);
          actions.removeCard(currentCard.id);
        } catch (error) {
          console.error("Failed to delete card", error);
        } finally {
          setIsDeleting(false);
        }
      }
    }, [currentCard, actions, onDeleteCard]);

    const currentStatus = useMemo(() => {
      if (!currentCard) return null;
      if (isCramMode)
        return {
          label: "CRAM",
          className: "text-chart-5 border-chart-5/20 bg-chart-5/10",
        };

      const s = currentCard.state;

      if (s === 0 || (s === undefined && currentCard.status === "new")) {
        return {
          label: "NEW",
          className: "text-chart-1 border-chart-1/20 bg-chart-1/10",
        };
      }
      if (s === 1 || (s === undefined && currentCard.status === "learning")) {
        return {
          label: "LRN",
          className: "text-chart-2 border-chart-2/20 bg-chart-2/10",
        };
      }
      if (s === 3) {
        return {
          label: "LAPSE",
          className: "text-destructive border-destructive/20 bg-destructive/10",
        };
      }
      return {
        label: "REV",
        className: "text-chart-3 border-chart-3/20 bg-chart-3/10",
      };
    }, [currentCard, isCramMode]);

    const intervals = useReviewIntervals(currentCard, fsrs, learningSteps, {
      relearnSteps,
      leechThreshold,
      leechAction,
    });

    useStudyShortcuts({
      currentCardId: currentCard?.id,
      sessionComplete: stats.isFinished,
      isFlipped: uiState.isFlipped,
      setIsFlipped: uiState.setIsFlipped,
      isProcessing: stats.isProcessing,
      handleGrade: actions.gradeCard,
      handleUndo: actions.undo,
      onExit,
      canUndo: !!canUndo,
      binaryRatingMode: !!binaryRatingMode,
    });

    if (stats.isWaiting) {
      return <StudySessionWaiting onExit={onExit} />;
    }

    if (stats.isFinished) {
      return (
        <StudySessionSummary
          cardsReviewed={stats.currentIndex}
          sessionXp={stats.sessionXp}
          sessionStreak={stats.sessionStreak}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    }

    if (!currentCard) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <div className="relative h-2 w-full bg-card border-b border-primary/10 overflow-hidden">
          <Progress
            value={stats.progress}
            className="h-full w-full rounded-none"
          />
        </div>

        <StudyHeader
          counts={stats.counts}
          currentStatus={currentStatus}
          sessionXp={stats.sessionXp}
          multiplierInfo={stats.multiplierInfo}
          isProcessing={stats.isProcessing || isDeleting}
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={handleDelete}
          onArchive={actions.markKnown}
          onUndo={actions.undo}
          onExit={onExit}
          canUndo={!!canUndo}
          isBookmarked={currentCard?.isBookmarked}
          onBookmark={handleBookmark}
        />

        <StudyCardArea
          currentCard={currentCard}
          isFlipped={uiState.isFlipped}
          autoPlayAudio={autoPlayAudio || blindMode}
          blindMode={blindMode}
          showTranslation={showTranslationAfterFlip}
          language={language}
          onAddCard={onAddCard}
          onUpdateCard={(card) => {
            onUpdateCard(card);
            actions.updateCard(card);
          }}
        />

        <StudyFooter
          isFlipped={uiState.isFlipped}
          setIsFlipped={uiState.setIsFlipped}
          isProcessing={stats.isProcessing}
          binaryRatingMode={binaryRatingMode}
          onGrade={actions.gradeCard}
          intervals={intervals}
        />

        <AddCardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onAdd={(updatedCard) => {
            onUpdateCard(updatedCard);
            actions.updateCard(updatedCard);
            setIsEditModalOpen(false);
          }}
          initialCard={currentCard}
        />
      </div>
    );
  },
);
