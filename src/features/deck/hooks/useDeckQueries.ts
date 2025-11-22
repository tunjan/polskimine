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
    staleTime: 0, // Always fresh for study
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ card, grade }: { card: Card; grade: Grade }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      // 1. Increment history in DB
      await incrementHistory(today, 1, card.language || settings.language);
      
      // 2. Award XP if user exists
      if (user) {
          const xpAmount =
            card.status === 'new'
              ? 50
              : grade === 'Again'
              ? 1
              : grade === 'Hard'
              ? 5
              : 10;

          await supabase
            .from('activity_log')
            .insert({
              user_id: user.id,
              activity_type: card.status === 'new' ? 'new_card' : 'review',
              xp_awarded: xpAmount,
              language: card.language || settings.language,
            });
      }
      
      return { card, grade, today };
    },
    onMutate: async ({ card }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      await queryClient.cancelQueries({ queryKey: ['history', settings.language] });
      await queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] });
      
      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      
      // Optimistically update history
      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });
      
      // Optimistically update reviewsToday
      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
         if (!old) return { newCards: 0, reviewCards: 0 };
         return {
             newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
             reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
         };
      });

      return { previousHistory, previousReviewsToday };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['history', settings.language], context?.previousHistory);
      queryClient.setQueryData(['reviewsToday', settings.language], context?.previousReviewsToday);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    },
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
