import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';

export const useCardText = (card: Card) => {
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => {
    setDisplayedTranslation(card.nativeTranslation);
    setIsGaslit(false);
  }, [card.id, card.nativeTranslation]);

  const processText = useCallback((text: string) => {
    return text;
  }, []);

  return {
    displayedTranslation,
    isGaslit,
    processText
  };
};
