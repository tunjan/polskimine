import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DeckProvider } from './contexts/DeckContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { DashboardRoute } from './routes/DashboardRoute';
import { StudyRoute } from './routes/StudyRoute';

const PolskiMineApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/study" element={<StudyRoute />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="polskimine-theme">
      <SettingsProvider>
        <DeckProvider>
          <PolskiMineApp />
          <Toaster position="bottom-right" />
        </DeckProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;