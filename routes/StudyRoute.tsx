import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudySession } from '../components/StudySession';
import { useDeck } from '../contexts/DeckContext';
import { isCardDue } from '../services/srs';
import { Card } from '../types';

export const StudyRoute: React.FC = () => {
  const { cards, updateCard, recordReview, undoReview, canUndo, isLoading } = useDeck();
  const navigate = useNavigate();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && !isInitialized) {
      const now = new Date();
      const due = cards.filter(c => isCardDue(c, now));
      setSessionCards(due);
      setIsInitialized(true);
    }
  }, [cards, isLoading, isInitialized]);

  if (isLoading || !isInitialized) {
    return <div className="flex items-center justify-center h-screen">Loading session...</div>;
  }

  return (
    <StudySession 
      dueCards={sessionCards}
      onUpdateCard={updateCard}
      onRecordReview={recordReview}
      onExit={() => navigate('/')}
      onUndo={undoReview}
      canUndo={canUndo}
    />
  );
};
