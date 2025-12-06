import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeckActions } from '@/contexts/DeckActionsContext';
import { useDeckStats } from '@/features/deck/hooks/useDeckStats';
import { useDeckStore } from '@/stores/useDeckStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { isNewCard } from '@/services/studyLimits';
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';
import { useClaimDailyBonusMutation } from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';
import { LoadingScreen } from '@/components/ui/loading';
import { toast } from 'sonner';
import { sortCards, CardOrder } from '@/features/study/logic/cardSorter';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview } = useDeckActions();
  const { stats } = useDeckStats();
  const lastReview = useDeckStore(state => state.lastReview);
  const canUndo = !!lastReview;

  const { updateCard, deleteCard, addCard } = useCardOperations();
  const settings = useSettingsStore(s => s.settings);
  const claimBonus = useClaimDailyBonusMutation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await getCramCards(limit, tag, settings.language);
          if (isMounted) {
            setSessionCards(cramCards);
            setReserveCards([]);
          }
        } else {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 15000)
          );

          const [due, reviewsToday] = await Promise.race([
            Promise.all([
              getDueCards(new Date(), settings.language),
              getTodayReviewStats(settings.language)
            ]),
            timeoutPromise
          ]) as [Card[], { newCards: number; reviewCards: number }];

          if (!isMounted) return;

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

          // Apply card order preference
          const sortedActive = sortCards(active, (settings.cardOrder as CardOrder) || 'newFirst');

          setSessionCards(sortedActive);
          setReserveCards(reserve);
        }
      } catch (err) {
        console.error("Failed to load cards", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cards');
          toast.error('Failed to load study session. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCards();

    return () => {
      isMounted = false;
    };
  }, [settings.language, isCramMode, searchParams, settings.dailyNewLimits, settings.dailyReviewLimits]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === 'known') {
        updateCard(card, { silent: true });
      }
      return;
    }
    updateCard(card, { silent: true });
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);


    setSessionCards(prev => prev.filter(c => c.id !== id));
  };

  const handleRecordReview = async (card: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    if (!isCramMode) {
      await recordReview(card, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen title="Loading Session" subtitle="Preparing your cards..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium">Failed to load study session</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Return to Dashboard
          </button>
        </div>
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
