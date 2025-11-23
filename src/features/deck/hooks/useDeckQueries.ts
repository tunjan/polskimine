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
import { addReviewLog } from '@/services/db/repositories/revlogRepository';
import { Card, Grade } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { format, differenceInMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


const calculateXP = (cardStatus: string, grade: Grade): number => {

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
      
      // 1. Calculate Metrics for Log
      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;
      
      // Calculate elapsed days with decimal precision (critical for FSRS)
      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440; // 1440 mins in a day

      const scheduledDays = card.interval || 0;

      // 2. Save Log (Fire and forget, or await if strict)
      await addReviewLog(card, grade, elapsedDays, scheduledDays);

      // await incrementHistory(today, 1, card.language || settings.language);
      

      const xpAmount = calculateXP(card.status, grade);

      if (user) {

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
      

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] }) // Added: prevent overwrite of optimistic language XP
      ]);
      

      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]); // Added snapshot
      

      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });
      

      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
         if (!old) return { newCards: 0, reviewCards: 0 };
         return {
             newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
             reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
         };
      });




      queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c.id !== card.id);
      });






      if (user) {
        const xpAmount = calculateXP(card.status, grade);
        incrementXPOptimistically(xpAmount);


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
