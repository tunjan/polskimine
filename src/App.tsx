import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
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
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

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
    <Router>
      <LanguageThemeManager />
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('auth/callback')) {

          // 1. Extract the hash/fragment from the URL
          // URL looks like: com.linguaflow.app://auth/callback#access_token=...&refresh_token=...
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const params = new URLSearchParams(url.substring(hashIndex + 1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            // 2. Manually set the session in Supabase
            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

              if (error) console.error("Error setting session:", error);
            }
          }

          // 3. Close the browser only AFTER processing
          await Browser.close();
        }
      });
    }
  }, []);
  // ---> END ADD EFFECT
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
                  }} />
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