import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeckProvider } from '@/contexts/DeckContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SabotageProvider } from '@/contexts/SabotageContext';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/features/auth/AuthPage';
import { UsernameSetup } from '@/features/auth/UsernameSetup';

const queryClient = new QueryClient();

const LinguaFlowApp: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }




  

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }


  if (!profile.username) {
    return <UsernameSetup />;
  }



  return (
    <BrowserRouter>
      <LanguageThemeManager />
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="languagemine-theme">
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <DeckProvider>
                <SabotageProvider>
                  <LinguaFlowApp />
                  <Toaster position="bottom-right" />
                </SabotageProvider>
              </DeckProvider>
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;