import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { isNewCard } from '@/services/studyLimits'; 
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';
import { useClaimDailyBonusMutation } from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';
import { GameLoader } from '@/components/ui/game-ui';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview, canUndo, stats } = useDeck();
  const { updateCard, deleteCard, addCard } = useCardOperations();
  const { settings } = useSettings();
  const claimBonus = useClaimDailyBonusMutation();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]); 
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
          setReserveCards([]);
        } else {
          const due = await getDueCards(new Date(), settings.language);
          const reviewsToday = await getTodayReviewStats(settings.language);
          
          const dailyNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
          const dailyReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;
          

          const active: Card[] = [];
          const reserve: Card[] = [];
          
          let newCount = reviewsToday.newCards || 0;
          let reviewCount = reviewsToday.reviewCards || 0;

          const hasLimit = (val: number) => val > 0;

          for (const card of due) {
            if (isNewCard(card)) {

              if (hasLimit(dailyNewLimit) && newCount >= dailyNewLimit) {
                reserve.push(card);
              } else {
                active.push(card);
                if (hasLimit(dailyNewLimit)) newCount++;
              }
            } else {

              if (hasLimit(dailyReviewLimit) && reviewCount >= dailyReviewLimit) {
                 continue;
              }
              active.push(card);
              if (hasLimit(dailyReviewLimit)) reviewCount++;
            }
          }
          
          setSessionCards(active);
          setReserveCards(reserve);
        }
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === 'known') {
        updateCard(card);
      }
      return;
    }
    updateCard(card);
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
    
    
    setSessionCards(prev => prev.filter(c => c.id !== id));
  };

  const handleRecordReview = (card: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    if (!isCramMode) {
      recordReview(card, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <GameLoader size="lg" text="Preparing session" />
      </div>
    );
  }

  return (
    <StudySession 
      dueCards={sessionCards}
      reserveCards={reserveCards} 
      onUpdateCard={handleUpdateCard}
      onDeleteCard={handleDeleteCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
      onAddCard={addCard}
    />
  );
};