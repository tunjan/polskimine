import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';

interface UseStudySessionParams {
  dueCards: Card[];
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const useStudySession = ({
  dueCards,
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(dueCards.length === 0);
  const [actionHistory, setActionHistory] = useState<{ addedCard: boolean }[]>([]);

  useEffect(() => {
    setSessionCards(dueCards);
    setCurrentIndex(0);
    setSessionComplete(dueCards.length === 0);
    setActionHistory([]);
  }, [dueCards]);

  const currentCard = sessionCards[currentIndex];

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    const now = new Date();
    let due = isCardDue(currentCard, now);
    if (
      currentCard &&
      !due &&
      settings.ignoreLearningStepsWhenNoCards
    ) {
      const remainingCards = sessionCards.slice(currentIndex);
      if (!remainingCards.some((card) => isCardDue(card, now))) {
        due = true;
      }
    }
    return due;
  }, [currentCard, currentIndex, sessionCards, settings.ignoreLearningStepsWhenNoCards]);

  const handleGrade = useCallback(
    (grade: Grade) => {
      if (!currentCard) return;
      const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
      onUpdateCard(updatedCard);
      onRecordReview(currentCard, grade);

      let appended = false;
      if (updatedCard.status === 'learning') {
        setSessionCards((prev) => [...prev, updatedCard]);
        appended = true;
      }
      setActionHistory((prev) => [...prev, { addedCard: appended }]);

      if (currentIndex < sessionCards.length - 1 || appended) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    },
    [currentCard, currentIndex, onRecordReview, onUpdateCard, sessionCards.length, settings.fsrs]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo || !onUndo) return;
    onUndo();
    if (currentIndex > 0 || sessionComplete) {
      const lastAction = actionHistory[actionHistory.length - 1];
      if (lastAction?.addedCard) {
        setSessionCards((prev) => prev.slice(0, -1));
      }
      setActionHistory((prev) => prev.slice(0, -1));
      setSessionComplete(false);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsFlipped(true);
    }
  }, [actionHistory, canUndo, currentIndex, onUndo, sessionComplete]);

  const progress = sessionCards.length
    ? (currentIndex / sessionCards.length) * 100
    : 0;

  return {
    sessionCards,
    currentCard,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionComplete,
    isCurrentCardDue,
    handleGrade,
    handleUndo,
    progress,
  };
};