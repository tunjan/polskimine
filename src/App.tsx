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
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-foreground" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Loading System</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Handle case where user is auth'd but profile fetch failed or hasn't completed
  if (!profile) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-foreground" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Loading Profile</span>
            </div>
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
      <ThemeProvider defaultTheme="light" storageKey="languagemine-theme">
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <DeckProvider>
                <SabotageProvider>
                  <LinguaFlowApp />
                  <Toaster position="bottom-right" toastOptions={{
                    className: 'rounded-none border-border font-mono text-xs uppercase tracking-wide',
                    style: { borderRadius: '2px' }
                  }}/>
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