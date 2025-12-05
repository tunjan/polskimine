import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { SessionProvider } from '@/contexts/SessionContext';
import { DeckActionsProvider } from '@/contexts/DeckActionsContext';
import { DeckStatsProvider } from '@/contexts/DeckStatsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SettingsSync } from '@/features/settings/components/SettingsSync';

const queryClient = new QueryClient();

const TOAST_OPTIONS = {

};

interface AppProvidersProps {
    children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="languagemine-theme">
                <ErrorBoundary>
                    <AuthProvider>
                        <SettingsSync />
                        <ProfileProvider>
                            <GamificationProvider>
                                <SessionProvider>
                                    <DeckActionsProvider>
                                        <DeckStatsProvider>
                                            <MusicProvider>
                                                <Router>
                                                    {children}
                                                    <Toaster position="bottom-right" expand={true} />
                                                </Router>
                                            </MusicProvider>
                                        </DeckStatsProvider>
                                    </DeckActionsProvider>
                                </SessionProvider>
                            </GamificationProvider>
                        </ProfileProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
