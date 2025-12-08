import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { useDeckStats } from '@/features/collection/hooks/useDeckStats';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDashboardStats } from '@/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/db/repositories/cardRepository';
import { LoadingScreen } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeckStats();
  const language = useSettingsStore(s => s.language);
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['dashboardStats', language],
    queryFn: () => getDashboardStats(language),
  });

  const { data: cards, isLoading: isCardsLoading, isError: isCardsError } = useQuery({
    queryKey: ['dashboardCards', language],
    queryFn: () => getCardsForDashboard(language),
  });

  if (isStatsLoading || isCardsLoading) {
    return <LoadingScreen title="Loading Dashboard" subtitle="Fetching your progress..." />;
  }

  if (isStatsError || isCardsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-red-500">Failed to load dashboard data.</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!dashboardStats || !cards) {
    return <div>No data found.</div>;
  }


  const metrics = {
    total: dashboardStats.counts.new + dashboardStats.counts.learning + dashboardStats.counts.review + dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.review,
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
