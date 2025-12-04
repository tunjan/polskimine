import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard }from '@/features/dashboard/components/Dashboard';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/services/db/repositories/cardRepository';
import { GameLoadingScreen } from '@/components/ui/game-ui';

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
    return <GameLoadingScreen title="Loading" subtitle="Preparing your dashboard" />;
  }

  
  const metrics = {
    total: dashboardStats.counts.new + dashboardStats.counts.learning + dashboardStats.counts.graduated + dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.graduated, 
    known: dashboardStats.counts.known,
  };

  
  const xp = dashboardStats.languageXp;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  return (
    <Dashboard 
      metrics={metrics}
      languageXp={{ xp, level }}
      stats={stats}
      history={history}
      onStartSession={() => navigate('/study')}
      cards={cards as any} 
    />
  );
};