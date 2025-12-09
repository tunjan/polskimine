import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Grade } from "@/types";
import { StudySession } from "@/features/study/components/StudySession";
import { useDeckActions } from "@/hooks/useDeckActions";
import { useDeckStats } from "@/features/collection/hooks/useDeckStats";
import { useDeckStore } from "@/stores/useDeckStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useCardOperations } from "@/features/collection/hooks/useCardOperations";
import { isNewCard } from "@/services/studyLimits";
import { getCramCards, getDueCards } from "@/db/repositories/cardRepository";
import { getTodayReviewStats } from "@/db/repositories/statsRepository";
import { useClaimDailyBonusMutation } from "@/features/collection/hooks/useDeckQueries";
import { CardXpPayload } from "@/core/gamification/xp";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sortCards, CardOrder } from "@/core/srs/cardSorter";

const StudyRoute: React.FC = () => {
  const { recordReview, undoReview } = useDeckActions();
  const { stats } = useDeckStats();
  const lastReview = useDeckStore((state) => state.lastReview);
  const canUndo = !!lastReview;

  const { updateCard, deleteCard, addCard } = useCardOperations();

  const { language, dailyNewLimits, dailyReviewLimits, cardOrder, ignoreLearningStepsWhenNoCards } =
    useSettingsStore(
      useShallow((s) => ({
        language: s.language,
        dailyNewLimits: s.dailyNewLimits,
        dailyReviewLimits: s.dailyReviewLimits,
        cardOrder: s.cardOrder,
        ignoreLearningStepsWhenNoCards: s.ignoreLearningStepsWhenNoCards,
      })),
    );

  const claimBonus = useClaimDailyBonusMutation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get("mode");
  const isCramMode = mode === "cram";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get("limit") || "50", 10);
          const cramCards = await getCramCards(limit, language);
          if (isMounted) {
            setSessionCards(cramCards);
            setReserveCards([]);
          }
        } else {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 15000),
          );

          // Use exactly 'now' to match Dashboard logic. 
          // Previously this had a 20m offset for 'reviewFirst' which caused mismatches.
          const now = new Date();
          
          const [due, reviewsToday] = (await Promise.race([
            Promise.all([
              getDueCards(now, language, ignoreLearningStepsWhenNoCards),
              getTodayReviewStats(language),
            ]),
            timeoutPromise,
          ])) as [Card[], { newCards: number; reviewCards: number }];

          if (!isMounted) return;

          const dailyNewLimit = dailyNewLimits?.[language] ?? 20;
          const dailyReviewLimit = dailyReviewLimits?.[language] ?? 100;

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
              if (
                hasLimit(dailyReviewLimit) &&
                reviewCount >= dailyReviewLimit
              ) {
                // For reviews, we don't usually keep a 'reserve' queue for daily limits 
                // in the same way (once the limit is hit, you're done for the day),
                // but we push to reserve just in case cards are deleted/suspended to fill the gap.
                reserve.push(card);
              } else {
                active.push(card);
                if (hasLimit(dailyReviewLimit)) reviewCount++;
              }
            }
          }

          const sortedActive = sortCards(
            active,
            (cardOrder as CardOrder) || "newFirst",
          );

          setSessionCards(sortedActive);
          setReserveCards(reserve);
        }
      } catch (err) {
        console.error("Failed to load cards", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load cards");
          toast.error("Failed to load study session. Please try again.");
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
  }, [
    language,
    isCramMode,
    searchParams,
    dailyNewLimits,
    dailyReviewLimits,
    cardOrder,
  ]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === "known") {
        updateCard(card, { silent: true });
      }
      return;
    }
    updateCard(card, { silent: true });
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
  };

  const handleRecordReview = async (
    card: Card,
    newCard: Card,
    grade: Grade,
    xpPayload?: CardXpPayload,
  ) => {
    if (!isCramMode) {
      await recordReview(card, newCard, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate("/");
  };

  if (isLoading) {
    return (
      <LoadingScreen
        title="Loading Session"
        subtitle="Preparing your cards..."
      />
    );
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
          <Button onClick={() => navigate("/")} size="default">
            Return to Dashboard
          </Button>
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
      onExit={() => navigate("/")}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
      onAddCard={addCard}
    />
  );
};

export default StudyRoute;