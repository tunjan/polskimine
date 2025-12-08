import { useState, useEffect, useCallback } from "react";

interface UseCardInteractionProps {
  cardId: string;
  blindMode: boolean;
  isFlipped: boolean;
}

export function useCardInteraction({
  cardId,
  blindMode,
  isFlipped,
}: UseCardInteractionProps) {
  const [isRevealed, setIsRevealed] = useState(!blindMode);

  useEffect(() => {
    setIsRevealed(!blindMode);
  }, [cardId, blindMode]);

  useEffect(() => {
    if (isFlipped) setIsRevealed(true);
  }, [isFlipped]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsRevealed(true);
    }
  }, []);

  return {
    isRevealed,
    setIsRevealed,
    handleReveal,
    handleKeyDown,
  };
}
