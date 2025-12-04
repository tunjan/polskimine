import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';
import { isNewCard } from '@/services/studyLimits'; 

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[]; 
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [], 
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [reserveCards, setReserveCards] = useState<Card[]>(initialReserve); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(dueCards.length === 0);
  const [actionHistory, setActionHistory] = useState<{ addedCard: boolean }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialized = useRef(false);


  const isProcessingRef = useRef(false);


  useEffect(() => {
    if (!isInitialized.current && dueCards.length > 0) {
      let sortedCards = [...dueCards];

      if (settings.cardOrder === 'newFirst') {
        sortedCards.sort((a, b) => {
          const aIsNew = isNewCard(a);
          const bIsNew = isNewCard(b);
          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;
          return 0;
        });
      } else if (settings.cardOrder === 'reviewFirst') {
        sortedCards.sort((a, b) => {
          const aIsNew = isNewCard(a);
          const bIsNew = isNewCard(b);
          if (!aIsNew && bIsNew) return -1;
          if (aIsNew && !bIsNew) return 1;
          return 0;
        });
      }

      setSessionCards(sortedCards);
      setReserveCards(initialReserve);
      setCurrentIndex(0);
      setSessionComplete(dueCards.length === 0);
      setActionHistory([]);
      isInitialized.current = true;
    }
  }, [dueCards, initialReserve, settings.cardOrder]);

  const currentCard = sessionCards[currentIndex];

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    const now = new Date();
    return isCardDue(currentCard, now);
  }, [currentCard]);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (!currentCard || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
        await Promise.resolve(onUpdateCard(updatedCard));
        await Promise.resolve(onRecordReview(currentCard, grade));

        let appended = false;
        if (updatedCard.status === 'learning') {
          setSessionCards((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === updatedCard.id) return prev;
            return [...prev, updatedCard];
          });
          appended = true;
        }
        setActionHistory((prev) => [...prev, { addedCard: appended }]);

        if (currentIndex < sessionCards.length - 1 || appended) {
          setIsFlipped(false);
          setCurrentIndex((prev) => prev + 1);
        } else {
          setSessionComplete(true);
        }
      } catch (e) {
        console.error("Review failed", e);
        return;
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [currentCard, currentIndex, onRecordReview, onUpdateCard, sessionCards.length, settings.fsrs]
  );

  const handleMarkKnown = useCallback(async () => {
    if (!currentCard || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const wasNew = isNewCard(currentCard); 

      const updatedCard: Card = {
        ...currentCard,
        status: 'known',
      };

      await Promise.resolve(onUpdateCard(updatedCard));


      let replacementAdded = false;
      if (wasNew && reserveCards.length > 0) {
        const nextNew = reserveCards[0];
        setSessionCards(prev => [...prev, nextNew]);
        setReserveCards(prev => prev.slice(1));
        replacementAdded = true;
      }


      setActionHistory((prev) => [...prev, { addedCard: replacementAdded }]);

      if (currentIndex < sessionCards.length - 1 || replacementAdded) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    } catch (e) {
      console.error("Mark known failed", e);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [currentCard, currentIndex, onUpdateCard, sessionCards.length, reserveCards]);

  const handleUndo = useCallback(() => {
    if (!canUndo || !onUndo) return;
    onUndo();

    if (currentIndex > 0 || sessionComplete) {
      setActionHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        const lastAction = prev[prev.length - 1];



        if (lastAction?.addedCard) {
          setSessionCards((prevCards) => prevCards.slice(0, -1));
        }

        return newHistory;
      });

      setSessionComplete(false);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsFlipped(true);
    }
  }, [canUndo, currentIndex, onUndo, sessionComplete]);

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
    handleMarkKnown,
    handleUndo,
    progress,
    isProcessing,
  };
};