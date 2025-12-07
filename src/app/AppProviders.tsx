import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';


import { DeckActionsProvider } from '@/contexts/DeckActionsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MusicProvider } from '@/contexts/MusicContext';
import { AuthProvider } from '@/contexts/AuthContext';
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

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="light" storageKey="languagemine-theme">
                <ErrorBoundary>
                    <AuthProvider>
                        <SettingsSync />
                        <GamificationProvider>
                            <DeckActionsProvider>
                                <MusicProvider>
                                    <BrowserRouter>
                                        {children}
                                        <Toaster position="bottom-right" expand={true} />
                                    </BrowserRouter>
                                </MusicProvider>
                            </DeckActionsProvider>
                        </GamificationProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
