import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load all route components for better code splitting
const DashboardRoute = lazy(() => import('@/routes/DashboardRoute').then(m => ({ default: m.DashboardRoute })));
const StudyRoute = lazy(() => import('@/routes/StudyRoute').then(m => ({ default: m.StudyRoute })));
const CardsRoute = lazy(() => import('@/routes/CardsRoute').then(m => ({ default: m.CardsRoute })));
const SettingsRoute = lazy(() => import('@/features/settings/routes/SettingsRoute').then(m => ({ default: m.SettingsRoute })));

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-4 w-4 border border-foreground/20 border-t-foreground" />
      <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Loading</span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/study" element={<StudyRoute />} />
      <Route path="/cards" element={<CardsRoute />} />
      <Route path="/settings/*" element={<SettingsRoute />} />
    </Routes>
  </Suspense>
);
