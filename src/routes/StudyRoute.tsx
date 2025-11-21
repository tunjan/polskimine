import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { applyStudyLimits } from '@/services/studyLimits';
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview, canUndo } = useDeck();
  const { updateCard } = useCardOperations();
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
          const cramCards = await getCramCards(limit, tag, settings.language);
          setSessionCards(cramCards);
        } else {
          const due = await getDueCards(new Date(), settings.language);
          const reviewsToday = await getTodayReviewStats(settings.language);
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
  }, [settings.dailyNewLimit, settings.dailyReviewLimit, settings.language, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (!isCramMode) {
      updateCard(card);
    }
  };

  const handleRecordReview = (card: Card, grade: Grade) => {
    if (!isCramMode) {
      recordReview(card, grade);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
    />
  );
};