import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardRoute } from '@/routes/DashboardRoute';
import { StudyRoute } from '@/routes/StudyRoute';
import { CardsRoute } from '@/routes/CardsRoute';
import { Leaderboard } from '@/features/leaderboard/Leaderboard';
import { MultiplayerLobby } from '@/features/multiplayer/MultiplayerLobby';
import { GameArena } from '@/features/multiplayer/GameArena';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/study" element={<StudyRoute />} />
    <Route path="/cards" element={<CardsRoute />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/multiplayer" element={<MultiplayerLobby />} />
    <Route path="/multiplayer/:roomId" element={<GameArena />} />
  </Routes>
);