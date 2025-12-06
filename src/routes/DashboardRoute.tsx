import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { useDeckStats } from '@/features/deck/hooks/useDeckStats';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/services/db/repositories/cardRepository';
import { LoadingScreen } from '@/components/ui/loading';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeckStats();
  const settings = useSettingsStore(s => s.settings);
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  const { data: cards, isLoading: isCardsLoading, isError: isCardsError } = useQuery({
    queryKey: ['dashboardCards', settings.language],
    queryFn: () => getCardsForDashboard(settings.language),
  });

  if (isStatsLoading || isCardsLoading) {
    return <LoadingScreen title="Loading Dashboard" subtitle="Fetching your progress..." />;
  }

  if (isStatsError || isCardsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-red-500">Failed to load dashboard data.</h2>
        <button onClick={() => window.location.reload()} className="mt-4 btn">Retry</button>
      </div>
    );
  }

  if (!dashboardStats || !cards) {
    return <div>No data found.</div>;
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
