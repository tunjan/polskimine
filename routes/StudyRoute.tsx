import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudySession } from '../components/StudySession';
import { useDeck } from '../contexts/DeckContext';
import { db } from '../services/db';
import { Card } from '../types';

export const StudyRoute: React.FC = () => {
  const { updateCard, recordReview, undoReview, canUndo } = useDeck();
  const navigate = useNavigate();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDueCards = async () => {
      try {
        const due = await db.getDueCards();
        setSessionCards(due);
      } catch (error) {
        console.error("Failed to load due cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDueCards();
  }, []);

  if (isLoading) {
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
