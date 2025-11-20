import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudySession } from '../components/StudySession';
import { useDeck } from '../contexts/DeckContext';
import { db } from '../services/db';
import { Card } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { applyStudyLimits } from '../services/studyLimits';

export const StudyRoute: React.FC = () => {
  const { updateCard, recordReview, undoReview, canUndo } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await db.getCramCards(limit, tag);
          setSessionCards(cramCards);
        } else {
          const due = await db.getDueCards();
          const reviewsToday = await db.getTodayReviewStats();
          const limited = applyStudyLimits(due, {
            dailyNewLimit: settings.dailyNewLimit,
            dailyReviewLimit: settings.dailyReviewLimit,
            reviewsToday
          });
          setSessionCards(limited);
        }
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [settings.dailyNewLimit, settings.dailyReviewLimit, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (!isCramMode) {
      updateCard(card);
    }
  };

  const handleRecordReview = (card: Card) => {
    if (!isCramMode) {
      recordReview(card);
    }
  };

  const handleMarkKnown = (card: Card) => {
    if (!isCramMode) {
      const updatedCard = { ...card, status: 'known' as const };
      updateCard(updatedCard);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="loading-skeleton" className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-pulse flex flex-col items-center justify-center min-h-[60vh]">
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
      dueCards={sessionCards}
      onUpdateCard={handleUpdateCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      onMarkKnown={handleMarkKnown}
    />
  );
};
