import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardRoute } from '@/routes/DashboardRoute';
import { StudyRoute } from '@/routes/StudyRoute';
import { CardsRoute } from '@/routes/CardsRoute';
import { SettingsRoute } from '@/features/settings/routes/SettingsRoute';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/study" element={<StudyRoute />} />
    <Route path="/cards" element={<CardsRoute />} />
    <Route path="/settings/*" element={<SettingsRoute />} />
  </Routes>
);
