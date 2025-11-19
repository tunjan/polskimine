import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudySession } from '../components/StudySession';
import { useDeck } from '../contexts/DeckContext';
import { isCardDue } from '../services/srs';

export const StudyRoute: React.FC = () => {
  const { cards, updateCard, recordReview, undoReview, canUndo } = useDeck();
  const navigate = useNavigate();
  const dueCards = useMemo(() => {
    const now = new Date();
    return cards.filter(c => isCardDue(c, now));
  }, [cards]);

  return (
    <StudySession 
      dueCards={dueCards}
      onUpdateCard={updateCard}
      onRecordReview={recordReview}
      onExit={() => navigate('/')}
      onUndo={undoReview}
      canUndo={canUndo}
    />
  );
};
