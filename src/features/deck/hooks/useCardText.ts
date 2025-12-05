import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';

// Sabotage removed - local-only app has no curses
export const useCardText = (card: Card) => {
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => {
    // No curses in local mode - always show real translation
    setDisplayedTranslation(card.nativeTranslation);
    setIsGaslit(false);
  }, [card.id, card.nativeTranslation]);

  const processText = useCallback((text: string) => {
    // No text processing curses in local mode
    return text;
  }, []);

  return {
    displayedTranslation,
    isGaslit,
    processText
  };
};
