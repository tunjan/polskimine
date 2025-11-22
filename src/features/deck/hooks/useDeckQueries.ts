import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/services/db/repositories/statsRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/services/db/repositories/historyRepository';
import { getDueCards, saveCard } from '@/services/db/repositories/cardRepository';
import { Card, Grade } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// REWORKED: Only award XP for New cards. 0 for everything else.
const calculateXP = (cardStatus: string, grade: Grade): number => {
  // Only 'new' cards give immediate gratification
  if (cardStatus === 'new') return 50;
  return 0;
};

export const useDeckStatsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['deckStats', settings.language],
    queryFn: () => fetchStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['dueCards', settings.language],
    queryFn: () => getDueCards(new Date(), settings.language),
    staleTime: 60 * 1000, // Cache for 1 minute to reduce refetch thrashing
  });
};

export const useReviewsTodayQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['reviewsToday', settings.language],
    queryFn: () => getTodayReviewStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['history', settings.language],
    queryFn: () => fetchHistory(settings.language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user, incrementXPOptimistically } = useAuth();

  return useMutation({
    mutationFn: async ({ card, grade }: { card: Card; grade: Grade }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      // 1. Increment history in DB
      await incrementHistory(today, 1, card.language || settings.language);
      
      // 2. Award XP ONLY if it's a new card
      const xpAmount = calculateXP(card.status, grade);

      if (user) {
        // Insert activity log
        await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            activity_type: card.status === 'new' ? 'new_card' : 'review',
            xp_awarded: xpAmount, // This will be 0 for reviews
            language: card.language || settings.language,
          });

        if (xpAmount > 0) {
          const { error: xpError } = await supabase.rpc('increment_profile_xp', {
            user_id: user.id,
            amount: xpAmount
          });
          if (xpError) console.error('Failed to update profile XP:', xpError);
        }
      }
      
      return { card, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      // 1. Cancel ALL relevant queries to prevent overwrites from background refetches
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] }) // Added: prevent overwrite of optimistic language XP
      ]);
      
      // 2. Snapshot previous values for rollback
      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]); // Added snapshot
      
      // 3. Optimistically update history
      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });
      
      // 4. Optimistically update reviewsToday
      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
         if (!old) return { newCards: 0, reviewCards: 0 };
         return {
             newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
             reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
         };
      });

      // 5. Optimistically update: REMOVE CARD FROM DUE QUEUE regardless of grade.
      // If graded 'Again', it enters a short learning interval and should not count as currently due.
      // The study session manages immediate re-queue locally.
      queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c.id !== card.id);
      });

      // Note: We do NOT optimistically update deckStats.due here because DeckContext
      // derives the due count from the dueCards array. Updating both causes desync.
      // The invalidation on settlement will sync deckStats from the server.

      // 7. Optimistically update Profile XP (Only if > 0)
      if (user) {
        const xpAmount = calculateXP(card.status, grade);
        incrementXPOptimistically(xpAmount);

        // Update Dashboard Stats
        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                languageXp: (old.languageXp || 0) + xpAmount
            };
        });
      }

      return { previousHistory, previousReviewsToday, previousDueCards, previousDashboardStats };
    },
    onError: (err, newTodo, context) => {
      // Rollback EVERYTHING if it fails
      if (context) {
        queryClient.setQueryData(['history', settings.language], context.previousHistory);
        queryClient.setQueryData(['reviewsToday', settings.language], context.previousReviewsToday);
        queryClient.setQueryData(['dueCards', settings.language], context.previousDueCards);
        queryClient.setQueryData(['dashboardStats', settings.language], context.previousDashboardStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', settings.language] });
    },
  });
};

// NEW: Mutation to claim the daily completion bonus
export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user, incrementXPOptimistically } = useAuth();
  const BONUS_AMOUNT = 300; // Big reward for finishing

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('claim_daily_bonus', {
        p_user_id: user.id,
        p_language: settings.language,
        p_xp_amount: BONUS_AMOUNT
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.success) {
        toast.success(`Daily Goal Complete! +${BONUS_AMOUNT} XP`);
        incrementXPOptimistically(BONUS_AMOUNT);
        
        // Update Dashboard Stats
        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                languageXp: (old.languageXp || 0) + BONUS_AMOUNT
            };
        });
      }
    }
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  return useMutation({
    mutationFn: async ({ card, date }: { card: Card; date: string }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || settings.language);
      return { card, date };
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cards'] });
       queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    }
  });
};
