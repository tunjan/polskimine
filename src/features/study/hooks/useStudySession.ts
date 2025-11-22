import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialized = useRef(false);
  
  // Synchronous ref to prevent race condition in keyboard event handler
  const isProcessingRef = useRef(false);

  // Initialize session only once to prevent index resets when dueCards change during reviews
  useEffect(() => {
    if (!isInitialized.current && dueCards.length > 0) {
      setSessionCards(dueCards);
      setCurrentIndex(0);
      setSessionComplete(dueCards.length === 0);
      setActionHistory([]);
      isInitialized.current = true;
    }
  }, [dueCards]);

  const currentCard = sessionCards[currentIndex];

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    const now = new Date();
    // Relaxed check: treat the current card as reviewable if its dueDate <= now.
    // Early reviews (slightly in future) are managed by queue logic; we don't gate UI here.
    return isCardDue(currentCard, now);
  }, [currentCard]);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      // Check synchronous ref instead of state
      if (!currentCard || isProcessingRef.current) return;
      
      // Lock immediately before any async operations
      isProcessingRef.current = true;
      setIsProcessing(true);
      
      try {
        const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
        // Sequence: update card, then record review. Fail fast without advancing index.
        await Promise.resolve(onUpdateCard(updatedCard));
        await Promise.resolve(onRecordReview(currentCard, grade));

        let appended = false;
        if (updatedCard.status === 'learning') {
          setSessionCards((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === updatedCard.id) return prev; // Prevent duplicate append
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
        // Unlock synchronously
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
      const updatedCard: Card = {
        ...currentCard,
        status: 'known',
      };

      await Promise.resolve(onUpdateCard(updatedCard));
      
      // We don't record a review for "known" as it's a manual override,
      // but we do advance the queue.
      setActionHistory((prev) => [...prev, { addedCard: false }]);

      if (currentIndex < sessionCards.length - 1) {
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
  }, [currentCard, currentIndex, onUpdateCard, sessionCards.length]);

  const handleUndo = useCallback(() => {
    if (!canUndo || !onUndo) return;
    onUndo();
    
    if (currentIndex > 0 || sessionComplete) {
      setActionHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        const lastAction = prev[prev.length - 1];
        
        // If the last action added a card to the queue (learning status),
        // remove that ghost card from the end of sessionCards
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