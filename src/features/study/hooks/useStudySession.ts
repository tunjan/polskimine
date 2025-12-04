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
  const [actionHistory, setActionHistory] = useState<{ addedCardId: string | null }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [tick, setTick] = useState(0);
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

  // NOTE: We intentionally do NOT sync sessionCards with dueCards during the session.
  // Doing so would cause the index to shift when cards are removed from dueCards,
  // leading to cards being skipped. The session queue is effectively "detached"
  // from the dueCards query once initialized.
  // Card deletions should be handled explicitly via onDeleteCard callback.

  useEffect(() => {
    const current = sessionCards[currentIndex];
    if (!current) {
      setIsWaiting(false);
      return;
    }

    const now = new Date();
    if (isCardDue(current, now)) {
      setIsWaiting(false);
      return;
    }

    const nextDueIndex = sessionCards.findIndex((c, i) => i > currentIndex && isCardDue(c, now));

    if (nextDueIndex !== -1) {
      setSessionCards((prev) => {
        const newCards = [...prev];
        const [card] = newCards.splice(nextDueIndex, 1);
        newCards.splice(currentIndex, 0, card);
        return newCards;
      });
      setIsWaiting(false);
    } else {
      // If user has enabled "skip learning wait", allow review immediately
      if (settings.ignoreLearningStepsWhenNoCards) {
        setIsWaiting(false);
        return;
      }
      
      setIsWaiting(true);
      const dueTime = new Date(current.dueDate).getTime();
      const delay = Math.max(100, dueTime - now.getTime());
      
      const timer = setTimeout(() => {
        setTick((t) => t + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [sessionCards, currentIndex, tick, settings.ignoreLearningStepsWhenNoCards]);

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

        let addedCardId: string | null = null;
        let newSessionLength = sessionCards.length;
        const isLastCard = currentIndex === sessionCards.length - 1;
        
        if (updatedCard.status === 'learning') {
          if (isLastCard) {
            // On last card and still learning: update the card in place and stay here
            setSessionCards((prev) => {
              const newCards = [...prev];
              newCards[currentIndex] = updatedCard;
              return newCards;
            });
            // Stay on current card, just flip back
            setIsFlipped(false);
            setActionHistory((prev) => [...prev, { addedCardId: null }]);
            // Note: finally block will clean up isProcessing
            return; // Early return - don't increment index or complete
          } else {
            // Not on last card: add to end normally
            setSessionCards((prev) => [...prev, updatedCard]);
            addedCardId = updatedCard.id;
            newSessionLength = sessionCards.length + 1;
          }
        }
        setActionHistory((prev) => [...prev, { addedCardId }]);

        // Check against the updated length (accounting for potentially added card)
        if (currentIndex < newSessionLength - 1) {
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


      let addedCardId: string | null = null;
      let newSessionLength = sessionCards.length;
      
      if (wasNew && reserveCards.length > 0) {
        const nextNew = reserveCards[0];
        setSessionCards(prev => [...prev, nextNew]);
        setReserveCards(prev => prev.slice(1));
        addedCardId = nextNew.id;
        // Account for the card we just added
        newSessionLength = sessionCards.length + 1;
      }


      setActionHistory((prev) => [...prev, { addedCardId }]);

      // Check against the updated length (accounting for potentially added card)
      if (currentIndex < newSessionLength - 1) {
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



        if (lastAction?.addedCardId) {
          setSessionCards((prevCards) => {
             const last = prevCards[prevCards.length - 1];
             if (last && last.id === lastAction.addedCardId) {
                 return prevCards.slice(0, -1);
             }
             return prevCards;
          });
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

  // Remove a card from the session queue (e.g., when deleted)
  const removeCardFromSession = useCallback((cardId: string) => {
    setSessionCards((prev) => {
      const index = prev.findIndex((c) => c.id === cardId);
      if (index === -1) return prev;

      const newCards = prev.filter((c) => c.id !== cardId);

      // Adjust currentIndex if needed
      if (index < currentIndex) {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (index === currentIndex && newCards.length > 0) {
        // If we removed the current card, stay at the same index
        // (which will now point to the next card)
        if (currentIndex >= newCards.length) {
          setCurrentIndex(newCards.length - 1);
        }
      }

      // Check if session should complete
      if (newCards.length === 0) {
        setSessionComplete(true);
      }

      return newCards;
    });
  }, [currentIndex]);

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
    isWaiting,
    removeCardFromSession,
  };
};