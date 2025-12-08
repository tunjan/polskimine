import React, { useEffect } from "react";
import { migrateCardStatuses } from "@/db/migrations/standardizeStatus";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading";
import { AppProviders } from "@/app/AppProviders";
import { AppRouter } from "@/app/AppRouter";
import { usePlatformSetup } from "@/hooks/usePlatformSetup";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPage } from "@/features/auth/AuthPage";
import { UsernameSetup } from "@/features/auth/UsernameSetup";
import { OnboardingFlow } from "@/features/auth/OnboardingFlow";

const AppContent: React.FC = () => {
  usePlatformSetup();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const loading = authLoading || profileLoading;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !window.location.pathname.startsWith("/test-stats")) {
    return <AuthPage />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-sans text-muted-foreground">
            Profile not found.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs font-sans uppercase tracking-widest text-primary"
          >
            Retry
          </Button>
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

  return <AppRouter />;
};

const App: React.FC = () => {
  useEffect(() => {
    const hasMigrated = localStorage.getItem("migration_v1_status");
    if (!hasMigrated) {
      migrateCardStatuses().then(() => {
        localStorage.setItem("migration_v1_status", "true");
      });
    }

    // Run corruption check/repair on every load (lightweight if no errors)
    import("@/db/repositories/cardRepository").then(({ repairCorruptedCards }) => {
      repairCorruptedCards();
    });
  }, []);
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
