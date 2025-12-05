import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { SessionProvider } from '@/contexts/SessionContext';
import { DeckActionsProvider } from '@/contexts/DeckActionsContext';
import { DeckStatsProvider } from '@/contexts/DeckStatsContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const queryClient = new QueryClient();

const TOAST_OPTIONS = {
    className: 'genshin-toast gap-4',
    style: {
        fontFamily: 'var(--font-serif)',
        fontSize: '1rem',
        fontWeight: 400,
        letterSpacing: '0.02em',
    },
    descriptionClassName: 'text-muted-foreground font-sans font-light text-sm tracking-wide mt-1',
    actionButtonStyle: {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        fontFamily: 'var(--font-sans)',
        borderRadius: '0px',
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        padding: '0.5rem 1rem',
        border: '1px solid var(--primary-foreground)',
    },
    cancelButtonStyle: {
        backgroundColor: 'transparent',
        color: 'var(--muted-foreground)',
        fontFamily: 'var(--font-sans)',
        borderRadius: '0px',
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        padding: '0.5rem 1rem',
        border: '1px solid var(--border)',
    }
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
                        <ProfileProvider>
                            <GamificationProvider>
                                <SettingsProvider>
                                    <SessionProvider>
                                        <DeckActionsProvider>
                                            <DeckStatsProvider>
                                                <MusicProvider>
                                                    <Router>
                                                        {children}
                                                        <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
                                                    </Router>
                                                </MusicProvider>
                                            </DeckStatsProvider>
                                        </DeckActionsProvider>
                                    </SessionProvider>
                                </SettingsProvider>
                            </GamificationProvider>
                        </ProfileProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
