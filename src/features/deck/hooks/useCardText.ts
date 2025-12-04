import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';

export const useCardText = (card: Card) => {
  const { isCursedWith } = useSabotage();
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => {
    if (isCursedWith('gaslight') && Math.random() > 0.5) {
      const randomFake = FAKE_ANSWERS[Math.floor(Math.random() * FAKE_ANSWERS.length)];
      setDisplayedTranslation(randomFake);
      setIsGaslit(true);
    } else {
      setDisplayedTranslation(card.nativeTranslation);
      setIsGaslit(false);
    }
  }, [card.id, isCursedWith, card.nativeTranslation]);

  const processText = useCallback((text: string) => {
    return isCursedWith('uwu') ? uwuify(text) : text;
  }, [isCursedWith]);

  return {
    displayedTranslation,
    isGaslit,
    processText
  };
};

