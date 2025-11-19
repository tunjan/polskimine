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

  // ...existing code...
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-pulse flex flex-col items-center justify-center min-h-[60vh]">
        {/* Header Skeleton */}
        <div className="w-full flex justify-between items-center mb-4">
           <div className="h-4 bg-gray-200 rounded w-24"></div>
           <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Card Skeleton */}
        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg h-[400px]"></div>

        {/* Controls Skeleton */}
        <div className="w-full max-w-md grid grid-cols-3 gap-4 mt-8">
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <StudySession 
// ...existing code... 
      dueCards={sessionCards}
      onUpdateCard={updateCard}
      onRecordReview={recordReview}
      onExit={() => navigate('/')}
      onUndo={undoReview}
      canUndo={canUndo}
    />
  );
};
