import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeckProvider } from '@/contexts/DeckContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { SabotageProvider } from '@/contexts/SabotageContext';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/features/auth/AuthPage';
import { UsernameSetup } from '@/features/auth/UsernameSetup';
import { OnboardingFlow } from '@/features/auth/OnboardingFlow'; 
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

// Toast configuration - defined outside component to prevent re-renders
const TOAST_OPTIONS = {
  className: 'bg-card/95 backdrop-blur-sm text-foreground border border-border/40  rounded-3xl font-serif px-6 py-4 gap-3',
  style: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1rem',
    fontWeight: 400,
    letterSpacing: '-0.01em',
  },
  descriptionClassName: 'text-muted-foreground/80 font-sans font-light text-sm tracking-wide',
  actionButtonStyle: {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
    fontFamily: 'var(--font-sans)',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding: '0.5rem 1rem',
  },
  cancelButtonStyle: {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    fontFamily: 'var(--font-sans)',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding: '0.5rem 1rem',
  }
};

const LinguaFlowApp: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border border-foreground/20 border-t-foreground" />
          <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Loading</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-sans text-muted-foreground">Profile not found.</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-sans uppercase tracking-widest text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile.username) {
    return <UsernameSetup />;
  }

  
  if (!profile.initial_deck_generated) {
    return <OnboardingFlow />;
  }
  
  // Select router based on platform - done inside component for better testability
  const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

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

          
          
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const params = new URLSearchParams(url.substring(hashIndex + 1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            
            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

              if (error) console.error("Error setting session:", error);
            }
          }

          
          await Browser.close();
        }
      });
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="languagemine-theme">
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <DeckProvider>
                <SabotageProvider>
                  <MusicProvider>
                    <LinguaFlowApp />
                    <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
                  </MusicProvider>
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
