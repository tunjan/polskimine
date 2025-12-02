import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard }from '@/features/dashboard/components/Dashboard';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/services/db/repositories/cardRepository';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  const { data: cards, isLoading: isCardsLoading } = useQuery({
    queryKey: ['dashboardCards', settings.language],
    queryFn: () => getCardsForDashboard(settings.language),
  });

  if (isStatsLoading || isCardsLoading || !dashboardStats || !cards) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Transform counts to include total and rename graduated to reviewing
  const metrics = {
    total: dashboardStats.counts.new + dashboardStats.counts.learning + dashboardStats.counts.graduated + dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.graduated, // Graduated is the reviewing state
    known: dashboardStats.counts.known,
  };

  // Calculate level from XP (100 * (level - 1)^2)
  const xp = dashboardStats.languageXp;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  return (
    <Dashboard 
      metrics={metrics}
      languageXp={{ xp, level }}
      stats={stats}
      history={history}
      onStartSession={() => navigate('/study')}
      cards={cards as any} // Type assertion for now since cards query needs proper typing
    />
  );
};