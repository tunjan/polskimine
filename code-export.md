# check_fsrs.ts

```typescript
import * as fsrs from "ts-fsrs";
```

# src/App.tsx

```typescript
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
    migrateCardStatuses();
  }, []);
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;
```

# src/app/AppProviders.tsx

```typescript
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SettingsSync } from "@/features/settings/components/SettingsSync";

const queryClient = new QueryClient();

const TOAST_OPTIONS = {};

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
              <MusicProvider>
                <BrowserRouter>
                  {children}
                  <Toaster position="bottom-right" expand={true} />
                </BrowserRouter>
              </MusicProvider>
            </GamificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
```

# src/app/AppRouter.tsx

```typescript
import React from "react";
import { Layout } from "@/components/layout/Layout";
import { LanguageThemeManager } from "@/components/common/LanguageThemeManager";
import { AppRoutes } from "@/router";

export const AppRouter: React.FC = () => {
  return (
    <>
      <LanguageThemeManager />
      <Layout>
        <AppRoutes />
      </Layout>
    </>
  );
};
```

# src/components/common/ErrorBoundary.tsx

```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">
            Something went wrong
          </h1>
          <p className="text-muted-foreground max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

# src/components/common/LanguageThemeManager.tsx

```typescript
import React, { useLayoutEffect } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";

const STYLE_TAG_ID = "custom-language-theme";

export const LanguageThemeManager: React.FC = () => {
  const { language, languageColors } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      languageColors: s.languageColors,
    }))
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute("data-language");
    if (previousLanguage && previousLanguage !== language) {
      root.removeAttribute("data-language");
    }

    if (!language) return;

    root.setAttribute("data-language", language);

    const customColor = languageColors?.[language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor && typeof customColor === "string") {
      if (!/^[0-9\s.%]+$/.test(customColor)) {
        styleTag.innerHTML = "";
        return;
      }
      const [h, s, l] = customColor.split(" ").map((v) => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL =
        normalizedL < 50
          ? Math.min(normalizedL + 30, 90)
          : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${language}"] {
          --primary: hsl(${customColor});
          --ring: hsl(${customColor});
        }
        :root[data-language="${language}"].dark {
          --primary: hsl(${darkColor});
          --ring: hsl(${darkColor});
        }
      `;
    } else {
      styleTag.innerHTML = "";
    }

    return () => {
      root.removeAttribute("data-language");
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [language, languageColors]);

  return null;
};
```

# src/components/layout/Layout.tsx

```typescript
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  List as ListIcon,
  Settings,
  LogOut,
  Plus,
  Zap,
  ChevronUp,
  Save,
  Download,
} from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useCardOperations } from "@/features/collection/hooks/useCardOperations";
import { AddCardModal } from "@/features/collection/components/AddCardModal";

import { CramModal } from "@/features/study/components/CramModal";
import { LanguageId } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PolishFlag,
  NorwegianFlag,
  JapaneseFlag,
  SpanishFlag,
  GermanFlag,
} from "@/components/ui/flags";
import { toast } from "sonner";
import { useSyncthingSync } from "@/features/settings/hooks/useSyncthingSync";

interface NavActionProps {
  onOpenAdd: () => void;
  onOpenCram: () => void;
  onSyncSave: () => void;
  onSyncLoad: () => void;
  isSyncing: boolean;
  isSyncingLoad: boolean;
  onCloseMobileMenu?: () => void;
}

const AppSidebar: React.FC<NavActionProps> = ({
  onOpenAdd,
  onOpenCram,
  onSyncSave,
  onSyncLoad,
  isSyncing,
  isSyncingLoad,
  onCloseMobileMenu,
}) => {
  const location = useLocation();
  const { language, updateSettings } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      updateSettings: s.updateSettings,
    }))
  );
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const languages = [
    { code: LanguageId.Polish, name: "Polish", Flag: PolishFlag },
    { code: LanguageId.Norwegian, name: "Norwegian", Flag: NorwegianFlag },
    { code: LanguageId.Japanese, name: "Japanese", Flag: JapaneseFlag },
    { code: LanguageId.Spanish, name: "Spanish", Flag: SpanishFlag },
    { code: LanguageId.German, name: "German", Flag: GermanFlag },
  ] as const;

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  const mainNavItems = [
    { to: "/", icon: LayoutDashboard, label: "Overview" },
    { to: "/cards", icon: ListIcon, label: "Index" },
    { to: "/study", icon: GraduationCap, label: "Study" },
  ];

  const toolItems = [
    {
      icon: Plus,
      label: "Add Entry",
      onClick: () => {
        onOpenAdd();
        onCloseMobileMenu?.();
      },
    },
    {
      icon: Zap,
      label: "Cram Mode",
      onClick: () => {
        onOpenCram();
        onCloseMobileMenu?.();
      },
    },
    {
      icon: Save,
      label: isSyncing ? "Saving..." : "Save Changes",
      onClick: () => {
        if (!isSyncing) {
          onSyncSave();
        }
      },
      disabled: isSyncing,
    },
    {
      icon: Download,
      label: isSyncingLoad ? "Loading..." : "Import Changes",
      onClick: () => {
        if (!isSyncingLoad) {
          onSyncLoad();
        }
      },
      disabled: isSyncingLoad,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LinguaFlow</span>
                  <span className="truncate text-xs">Sentence Miner</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.to}
                    onClick={onCloseMobileMenu}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                    <currentLanguage.Flag className="w-full h-full object-cover rounded-sm" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentLanguage.name}
                    </span>
                    <span className="truncate text-xs">Change Language</span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-2"
                  >
                    <lang.Flag className="w-4 h-3 rounded-[1px] border border-border/30" />
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Active
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarSeparator />

          {profile && (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="font-bold">
                    {profile.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {profile.username}
                  </span>
                  <span className="truncate text-xs">Free Plan</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                signOut();
                onCloseMobileMenu?.();
              }}
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" onClick={onCloseMobileMenu}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addCard } = useCardOperations();
  const location = useLocation();
  const {
    saveToSyncFile,
    loadFromSyncFile,
    isSaving: isSyncing,
    isLoading: isSyncingLoad,
  } = useSyncthingSync();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);

  const isStudyMode = location.pathname === "/study";

  const sidebarProps: NavActionProps = {
    onOpenAdd: () => setIsAddModalOpen(true),
    onOpenCram: () => setIsCramModalOpen(true),
    onSyncSave: saveToSyncFile,
    onSyncLoad: loadFromSyncFile,
    isSyncing,
    isSyncingLoad,
  };

  if (isStudyMode) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="min-h-screen p-0">{children}</main>
        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addCard}
        />
        <CramModal
          isOpen={isCramModalOpen}
          onClose={() => setIsCramModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex-1 flex flex-col p-4 pt-0">
          <div className="min-h-screen flex-1 rounded-xl md:min-h-min md:flex-col overflow-y-auto">
            {children}
          </div>
        </div>
      </SidebarInset>

      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
      <CramModal
        isOpen={isCramModalOpen}
        onClose={() => setIsCramModalOpen(false)}
      />
    </SidebarProvider>
  );
};
```

# src/constants.ts

```typescript
import { Card, ReviewHistory } from "./types";

export const MOCK_CARDS: Card[] = [
  {
    id: "1",
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: "2",
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: "learning",
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: "4",
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: "graduated",
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: "5",
    targetSentence: "Wszystko w porządku?",

    nativeTranslation: "Is everything okay?",
    notes:
      "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];

export const getUTCDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = getUTCDateString(pastDate);

    history[dateKey] =
      (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = "language_mining_deck_v1";
export const HISTORY_KEY = "language_mining_history_v1";

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [
    0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722,
    0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425,
    0.0912, 0.0658, 0.1542,
  ],
};

export const LANGUAGE_NAMES = {
  polish: "Polish",
  norwegian: "Norwegian",
  japanese: "Japanese",
  spanish: "Spanish",
  german: "German",
} as const;
```

# src/constants/settings.ts

```typescript
export const CARD_ORDER = {
  NEW_FIRST: "newFirst",
  REVIEW_FIRST: "reviewFirst",
  MIXED: "mixed",
} as const;

export type CardOrderValue = (typeof CARD_ORDER)[keyof typeof CARD_ORDER];

export const TTS_PROVIDER = {
  BROWSER: "browser",
  GOOGLE: "google",
  AZURE: "azure",
} as const;

export type TTSProviderValue = (typeof TTS_PROVIDER)[keyof typeof TTS_PROVIDER];
```

# src/contexts/AuthContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, hashPassword, generateId, LocalUser } from "@/db/dexie";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  register: (username: string, password: string) => Promise<{ user: AuthUser }>;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getRegisteredUsers: () => Promise<LocalUser[]>;
}

const SESSION_KEY = "linguaflow_current_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUserId = localStorage.getItem(SESSION_KEY);
        if (savedUserId) {
          const existingUser = await db.users.get(savedUserId);
          if (existingUser) {
            setUser({ id: existingUser.id, username: existingUser.username });
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (
    username: string,
    password: string
  ): Promise<{ user: AuthUser }> => {
    const existingUser = await db.users
      .where("username")
      .equals(username)
      .first();
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await db.users.add({
      id: userId,
      username,
      passwordHash,
      created_at: now,
    });

    await db.profile.put({
      id: userId,
      username,
      xp: 0,
      points: 0,
      level: 1,
      created_at: now,
      updated_at: now,
    });

    localStorage.setItem(SESSION_KEY, userId);

    const authUser = { id: userId, username };
    setUser(authUser);

    return { user: authUser };
  };

  const login = async (username: string, password: string): Promise<void> => {
    const existingUser = await db.users
      .where("username")
      .equals(username)
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    const passwordHash = await hashPassword(password);
    if (existingUser.passwordHash !== passwordHash) {
      throw new Error("Invalid password");
    }

    localStorage.setItem(SESSION_KEY, existingUser.id);
    setUser({ id: existingUser.id, username: existingUser.username });

    toast.success(`Welcome back, ${existingUser.username}!`);
  };

  const updateUsername = async (username: string) => {
    if (!user) throw new Error("No user logged in");

    const now = new Date().toISOString();

    await db.users.update(user.id, { username });

    const exists = await db.profile.get(user.id);
    if (exists) {
      await db.profile.update(user.id, { username, updated_at: now });
    } else {
      await db.profile.put({
        id: user.id,
        username,
        xp: 0,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now,
      });
    }

    setUser((prev) => (prev ? { ...prev, username } : null));
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success("Signed out");
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");

    await db.transaction(
      "rw",
      [db.users, db.profile, db.cards, db.revlog, db.history],
      async () => {
        await db.users.delete(user.id);
        await db.profile.delete(user.id);

        const userCards = await db.cards
          .where("user_id")
          .equals(user.id)
          .toArray();
        await db.cards.bulkDelete(userCards.map((c) => c.id));

        await db.revlog.where("user_id").equals(user.id).delete();
      }
    );

    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success("Account deleted");
  };

  const getRegisteredUsers = async (): Promise<LocalUser[]> => {
    return await db.users.toArray();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        signOut,
        deleteAccount,
        updateUsername,
        getRegisteredUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

# src/contexts/GamificationContext.tsx

```typescript
import React, { createContext, useContext } from "react";
import { db } from "@/db/dexie";
import { useAuth } from "./AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";

interface GamificationContextType {
  incrementXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();

  const incrementXP = (amount: number) => {
    if (!profile || !user) return;

    const newXP = (profile.xp || 0) + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    db.profile
      .update(user.id, {
        xp: newXP,
        points: (profile.points || 0) + amount,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .then(() => {
        refreshProfile();
      })
      .catch(console.error);
  };

  return (
    <GamificationContext.Provider value={{ incrementXP }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
};
```

# src/contexts/MusicContext.tsx

```typescript
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface MusicContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MUSIC_URL = "/music/medieval.mp3";

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <MusicContext.Provider value={{ isPlaying, togglePlay, volume, setVolume }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
};
```

# src/contexts/ThemeContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const theme = "light";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("light");
  }, []);

  const value: ThemeContextState = {
    theme,
    setTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
```

# src/contexts/UserProfileContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/db/dexie";

interface LocalProfile {
  id: string;
}

interface UserProfileContextType {
  profile: LocalProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const LOCAL_USER_ID = "local-user";

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const count = await db.profile.where("id").equals(LOCAL_USER_ID).count();
      if (count > 0) {
        setProfile({ id: LOCAL_USER_ID });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
```

# src/core/gamification/index.ts

```typescript
export * from "./xp";
```

# src/core/gamification/xp.ts

```typescript
export type CardRating = "again" | "hard" | "good" | "easy";

export const XP_CONFIG = {
  BASE: {
    again: 1,
    hard: 3,
    good: 5,
    easy: 8,
  },
  CRAM_CORRECT: 2,
  ASYMPTOTE_SCALE: 30,
} as const;

export const getDailyStreakMultiplier = (
  days: number
): { value: number; label: string } => {
  if (days <= 0) return { value: 1.0, label: "Standard (1.00x)" };

  const rawCurve = Math.tanh(days / XP_CONFIG.ASYMPTOTE_SCALE);

  const value = Math.round((1 + rawCurve) * 100) / 100;

  let tier = "Rookie";
  if (value >= 1.9) tier = "Godlike";
  else if (value >= 1.75) tier = "Grandmaster";
  else if (value >= 1.5) tier = "Master";
  else if (value >= 1.25) tier = "Elite";
  else if (value >= 1.1) tier = "Pro";

  return {
    value,
    label: `${tier} (${value.toFixed(2)}x)`,
  };
};

export interface XpCalculationResult {
  baseXp: number;
  bonusXp: number;
  multiplier: number;
  totalXp: number;
  isStreakBonus: boolean;
}

export interface CardXpPayload extends XpCalculationResult {
  rating: CardRating;
  streakAfter: number;
  isCramMode: boolean;
  dailyStreak: number;
  multiplierLabel: string;
}

export const calculateCardXp = (
  rating: CardRating,
  sessionStreak: number,
  dailyStreak: number,
  isCramMode: boolean = false
): XpCalculationResult => {
  if (isCramMode) {
    const cramXp = rating === "again" ? 0 : XP_CONFIG.CRAM_CORRECT;
    return {
      baseXp: cramXp,
      bonusXp: 0,
      multiplier: 1,
      totalXp: cramXp,
      isStreakBonus: false,
    };
  }

  const baseXp = XP_CONFIG.BASE[rating];
  const bonusXp = 0;

  const { value: multiplier } = getDailyStreakMultiplier(dailyStreak);
  const preMultiplied = baseXp + bonusXp;

  const totalXp = Math.round(preMultiplied * multiplier);

  return {
    baseXp,
    bonusXp,
    multiplier,
    totalXp,
    isStreakBonus: false,
  };
};
```

# src/core/srs/cardSorter.ts

```typescript
import { Card } from "@/types";

export type CardOrder = "newFirst" | "reviewFirst" | "mixed";

import { isNewCard } from "@/services/studyLimits";

export const sortCards = (cards: Card[], order: CardOrder): Card[] => {
  if (cards.length === 0) return [];

  const dateSorted = [...cards].sort((a, b) => {
    const dateComparison = (a.dueDate || "").localeCompare(b.dueDate || "");
    if (dateComparison !== 0) return dateComparison;
    return (a.id || "").localeCompare(b.id || "");
  });

  if (order === "mixed") {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const newCards = dateSorted.filter((c) => isNewCard(c));
  const reviewCards = dateSorted.filter((c) => !isNewCard(c));

  if (order === "reviewFirst") {
    return [...reviewCards, ...newCards];
  }

  return [...newCards, ...reviewCards];
};
```

# src/core/srs/index.ts

```typescript
export * from "./scheduler";
export * from "./cardSorter";
```

# src/core/srs/scheduler.ts

```typescript
import {
  addDays,
  startOfDay,
  subHours,
  isBefore,
  isSameDay,
  addMinutes,
} from "date-fns";
import {
  Card,
  Grade,
  UserSettings,
  CardStatus,
  mapFsrsStateToStatus,
} from "@/types";
import { SRS_CONFIG, FSRS_DEFAULTS } from "@/constants";
import {
  FSRS,
  Card as FSRSCard,
  Rating,
  State,
  generatorParameters,
} from "ts-fsrs";

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings["fsrs"] | null = null;
let lastWHash: string | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {
  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case "Again":
      return Rating.Again;
    case "Hard":
      return Rating.Hard;
    case "Good":
      return Rating.Good;
    case "Easy":
      return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  return mapFsrsStateToStatus(state);
};

function getFSRS(settings?: UserSettings["fsrs"]) {
  const currentWHash = settings?.w ? JSON.stringify(settings.w) : null;

  if (
    !cachedFSRS ||
    lastConfig?.request_retention !== settings?.request_retention ||
    lastConfig?.maximum_interval !== settings?.maximum_interval ||
    lastWHash !== currentWHash ||
    lastConfig?.enable_fuzzing !== settings?.enable_fuzzing
  ) {
    lastWHash = currentWHash;

    const paramsConfig = {
      request_retention:
        settings?.request_retention || FSRS_DEFAULTS.request_retention,
      maximum_interval:
        settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
      w: settings?.w || FSRS_DEFAULTS.w,
      enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
      learning_steps: [],
    };
    const params = generatorParameters(paramsConfig);
    cachedFSRS = new FSRS(params);
    lastConfig = settings || null;
  }
  return cachedFSRS;
}

export const calculateNextReview = (
  card: Card,
  grade: Grade,
  settings?: UserSettings["fsrs"],
  learningSteps: number[] = [1, 10]
): Card => {
  const now = new Date();
  const learningStepsMinutes =
    learningSteps.length > 0 ? learningSteps : [1, 10];
  const rawStep = card.learningStep ?? 0;
  const currentStep = Math.max(
    0,
    Math.min(rawStep, learningStepsMinutes.length - 1)
  );

  const isLearningPhase =
    (card.status === CardStatus.NEW || card.status === CardStatus.LEARNING) &&
    rawStep < learningStepsMinutes.length;

  if (isLearningPhase) {
    let nextStep = currentStep;
    let nextIntervalMinutes = 0;

    if (grade === "Again") {
      nextStep = 0;
      nextIntervalMinutes = learningStepsMinutes[0] ?? 1;
    } else if (grade === "Hard") {
      nextIntervalMinutes =
        learningStepsMinutes[currentStep] ??
        learningStepsMinutes[learningStepsMinutes.length - 1] ??
        1;
    } else if (grade === "Good") {
      nextStep = currentStep + 1;
      if (nextStep > learningStepsMinutes.length) {
      } else {
        nextIntervalMinutes = learningStepsMinutes[currentStep] ?? 1;
      }
    }

    if (
      grade === "Again" ||
      grade === "Hard" ||
      (grade === "Good" && nextStep <= learningStepsMinutes.length)
    ) {
      let nextDue = addMinutes(now, nextIntervalMinutes);

      if (isNaN(nextDue.getTime())) {
        console.error("[SRS] Invalid learning step interval", {
          nextIntervalMinutes,
          grade,
          card,
        });
        nextDue = addMinutes(now, 1);
      }

      const intervalDays = nextIntervalMinutes / (24 * 60);

      return {
        ...card,
        dueDate: nextDue.toISOString(),
        status: CardStatus.LEARNING,
        state: State.Learning,
        learningStep: nextStep,
        interval: intervalDays,
        precise_interval: intervalDays,
        scheduled_days: 0,
        last_review: now.toISOString(),
        reps: (card.reps || 0) + 1,
        lapses: grade === "Again" ? (card.lapses || 0) + 1 : card.lapses || 0,
      };
    }
  }

  const f = getFSRS(settings);

  let currentState = card.state;
  if (currentState === undefined) {
    if (card.status === CardStatus.NEW) currentState = State.New;
    else if (card.status === CardStatus.LEARNING) currentState = State.Learning;
    else if (card.status === CardStatus.REVIEW) currentState = State.Review;
    else currentState = State.Review;
  }

  if (
    !isLearningPhase &&
    (card.status === CardStatus.LEARNING || card.status === CardStatus.NEW)
  ) {
    currentState = State.New;
  }

  const lastReviewDate = card.last_review
    ? new Date(card.last_review)
    : undefined;

  if (
    (currentState === State.Review ||
      currentState === State.Learning ||
      currentState === State.Relearning) &&
    !lastReviewDate
  ) {
    currentState = State.New;
  }

  const fsrsCard: FSRSCard = {
    due: new Date(card.dueDate),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: currentState,
    last_review: lastReviewDate,
  } as FSRSCard;

  const schedulingCards = f.repeat(fsrsCard, now);

  const rating = mapGradeToRating(grade);
  const log = schedulingCards[rating].card;

  const tentativeStatus = mapStateToStatus(log.state);

  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses > 8 && !isLeech) {
    isLeech = true;
  }

  const nowMs = now.getTime();
  const dueMs = log.due.getTime();
  const diffMs = dueMs - nowMs;
  const preciseInterval = Math.max(0, diffMs / (24 * 60 * 60 * 1000));

  let scheduledDaysInt = Math.round(preciseInterval);
  if (
    tentativeStatus !== CardStatus.LEARNING &&
    tentativeStatus !== CardStatus.NEW
  ) {
    scheduledDaysInt = Math.max(1, scheduledDaysInt);
  }

  return {
    ...card,
    dueDate: !isNaN(log.due.getTime())
      ? log.due.toISOString()
      : addMinutes(now, 10).toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: scheduledDaysInt,
    precise_interval: preciseInterval,
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review:
      log.last_review && !isNaN(log.last_review.getTime())
        ? log.last_review.toISOString()
        : now.toISOString(),
    first_review:
      card.first_review ||
      ((card.reps || 0) === 0 ? now.toISOString() : undefined),
    status: tentativeStatus,
    interval: preciseInterval,
    learningStep: undefined,
    leechCount: totalLapses,
    isLeech,
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  if (
    card.status === CardStatus.NEW ||
    card.state === State.New ||
    (card.state === undefined && (card.reps || 0) === 0)
  ) {
    return true;
  }

  const due = new Date(card.dueDate);

  const ONE_HOUR_IN_DAYS = 1 / 24;
  if (card.interval < ONE_HOUR_IN_DAYS) {
    return due <= now;
  }

  const srsToday = getSRSDate(now);
  const nextSRSDay = addDays(srsToday, 1);

  return isBefore(due, nextSRSDay);
};
```

# src/data/initialCards.ts

```typescript
export const initialCards: any[] = [];
```

# src/db/client.ts

```typescript
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Card } from "@/types";

export interface HistoryEntry {
  date: string;
  count: number;
  byLanguage?: Record<string, number>;
}

export interface LinguaFlowDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
    indexes: { dueDate: string; status: string; last_review: string };
  };
  history: {
    key: string;
    value: HistoryEntry;
  };
}

const DB_NAME = "linguaflow-db";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<LinguaFlowDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LinguaFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        let cardStore;
        if (!db.objectStoreNames.contains("cards")) {
          cardStore = db.createObjectStore("cards", { keyPath: "id" });
        } else {
          cardStore = transaction.objectStore("cards");
        }

        if (!cardStore.indexNames.contains("dueDate")) {
          cardStore.createIndex("dueDate", "dueDate");
        }
        if (!cardStore.indexNames.contains("status")) {
          cardStore.createIndex("status", "status");
        }
        if (!cardStore.indexNames.contains("last_review")) {
          cardStore.createIndex("last_review", "last_review");
        }

        if (!db.objectStoreNames.contains("history")) {
          db.createObjectStore("history", { keyPath: "date" });
        }
      },
    });
  }

  return dbPromise;
};

export const resetDBCache = () => {
  dbPromise = null;
};
```

# src/db/dexie.ts

```typescript
import Dexie, { Table } from "dexie";
import { Card, ReviewLog, UserSettings } from "@/types";
import { State } from "ts-fsrs";

export interface LocalUser {
  id: string;
  username: string;
  passwordHash: string;
  created_at: string;
}

export interface LocalProfile {
  id: string;
  username: string;
  xp: number;
  points: number;
  level: number;
  language_level?: string;
  initial_deck_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevlogEntry {
  id: string;
  card_id: string;
  user_id?: string;
  grade: number;
  state: State;
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}

export interface HistoryEntry {
  date: string;
  language: string;
  user_id?: string;
  count: number;
}

export type LocalSettings = Partial<UserSettings> & {
  id: string;
  geminiApiKey?: string;
  googleTtsApiKey?: string;
  azureTtsApiKey?: string;
  azureRegion?: string;
  deviceId?: string;
  syncPath?: string;
  lastSync?: string;
};

export interface AggregatedStat {
  id: string;
  language: string;
  user_id?: string;
  metric: string;
  value: number;
  updated_at: string;
}

export class LinguaFlowDB extends Dexie {
  cards!: Table<Card>;
  revlog!: Table<RevlogEntry>;
  history!: Table<HistoryEntry>;
  profile!: Table<LocalProfile>;
  settings!: Table<LocalSettings>;
  aggregated_stats!: Table<AggregatedStat>;
  users!: Table<LocalUser>;
  constructor() {
    super("linguaflow-dexie");

    this.version(2).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]",
      revlog: "id, card_id, created_at, [card_id+created_at]",
      history: "[date+language], date, language",
      profile: "id",
      settings: "id",
    });

    this.version(3)
      .stores({
        cards:
          "id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]",
        revlog: "id, card_id, created_at, [card_id+created_at]",
        history: "[date+language], date, language",
        profile: "id",
        settings: "id",
        aggregated_stats: "id, [language+metric], updated_at",
      })
      .upgrade(async (tx) => {
        const allCards = await tx.table<Card>("cards").toArray();
        const languages = Array.from(new Set(allCards.map((c) => c.language)));

        for (const language of languages) {
          const cardIds = new Set(
            allCards.filter((c) => c.language === language).map((c) => c.id)
          );

          let totalXp = 0;
          let totalReviews = 0;

          await tx.table<RevlogEntry>("revlog").each((log) => {
            if (cardIds.has(log.card_id)) {
              totalXp += 10;
              totalReviews++;
            }
          });

          await tx.table<AggregatedStat>("aggregated_stats").bulkAdd([
            {
              id: `${language}:total_xp`,
              language: language || "unknown",
              metric: "total_xp",
              value: totalXp,
              updated_at: new Date().toISOString(),
            },
            {
              id: `${language}:total_reviews`,
              language: language || "unknown",
              metric: "total_reviews",
              value: totalReviews,
              updated_at: new Date().toISOString(),
            },
          ]);
        }

        let globalXp = 0;
        let globalReviews = 0;
        await tx.table<RevlogEntry>("revlog").each(() => {
          globalXp += 10;
          globalReviews++;
        });

        await tx.table<AggregatedStat>("aggregated_stats").bulkAdd([
          {
            id: "global:total_xp",
            language: "global",
            metric: "total_xp",
            value: globalXp,
            updated_at: new Date().toISOString(),
          },
          {
            id: "global:total_reviews",
            language: "global",
            metric: "total_reviews",
            value: globalReviews,
            updated_at: new Date().toISOString(),
          },
        ]);
      });

    this.version(4).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language]",
      revlog: "id, card_id, user_id, created_at, [card_id+created_at]",
      history: "[date+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats:
        "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.version(5).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate]",
      revlog:
        "id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]",
      history:
        "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats:
        "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.version(6).stores({
      cards:
        "id, status, language, dueDate, isBookmarked, user_id, [status+language], [language+status], [language+status+interval], [user_id+language], [user_id+status+language], [user_id+language+status], [user_id+language+dueDate], [user_id+language+status+dueDate], [user_id+language+isBookmarked+dueDate], [user_id+language+isLeech+dueDate]",
      revlog:
        "id, card_id, user_id, created_at, [card_id+created_at], [user_id+created_at]",
      history:
        "[date+language], [user_id+date+language], [user_id+language], date, language, user_id",
      profile: "id",
      settings: "id",
      aggregated_stats:
        "id, [language+metric], [user_id+language+metric], updated_at",
      users: "id, &username",
    });

    this.cards.hook("deleting", (primKey, obj, transaction) => {
      return this.revlog.where("card_id").equals(primKey).delete();
    });
  }
}

export const db = new LinguaFlowDB();

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const generateId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
```

# src/db/index.ts

```typescript
import * as cardRepository from "./repositories/cardRepository";
import * as historyRepository from "./repositories/historyRepository";
import * as statsRepository from "./repositories/statsRepository";

export { getDB, resetDBCache } from "./client";

export const db = {
  getCards: cardRepository.getCards,
  saveCard: cardRepository.saveCard,
  deleteCard: cardRepository.deleteCard,
  saveAllCards: cardRepository.saveAllCards,
  clearAllCards: cardRepository.clearAllCards,
  getDueCards: cardRepository.getDueCards,
  getCramCards: cardRepository.getCramCards,
  deleteCardsByLanguage: cardRepository.deleteCardsByLanguage,
  getStats: statsRepository.getStats,
  getTodayReviewStats: statsRepository.getTodayReviewStats,
  getHistory: historyRepository.getHistory,
  incrementHistory: historyRepository.incrementHistory,
  saveFullHistory: historyRepository.saveFullHistory,
  clearHistory: historyRepository.clearHistory,
};
```

# src/db/migrations/standardizeStatus.ts

```typescript
import { db } from "@/db/dexie";
import { CardStatus } from "@/types/cardStatus";

export const migrateCardStatuses = async () => {
  await db.transaction("rw", db.cards, async () => {
    await db.cards.toCollection().modify((card) => {
      if (card.status === "graduated") {
        card.status = CardStatus.REVIEW;
      }

      if (card.status !== CardStatus.KNOWN) {
        if (card.state !== undefined) {
          if (card.state === 0) card.status = CardStatus.NEW;
          if (card.state === 1 || card.state === 3)
            card.status = CardStatus.LEARNING;
          if (card.state === 2) card.status = CardStatus.REVIEW;
        }
      }
    });
  });
  console.log("Card statuses standardized.");
};
```

# src/db/repositories/aggregatedStatsRepository.ts

```typescript
import { db, AggregatedStat } from "@/db/dexie";
import { getCurrentUserId } from "./cardRepository";

export const getAggregatedStat = async (
  language: string,
  metric: string
): Promise<number> => {
  const userId = getCurrentUserId();
  if (!userId) return 0;

  const id = `${userId}:${language}:${metric}`;
  const stat = await db.aggregated_stats.get(id);
  return stat?.value ?? 0;
};

export const incrementStat = async (
  language: string,
  metric: string,
  delta: number
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const id = `${userId}:${language}:${metric}`;
  const existing = await db.aggregated_stats.get(id);

  if (existing) {
    await db.aggregated_stats.update(id, {
      value: existing.value + delta,
      updated_at: new Date().toISOString(),
    });
  } else {
    await db.aggregated_stats.add({
      id,
      language,
      user_id: userId,
      metric,
      value: delta,
      updated_at: new Date().toISOString(),
    });
  }
};

export const bulkSetStats = async (
  stats: Array<{ language: string; metric: string; value: number }>
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const records: AggregatedStat[] = stats.map((s) => ({
    id: `${userId}:${s.language}:${s.metric}`,
    language: s.language,
    user_id: userId,
    metric: s.metric,
    value: s.value,
    updated_at: new Date().toISOString(),
  }));

  await db.aggregated_stats.bulkPut(records);
};

export const recalculateAllStats = async (language?: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cards = language
    ? await db.cards
        .where("[user_id+language]")
        .equals([userId, language])
        .toArray()
    : await db.cards.where("user_id").equals(userId).toArray();

  const cardIds = new Set(cards.map((c) => c.id));

  let totalXp = 0;
  let totalReviews = 0;

  const logs = await db.revlog.where("user_id").equals(userId).toArray();
  logs.forEach((log) => {
    if (!language || cardIds.has(log.card_id)) {
      totalXp += 10;
      totalReviews++;
    }
  });

  const statsToWrite: Array<{
    language: string;
    metric: string;
    value: number;
  }> = [];
  const lang = language || "global";

  statsToWrite.push(
    { language: lang, metric: "total_xp", value: totalXp },
    { language: lang, metric: "total_reviews", value: totalReviews }
  );

  await bulkSetStats(statsToWrite);
};
```

# src/db/repositories/cardRepository.ts

```typescript
import {
  Card,
  CardStatus,
  mapFsrsStateToStatus,
  Language,
  LanguageId,
} from "@/types";
import { getSRSDate } from "@/core/srs";
import { db, generateId } from "@/db/dexie";
import { SRS_CONFIG } from "@/constants";
import { z } from "zod";

const SESSION_KEY = "linguaflow_current_user";

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

const DBRawCardSchema = z.object({
  id: z.string(),
  targetSentence: z.string(),
  targetWord: z.string().optional().nullable(),
  targetWordTranslation: z.string().optional().nullable(),
  targetWordPartOfSpeech: z.string().optional().nullable(),
  nativeTranslation: z.string(),
  furigana: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  grammaticalCase: z.string().optional().nullable(),
  notes: z.string().optional().nullable().default(""),
  tags: z.array(z.string()).optional().nullable(),
  language: z.string().optional(),
  status: z
    .union([z.nativeEnum(CardStatus), z.string()])
    .transform((val) => val as CardStatus),

  interval: z.number().default(0),
  easeFactor: z.number().default(2.5),
  dueDate: z.string(),

  stability: z.number().optional().nullable(),
  difficulty: z.number().optional().nullable(),
  elapsed_days: z.number().optional().nullable(),
  scheduled_days: z.number().optional().nullable(),
  reps: z.number().optional().nullable(),
  lapses: z.number().optional().nullable(),
  state: z.number().optional().nullable(),
  due: z.string().optional().nullable(),
  last_review: z.string().optional().nullable(),
  first_review: z.string().optional().nullable(),

  learningStep: z.number().optional().nullable(),
  leechCount: z.number().optional().nullable(),
  isLeech: z.boolean().optional().default(false),
  isBookmarked: z.boolean().optional().default(false),
  precise_interval: z.number().optional().nullable(),

  user_id: z.string().optional().nullable(),
});

export type DBRawCard = z.infer<typeof DBRawCardSchema>;

export const mapToCard = (data: unknown): Card => {
  const result = DBRawCardSchema.safeParse(data);

  if (!result.success) {
    console.error("Card validation failed:", result.error, data);
    return data as Card;
  }

  const validData = result.data;

  return {
    id: validData.id,
    targetSentence: validData.targetSentence,
    targetWord: validData.targetWord || undefined,
    targetWordTranslation: validData.targetWordTranslation || undefined,
    targetWordPartOfSpeech: validData.targetWordPartOfSpeech || undefined,
    nativeTranslation: validData.nativeTranslation,
    furigana: validData.furigana || undefined,
    gender: validData.gender || undefined,
    grammaticalCase: validData.grammaticalCase || undefined,
    notes: validData.notes || "",
    tags: validData.tags || undefined,
    language: validData.language as Language,
    status: validData.status,
    interval: validData.interval,
    easeFactor: validData.easeFactor,
    dueDate: validData.dueDate,

    stability: validData.stability ?? undefined,
    difficulty: validData.difficulty ?? undefined,
    elapsed_days: validData.elapsed_days ?? undefined,
    scheduled_days: validData.scheduled_days ?? undefined,
    reps: validData.reps ?? undefined,
    lapses: validData.lapses ?? undefined,
    state: validData.state ?? undefined,
    due: validData.due ?? undefined,
    last_review: validData.last_review ?? undefined,
    first_review: validData.first_review ?? undefined,

    learningStep: validData.learningStep ?? undefined,
    leechCount: validData.leechCount ?? undefined,
    isLeech: validData.isLeech,
    isBookmarked: validData.isBookmarked,
    precise_interval: validData.precise_interval ?? undefined,

    user_id: validData.user_id ?? undefined,
  } as Card;
};

export const getCards = async (): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards.where("user_id").equals(userId).toArray();
  return rawCards.map(mapToCard);
};

export const getAllCardsByLanguage = async (
  language: Language
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();
  return rawCards.map(mapToCard);
};

export const getCardsForRetention = async (
  language: Language
): Promise<Partial<Card>[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((c) => ({
    id: c.id,
    dueDate: c.dueDate,
    status: c.status,
    stability: c.stability,
    state: c.state,
  }));
};

export const getDashboardCounts = async (
  language: Language
): Promise<{
  total: number;
  new: number;
  learned: number;
  hueDue: number;
}> => {
  const userId = getCurrentUserId();
  if (!userId) return { total: 0, new: 0, learned: 0, hueDue: 0 };

  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(4);
  const cutoffISO = cutoffDate.toISOString();

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  const allCards = rawCards.map(mapToCard);

  const total = allCards.length;
  const newCards = allCards.filter((c) => c.status === "new").length;
  const learned = allCards.filter((c) => c.status === "known").length;
  const due = allCards.filter(
    (c) => c.status !== "known" && c.dueDate <= cutoffISO
  ).length;

  return {
    total,
    new: newCards,
    learned,
    hueDue: due,
  };
};

export const getCardsForDashboard = async (
  language: Language
): Promise<
  Array<{
    id: string;
    dueDate: string | null;
    status: string;
    stability: number | null;
    state: number | null;
  }>
> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((card) => ({
    id: card.id,
    dueDate: card.dueDate,
    status: card.status,
    stability: card.stability ?? null,
    state: card.state ?? null,
  }));
};

export const saveCard = async (card: Card) => {
  const userId = getCurrentUserId();
  if (!card.id) {
    card.id = generateId();
  }
  if (!card.user_id && userId) {
    card.user_id = userId;
  }
  if (card.status !== CardStatus.KNOWN) {
    if (card.state !== undefined) {
      card.status = mapFsrsStateToStatus(card.state);
    }
  }

  await db.cards.put(card);
};

export const deleteCard = async (id: string) => {
  await db.transaction("rw", [db.cards, db.revlog], async () => {
    await db.cards.delete(id);
  });
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  await db.transaction("rw", [db.cards, db.revlog], async () => {
    await db.cards.bulkDelete(ids);
  });
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = getCurrentUserId();

  const cardsWithIds = cards.map((card) => ({
    ...card,
    id: card.id || generateId(),
    user_id: card.user_id || userId || undefined,
  }));

  await db.cards.bulkPut(cardsWithIds);
};

export const clearAllCards = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  await db.cards.where("user_id").equals(userId).delete();
};

export const getDueCards = async (
  now: Date,
  language: Language
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const cutoffISO = cutoffDate.toISOString();

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.status !== "known" && card.dueDate <= cutoffISO)
    .toArray();

  return rawCards
    .map(mapToCard)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getCramCards = async (
  limit: number,
  tag?: string,
  language?: Language
): Promise<Card[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language || LanguageId.Polish])
    .toArray();

  let cards = rawCards.map(mapToCard);

  if (tag) {
    cards = cards.filter((c) => c.tags?.includes(tag));
  }

  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const cardsToDelete = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  const ids = cardsToDelete.map((c) => c.id);
  if (ids.length > 0) {
    await db.cards.bulkDelete(ids);
  }
};

export const getCardSignatures = async (
  language: Language
): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .toArray();

  return rawCards.map(mapToCard).map((c) => ({
    target_sentence: c.targetSentence,
    language: c.language as string,
  }));
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let rawCards: Card[];

  if (language) {
    rawCards = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();
  } else {
    rawCards = await db.cards.where("user_id").equals(userId).toArray();
  }

  const cards = rawCards.map(mapToCard);

  const uniqueTags = new Set<string>();
  cards.forEach((card) => {
    if (card.tags) {
      card.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};

export const getLearnedWords = async (
  language: Language
): Promise<string[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.status !== "new" && card.targetWord != null)
    .toArray();

  const words = rawCards
    .map(mapToCard)
    .map((card) => card.targetWord)
    .filter((word): word is string => word !== null && word !== undefined);

  return [...new Set(words)];
};

export const getCardByTargetWord = async (
  targetWord: string,
  language: Language
): Promise<Card | undefined> => {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const lowerWord = targetWord.toLowerCase();
  const rawCards = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .filter((card) => card.targetWord?.toLowerCase() === lowerWord)
    .toArray();

  if (rawCards.length === 0) return undefined;

  return mapToCard(rawCards[0]);
};
```

# src/db/repositories/historyRepository.ts

```typescript
import { db } from "@/db/dexie";
import { ReviewHistory, Language, LanguageId } from "@/types";
import { format } from "date-fns";
import { getCurrentUserId } from "./cardRepository";

export const getHistory = async (
  language?: Language
): Promise<ReviewHistory> => {
  const userId = getCurrentUserId();
  if (!userId) return {};

  let logs = await db.revlog.where("user_id").equals(userId).toArray();

  if (language) {
    const cards = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();
    const cardIds = new Set(cards.map((c) => c.id));
    logs = logs.filter((log) => cardIds.has(log.card_id));
  }

  return logs.reduce<ReviewHistory>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = LanguageId.Polish
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const existing = await db.history
    .where("[user_id+date+language]")
    .equals([userId, date, language])
    .first();

  if (existing) {
    await db.history.update([date, language], {
      count: existing.count + delta,
    });
  } else {
    await db.history.add({
      date,
      language,
      user_id: userId,
      count: delta,
    });
  }
};

export const saveFullHistory = async (
  history: ReviewHistory,
  language: Language = LanguageId.Polish
) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    user_id: userId,
    count: typeof count === "number" ? count : 0,
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  if (language) {
    const historyToDelete = await db.history
      .where("[user_id+language]")
      .equals([userId, language])
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  } else {
    const historyToDelete = await db.history
      .where("user_id")
      .equals(userId)
      .toArray();

    for (const entry of historyToDelete) {
      await db.history.delete([entry.date, entry.language]);
    }
  }
};
```

# src/db/repositories/revlogRepository.ts

```typescript
import { db, generateId, RevlogEntry } from "@/db/dexie";
import { ReviewLog, Card, Grade } from "@/types";
import { State } from "ts-fsrs";
import { incrementStat } from "./aggregatedStatsRepository";
import { getCurrentUserId } from "./cardRepository";

const mapGradeToNumber = (grade: Grade): number => {
  switch (grade) {
    case "Again":
      return 1;
    case "Hard":
      return 2;
    case "Good":
      return 3;
    case "Easy":
      return 4;
  }
};

export const addReviewLog = async (
  card: Card,
  grade: Grade,
  elapsedDays: number,
  scheduledDays: number
) => {
  const userId = getCurrentUserId();

  const entry: RevlogEntry = {
    id: generateId(),
    card_id: card.id,
    user_id: userId || undefined,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString(),
  };

  await db.revlog.add(entry);

  await incrementStat(card.language || "polish", "total_xp", 10);
  await incrementStat(card.language || "polish", "total_reviews", 1);

  await incrementStat("global", "total_xp", 10);
  await incrementStat("global", "total_reviews", 1);
};

export const getAllReviewLogs = async (
  language?: string
): Promise<ReviewLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  let logs = await db.revlog.where("user_id").equals(userId).toArray();

  if (language) {
    const cards = await db.cards
      .where("language")
      .equals(language)
      .filter((c) => c.user_id === userId)
      .toArray();
    const cardIds = new Set(cards.map((c) => c.id));
    logs = logs.filter((log) => cardIds.has(log.card_id));
  }

  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return logs as unknown as ReviewLog[];
};
```

# src/db/repositories/settingsRepository.ts

```typescript
import { db, LocalSettings } from "../dexie";
import { UserSettings } from "@/types";

export interface UserApiKeys {
  geminiApiKey?: string;
  googleTtsApiKey?: string;
  azureTtsApiKey?: string;
  azureRegion?: string;
}

const SETTINGS_KEY = "linguaflow_api_keys";
const UI_SETTINGS_KEY = "language_mining_settings";

export async function getUserSettings(
  userId: string
): Promise<UserApiKeys | null> {
  try {
    const settings = await db.settings.get(userId);
    if (!settings) return null;

    return settings as UserApiKeys;
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return null;
  }
}

export async function getFullSettings(
  userId: string
): Promise<LocalSettings | null> {
  try {
    const settings = await db.settings.get(userId);
    return settings || null;
  } catch (error) {
    console.error("Failed to fetch full settings:", error);
    return null;
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<LocalSettings>
): Promise<void> {
  try {
    const existing = await db.settings.get(userId);
    const merged = { ...existing, ...settings, id: userId };
    await db.settings.put(merged);
  } catch (error) {
    console.error("Failed to update user settings:", error);
    throw error;
  }
}

export async function getSystemSetting<T>(
  key: keyof LocalSettings,
  userId: string = "local-user"
): Promise<T | undefined> {
  try {
    const settings = await db.settings.get(userId);
    return settings?.[key] as T;
  } catch (error) {
    console.error(`Failed to fetch system setting ${key}:`, error);
    return undefined;
  }
}

export async function setSystemSetting(
  key: keyof LocalSettings,
  value: any,
  userId: string = "local-user"
): Promise<void> {
  try {
    const existing = (await db.settings.get(userId)) || { id: userId };
    await db.settings.put({ ...existing, [key]: value });
  } catch (error) {
    console.error(`Failed to update system setting ${key}:`, error);
    throw error;
  }
}

export async function migrateLocalSettingsToDatabase(
  userId: string
): Promise<boolean> {
  try {
    const existingDb = await db.settings.get(userId);

    const storedKeys = localStorage.getItem(SETTINGS_KEY);
    const storedUi = localStorage.getItem(UI_SETTINGS_KEY);

    if (existingDb) {
      if (storedKeys) localStorage.removeItem(SETTINGS_KEY);
      if (storedUi) localStorage.removeItem(UI_SETTINGS_KEY);
      return false;
    }

    if (!storedKeys && !storedUi) return false;

    const apiKeys = storedKeys ? JSON.parse(storedKeys) : {};
    const uiSettings = storedUi ? JSON.parse(storedUi) : {};

    const merged: LocalSettings = {
      id: userId,
      ...uiSettings,
      ...apiKeys,
    };

    await db.settings.put(merged);

    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(UI_SETTINGS_KEY);

    return true;
  } catch (error) {
    console.error("Failed to migrate settings:", error);
    return false;
  }
}
```

# src/db/repositories/statsRepository.ts

```typescript
import { getSRSDate } from "@/core/srs";
import { SRS_CONFIG } from "@/constants";
import { db } from "@/db/dexie";
import {
  differenceInCalendarDays,
  parseISO,
  addDays,
  format,
  subDays,
  startOfDay,
  parse,
} from "date-fns";
import { getDashboardCounts, getCurrentUserId } from "./cardRepository";
import { CardStatus } from "@/types/cardStatus";
import Dexie from "dexie";

export const getDashboardStats = async (language?: string) => {
  const userId = getCurrentUserId();
  const counts = { new: 0, learning: 0, review: 0, known: 0 };
  let languageXp = 0;

  if (language && userId) {
    const [
      newCount,
      knownCount,
      learningCount,
      graduatedCount,
      implicitKnownCount,
    ] = await Promise.all([
      db.cards
        .where("[user_id+language+status]")
        .equals([userId, language, CardStatus.NEW])
        .count(),
      db.cards
        .where("[user_id+language+status]")
        .equals([userId, language, CardStatus.KNOWN])
        .count(),
      db.cards
        .where("[user_id+language+status]")
        .equals([userId, language, CardStatus.LEARNING])
        .count(),
      db.cards
        .where("[language+status+interval]")
        .between(
          [language, CardStatus.REVIEW, 0],
          [language, CardStatus.REVIEW, 180],
          true,
          false
        )
        .filter((c) => c.user_id === userId)
        .count(),
      db.cards
        .where("[language+status+interval]")
        .between(
          [language, CardStatus.REVIEW, 180],
          [language, CardStatus.REVIEW, Dexie.maxKey],
          true,
          true
        )
        .filter((c) => c.user_id === userId)
        .count(),
    ]);

    const xpStat = await db.aggregated_stats.get(
      `${userId}:${language}:total_xp`
    );
    languageXp = xpStat?.value ?? 0;

    counts.new = newCount;
    counts.learning = learningCount;
    counts.review = graduatedCount;
    counts.known = knownCount + implicitKnownCount;
  } else if (language) {
    const [newCount, knownCount, learningCount] = await Promise.all([
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.NEW])
        .count(),
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.KNOWN])
        .count(),
      db.cards
        .where("[language+status]")
        .equals([language, CardStatus.LEARNING])
        .count(),
    ]);

    let review = 0;
    let implicitKnown = 0;

    await db.cards
      .where("[language+status]")
      .equals([language, CardStatus.REVIEW])
      .each((c) => {
        const interval = c.interval || 0;
        if (interval < 180) review++;
        else implicitKnown++;
      });

    counts.new = newCount;
    counts.learning = learningCount;
    counts.review = review;
    counts.known = knownCount + implicitKnown;

    const xpStat = await db.aggregated_stats
      .where({ language, metric: "total_xp" })
      .first();
    languageXp = xpStat?.value ?? 0;
  } else {
    const [newCount, knownCountByStatus, learningCount] = await Promise.all([
      db.cards.where("status").equals(CardStatus.NEW).count(),
      db.cards.where("status").equals(CardStatus.KNOWN).count(),
      db.cards.where("status").equals(CardStatus.LEARNING).count(),
    ]);

    let review = 0;
    let implicitKnown = 0;

    await db.cards
      .where("status")
      .equals(CardStatus.REVIEW)
      .each((c) => {
        const interval = c.interval || 0;
        if (interval < 180) review++;
        else implicitKnown++;
      });

    counts.new = newCount;
    counts.known = knownCountByStatus + implicitKnown;
    counts.learning = learningCount;
    counts.review = review;

    const globalXpStat = await db.aggregated_stats.get("global:total_xp");
    languageXp = globalXpStat?.value ?? 0;
  }

  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), "d"),
    fullDate: addDays(today, i).toISOString(),
    count: 0,
  }));

  const endDate = addDays(today, daysToShow);

  let query = db.cards
    .where("dueDate")
    .between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    query = query.filter((c) => c.language === language);
  }

  query = query.filter(
    (c) => c.status !== CardStatus.NEW && c.status !== CardStatus.KNOWN
  );

  await query.each((card) => {
    if (!card.dueDate) return;
    const due = parseISO(card.dueDate);
    const diff = differenceInCalendarDays(due, today);
    if (diff >= 0 && diff < daysToShow) {
      forecast[diff].count++;
    }
  });

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  if (language) {
    const counts = await getDashboardCounts(language as any);
    return {
      total: counts.total,
      due: counts.hueDue,
      learned: counts.learned,
    };
  }

  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);
  const cutoffIso = cutoffDate.toISOString();

  const total = await db.cards.count();
  const due = await db.cards
    .where("dueDate")
    .below(cutoffIso)
    .filter((c) => c.status !== CardStatus.KNOWN)
    .count();
  const learned = await db.cards
    .where("status")
    .anyOf(CardStatus.REVIEW, CardStatus.KNOWN)
    .count();

  return { total, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const userId = getCurrentUserId();
  if (!userId) return { newCards: 0, reviewCards: 0 };

  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const logs = await db.revlog
    .where("[user_id+created_at]")
    .between(
      [userId, rangeStart.toISOString()],
      [userId, rangeEnd.toISOString()],
      true,
      false
    )
    .toArray();

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    const cardIds = await db.cards
      .where("[user_id+language]")
      .equals([userId, language])
      .primaryKeys();
    const cardIdSet = new Set(cardIds);

    logs.forEach((entry) => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    logs.forEach((entry) => {
      if (entry.state === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = getCurrentUserId();
  if (!userId) return { activity: [], grades: [], retention: [] };

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startDateIso = startDate.toISOString();

  const cardIds = await db.cards
    .where("[user_id+language]")
    .equals([userId, language])
    .primaryKeys();
  const cardIdSet = new Set(cardIds);

  const logs = await db.revlog
    .where("[user_id+created_at]")
    .between([userId, startDateIso], [userId, "\uffff"], true, true)
    .filter((log) => cardIdSet.has(log.card_id))
    .toArray();

  const activityMap = new Map<
    string,
    { date: string; count: number; pass: number }
  >();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach((log) => {
    if (!log.created_at) return;

    const dateObj = new Date(log.created_at);
    if (isNaN(dateObj.getTime())) return;

    const dateKey = format(dateObj, "yyyy-MM-dd");
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++;
    }

    switch (log.grade) {
      case 1:
        gradeCounts.Again++;
        break;
      case 2:
        gradeCounts.Hard++;
        break;
      case 3:
        gradeCounts.Good++;
        break;
      case 4:
        gradeCounts.Easy++;
        break;
    }
  });

  const activityData = Array.from(activityMap.values());

  const retentionData = activityData.map((day) => {
    const dateObj = parse(day.date, "yyyy-MM-dd", new Date());
    return {
      date: format(dateObj, "MMM d"),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null,
    };
  });

  return {
    activity: activityData.map((d) => {
      const dateObj = parse(d.date, "yyyy-MM-dd", new Date());
      return { ...d, label: format(dateObj, "dd") };
    }),
    grades: [
      { name: "Again", value: gradeCounts.Again, color: "#ef4444" },
      { name: "Hard", value: gradeCounts.Hard, color: "#f97316" },
      { name: "Good", value: gradeCounts.Good, color: "#22c55e" },
      { name: "Easy", value: gradeCounts.Easy, color: "#3b82f6" },
    ],
    retention: retentionData,
  };
};
```

# src/db/workers/stats.worker.ts

```typescript
import { format, subDays } from "date-fns";

interface Log {
  created_at: string;
  grade: number;
  card_id: string;
}

interface ActivityWorkerInput {
  action: "calculate_activity";
  logs: Log[];
  days: number;
  cardIds: string[];
}

interface StreakWorkerInput {
  action: "calculate_streaks";
  history: Record<string, number>;
  todayStr: string;
  yesterdayStr: string;
}

type WorkerInput = ActivityWorkerInput | StreakWorkerInput;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const input = e.data;

  if (input.action === "calculate_activity") {
    const { logs, days, cardIds } = input;
    const cardIdSet = new Set(cardIds);

    const filteredLogs = logs.filter((log) => cardIdSet.has(log.card_id));

    const activityMap = new Map<
      string,
      { date: string; count: number; pass: number; fail: number }
    >();
    const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      activityMap.set(key, {
        date: key,
        count: 0,
        pass: 0,
        fail: 0,
      });
    }

    filteredLogs.forEach((log) => {
      const date = new Date(log.created_at);
      const key = format(date, "yyyy-MM-dd");

      if (activityMap.has(key)) {
        const entry = activityMap.get(key)!;
        entry.count++;
        if (log.grade === 1) {
          entry.fail++;
        } else {
          entry.pass++;
        }
      }

      if (log.grade === 1) gradeCounts.Again++;
      else if (log.grade === 2) gradeCounts.Hard++;
      else if (log.grade === 3) gradeCounts.Good++;
      else if (log.grade === 4) gradeCounts.Easy++;
    });

    const activityData = Array.from(activityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    self.postMessage({
      activityData,
      gradeCounts,
      totalReviews: filteredLogs.length,
    });
  } else if (input.action === "calculate_streaks") {
    const { history, todayStr, yesterdayStr } = input;

    if (!history || Object.keys(history).length === 0) {
      self.postMessage({
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0,
      });
      return;
    }

    const sortedDates = Object.keys(history).sort();

    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === "number" ? val : 0),
      0
    );

    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    let currentStreak = 0;

    const hasToday = history[todayStr];
    const hasYesterday = history[yesterdayStr];

    if (hasToday || hasYesterday) {
      currentStreak = 1;

      const dateSet = new Set(sortedDates);

      const startDateStr = hasToday ? todayStr : yesterdayStr;
      let checkDate = new Date(startDateStr);
      checkDate.setDate(checkDate.getDate() - 1);

      const maxDays = Math.min(sortedDates.length, 3650);

      for (let i = 0; i < maxDays; i++) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, "0");
        const day = String(checkDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    self.postMessage({
      currentStreak,
      longestStreak,
      totalReviews,
    });
  }
};
```

# src/features/auth/AuthPage.tsx

```typescript
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  Lock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  LanguageLevelSelector,
  DeckGenerationStep,
  AuthLayout,
} from "./components";
import { LanguageSelector } from "./components/LanguageSelector";
import { generateInitialDeck } from "@/features/generator/services/deckGeneration";
import { saveAllCards } from "@/db/repositories/cardRepository";
import { updateUserSettings } from "@/db/repositories/settingsRepository";
import { Difficulty, Card as CardType, Language, LanguageId } from "@/types";
import { Loader } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POLISH_BEGINNER_DECK } from "@/assets/starter-decks/polish";
import { NORWEGIAN_BEGINNER_DECK } from "@/assets/starter-decks/norwegian";
import { JAPANESE_BEGINNER_DECK } from "@/assets/starter-decks/japanese";
import { SPANISH_BEGINNER_DECK } from "@/assets/starter-decks/spanish";
import { GERMAN_BEGINNER_DECK } from "@/assets/starter-decks/german";
import { v4 as uuidv4 } from "uuid";
import { LocalUser } from "@/db/dexie";

type AuthMode = "login" | "register";
type SetupStep = "auth" | "language" | "level" | "deck";

const BEGINNER_DECKS: Record<Language, CardType[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const AuthPage: React.FC = () => {
  const { markInitialDeckGenerated } = useProfile();
  const { register, login, getRegisteredUsers } = useAuth();

  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [loading, setLoading] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [existingUsers, setExistingUsers] = useState<LocalUser[]>([]);
  const [setupStep, setSetupStep] = useState<SetupStep>("auth");
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getRegisteredUsers();
      setExistingUsers(users);
      if (users.length > 0) {
        setAuthMode("login");
      }
    };
    loadUsers();
  }, [getRegisteredUsers]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "register") {
      if (!username.trim() || username.length < 3) {
        toast.error("Username must be at least 3 characters");
        return;
      }
      if (!password || password.length < 4) {
        toast.error("Password must be at least 4 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const result = await register(username.trim(), password);
        setCurrentUserId(result.user.id);
        toast.success("Account created!");
        setSetupStep("language");
      } catch (error: any) {
        toast.error(error.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    } else {
      if (!username.trim()) {
        toast.error("Please enter your username");
        return;
      }
      if (!password) {
        toast.error("Please enter your password");
        return;
      }

      setLoading(true);
      try {
        await login(username.trim(), password);
      } catch (error: any) {
        toast.error(error.message || "Login failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      updateSettings({ language: selectedLanguages[0] });
      setSetupStep("level");
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSetupStep("deck");
  };

  const handleDeckSetup = async (
    languages: Language[],
    useAI: boolean,
    apiKey?: string
  ) => {
    if (!selectedLevel || !currentUserId) return;
    setLoading(true);

    try {
      if (useAI && apiKey) {
        await updateUserSettings(currentUserId, { geminiApiKey: apiKey });
      }

      let allCards: CardType[] = [];

      if (useAI && apiKey) {
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
        toast.success(
          `Generated ${allCards.length} personalized cards for ${
            languages.length
          } language${languages.length > 1 ? "s" : ""}!`
        );
      } else {
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map((c) => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: currentUserId,
          }));
          allCards = [...allCards, ...languageCards];
        }
        toast.success(
          `Loaded ${allCards.length} starter cards for ${
            languages.length
          } language${languages.length > 1 ? "s" : ""}!`
        );
      }

      allCards = allCards.map((c) => ({ ...c, user_id: currentUserId }));

      if (allCards.length > 0) {
        await saveAllCards(allCards);
      }

      await markInitialDeckGenerated(currentUserId);

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center my-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        {authMode === "login" ? "Welcome back" : "Begin your journey"}
      </p>
    </div>
  );

  const renderAuthStep = () => (
    <form onSubmit={handleAuthSubmit} className="space-y-4">
      {/* Auth Mode Toggle */}
      <Tabs
        value={authMode}
        onValueChange={(val) => setAuthMode(val as AuthMode)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Existing users hint */}
      {authMode === "login" && existingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-4">
          <Users size={14} />
          <span>
            {existingUsers.length} user{existingUsers.length > 1 ? "s" : ""}{" "}
            registered: {existingUsers.map((u) => u.username).join(", ")}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="username"
          className="text-xs font-medium text-muted-foreground ml-1"
        >
          Username
        </Label>
        <div className="relative group/input">
          <Input
            id="username"
            type="text"
            placeholder={
              authMode === "login" ? "Enter your username" : "Choose a username"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-11"
            required
            minLength={3}
            maxLength={20}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <UserIcon size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs font-medium text-muted-foreground ml-1"
        >
          Password
        </Label>
        <div className="relative group/input">
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11"
            required
            minLength={4}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <Lock size={16} />
          </div>
        </div>
      </div>

      {authMode === "register" && (
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-muted-foreground ml-1"
          >
            Confirm Password
          </Label>
          <div className="relative group/input">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-11"
              required
              minLength={4}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
              <Lock size={16} />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? (
          <Loader size="sm" />
        ) : (
          <>
            {authMode === "login" ? "Sign In" : "Create Account"}{" "}
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );

  if (loading && setupStep === "deck") {
    return (
      <AuthLayout>
        <Card className="text-center py-12 p-6">
          <Loader size="lg" />
          <h3 className="mt-4 text-lg font-medium tracking-wide ">
            Forging your deck...
          </h3>
          <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "language") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("auth")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Languages</h2>
          </div>
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "level") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("language")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "deck") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("level")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Deck Configuration</h2>
          </div>
          <DeckGenerationStep
            languages={selectedLanguages}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="py-8 px-6 md:px-8">
        {renderHeader()}
        {renderAuthStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
```

# src/features/auth/LoginScreen.tsx

```typescript
import React from "react";
import { LogIn, Command } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center ">
          <Command size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LinguaFlow</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sign in to sync your decks, earn XP, and climb the global
            leaderboard.
          </p>
        </div>
      </div>
      <Button
        onClick={signInWithGoogle}
        disabled={loading}
        className="rounded-full px-6 py-6 text-base font-medium"
      >
        <LogIn size={18} className="mr-2" />
        Continue with Google
      </Button>
      <p className="text-[11px] uppercase text-muted-foreground tracking-[0.2em]">
        Powered by Supabase Auth
      </p>
    </div>
  );
};
```

# src/features/auth/OnboardingFlow.tsx

```typescript
import React, { useState } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { LanguageLevelSelector } from "./components/LanguageLevelSelector";
import { LanguageSelector } from "./components/LanguageSelector";
import { DeckGenerationStep } from "./components/DeckGenerationStep";
import { Difficulty, Card, Language, LanguageId } from "@/types";
import { toast } from "sonner";
import { updateUserSettings } from "@/db/repositories/settingsRepository";
import { generateInitialDeck } from "@/features/generator/services/deckGeneration";
import { saveAllCards } from "@/db/repositories/cardRepository";
import { Command, LogOut } from "lucide-react";
import {
  POLISH_BEGINNER_DECK,
  NORWEGIAN_BEGINNER_DECK,
  JAPANESE_BEGINNER_DECK,
  SPANISH_BEGINNER_DECK,
  GERMAN_BEGINNER_DECK,
} from "@/assets/starter-decks";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

const BEGINNER_DECKS: Record<Language, Card[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const OnboardingFlow: React.FC = () => {
  const { user, signOut } = useAuth();
  const { markInitialDeckGenerated } = useProfile();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [step, setStep] = useState<"language" | "level" | "deck">("language");
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      updateSettings({ language: selectedLanguages[0] });
      setStep("level");
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep("deck");
  };

  const handleDeckComplete = async (
    languages: Language[],
    useAI: boolean,
    apiKey?: string
  ) => {
    if (!user || !selectedLevel) return;

    try {
      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }

      let allCards: Card[] = [];

      if (useAI && apiKey) {
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
      } else {
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map((c) => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: user.id,
          }));
          allCards = [...allCards, ...languageCards];
        }
      }

      allCards = allCards.map((c) => ({ ...c, user_id: user.id }));

      if (allCards.length > 0) {
        console.log(
          "[OnboardingFlow] Saving",
          allCards.length,
          "cards across",
          languages.length,
          "languages..."
        );
        await saveAllCards(allCards);
        toast.success(
          `Loaded ${allCards.length} cards for ${languages.length} language${
            languages.length > 1 ? "s" : ""
          }.`
        );
        console.log("[OnboardingFlow] Cards saved.");
      }

      console.log("[OnboardingFlow] Marking initial deck as generated...");
      await markInitialDeckGenerated();

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Onboarding failed:", error);
      toast.error(error.message || "Setup failed. Please try again.");
      throw error;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">
      {/* Header / Nav */}
      <div className="fixed top-6 right-6">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 h-auto p-2"
        >
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {step === "language"
                ? "Select Languages."
                : step === "level"
                ? "Proficiency Level."
                : "Initialize Decks."}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === "language"
                ? "Step 1 of 3"
                : step === "level"
                ? "Step 2 of 3"
                : "Step 3 of 3"}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === "language" && (
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
          />
        )}

        {step === "level" && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={handleLevelSelected}
            />
            <Button
              variant="link"
              onClick={() => setStep("language")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center h-auto p-0"
            >
              Back to Language Selection
            </Button>
          </div>
        )}

        {step === "deck" && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              languages={selectedLanguages}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckComplete}
            />
            <Button
              variant="link"
              onClick={() => setStep("level")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center h-auto p-0"
            >
              Back to Level Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

# src/features/auth/UsernameSetup.tsx

```typescript
import React, { useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { ButtonLoader } from "@/components/ui/loading";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const UsernameSetup: React.FC = () => {
  const { updateUsername, user } = useAuth();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (username.length < 3) {
      toast.error("Minimum 3 characters required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUsername(username.trim());
      toast.success("Identity established.");
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 selection:bg-foreground selection:text-background">
      <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-700 space-y-12">
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-4">
            Step 02 / Identity
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground leading-tight">
            How should we <br /> call you?
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="relative group">
            <Input
              className="w-full bg-transparent border-b border-border border-t-0 border-x-0 px-0 py-4 text-2xl md:text-3xl font-light outline-none transition-all focus-visible:ring-0 focus:border-foreground placeholder:text-muted-foreground/20 rounded-none text-foreground h-auto shadow-none"
              placeholder="Type name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              minLength={3}
              maxLength={20}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                {username.length} / 20
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              ID: {user?.email}
            </div>

            <Button
              type="submit"
              variant="ghost"
              className="group flex items-center gap-3 text-sm font-medium hover:text-foreground/70 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !username}
            >
              {isSubmitting ? "Processing" : "Confirm"}
              {isSubmitting ? (
                <ButtonLoader />
              ) : (
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

# src/features/auth/components/AuthLayout.tsx

```typescript
import React from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)}>{children}</div>
    </div>
  );
};
```

# src/features/auth/components/DeckGenerationStep.tsx

```typescript
import React, { useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Difficulty, Language, LanguageId, LANGUAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { ButtonLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeckGenerationStepProps {
  languages: Language[];
  proficiencyLevel: Difficulty;
  onComplete: (
    languages: Language[],
    useAI: boolean,
    apiKey?: string
  ) => Promise<void>;
}

type DeckOption = "ai" | "default" | null;

export const DeckGenerationStep: React.FC<DeckGenerationStepProps> = ({
  languages,
  proficiencyLevel,
  onComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<DeckOption>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (selectedOption === "ai" && !apiKey.trim()) {
      setError("Please enter your Gemini API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onComplete(
        languages,
        selectedOption === "ai",
        selectedOption === "ai" ? apiKey : undefined
      );
    } catch (err: any) {
      setError(err.message || "Failed to complete setup");
      setLoading(false);
    }
  };

  const languageNames = languages
    .map((lang) => LANGUAGE_LABELS[lang] || lang)
    .join(", ");
  const languageCount = languages.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs  text-muted-foreground uppercase tracking-wider">
          Choose how to start learning{" "}
          {languageCount > 1 ? `${languageCount} languages` : languageNames} at{" "}
          {proficiencyLevel} level.
        </p>
        {languageCount > 1 && (
          <p className="text-xs text-muted-foreground/70">
            Selected: {languageNames}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {/* AI Generated Deck */}
        {/* AI Generated Deck */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setSelectedOption("ai")}
          disabled={loading}
          className={cn(
            "group relative w-full h-auto flex justify-start items-start p-4 text-left",
            selectedOption === "ai"
              ? "border-primary bg-primary/10 hover:bg-primary/20"
              : ""
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="flex-1 space-y-1 ml-2">
              <div
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  selectedOption === "ai" ? "text-primary" : "text-foreground"
                )}
              >
                AI-Generated Decks
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                Generate 50 personalized flashcards per language using Gemini
                AI, tailored to {proficiencyLevel} level. Requires your API key.
              </p>
            </div>
          </div>
        </Button>

        {/* Default Deck */}
        {/* Default Deck */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setSelectedOption("default")}
          disabled={loading}
          className={cn(
            "group relative w-full h-auto flex justify-start items-start p-4 text-left",
            selectedOption === "default"
              ? "border-primary bg-primary/10 hover:bg-primary/20"
              : ""
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div className="flex-1 space-y-1 ml-2">
              <div
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  selectedOption === "default"
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                Standard Courses
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                Start with our curated beginner decks for{" "}
                {languageCount > 1 ? "each language" : "this language"}. Best
                for getting started quickly.
              </p>
            </div>
          </div>
        </Button>
      </div>

      {/* API Key Input */}
      {selectedOption === "ai" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <Label
              htmlFor="apiKey"
              className="text-xs font-medium text-muted-foreground  uppercase tracking-wider ml-1"
            >
              Gemini API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {error && <p className="text-destructive text-xs ml-1">{error}</p>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Your key is stored locally and only used for deck generation.
          </p>
        </div>
      )}

      {/* Action Button */}
      {selectedOption && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <ButtonLoader />
            ) : selectedOption === "ai" ? (
              `Generate ${languageCount} Deck${languageCount > 1 ? "s" : ""}`
            ) : (
              "Start Learning"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
```

# src/features/auth/components/LanguageLevelSelector.tsx

```typescript
import React from "react";
import { Check } from "lucide-react";
import { Difficulty } from "@/types";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LanguageLevelSelectorProps {
  selectedLevel: Difficulty | null;
  onSelectLevel: (level: Difficulty) => void;
}

const LEVELS: { level: Difficulty; name: string; description: string }[] = [
  {
    level: "A1",
    name: "Beginner",
    description: "Basic phrases, greetings, simple present tense",
  },
  {
    level: "A2",
    name: "Elementary",
    description: "Everyday expressions, simple past, basic questions",
  },
  {
    level: "B1",
    name: "Intermediate",
    description: "Connected text, express opinions, common idioms",
  },
  {
    level: "B2",
    name: "Upper Intermediate",
    description: "Complex topics, abstract ideas, nuanced expressions",
  },
  {
    level: "C1",
    name: "Advanced",
    description: "Sophisticated vocabulary, idiomatic expressions",
  },
  {
    level: "C2",
    name: "Mastery",
    description: "Near-native fluency, literary expressions",
  },
];

export const LanguageLevelSelector: React.FC<LanguageLevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          This helps us create appropriate content for you.
        </p>
      </div>

      <RadioGroup
        value={selectedLevel || ""}
        onValueChange={(value) => onSelectLevel(value as Difficulty)}
        className="grid gap-3"
      >
        {LEVELS.map(({ level, name, description }) => (
          <div key={level}>
            <RadioGroupItem value={level} id={level} className="peer sr-only" />
            <Label
              htmlFor={level}
              className={cn(
                "flex items-start gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                selectedLevel === level && "border-primary bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary",
                  selectedLevel === level
                    ? "bg-primary text-primary-foreground"
                    : "opacity-0"
                )}
              >
                <Check className="h-3 w-3" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {level}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal">
                  {description}
                </p>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
```

# src/features/auth/components/LanguageSelector.tsx

```typescript
import React from "react";
import { Language, LanguageId } from "@/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  selectedLanguages: Language[];
  onToggle: (lang: Language) => void;
  onContinue: () => void;
}

const LANGUAGES: { id: Language; name: string; flag: string }[] = [
  { id: LanguageId.Polish, name: "Polish", flag: "🇵🇱" },
  { id: LanguageId.Norwegian, name: "Norwegian", flag: "🇳🇴" },
  { id: LanguageId.Japanese, name: "Japanese", flag: "🇯🇵" },
  { id: LanguageId.Spanish, name: "Spanish", flag: "🇪🇸" },
  { id: LanguageId.German, name: "German", flag: "🇩🇪" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onToggle,
  onContinue,
}) => {
  const isSelected = (id: Language) => selectedLanguages.includes(id);
  const canContinue = selectedLanguages.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Select the languages you want to learn.
        </p>
      </div>

      <div className="grid gap-3">
        {LANGUAGES.map(({ id, name, flag }) => (
          <div key={id}>
            <Label
              htmlFor={id}
              className={cn(
                "flex items-center justify-between w-full p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                isSelected(id)
                  ? "border-primary bg-primary/10"
                  : "border-input bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{flag}</span>
                <span className="font-medium text-foreground">{name}</span>
              </div>

              <Checkbox
                id={id}
                checked={isSelected(id)}
                onCheckedChange={() => onToggle(id)}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
            </Label>
          </div>
        ))}
      </div>

      {canContinue && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button onClick={onContinue} className="w-full">
            Continue ({selectedLanguages.length} selected)
          </Button>
        </div>
      )}
    </div>
  );
};
```

# src/features/auth/components/index.ts

```typescript
export * from "./AuthLayout";
export * from "./DeckGenerationStep";
export * from "./LanguageLevelSelector";
```

# src/features/collection/components/AddCardModal.tsx

```typescript
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/lib/ai";
import { escapeRegExp, parseFurigana } from "@/lib/utils";
import { useSettingsStore, SettingsState } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

const formSchema = z
  .object({
    sentence: z.string().min(1, "Sentence is required"),
    targetWord: z.string().optional(),
    targetWordTranslation: z.string().optional(),
    targetWordPartOfSpeech: z.string().optional(),
    translation: z.string().min(1, "Translation is required"),
    notes: z.string().optional(),
    furigana: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetWord && data.sentence) {
      try {
        if (
          !data.sentence.toLowerCase().includes(data.targetWord.toLowerCase())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Target word provided but not found in sentence",
            path: ["targetWord"],
          });
        }
      } catch (e) {}
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialCard,
}) => {
  const { language, geminiApiKey } = useSettingsStore(
    useShallow((s: SettingsState) => ({
      language: s.language,
      geminiApiKey: s.geminiApiKey,
    }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const isMounted = React.useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sentence: "",
      targetWord: "",
      targetWordTranslation: "",
      targetWordPartOfSpeech: "",
      translation: "",
      notes: "",
      furigana: "",
    },
  });

  const watchedSentence = form.watch("sentence");
  const watchedTargetWord = form.watch("targetWord");

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      if (initialCard) {
        form.reset({
          sentence: initialCard.targetSentence,
          targetWord: initialCard.targetWord || "",
          targetWordTranslation: initialCard.targetWordTranslation || "",
          targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
          translation: initialCard.nativeTranslation,
          notes: initialCard.notes,
          furigana: initialCard.furigana || "",
        });
      } else {
        form.reset({
          sentence: "",
          targetWord: "",
          targetWordTranslation: "",
          targetWordPartOfSpeech: "",
          translation: "",
          notes: "",
          furigana: "",
        });
      }

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length
          );
        }
      }, 100);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialCard, language, form.reset]);

  const handleAutoFill = async () => {
    const currentSentence = form.watch("sentence");
    if (!currentSentence) return;
    if (!geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings > General");
      return;
    }
    setIsGenerating(true);
    try {
      const targetLanguage = initialCard?.language || language;
      const result = await aiService.generateCardContent(
        currentSentence,
        targetLanguage,
        geminiApiKey
      );

      if (isMounted.current) {
        if (targetLanguage === LanguageId.Japanese && result.furigana) {
          form.setValue("sentence", result.furigana);
        }

        form.setValue("translation", result.translation);
        if (result.targetWord) form.setValue("targetWord", result.targetWord);
        if (result.targetWordTranslation)
          form.setValue("targetWordTranslation", result.targetWordTranslation);
        if (result.targetWordPartOfSpeech)
          form.setValue(
            "targetWordPartOfSpeech",
            result.targetWordPartOfSpeech
          );
        form.setValue("notes", result.notes);
        if (result.furigana) form.setValue("furigana", result.furigana);

        toast.success("Content generated");
      }
    } catch (e: any) {
      console.error("Auto-fill error:", e);
      if (isMounted.current) toast.error(e.message || "Generation failed");
    } finally {
      if (isMounted.current) setIsGenerating(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    const cardBase =
      initialCard ||
      ({
        id: uuidv4(),
        status: "new",
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
      } as Card);

    const targetLanguage = initialCard?.language || language;
    let targetSentence = data.sentence;
    let furigana = data.furigana || undefined;

    if (targetLanguage === LanguageId.Japanese) {
      furigana = data.sentence;
      targetSentence = parseFurigana(data.sentence)
        .map((s) => s.text)
        .join("");
    }

    const newCard: Card = {
      ...cardBase,
      targetSentence: targetSentence,
      targetWord: data.targetWord || undefined,
      targetWordTranslation: data.targetWordTranslation || undefined,
      targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
      nativeTranslation: data.translation,
      notes: data.notes || "",
      furigana: furigana,
      language: targetLanguage,
    };
    onAdd(newCard);
    form.reset({
      sentence: "",
      targetWord: "",
      targetWordTranslation: "",
      targetWordPartOfSpeech: "",
      translation: "",
      notes: "",
      furigana: "",
    });
    onClose();
  };

  const HighlightedPreview = useMemo(() => {
    if (!watchedSentence) return null;

    const targetLanguage = initialCard?.language || language;

    if (targetLanguage === LanguageId.Japanese) {
      const segments = parseFurigana(watchedSentence);
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {segments.map((segment, i) => {
            const isTarget =
              watchedTargetWord && segment.text === watchedTargetWord;
            if (segment.furigana) {
              return (
                <ruby key={i} className="mr-1" style={{ rubyAlign: "center" }}>
                  <span
                    className={
                      isTarget
                        ? "text-primary border-b border-primary/50"
                        : "text-foreground"
                    }
                  >
                    {segment.text}
                  </span>
                  <rt
                    className="text-xs text-muted-foreground select-none text-center"
                    style={{ textAlign: "center" }}
                  >
                    {segment.furigana}
                  </rt>
                </ruby>
              );
            }
            return (
              <span
                key={i}
                className={
                  isTarget ? "text-primary border-b border-primary/50" : ""
                }
              >
                {segment.text}
              </span>
            );
          })}
        </div>
      );
    }

    if (!watchedTargetWord) return null;
    try {
      const parts = watchedSentence.split(
        new RegExp(`(${escapeRegExp(watchedTargetWord)})`, "gi")
      );
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {parts.map((part, i) =>
            part.toLowerCase() === watchedTargetWord.toLowerCase() ? (
              <span key={i} className="text-primary border-b border-primary/50">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {watchedSentence}
        </div>
      );
    }
  }, [watchedSentence, watchedTargetWord, language, initialCard]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialCard ? "Edit Card" : "Add New Card"}
          </DialogTitle>
          <DialogDescription>
            Create or modify your flashcard details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sentence Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-semibold">
                  Native Sentence
                </FormLabel>
                <Button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isGenerating || !watchedSentence}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span className="text-xs">Auto-Fill with AI</span>
                </Button>
              </div>

              <FormField
                control={form.control}
                name="sentence"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Type the sentence in target language..."
                        className="resize-none text-lg min-h-[100px]"
                        ref={(e) => {
                          field.ref(e);
                          textareaRef.current = e as HTMLTextAreaElement;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {HighlightedPreview}
            </div>

            <Separator />

            {/* Translation and Target Word */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="translation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Translation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sentence translation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Word</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Word to highlight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Word Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetWordTranslation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Word Definition</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Definition of target word"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWordPartOfSpeech"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part of Speech</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="noun">Noun</SelectItem>
                        <SelectItem value="verb">Verb</SelectItem>
                        <SelectItem value="adjective">Adjective</SelectItem>
                        <SelectItem value="adverb">Adverb</SelectItem>
                        <SelectItem value="pronoun">Pronoun</SelectItem>
                        <SelectItem value="expression">Expression</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Usage notes, context, or grammar rules"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Card</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

# src/features/collection/components/CardHistoryModal.tsx

```typescript
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/types";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { Activity, Clock, Target, Zap, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card as UiCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}) => (
  <UiCard>
    <CardContent className="flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      {subtext && (
        <span className="text-xs text-muted-foreground mt-1">{subtext}</span>
      )}
    </CardContent>
  </UiCard>
);

const TimelineEvent = ({
  label,
  dateStr,
}: {
  label: string;
  dateStr?: string;
}) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="text-right flex flex-col items-end">
        <span className="text-sm font-medium tabular-nums">
          {format(date, "PPP")}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  if (!card) return null;

  const difficultyPercent = Math.min(
    100,
    Math.round(((card.difficulty || 0) / 10) * 100)
  );
  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;

  const getFsrsLabel = (state?: number) => {
    if (state === 0) return "New";
    if (state === 1) return "Learning";
    if (state === 2) return "Review";
    if (state === 3) return "Relearning";
    return "Unknown";
  };

  const getStateVariant = (
    state?: number
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (state === 0) return "default";
    if (state === 1) return "secondary";
    if (state === 2) return "outline";
    if (state === 3) return "destructive";
    return "outline";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>Card History</DialogTitle>
            </div>
            <Badge variant={getStateVariant(card.state)}>
              {getFsrsLabel(card.state)}
            </Badge>
          </div>
          <DialogDescription>
            Detailed statistics and timeline for this card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold leading-tight text-balance">
              {card.targetSentence}
            </h2>
            <p className="text-muted-foreground text-balance">
              {card.nativeTranslation}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatBox
              label="Reviews"
              value={card.reps || 0}
              subtext="Total Repetitions"
              icon={<Activity size={16} />}
            />
            <StatBox
              label="Lapses"
              value={card.lapses || 0}
              subtext="Forgotten count"
              icon={<Zap size={16} />}
            />
            <StatBox
              label="Stability"
              value={`${stability}d`}
              subtext="Retention Interval"
              icon={<Target size={16} />}
            />
            <StatBox
              label="Difficulty"
              value={`${(card.difficulty || 0).toFixed(1)}`}
              subtext={
                difficultyPercent > 60 ? "High Difficulty" : "Normal Range"
              }
              icon={<Clock size={16} />}
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <History size={14} /> Timeline
            </h3>
            <div className="space-y-1">
              <TimelineEvent
                label="Created"
                dateStr={card.first_review || card.dueDate}
              />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

# src/features/collection/components/CardList.tsx

```typescript
import React, { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Card as CardModel } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { getCardColumns } from "./CardTableColumns";
import { Card } from "@/components/ui/card";
import { RowSelectionState } from "@tanstack/react-table";

interface CardListProps {
  cards: CardModel[];
  searchTerm: string;
  onEditCard: (card: CardModel) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: CardModel) => void;
  onPrioritizeCard: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, index: number, isShift: boolean) => void;
  onSelectAll: () => void;

  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  searchTerm,
  onEditCard,
  onDeleteCard,
  onViewHistory,
  onPrioritizeCard,
  selectedIds,
  onToggleSelect,
  onSelectAll,

  page = 0,
  totalPages = 1,
  totalCount = 0,
  onPageChange,
}) => {
  const rowSelection = useMemo(() => {
    const state: RowSelectionState = {};
    selectedIds.forEach((id) => {
      state[id] = true;
    });
    return state;
  }, [selectedIds]);

  const handleRowSelectionChange = (newSelection: RowSelectionState) => {
    const newSelectedIds = new Set(
      Object.keys(newSelection).filter((id) => newSelection[id])
    );
    const currentSelectedIds = selectedIds;

    newSelectedIds.forEach((id) => {
      if (!currentSelectedIds.has(id)) {
        const index = cards.findIndex((c) => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });

    currentSelectedIds.forEach((id) => {
      if (!newSelectedIds.has(id)) {
        const index = cards.findIndex((c) => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });
  };

  const columns = useMemo(
    () =>
      getCardColumns({
        onEditCard,
        onDeleteCard,
        onViewHistory,
        onPrioritizeCard,
        onToggleSelect,
      }),
    [onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, onToggleSelect]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Card className="p-6 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md">
          {/* Decorative container with diamond shape */}
          <div className="relative mb-8">
            <div className="w-16 h-16 border rounded-full flex items-center justify-center bg-muted/20">
              <BookOpen
                className="w-8 h-8 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">
            No cards found
          </h3>
          <p className="text-sm text-muted-foreground/60 font-light ">
            Your collection appears to be empty
          </p>
          {/* Decorative line */}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full px-4 md:px-6 lg:px-8 py-4">
      <DataTable
        columns={columns}
        data={cards}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        enableRowSelection
        getRowId={(row) => row.id}
        searchValue={searchTerm}
        searchColumn="targetSentence"
        pageSize={50}
        onRowClick={onViewHistory}
        manualPagination={true}
        pageCount={totalPages}
        pageIndex={page}
        onPageChange={onPageChange}
        totalItems={totalCount}
      />
    </div>
  );
};
```

# src/features/collection/components/CardTableColumns.tsx

```typescript
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardStatus } from "@/types";
import {
  MoreHorizontal,
  Zap,
  History,
  Pencil,
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bookmark,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO, isValid, format } from "date-fns";
import { formatInterval } from "@/utils/formatInterval";
import { Button } from "@/components/ui/button";

const StatusBadge = ({ status }: { status: CardStatus }) => {
  const statusConfig = {
    [CardStatus.NEW]: {
      label: "New",
      icon: <Star className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />,
      className: "text-primary bg-primary/10 border-primary/30",
    },
    [CardStatus.LEARNING]: {
      label: "Learning",
      icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />,
      className: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    [CardStatus.REVIEW]: {
      label: "Review",
      icon: <Clock className="w-3 h-3" strokeWidth={1.5} />,
      className: "text-emerald-600 bg-emerald-600/10 border-emerald-600/30",
    },
    [CardStatus.KNOWN]: {
      label: "Mastered",
      icon: <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />,
      className: "text-primary bg-primary/10 border-primary/30",
    },
  };

  const config = statusConfig[status] || statusConfig[CardStatus.NEW];

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all border rounded-sm",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

const ScheduleCell = ({
  dateStr,
  status,
  interval,
}: {
  dateStr: string;
  status: CardStatus;
  interval: number;
}) => {
  if (status === CardStatus.NEW) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="w-3 h-3" strokeWidth={1.5} />
        <span className="text-xs font-medium">Awaiting</span>
      </div>
    );
  }

  const date = parseISO(dateStr);
  if (!isValid(date))
    return <span className="text-muted-foreground/40 text-xs">—</span>;

  if (date.getFullYear() === 1970) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/50 text-primary rounded-sm">
        <Zap className="w-3 h-3" strokeWidth={2} fill="currentColor" />
        <span className="text-xs font-bold">Priority</span>
      </div>
    );
  }

  const isPast = date < new Date();

  return (
    <div className="space-y-0.5">
      <p
        className={cn(
          "text-sm font-medium tabular-nums ",
          isPast ? "text-destructive" : "text-foreground"
        )}
      >
        {format(date, "MMM d")}
      </p>
      <p className="text-xs text-muted-foreground">
        {interval > 0 && `${formatInterval(interval * 24 * 60 * 60 * 1000)} • `}
        {formatDistanceToNow(date, { addSuffix: true })}
      </p>
    </div>
  );
};

const SortableHeader = ({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) => {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center gap-2 hover:text-primary transition-colors group h-8 px-2 font-bold"
    >
      {children}
      {isSorted === "asc" ? (
        <ArrowUp className="w-3 h-3 text-primary" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="w-3 h-3 text-primary" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
      )}
    </Button>
  );
};

interface ColumnActions {
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: Card) => void;
  onPrioritizeCard: (id: string) => void;
  onToggleSelect?: (id: string, index: number, isShift: boolean) => void;
}

export function getCardColumns(actions: ColumnActions): ColumnDef<Card>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground"
          />
        </div>
      ),
      cell: ({ row, table }) => {
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (actions.onToggleSelect) {
            const rowIndex = table
              .getRowModel()
              .rows.findIndex((r) => r.id === row.id);
            actions.onToggleSelect(row.id, rowIndex, e.shiftKey);
          } else {
            row.toggleSelected();
          }
        };
        return (
          <div
            className="flex items-center justify-center"
            onClick={handleClick}
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={() => {}}
              aria-label="Select row"
              className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground pointer-events-none"
            />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    {
      accessorKey: "isBookmarked",
      header: ({ column }) => (
        <div className="flex justify-center">
          <SortableHeader column={column}>
            <Bookmark size={14} strokeWidth={1.5} />
          </SortableHeader>
        </div>
      ),
      cell: ({ row }) => {
        const isBookmarked = row.original.isBookmarked;
        if (!isBookmarked) return null;
        return (
          <div className="flex items-center justify-center">
            <Bookmark size={14} className="text-primary fill-primary" />
          </div>
        );
      },
      size: 50,
    },

    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      size: 120,
    },

    {
      accessorKey: "targetWord",
      header: ({ column }) => (
        <SortableHeader column={column}>Word</SortableHeader>
      ),
      cell: ({ row }) => {
        const word = row.original.targetWord;
        const pos = row.original.targetWordPartOfSpeech;

        if (!word) return <span className="text-muted-foreground/40">—</span>;

        return (
          <div className="space-y-0.5">
            <p className="font-medium text-foreground text-base">{word}</p>
            {pos && (
              <p className="text-xs text-muted-foreground font-medium">{pos}</p>
            )}
          </div>
        );
      },
      size: 140,
    },

    {
      accessorKey: "targetSentence",
      header: ({ column }) => (
        <SortableHeader column={column}>Sentence</SortableHeader>
      ),
      cell: ({ row }) => (
        <p className="text-sm font-light text-foreground/90 truncate max-w-[150px]">
          {row.getValue("targetSentence")}
        </p>
      ),
      filterFn: "includesString",
    },

    {
      accessorKey: "nativeTranslation",
      header: "Translation",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground font-light line-clamp-2 max-w-[150px]">
          {row.getValue("nativeTranslation")}
        </p>
      ),
    },

    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <SortableHeader column={column}>Due</SortableHeader>
      ),
      cell: ({ row }) => (
        <ScheduleCell
          dateStr={row.getValue("dueDate")}
          status={row.original.status}
          interval={row.original.interval}
        />
      ),
      size: 120,
    },

    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const card = row.original;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "relative w-8 h-8 flex items-center justify-center transition-all duration-200 outline-none border border-transparent rounded-full",
                  "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/30",
                  "opacity-0 group-hover:opacity-100 focus:opacity-100"
                )}
              >
                <MoreHorizontal size={16} strokeWidth={1.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-border bg-card p-1.5 text-foreground"
              >
                <DropdownMenuItem
                  onClick={() => actions.onPrioritizeCard(card.id)}
                  className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                >
                  <Zap
                    size={14}
                    className="mr-2.5 opacity-60"
                    strokeWidth={1.5}
                  />
                  Priority
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onViewHistory(card)}
                  className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                >
                  <History
                    size={14}
                    className="mr-2.5 opacity-60"
                    strokeWidth={1.5}
                  />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onEditCard(card)}
                  className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                >
                  <Pencil
                    size={14}
                    className="mr-2.5 opacity-60"
                    strokeWidth={1.5}
                  />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border" />
                <DropdownMenuItem
                  onClick={() => actions.onDeleteCard(card.id)}
                  className="text-sm cursor-pointer py-2 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2
                    size={14}
                    className="mr-2.5 opacity-60"
                    strokeWidth={1.5}
                  />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 50,
    },
  ];
}
```

# src/features/collection/hooks/useCardOperations.ts

```typescript
import { useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/types";
import {
  deleteCard as deleteCardFromRepo,
  deleteCardsBatch as deleteCardsBatchFromRepo,
  saveCard,
  saveAllCards,
} from "@/db/repositories/cardRepository";
import { useDeckActions } from "@/hooks/useDeckActions";
import { db } from "@/db/dexie";

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card, options?: { silent?: boolean }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCardsBatch: (ids: string[]) => Promise<void>;
  prioritizeCards: (ids: string[]) => Promise<void>;
}

export const useCardOperations = (): CardOperations => {
  const { refreshDeckData } = useDeckActions();
  const queryClient = useQueryClient();

  const addCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        refreshDeckData();
        toast.success("Card added successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add card");
      }
    },
    [queryClient, refreshDeckData]
  );

  const addCardsBatch = useCallback(
    async (cards: Card[]) => {
      try {
        await saveAllCards(cards);
        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        refreshDeckData();
        toast.success(`${cards.length} cards added successfully`);
      } catch (error) {
        console.error(error);
        toast.error("Failed to add cards");
      }
    },
    [queryClient, refreshDeckData]
  );

  const updateCard = useCallback(
    async (card: Card, options?: { silent?: boolean }) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        refreshDeckData();
        if (!options?.silent) {
          toast.success("Card updated successfully");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update card");
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      try {
        await deleteCardFromRepo(id);
        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        refreshDeckData();
        toast.success("Card deleted");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete card");
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCardsBatch = useCallback(
    async (ids: string[]) => {
      try {
        await deleteCardsBatchFromRepo(ids);
        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        refreshDeckData();
        toast.success(`${ids.length} cards deleted`);
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete cards");
      }
    },
    [queryClient, refreshDeckData]
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {
        await db.cards
          .where("id")
          .anyOf(ids)
          .modify({ dueDate: new Date(0).toISOString() });

        await queryClient.invalidateQueries({ queryKey: ["cards"] });
        await queryClient.invalidateQueries({ queryKey: ["dueCards"] });
        refreshDeckData();
        toast.success(
          `${ids.length} card${
            ids.length === 1 ? "" : "s"
          } moved to top of queue`
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to prioritize cards");
      }
    },
    [queryClient, refreshDeckData]
  );

  return {
    addCard,
    addCardsBatch,
    updateCard,
    deleteCard,
    deleteCardsBatch,
    prioritizeCards,
  };
};
```

# src/features/collection/hooks/useCardText.ts

```typescript
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/types";

export const useCardText = (card: Card) => {
  const [displayedTranslation, setDisplayedTranslation] = useState(
    card.nativeTranslation
  );
  const [isGaslit, setIsGaslit] = useState(false);

  useEffect(() => {
    setDisplayedTranslation(card.nativeTranslation);
    setIsGaslit(false);
  }, [card.id, card.nativeTranslation]);

  const processText = useCallback((text: string) => {
    return text;
  }, []);

  return {
    displayedTranslation,
    isGaslit,
    processText,
  };
};
```

# src/features/collection/hooks/useCardsQuery.ts

```typescript
import Dexie from "dexie";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { db } from "@/db/dexie";
import { getCurrentUserId } from "@/db/repositories/cardRepository";
import { CardStatus, Card } from "@/types";

export interface CardFilters {
  status?: CardStatus | "all";
  bookmarked?: boolean;
  leech?: boolean;
}

export const useCardsQuery = (
  page = 0,
  pageSize = 50,
  searchTerm = "",
  filters: CardFilters = {}
) => {
  const language = useSettingsStore((s) => s.language);

  return useQuery({
    queryKey: ["cards", language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      const userId = getCurrentUserId();
      if (!userId) return { data: [], count: 0 };

      let collection: Dexie.Collection<Card, string>;

      if (filters.leech) {
        collection = db.cards
          .where("[user_id+language+isLeech+dueDate]")
          .between(
            [userId, language, 1, Dexie.minKey],
            [userId, language, 1, Dexie.maxKey],
            true,
            true
          )
          .reverse();
      } else if (filters.bookmarked) {
        collection = db.cards
          .where("[user_id+language+isBookmarked+dueDate]")
          .between(
            [userId, language, 1, Dexie.minKey],
            [userId, language, 1, Dexie.maxKey],
            true,
            true
          )
          .reverse();
      } else if (filters.status && filters.status !== "all") {
        collection = db.cards
          .where("[user_id+language+status+dueDate]")
          .between(
            [userId, language, filters.status, Dexie.minKey],
            [userId, language, filters.status, Dexie.maxKey],
            true,
            true
          )
          .reverse();
      } else {
        collection = db.cards
          .where("[user_id+language+dueDate]")
          .between(
            [userId, language, Dexie.minKey],
            [userId, language, Dexie.maxKey],
            true,
            true
          )
          .reverse();
      }

      const requiresRefine =
        (filters.leech &&
          (filters.bookmarked ||
            (filters.status && filters.status !== "all"))) ||
        (filters.bookmarked && filters.status && filters.status !== "all");

      if (requiresRefine || searchTerm) {
        collection = collection.filter((c) => {
          if (
            filters.status &&
            filters.status !== "all" &&
            c.status !== filters.status
          )
            return false;
          if (filters.bookmarked && !c.isBookmarked) return false;
          if (filters.leech && !c.isLeech) return false;

          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              c.targetSentence?.toLowerCase().includes(term) ||
              c.nativeTranslation?.toLowerCase().includes(term) ||
              c.targetWord?.toLowerCase().includes(term) ||
              c.notes?.toLowerCase().includes(term)
            );
          }
          return true;
        });
      }

      const totalCount = await collection.count();

      const start = page * pageSize;
      const paginatedCards = await collection
        .offset(start)
        .limit(pageSize)
        .toArray();

      return {
        data: paginatedCards,
        count: totalCount,
      };
    },
    placeholderData: keepPreviousData,
  });
};
```

# src/features/collection/hooks/useDeckQueries.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { db } from "@/db/dexie";
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from "@/db/repositories/statsRepository";
import {
  getHistory as fetchHistory,
  incrementHistory,
} from "@/db/repositories/historyRepository";
import { getDueCards, saveCard } from "@/db/repositories/cardRepository";
import { addReviewLog } from "@/db/repositories/revlogRepository";
import { Card, Grade } from "@/types";
import { getSRSDate } from "@/core/srs/scheduler";
import { format, differenceInMinutes } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { toast } from "sonner";
import { CardXpPayload } from "@/core/gamification/xp";

export const useDeckStatsQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["deckStats", language],
    queryFn: () => fetchStats(language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["dueCards", language],
    queryFn: () => getDueCards(new Date(), language),
    staleTime: 60 * 1000,
  });
};

export const useReviewsTodayQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["reviewsToday", language],
    queryFn: () => getTodayReviewStats(language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const language = useSettingsStore((s) => s.language);
  return useQuery({
    queryKey: ["history", language],
    queryFn: () => fetchHistory(language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({
      card,
      newCard,
      grade,
      xpPayload,
    }: {
      card: Card;
      newCard: Card;
      grade: Grade;
      xpPayload?: CardXpPayload;
    }) => {
      const today = format(getSRSDate(new Date()), "yyyy-MM-dd");

      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;

      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440;

      const scheduledDays = card.scheduled_days ?? card.interval ?? 0;

      await db.transaction(
        "rw",
        [db.cards, db.revlog, db.aggregated_stats, db.history],
        async () => {
          await saveCard(newCard);
          await addReviewLog(card, grade, elapsedDays, scheduledDays);
          await incrementHistory(today, 1, card.language || language);
        }
      );

      const xpAmount = xpPayload?.totalXp ?? 0;

      return { card: newCard, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), "yyyy-MM-dd");

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["history", language] }),
        queryClient.cancelQueries({ queryKey: ["reviewsToday", language] }),
        queryClient.cancelQueries({ queryKey: ["dueCards", language] }),
        queryClient.cancelQueries({ queryKey: ["deckStats", language] }),
        queryClient.cancelQueries({ queryKey: ["dashboardStats", language] }),
      ]);

      const previousHistory = queryClient.getQueryData(["history", language]);
      const previousReviewsToday = queryClient.getQueryData([
        "reviewsToday",
        language,
      ]);
      const previousDueCards = queryClient.getQueryData(["dueCards", language]);
      const previousDashboardStats = queryClient.getQueryData([
        "dashboardStats",
        language,
      ]);

      queryClient.setQueryData(["history", language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });

      queryClient.setQueryData(["reviewsToday", language], (old: any) => {
        if (!old) return { newCards: 0, reviewCards: 0 };
        return {
          newCards: card.status === "new" ? old.newCards + 1 : old.newCards,
          reviewCards:
            card.status !== "new" ? old.reviewCards + 1 : old.reviewCards,
        };
      });

      queryClient.setQueryData(
        ["dueCards", language],
        (old: Card[] | undefined) => {
          if (!old) return [];
          if (grade === "Again") return old;
          return old.filter((c) => c.id !== card.id);
        }
      );

      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXP(xpAmount);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + xpAmount,
          };
        });
      }

      return {
        previousHistory,
        previousReviewsToday,
        previousDueCards,
        previousDashboardStats,
      };
    },
    onError: (_err, _newTodo, context) => {
      if (context) {
        queryClient.setQueryData(
          ["history", language],
          context.previousHistory
        );
        queryClient.setQueryData(
          ["reviewsToday", language],
          context.previousReviewsToday
        );
        queryClient.setQueryData(
          ["dueCards", language],
          context.previousDueCards
        );
        queryClient.setQueryData(
          ["dashboardStats", language],
          context.previousDashboardStats
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["history", language] });
      queryClient.invalidateQueries({ queryKey: ["reviewsToday", language] });
      queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", language] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats", language] });
    },
  });
};

export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { incrementXP } = useGamification();
  const BONUS_AMOUNT = 20;

  return useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: (data) => {
      if (data && data.success) {
        toast.success(`Daily Goal Complete! +${BONUS_AMOUNT} XP`);
        incrementXP(BONUS_AMOUNT);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: (old.languageXp || 0) + BONUS_AMOUNT,
          };
        });
      }
    },
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({
      card,
      date,
      xpEarned,
    }: {
      card: Card;
      date: string;
      xpEarned: number;
    }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || language);
      return { card, date, xpEarned };
    },
    onSuccess: ({ xpEarned }) => {
      if (user && xpEarned > 0) {
        incrementXP(-xpEarned);

        queryClient.setQueryData(["dashboardStats", language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: Math.max(0, (old.languageXp || 0) - xpEarned),
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["history", language] });
      queryClient.invalidateQueries({ queryKey: ["reviewsToday", language] });
      queryClient.invalidateQueries({ queryKey: ["deckStats", language] });
      queryClient.invalidateQueries({ queryKey: ["dueCards", language] });
    },
  });
};
```

# src/features/collection/hooks/useDeckStats.ts

```typescript
import { useMemo } from "react";
import {
  useDeckStatsQuery,
  useDueCardsQuery,
  useHistoryQuery,
  useReviewsTodayQuery,
} from "@/features/collection/hooks/useDeckQueries";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useStreakStats } from "./useStreakStats";
import { applyStudyLimits, isNewCard } from "@/services/studyLimits";
import { DeckStats } from "@/types";

export const useDeckStats = () => {
  const { language, dailyNewLimits, dailyReviewLimits } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      dailyNewLimits: s.dailyNewLimits,
      dailyReviewLimits: s.dailyReviewLimits,
    }))
  );
  const streakStats = useStreakStats();

  const { data: reviewsTodayData, isLoading: reviewsTodayLoading } =
    useReviewsTodayQuery();
  const reviewsToday = reviewsTodayData || { newCards: 0, reviewCards: 0 };

  const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
  const { data: history, isLoading: historyLoading } = useHistoryQuery();

  const isLoading =
    statsLoading || dueCardsLoading || historyLoading || reviewsTodayLoading;

  const currentNewLimit = dailyNewLimits?.[language] ?? 20;
  const currentReviewLimit = dailyReviewLimits?.[language] ?? 100;

  const stats = useMemo<DeckStats>(() => {
    if (!dbStats || !dueCards) {
      return {
        total: 0,
        due: 0,
        newDue: 0,
        reviewDue: 0,
        learned: 0,
        streak: 0,
        totalReviews: 0,
        longestStreak: 0,
      };
    }

    const limitedCards = applyStudyLimits(dueCards, {
      dailyNewLimit: currentNewLimit,
      dailyReviewLimit: currentReviewLimit,
      reviewsToday: reviewsToday,
    });

    const newDue = limitedCards.filter(isNewCard).length;
    const reviewDue = limitedCards.length - newDue;

    return {
      total: dbStats.total,
      learned: dbStats.learned,
      due: limitedCards.length,
      newDue,
      reviewDue,
      streak: streakStats.currentStreak,
      totalReviews: streakStats.totalReviews,
      longestStreak: streakStats.longestStreak,
    };
  }, [
    dbStats,
    dueCards,
    reviewsToday,
    currentNewLimit,
    currentReviewLimit,
    streakStats,
  ]);

  return {
    stats,
    history: history || {},
    isLoading,
  };
};
```

# src/features/collection/hooks/useStreakStats.ts

```typescript
import { useState, useEffect, useRef } from "react";
import { useHistoryQuery } from "@/features/collection/hooks/useDeckQueries";
import { getUTCDateString } from "@/constants";
import { getSRSDate } from "@/core/srs/scheduler";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
}

export const useStreakStats = () => {
  const { data: history } = useHistoryQuery();
  const [stats, setStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
  });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/db/workers/stats.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { currentStreak, longestStreak, totalReviews } = e.data;
      setStats({ currentStreak, longestStreak, totalReviews });
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!history || Object.keys(history).length === 0) {
      setStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
      return;
    }

    if (!workerRef.current) return;

    const srsToday = getSRSDate(new Date());
    const todayStr = getUTCDateString(srsToday);
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = getUTCDateString(srsYesterday);

    workerRef.current.postMessage({
      action: "calculate_streaks",
      history,
      todayStr,
      yesterdayStr,
    });
  }, [history]);

  return stats;
};
```

# src/features/collection/utils/createCard.ts

```typescript
import { Card, Language, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const createCard = (
  language: Language,
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string,
  furigana?: string
): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  targetWordTranslation,
  targetWordPartOfSpeech,
  furigana,
  status: "new",
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language,
});

export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card =>
  createCard(
    LanguageId.Polish,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech
  );

export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card =>
  createCard(
    LanguageId.Norwegian,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech
  );

export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  furigana?: string
): Card =>
  createCard(
    LanguageId.Japanese,
    sentence,
    translation,
    targetWord,
    notes,
    undefined,
    undefined,
    furigana
  );

export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = ""
): Card =>
  createCard(LanguageId.Spanish, sentence, translation, targetWord, notes);

export const createGermanCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = "",
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card =>
  createCard(
    LanguageId.German,
    sentence,
    translation,
    targetWord,
    notes,
    targetWordTranslation,
    targetWordPartOfSpeech
  );
```

# src/features/dashboard/components/Dashboard.tsx

```typescript
import React, { useMemo } from "react";
import {
  Activity,
  BookOpen,
  Sparkles,
  Target,
  Circle,
  Clock,
  CheckCircle2,
  Flame,
  History,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { subDays, startOfDay, format } from "date-fns";

import { DeckStats, ReviewHistory, Card as CardType } from "@/types";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { getRevlogStats } from "@/db/repositories/statsRepository";
import { getLevelProgress } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getRankForLevel } from "@/components/ui/level-badge";
import { Heatmap } from "./Heatmap";
import { RetentionStats } from "./RetentionStats";
import { ReviewVolumeChart } from "./ReviewVolumeChart";
import { TrueRetentionChart } from "./TrueRetentionChart";

interface DashboardProps {
  metrics: {
    total: number;
    new: number;
    learning: number;
    reviewing: number;
    known: number;
  };
  languageXp: { xp: number; level: number };
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: CardType[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  stats,
  history,
  onStartSession,
  cards,
  languageXp,
}) => {
  const { language, fsrs } = useSettingsStore(
    useShallow((s) => ({
      language: s.language,
      fsrs: s.fsrs,
    }))
  );
  const { profile } = useProfile();

  const levelData = getLevelProgress(languageXp.xp);
  const rank = getRankForLevel(levelData.level);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ["revlogStats", language],
    queryFn: () => getRevlogStats(language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, "yyyy-MM-dd");
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>{profile?.username || "User"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {levelData.level}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{rank.title}</p>
                <Progress
                  value={levelData.progressPercent}
                  className="h-2 mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {languageXp.xp.toLocaleString()} XP ·{" "}
                  {levelData.xpToNextLevel.toLocaleString()} to next
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Total XP</p>
                <p className="font-medium">{languageXp.xp.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="font-medium">
                  {profile?.points?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  stats.streak > 0 ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <Flame
                  className={`h-6 w-6 ${
                    stats.streak > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{stats.streak}</span>
                  <span className="text-sm text-muted-foreground">
                    day{stats.streak === 1 ? "" : "s"}
                  </span>
                  {isStreakAtRisk && stats.streak > 0 && (
                    <span className="text-xs text-destructive font-medium">
                      At Risk
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {lastSevenDays.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {day.date.toLocaleDateString("en", {
                          weekday: "narrow",
                        })}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-sm flex items-center justify-center ${
                          day.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {day.active && <span className="text-xs">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Session Card */}
        <Card>
          <CardContent className="flex flex-col h-full">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Due for Review
            </p>
            <p className="text-5xl font-bold text-primary mb-2">{stats.due}</p>
            <div className="flex items-center gap-3 text-xs  text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-blue-500 text-blue-500" />{" "}
                {stats.newDue} New
              </span>
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-green-500 text-green-500" />{" "}
                {stats.reviewDue} Reviews
              </span>
            </div>
            <Button
              size="lg"
              onClick={onStartSession}
              disabled={stats.due === 0}
              className="w-full max-w-xs md:mt-auto"
            >
              {stats.due > 0 ? "Start Session" : "All Caught Up"}
            </Button>
            {stats.due === 0 && (
              <p className="mt-4 text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> You're all done for now!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collection Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Collection Stats</h2>
        {hasNoCards ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Empty Inventory</p>
              <p className="text-xs text-muted-foreground">
                Add cards to start building your vocabulary.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">New</span>
                  <Circle size={14} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {metrics.new.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Learning
                  </span>
                  <Clock size={14} className="text-orange-500" />
                </div>
                <p className="text-2xl font-bold">
                  {metrics.learning.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Reviewing
                  </span>
                  <Activity size={14} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold">
                  {metrics.reviewing.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Mastered
                  </span>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">
                  {metrics.known.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Tabs for Detailed Stats */}
      <section>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="activity">
              <CalendarDays size={14} className="mr-1.5" /> Activity
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 size={14} className="mr-1.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="health">
              <Sparkles size={14} className="mr-1.5" /> Deck Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Review Heatmap
                </CardTitle>
                <CardDescription>
                  Visual history of your study habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasNoActivity ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Activity size={32} className="opacity-20" />
                    <p className="text-sm">
                      Start reviewing to generate activity data
                    </p>
                  </div>
                ) : (
                  <Heatmap history={history} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {hasNoActivity ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Complete reviews to unlock analytics.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Review Volume</CardTitle>
                    <CardDescription>
                      Daily card reviews over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && (
                          <ReviewVolumeChart data={revlogStats.activity} />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Retention Rate</CardTitle>
                    <CardDescription>Pass rate vs interval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && (
                          <TrueRetentionChart
                            data={revlogStats.retention}
                            targetRetention={fsrs.request_retention}
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Retention Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RetentionStats cards={cards} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};
```

# src/features/dashboard/components/GradeDistributionChart.tsx

```typescript
import React from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GradeDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  data,
}) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      };
    });
    return config;
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono uppercase text-muted-foreground/40">
        No Data
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Answer Distribution
        </h3>
      </div>

      <div className="flex-1 flex items-center gap-8">
        <div className="h-[160px] w-[160px] shrink-0 relative">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-light tracking-tighter"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 16}
                            className="fill-muted-foreground text-[9px] font-mono uppercase"
                          >
                            Reviews
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex flex-col gap-2 flex-1">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-mono">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

# src/features/dashboard/components/Heatmap.tsx

```typescript
import React, { useMemo } from "react";
import { ReviewHistory } from "@/types";
import { addDays, subDays, startOfDay, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { clsx } from "clsx";

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = React.memo(({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    let startDate = subDays(today, 364);
    const dayOfWeek = startDate.getDay();
    startDate = subDays(startDate, dayOfWeek);

    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const dateKey = format(d, "yyyy-MM-dd");
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today,
      });
    }
    return days;
  }, [history]);

  const getColorStyle = (count: number): string => {
    if (count === 0) return "bg-muted/30";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
    if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700";
    if (count <= 9) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      return history[dateKey] || 0;
    });

    const weekTotal = last7Days.reduce((sum, count) => sum + count, 0);
    const activeDays = last7Days.filter((count) => count > 0).length;

    return { weekTotal, activeDays, last7Days: last7Days.reverse() };
  }, [history]);

  return (
    <TooltipProvider>
      {/* Mobile Summary View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              This Week
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.weekTotal}{" "}
              <span className="text-sm text-muted-foreground">reviews</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              Active Days
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.activeDays}
              <span className="text-sm text-muted-foreground">/7</span>
            </p>
          </div>
        </div>

        {/* Mini week view for mobile */}
        <div className="flex gap-1.5 justify-between">
          {stats.last7Days.map((count, i) => {
            const date = subDays(new Date(), 6 - i);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground ">
                  {format(date, "EEE").charAt(0)}
                </span>
                <div
                  className={clsx(
                    "w-full aspect-square rounded-sm transition-colors",
                    getColorStyle(count)
                  )}
                />
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Full Heatmap */}
      <div
        className="hidden md:block w-full overflow-x-auto overflow-y-hidden lg:overflow-x-visible"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-block min-w-max py-2 lg:w-full">
          <div className="grid grid-rows-7 grid-flow-col gap-1 lg:gap-1">
            {calendarData.map((day) => (
              <Tooltip key={day.dateKey} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={clsx(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-3 lg:h-3 rounded-sm transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-pine-500/50",
                      day.inFuture
                        ? "opacity-0 pointer-events-none"
                        : getColorStyle(day.count)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-card text-foreground px-4 py-2.5 rounded-xl border border-border">
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 ">
                    {format(day.date, "MMM d, yyyy")}
                  </div>
                  <div className="text-sm font-light tabular-nums">
                    {day.count} review{day.count === 1 ? "" : "s"}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground ">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-200 dark:bg-pine-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-400 dark:bg-pine-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-500 dark:bg-pine-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-600 dark:bg-pine-400" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
});
```

# src/features/dashboard/components/LevelProgressBar.tsx

```typescript
import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LevelProgressBarProps {
  xp: number;
  level: number;
  className?: string;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  xp,
  level,
  className,
}) => {
  const progressData = useMemo(() => {
    const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
    const nextLevelStartXP = 100 * Math.pow(level, 2);

    const xpGainedInLevel = xp - currentLevelStartXP;
    const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;

    const percentage = Math.min(
      100,
      Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100)
    );
    const xpRemaining = nextLevelStartXP - xp;

    return { percentage, xpRemaining, nextLevelStartXP };
  }, [xp, level]);

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {/* Labels */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
            Current Level
          </span>
          <span className="text-sm font-medium font-sans">{level}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
            Next Level
          </span>
          <span className="text-xs font-sans text-muted-foreground">
            -{progressData.xpRemaining.toLocaleString()} XP
          </span>
        </div>
      </div>
      {/* Bar */}
      <Progress value={progressData.percentage} className="h-1 bg-muted" />
    </div>
  );
};
```

# src/features/dashboard/components/RetentionStats.tsx

```typescript
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Card as CardType } from "@/types";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import {
  differenceInCalendarDays,
  parseISO,
  format,
  addDays,
  addMonths,
  eachMonthOfInterval,
} from "date-fns";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RetentionStatsProps {
  cards: CardType[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = React.memo(
  ({ cards }) => {
    const [forecastRange, setForecastRange] = useState<"7d" | "1m" | "1y">(
      "7d"
    );

    const forecastData = useMemo(() => {
      const today = new Date();
      let data: { label: string; count: number; fullDate?: Date }[] = [];

      if (forecastRange === "7d") {
        data = Array.from({ length: 7 }).map((_, i) => {
          const date = addDays(today, i);
          return { label: format(date, "EEE"), count: 0, fullDate: date };
        });
      } else if (forecastRange === "1m") {
        data = Array.from({ length: 30 }).map((_, i) => {
          const date = addDays(today, i);
          return { label: format(date, "d"), count: 0, fullDate: date };
        });
      } else if (forecastRange === "1y") {
        const months = eachMonthOfInterval({
          start: today,
          end: addMonths(today, 11),
        });
        data = months.map((date) => ({
          label: format(date, "MMM"),
          count: 0,
          fullDate: date,
        }));
      }

      cards.forEach((card) => {
        if (card.status === "known" || !card.dueDate) return;
        const dueDate = parseISO(card.dueDate);
        const diffDays = differenceInCalendarDays(dueDate, today);

        if (diffDays < 0) return;

        if (forecastRange === "7d" && diffDays < 7) data[diffDays].count++;
        else if (forecastRange === "1m" && diffDays < 30)
          data[diffDays].count++;
        else if (forecastRange === "1y") {
          const monthIndex = data.findIndex(
            (d) =>
              d.fullDate &&
              d.fullDate.getMonth() === dueDate.getMonth() &&
              d.fullDate.getFullYear() === dueDate.getFullYear()
          );
          if (monthIndex !== -1) data[monthIndex].count++;
        }
      });
      return data;
    }, [cards, forecastRange]);

    const stabilityData = useMemo(() => {
      const buckets = [
        { label: "0-1d", min: 0, max: 1, count: 0 },
        { label: "3d", min: 1, max: 3, count: 0 },
        { label: "1w", min: 3, max: 7, count: 0 },
        { label: "2w", min: 7, max: 14, count: 0 },
        { label: "1m", min: 14, max: 30, count: 0 },
        { label: "3m", min: 30, max: 90, count: 0 },
        { label: "3m+", min: 90, max: Infinity, count: 0 },
      ];

      cards.forEach((card) => {
        if (!card.stability) return;
        const s = card.stability;
        const bucket = buckets.find((b) => s >= b.min && s < b.max);
        if (bucket) bucket.count++;
      });
      return buckets;
    }, [cards]);

    const forecastConfig = {
      count: {
        label: "Cards",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;

    const stabilityConfig = {
      count: {
        label: "Cards",
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;

    if (!cards || cards.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-light ">
          No data available
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">
              Workload Forecast
            </CardTitle>
            <div className="flex gap-1">
              {(["7d", "1m", "1y"] as const).map((range) => (
                <Button
                  key={range}
                  variant={forecastRange === range ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setForecastRange(range)}
                  className="h-7 px-2 text-xs"
                >
                  {range}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ChartContainer config={forecastConfig} className="h-full w-full">
                <BarChart
                  data={forecastData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => value}
                    className="text-xs text-muted-foreground"
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stability Chart */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-medium">
              Memory Stability
            </CardTitle>
            <CardDescription className="text-xs">
              Retention Interval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ChartContainer
                config={stabilityConfig}
                className="h-full w-full"
              >
                <BarChart
                  data={stabilityData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs text-muted-foreground"
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
```

# src/features/dashboard/components/ReviewVolumeChart.tsx

```typescript
import React from "react";
import { BarChart, Bar, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({
  data,
}) => {
  const chartConfig = {
    count: {
      label: "Reviews",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground/50">
          30 Day Volume
        </h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={2}
              className="text-[10px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index, payload) => (
                    <>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="text-sm font-normal tabular-nums text-foreground">
                        {value} reviews
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};
```

# src/features/dashboard/components/TrueRetentionChart.tsx

```typescript
import React from "react";
import { LineChart, Line, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({
  data,
  targetRetention,
}) => {
  const targetPercent = targetRetention * 100;

  const chartConfig = {
    rate: {
      label: "Pass Rate",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const hasData = data.some((d) => d.rate !== null);

  if (!hasData) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">
            True Retention (30d)
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-px bg-muted-foreground/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">
              Target: {targetPercent}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-[150px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground font-medium">
            No retention data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">
          True Retention (30d)
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-px bg-muted-foreground/30" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">
            Target: {targetPercent}%
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={4}
              className="text-[9px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-[9px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <ChartTooltip
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                opacity: 0.1,
              }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal tabular-nums text-foreground">
                          {Number(value).toFixed(1)}%
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 text-muted-foreground">
                          Pass Rate
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <ReferenceLine
              y={targetPercent}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              opacity={0.3}
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: "var(--color-rate)", strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};
```

# src/features/generator/components/GenerateCardsModal.tsx

```typescript
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Settings2 } from "lucide-react";
import { useCardGenerator } from "../hooks/useCardGenerator";
import { GeneratorConfig } from "./GeneratorConfig";
import { GeneratorPreview } from "./GeneratorPreview";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { Card as CardType } from "@/types";

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCards: (cards: CardType[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({
  isOpen,
  onClose,
  onAddCards,
}) => {
  const {
    step,
    setStep,
    loading,
    instructions,
    setInstructions,
    count,
    setCount,
    useLearnedWords,
    setUseLearnedWords,
    difficultyMode,
    setDifficultyMode,
    selectedLevel,
    setSelectedLevel,
    selectedWordTypes,
    toggleWordType,
    setSelectedWordTypes,
    handleTopicClick,
    generateCards,
    handleSmartLesson,
    handleSave,
    toggleSelection,
    selectAll,
    clearSelection,
    reset,
    generatedData,
    selectedIndices,
    setSelectedIndices,
  } = useCardGenerator({ onClose, onAddCards });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-300",
          "w-[95vw] h-[95vh] sm:max-w-5xl sm:h-[85vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">AI Card Generator</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {step === "config"
                    ? "Create custom flashcards instantly"
                    : "Review and save your cards"}
                </DialogDescription>
              </div>
            </div>
            {step === "preview" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("config")}
                className="gap-2 hidden sm:flex"
              >
                <Settings2 className="w-4 h-4" />
                Adjust Settings
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {step === "config" ? (
              <GeneratorConfig
                count={count}
                setCount={setCount}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                difficultyMode={difficultyMode}
                setDifficultyMode={setDifficultyMode}
                selectedWordTypes={selectedWordTypes}
                toggleWordType={toggleWordType}
                setSelectedWordTypes={setSelectedWordTypes}
                useLearnedWords={useLearnedWords}
                setUseLearnedWords={setUseLearnedWords}
                instructions={instructions}
                setInstructions={setInstructions}
                handleTopicClick={handleTopicClick}
                generateCards={() => generateCards()}
                handleSmartLesson={handleSmartLesson}
                loading={loading}
              />
            ) : (
              <GeneratorPreview
                generatedData={generatedData}
                selectedIndices={selectedIndices}
                setSelectedIndices={setSelectedIndices}
                toggleSelection={toggleSelection}
                setStep={setStep}
                handleSave={handleSave}
                selectAll={selectAll}
                clearSelection={clearSelection}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

# src/features/generator/components/GeneratorConfig.tsx

```typescript
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ListFilter,
  GraduationCap,
  Languages,
  Type,
  Loader2,
  Wand2,
  BookOpen,
} from "lucide-react";
import { WordType } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "pronoun", label: "Pronoun" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conj" },
];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Int.",
  C1: "Advanced",
  C2: "Proficient",
};

const SUGGESTED_TOPICS = [
  "Travel & Directions",
  "Ordering Food",
  "Business Meeting",
  "Daily Routine",
  "Medical Emergency",
  "Job Interview",
];

interface GeneratorConfigProps {
  count: number[];
  setCount: (value: number[]) => void;
  selectedLevel: string;
  setSelectedLevel: (value: string) => void;
  difficultyMode: "beginner" | "immersive";
  setDifficultyMode: (mode: "beginner" | "immersive") => void;
  selectedWordTypes: WordType[];
  toggleWordType: (type: WordType) => void;
  setSelectedWordTypes: (types: WordType[]) => void;
  useLearnedWords: boolean;
  setUseLearnedWords: (value: boolean) => void;
  instructions: string;
  setInstructions: (value: string) => void;
  handleTopicClick: (topic: string) => void;
  generateCards: () => void;
  handleSmartLesson: () => void;
  loading: boolean;
}

const WordTypeBadge = ({
  type,
  selected,
  onClick,
}: {
  type: { value: WordType; label: string };
  selected: boolean;
  onClick: () => void;
}) => (
  <Badge
    variant={selected ? "default" : "outline"}
    className={cn(
      "cursor-pointer transition-all hover:scale-105 active:scale-95 select-none px-3 py-1",
      !selected &&
        "text-muted-foreground hover:text-foreground hover:border-primary/50",
      selected && "bg-primary text-primary-foreground border-primary"
    )}
    onClick={onClick}
  >
    {type.label}
  </Badge>
);

export const GeneratorConfig: React.FC<GeneratorConfigProps> = ({
  count,
  setCount,
  selectedLevel,
  setSelectedLevel,
  difficultyMode,
  setDifficultyMode,
  selectedWordTypes,
  toggleWordType,
  setSelectedWordTypes,
  useLearnedWords,
  setUseLearnedWords,
  instructions,
  setInstructions,
  handleTopicClick,
  generateCards,
  handleSmartLesson,
  loading,
}) => {
  return (
    <motion.div
      key="config"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col sm:flex-row"
    >
      {/* Sidebar: Settings */}
      <div className="w-full sm:w-[320px] bg-muted/20 border-r flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Quantity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <ListFilter className="w-4 h-4" />
                  Quantity
                </Label>
                <Badge variant="secondary" className="font-mono">
                  {count[0]}
                </Badge>
              </div>
              <Slider
                value={count}
                onValueChange={setCount}
                min={3}
                max={50}
                step={1}
                className="py-2"
              />
            </div>

            {/* Proficiency */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                Proficiency Level
              </Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_DESCRIPTIONS).map(([lvl, desc]) => (
                    <SelectItem key={lvl} value={lvl}>
                      <span className="font-bold mr-2 text-primary">{lvl}</span>
                      <span className="text-muted-foreground">{desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-4 h-4" />
                Learning Approach
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDifficultyMode("beginner")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                    difficultyMode === "beginner"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-background hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-semibold mb-1">
                    Zero to Hero
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Single words building up
                  </span>
                </button>
                <button
                  onClick={() => setDifficultyMode("immersive")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                    difficultyMode === "immersive"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-background hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-semibold mb-1">Immersive</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Full natural sentences
                  </span>
                </button>
              </div>
            </div>

            <Separator />

            {/* Word Types */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Type className="w-4 h-4" />
                  Word Types
                </Label>
                {selectedWordTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWordTypes([])}
                    className="h-6 text-[10px]"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {WORD_TYPES.map((type) => (
                  <WordTypeBadge
                    key={type.value}
                    type={type}
                    selected={selectedWordTypes.includes(type.value as any)}
                    onClick={() => toggleWordType(type.value as any)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label
                htmlFor="learned-words"
                className="text-sm text-foreground"
              >
                Include Learned Words
              </Label>
              <Switch
                id="learned-words"
                checked={useLearnedWords}
                onCheckedChange={setUseLearnedWords}
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Area: Prompt */}
      <div className="flex-1 flex flex-col h-full bg-background">
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              What do you want to learn?
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. I want to learn 20 cooking verbs, or how to ask for directions proficiently..."
              className="min-h-[160px] text-base p-4 resize-none shadow-sm focus-visible:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground text-right">
              {instructions.length} chars
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Suggested Topics
            </Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <Button
                  key={topic}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTopicClick(topic)}
                  className="h-8 text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer for Config */}
        <div className="p-6 border-t bg-muted/10 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
            onClick={generateCards}
            disabled={loading || !instructions}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Cards
              </>
            )}
          </Button>

          <div className="relative flex items-center justify-center sm:hidden py-1">
            <span className="text-xs text-muted-foreground bg-background px-2 z-10">
              OR
            </span>
            <Separator className="absolute w-full" />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="sm:w-auto"
            onClick={handleSmartLesson}
            disabled={loading}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Smart Lesson
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
```

# src/features/generator/components/GeneratorPreview.tsx

```typescript
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ResultCard = ({
  card,
  selected,
  onToggle,
}: {
  card: any;
  selected: boolean;
  onToggle: () => void;
}) => {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
        selected
          ? "bg-primary/5 border-primary shadow-sm"
          : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-xs"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-lg leading-snug">
            {card.targetSentence}
          </p>
          <p className="text-sm text-muted-foreground">
            {card.nativeTranslation}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors shrink-0",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/30 group-hover:border-primary/50"
          )}
        >
          {selected && <Check className="w-3.5 h-3.5 stroke-3" />}
        </div>
      </div>

      <Separator className="my-1 bg-border/50" />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge
          variant="secondary"
          className="font-mono text-primary bg-primary/10 hover:bg-primary/15 border-0"
        >
          {card.targetWord}
        </Badge>
        <span className="text-muted-foreground italic">
          {card.targetWordTranslation}
        </span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
          {card.targetWordPartOfSpeech}
        </span>
      </div>
    </div>
  );
};

interface GeneratorPreviewProps {
  generatedData: any[];
  selectedIndices: Set<number>;
  setSelectedIndices: (indices: Set<number>) => void;
  toggleSelection: (index: number) => void;
  setStep: (step: "config" | "preview") => void;
  handleSave: () => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const GeneratorPreview: React.FC<GeneratorPreviewProps> = ({
  generatedData,
  selectedIndices,
  setSelectedIndices,
  toggleSelection,
  setStep,
  handleSave,
  selectAll,
  clearSelection,
}) => {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col"
    >
      {/* Results Actions */}
      <div className="px-6 py-3 border-b bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span className="font-semibold">{selectedIndices.size}</span>
            <span className="text-muted-foreground">selected</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {generatedData.length} generated
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:text-destructive"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      <ScrollArea className="flex-1 bg-muted/5 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
          {generatedData.map((card, idx) => (
            <ResultCard
              key={idx}
              card={card}
              selected={selectedIndices.has(idx)}
              onToggle={() => toggleSelection(idx)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Floating Footer (or fixed at bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background to-transparent pointer-events-none">
        <div className="flex justify-center sm:justify-end gap-3 pointer-events-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep("config")}
            className="shadow-sm bg-background/80 backdrop-blur"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={selectedIndices.size === 0}
            className="shadow-lg min-w-[160px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Add to Deck
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
```

# src/features/generator/hooks/useCardGenerator.ts

```typescript
import { useState } from "react";
import { aiService, WordType } from "@/lib/ai";
import { useSettingsStore, SettingsState } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { getLearnedWords } from "@/db/repositories/cardRepository";
import { Card as CardType } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface UseCardGeneratorProps {
  onClose: () => void;
  onAddCards: (cards: CardType[]) => void;
}

export const useCardGenerator = ({
  onClose,
  onAddCards,
}: UseCardGeneratorProps) => {
  const { language, geminiApiKey } = useSettingsStore(
    useShallow((s: SettingsState) => ({
      language: s.language,
      geminiApiKey: s.geminiApiKey,
    }))
  );
  const { profile } = useProfile();

  const [step, setStep] = useState<"config" | "preview">("config");
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [count, setCount] = useState([5]);
  const [useLearnedWords, setUseLearnedWords] = useState(true);
  const [difficultyMode, setDifficultyMode] = useState<
    "beginner" | "immersive"
  >("immersive");
  const [selectedLevel, setSelectedLevel] = useState<string>(
    profile?.language_level || "A1"
  );
  const [selectedWordTypes, setSelectedWordTypes] = useState<WordType[]>([]);

  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  const reset = () => {
    onClose();
    setTimeout(() => {
      setStep("config");
      setInstructions("");
      setGeneratedData([]);
      setSelectedWordTypes([]);
      setLoading(false);
    }, 200);
  };

  const toggleWordType = (type: WordType) => {
    setSelectedWordTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleTopicClick = (topic: string) => {
    setInstructions((prev) => (prev ? `${prev} ${topic}` : topic));
  };

  const generateCards = async (customInstructions?: string) => {
    const finalInstructions = customInstructions || instructions;

    if (!finalInstructions) {
      toast.error("Please enter specific topic or instructions");
      return;
    }
    if (!geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings");
      return;
    }

    setLoading(true);
    try {
      let learnedWords: string[] = [];
      try {
        if (useLearnedWords) {
          learnedWords = await getLearnedWords(language);
        }
      } catch (e) {
        console.warn("Failed to fetch learned words", e);
      }

      const results = await aiService.generateBatchCards({
        instructions: finalInstructions,
        count: count[0],
        language: language,
        apiKey: geminiApiKey,
        learnedWords: useLearnedWords ? learnedWords : undefined,
        proficiencyLevel: selectedLevel,
        difficultyMode,
        wordTypeFilters:
          selectedWordTypes.length > 0 ? selectedWordTypes : undefined,
      });

      const existingWordSet = new Set(learnedWords.map((w) => w.toLowerCase()));
      const uniqueResults = results.filter((card: any) => {
        return (
          card.targetWord && !existingWordSet.has(card.targetWord.toLowerCase())
        );
      });

      if (uniqueResults.length === 0 && results.length > 0) {
        toast.warning(
          "All generated words were duplicates. Try a harder difficulty or different topic."
        );
        return;
      }

      if (uniqueResults.length < results.length) {
        toast.info(
          `Filtered ${results.length - uniqueResults.length} known duplicates.`
        );
      }

      setGeneratedData(uniqueResults);
      setSelectedIndices(new Set(uniqueResults.map((_: any, i: number) => i)));
      setStep("preview");
    } catch (e: any) {
      console.error("Generation error:", e);
      toast.error(e.message || "Failed to generate cards");
    } finally {
      setLoading(false);
    }
  };

  const handleSmartLesson = async () => {
    setLoading(true);
    try {
      const learnedWords = await getLearnedWords(language).catch(() => []);

      let prompt = "";
      let mode: "beginner" | "immersive" = difficultyMode;

      if (learnedWords.length === 0) {
        prompt =
          "Basic intro conversation for a complete beginner. Greetings and simple questions.";
        mode = "beginner";
      } else {
        const reviewWords = learnedWords
          .sort(() => 0.5 - Math.random())
          .slice(0, 15);
        prompt = `Create a lesson reviewing these words: ${reviewWords.join(
          ", "
        )}. Create new sentences using these in different contexts.`;
      }

      setInstructions(prompt);
      setDifficultyMode(mode);

      await generateCards(prompt);
    } catch (e) {
      setLoading(false);
      console.error("Smart lesson failed", e);
    }
  };

  const handleSave = () => {
    const now = Date.now();
    const cardsToSave: CardType[] = generatedData
      .filter((_, i) => selectedIndices.has(i))
      .map(
        (item, index) =>
          ({
            id: uuidv4(),
            targetSentence: item.targetSentence,
            nativeTranslation: item.nativeTranslation,
            targetWord: item.targetWord,
            targetWordTranslation: item.targetWordTranslation,
            targetWordPartOfSpeech: item.targetWordPartOfSpeech,
            notes: item.notes,
            furigana: item.furigana,
            language: language,
            status: "new",
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date(now + index * 1000).toISOString(),
            reps: 0,
            lapses: 0,
            tags: ["AI-Gen", "Custom", instructions.slice(0, 15).trim()],
          } as CardType)
      );

    onAddCards(cardsToSave);
    toast.success(`Saved ${cardsToSave.length} new cards!`);
    reset();
  };

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSelectedIndices(newSet);
  };

  const selectAll = () =>
    setSelectedIndices(new Set(generatedData.map((_, i) => i)));
  const clearSelection = () => setSelectedIndices(new Set());

  return {
    step,
    setStep,
    loading,
    instructions,
    setInstructions,
    count,
    setCount,
    useLearnedWords,
    setUseLearnedWords,
    difficultyMode,
    setDifficultyMode,
    selectedLevel,
    setSelectedLevel,
    selectedWordTypes,
    toggleWordType,
    handleTopicClick,
    generateCards,
    handleSmartLesson,
    handleSave,
    toggleSelection,
    selectAll,
    clearSelection,
    reset,
    generatedData,
    selectedIndices,
    setSelectedIndices,
  };
};
```

# src/features/generator/services/csvImport.ts

```typescript
import { v4 as uuidv4 } from "uuid";
import { Card, Language, LanguageId } from "@/types";
import Papa from "papaparse";

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
  header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

const pickValue = (row: CsvRow, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const isLanguage = (value?: string): value is Language =>
  value === LanguageId.Polish ||
  value === LanguageId.Norwegian ||
  value === LanguageId.Japanese ||
  value === LanguageId.Spanish;

const rowToCard = (row: CsvRow, fallbackLanguage: Language): Card | null => {
  const sentence = pickValue(row, [
    "target_sentence",
    "sentence",
    "text",
    "front",
    "prompt",
  ]);
  const translation = pickValue(row, [
    "native_translation",
    "translation",
    "back",
    "answer",
  ]);

  if (!sentence || !translation) {
    return null;
  }

  const languageCandidate = pickValue(row, ["language", "lang"])?.toLowerCase();
  const language = isLanguage(languageCandidate)
    ? languageCandidate
    : fallbackLanguage;
  const tagsRaw = pickValue(row, ["tags", "tag_list", "labels"]);
  const notes = pickValue(row, ["notes", "context", "hint"]) || "";
  const targetWord = pickValue(row, ["target_word", "keyword", "cloze"]);
  const furigana = pickValue(row, ["furigana", "reading", "ruby"]);

  return {
    id: uuidv4(),
    targetSentence: sentence,
    targetWord: targetWord || undefined,
    nativeTranslation: translation,
    notes,
    tags: tagsRaw
      ? tagsRaw
          .split(/[|;,]/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined,
    furigana: furigana || undefined,
    language,
    status: "new",
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    reps: 0,
    lapses: 0,
  };
};

export const parseCardsFromCsv = (
  payload: string,
  fallbackLanguage: Language
): Card[] => {
  const sanitized = payload.trim();
  if (!sanitized) return [];

  const { data } = Papa.parse<Record<string, string>>(sanitized, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const cards: Card[] = [];

  for (const row of data) {
    if (Object.values(row).every((val) => !val || !val.trim())) continue;

    const card = rowToCard(row, fallbackLanguage);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
};

export const signatureForCard = (sentence: string, language: Language) =>
  `${language}::${sentence.trim().toLowerCase()}`;
```

# src/features/generator/services/deckGeneration.ts

```typescript
import { aiService } from "@/lib/ai";
import { Card, Difficulty, Language } from "@/types";

export interface GenerateInitialDeckOptions {
  language: Language;
  proficiencyLevel: Difficulty;
  apiKey?: string;
}

export async function generateInitialDeck(
  options: GenerateInitialDeckOptions
): Promise<Card[]> {
  if (!options.apiKey) {
    throw new Error("API Key is required for AI deck generation");
  }

  try {
    const totalCards = 50;
    const batchSize = 10;

    const topics = [
      "Casual Greetings & Meeting New Friends (informal)",
      "Ordering Coffee, Pastries & Restaurant Basics",
      "Navigating the City & Public Transport Survival",
      "Talking about Hobbies, Movies & Weekend Plans",
      "Essential Health & Emergency Phrases (Safety First)",
    ];

    const promises = topics.map((topic) =>
      aiService.generateBatchCards({
        language: options.language,
        instructions: `Generate content for ${options.proficiencyLevel} level. Topic: ${topic}. Ensure sentences are practical and varied.`,
        count: batchSize,
        apiKey: options.apiKey!,
      })
    );

    const results = await Promise.all(promises);
    const generatedData = results.flat();

    if (!generatedData || !Array.isArray(generatedData)) {
      throw new Error("Invalid response format from AI service");
    }

    const now = Date.now();
    const cards: Card[] = generatedData.map((card: any, index: number) => ({
      id: crypto.randomUUID(),
      targetSentence: card.targetSentence,
      nativeTranslation: card.nativeTranslation,
      targetWord: card.targetWord,
      targetWordTranslation: card.targetWordTranslation,
      targetWordPartOfSpeech: card.targetWordPartOfSpeech,
      gender: card.gender,
      grammaticalCase: card.grammaticalCase,
      notes: card.notes,
      furigana: card.furigana,
      language: options.language,
      status: "new" as const,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date(now + index * 1000).toISOString(),
      tags: [options.proficiencyLevel, "Starter", "AI-Gen"],
    }));

    return cards;
  } catch (error: any) {
    console.error("Failed to generate initial deck:", error);
    throw new Error(error.message || "Failed to generate deck via AI service");
  }
}
```

# src/features/profile/hooks/useProfile.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, LocalProfile } from "@/db/dexie";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profile = await db.profile.get(user.id);
      return profile || null;
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      if (!user?.id) throw new Error("No user authenticated");

      await db.profile.update(user.id, {
        username: newUsername,
        updated_at: new Date().toISOString(),
      });
      return newUsername;
    },
    onSuccess: (newUsername) => {
      queryClient.setQueryData<LocalProfile | null>(
        ["profile", user?.id],
        (old) => (old ? { ...old, username: newUsername } : null)
      );
    },
  });

  const updateLanguageLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      if (!user?.id) throw new Error("No user authenticated");

      await db.profile.update(user.id, {
        language_level: level,
        updated_at: new Date().toISOString(),
      });
      return level;
    },
    onSuccess: (level) => {
      queryClient.setQueryData<LocalProfile | null>(
        ["profile", user?.id],
        (old) => (old ? { ...old, language_level: level } : null)
      );
      toast.success("Language level updated");
    },
  });

  const markInitialDeckGeneratedMutation = useMutation({
    mutationFn: async (userId: string = user?.id || "") => {
      if (!userId) throw new Error("No user ID available");

      await db.profile.update(userId, {
        initial_deck_generated: true,
        updated_at: new Date().toISOString(),
      });
      return userId;
    },
    onSuccess: (_, variablesUserId) => {
      const targetId = variablesUserId || user?.id;
      queryClient.setQueryData<LocalProfile | null>(
        ["profile", targetId],
        (old) => (old ? { ...old, initial_deck_generated: true } : null)
      );
      queryClient.invalidateQueries({ queryKey: ["profile", targetId] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    loading: profileQuery.isLoading,
    error: profileQuery.error,

    updateUsername: (username: string) =>
      updateUsernameMutation.mutateAsync(username),
    updateLanguageLevel: (level: string) =>
      updateLanguageLevelMutation.mutateAsync(level),
    markInitialDeckGenerated: (userId?: string) =>
      markInitialDeckGeneratedMutation.mutateAsync(userId),
    refreshProfile: () => profileQuery.refetch(),
  };
};
```

# src/features/settings/components/AlgorithmSettings.tsx

```typescript
import React, { useState } from "react";
import {
  Wand2,
  RefreshCw,
  Target,
  Sliders,
  Settings,
  Download,
  Upload,
} from "lucide-react";
import { UserSettings } from "@/types";
import { FSRS_DEFAULTS } from "@/constants";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAllReviewLogs } from "@/db/repositories/revlogRepository";
import { optimizeFSRS } from "@/lib/fsrsOptimizer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { exportRevlogToCSV } from "@/features/settings/logic/optimizer";
import { db } from "@/db/dexie";
import { Textarea } from "@/components/ui/textarea";

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ reviews: number } | null>(null);
  const [manualWeights, setManualWeights] = useState(
    localSettings.fsrs.w.join(", ")
  );
  const [showManual, setShowManual] = useState(false);

  const handleExport = async () => {
    try {
      await exportRevlogToCSV(db);
      toast.success("RevLog exported to CSV");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const handleWeightsChange = (val: string) => {
    setManualWeights(val);
    const weights = val
      .split(/[\s,]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    if (weights.length === 19) {
      setLocalSettings((prev) => ({
        ...prev,
        fsrs: { ...prev.fsrs, w: weights },
      }));
    }
  };

  const handleOptimize = async () => {
    if (!user) return;
    setIsOptimizing(true);
    setProgress(0);
    try {
      const logs = await getAllReviewLogs(localSettings.language);
      if (logs.length < 50) {
        toast.error("Insufficient data (50+ reviews required).");
        setIsOptimizing(false);
        return;
      }
      const currentW = localSettings.fsrs.w || FSRS_DEFAULTS.w;

      const worker = new Worker(
        new URL("../../../workers/fsrs.worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (e) => {
        const { type, progress, w, error } = e.data;
        if (type === "progress") {
          setProgress(progress);
        } else if (type === "result") {
          setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === "error") {
          toast.error(`Optimization failed: ${error}`);
          worker.terminate();
          setIsOptimizing(false);
        }
      };

      worker.postMessage({ logs, currentW });
    } catch (e) {
      toast.error("Optimization failed to start");
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Retention Target Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Retention Target
        </h3>
        <p className="text-sm text-muted-foreground">
          Target accuracy for scheduled reviews
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Target Retention
              </label>
            </div>
            <span className="text-5xl md:text-6xl font-light tabular-nums text-foreground">
              {Math.round(localSettings.fsrs.request_retention * 100)}
              <span className="text-xl text-muted-foreground/40">%</span>
            </span>
          </div>

          <div className="space-y-4">
            <Slider
              min={0.7}
              max={0.99}
              step={0.01}
              value={[localSettings.fsrs.request_retention]}
              onValueChange={([value]) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  fsrs: { ...prev.fsrs, request_retention: value },
                }))
              }
              className="py-3"
            />
            <div className="flex justify-between text-xs  text-muted-foreground/50 uppercase tracking-wider">
              <span>Faster Reviews</span>
              <span>Higher Accuracy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Optimization Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Optimization
        </h3>
        <p className="text-sm text-muted-foreground">
          Personalize algorithm parameters
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Analyzes{" "}
              {report
                ? `${report.reviews} review records`
                : "your review history"}{" "}
              to calculate personalized parameters.
            </p>
            {report && (
              <span className="text-xs  uppercase tracking-[0.15em] text-pine-500">
                Complete
              </span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground  mb-1 uppercase tracking-wider">
                Processing review data
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOptimize}
                variant="secondary"
                className="w-full"
              >
                <Wand2 size={14} strokeWidth={1.5} /> Quick Optimize
                (In-Browser)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Download size={12} className="mr-2" /> Export Data
                </Button>
                <Button
                  onClick={() => setShowManual(!showManual)}
                  variant="outline"
                  className="w-full text-xs box-border"
                >
                  <Sliders size={12} className="mr-2" /> Manual Params
                </Button>
              </div>

              {showManual && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">
                    Parameters (w)
                  </p>
                  <Textarea
                    value={manualWeights}
                    onChange={(e) => handleWeightsChange(e.target.value)}
                    className="font-mono text-xs bg-muted/30 min-h-[80px]"
                    placeholder="0.4, 0.6, 2.4, ..."
                  />
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Paste the 19 comma-separated weights from the FSRS optimizer
                    output here.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Advanced Settings Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Settings
            className="w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          Advanced
        </h3>
        <p className="text-sm text-muted-foreground">
          Fine-tune scheduling behavior
        </p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Maximum Interval (days)
              </label>
            </div>
            <Input
              type="number"
              className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-2 placeholder:text-muted-foreground/30 focus-visible:border-primary/60 shadow-none focus-visible:ring-0"
              value={localSettings.fsrs.maximum_interval}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  fsrs: {
                    ...prev.fsrs,
                    maximum_interval: parseInt(e.target.value) || 36500,
                  },
                }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">
                  Enable Fuzzing
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">
                Prevents clustering of due dates by adding randomness
              </p>
            </div>
            <Switch
              checked={localSettings.fsrs.enable_fuzzing}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  fsrs: { ...prev.fsrs, enable_fuzzing: checked },
                }))
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Reset Button */}
      <div className="pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setLocalSettings((prev) => ({
              ...prev,
              fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w },
            }))
          }
          className="text-xs uppercase tracking-widest text-muted-foreground/40 hover:text-destructive hover:bg-transparent h-auto p-0 flex items-center gap-2"
        >
          <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </Button>
      </div>
    </div>
  );
};
```

# src/features/settings/components/AudioSettings.tsx

```typescript
import React from "react";
import { Volume2, Mic, Gauge } from "lucide-react";
import { UserSettings } from "@/types";
import { TTS_PROVIDER } from "@/constants/settings";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceOption {
  id: string;
  name: string;
}

interface AudioSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  availableVoices: VoiceOption[];
  onTestAudio: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  localSettings,
  setLocalSettings,
  availableVoices,
  onTestAudio,
}) => {
  const updateTts = (partial: Partial<UserSettings["tts"]>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Speech Provider Section */}
      <div>
        <h3 className="text-lg font-medium">Speech Provider</h3>
        <p className="text-sm text-muted-foreground">
          Text-to-speech engine configuration
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={localSettings.tts.provider}
              onValueChange={(value) =>
                updateTts({ provider: value as any, voiceURI: null })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: TTS_PROVIDER.BROWSER, label: "Browser Native" },
                  { value: TTS_PROVIDER.GOOGLE, label: "Google Cloud TTS" },
                  { value: TTS_PROVIDER.AZURE, label: "Microsoft Azure" },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localSettings.tts.provider !== TTS_PROVIDER.BROWSER && (
            <div className="pt-4 space-y-4 border-t mt-4">
              <div className="space-y-2">
                <Label>API Credentials</Label>
                <Input
                  type="password"
                  placeholder={
                    localSettings.tts.provider === TTS_PROVIDER.GOOGLE
                      ? "Google Cloud API key"
                      : "Azure subscription key"
                  }
                  value={
                    localSettings.tts.provider === TTS_PROVIDER.GOOGLE
                      ? localSettings.tts.googleApiKey
                      : localSettings.tts.azureApiKey
                  }
                  onChange={(e) =>
                    updateTts(
                      localSettings.tts.provider === TTS_PROVIDER.GOOGLE
                        ? { googleApiKey: e.target.value }
                        : { azureApiKey: e.target.value }
                    )
                  }
                  className="font-mono"
                />
              </div>
              {localSettings.tts.provider === TTS_PROVIDER.AZURE && (
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    placeholder="e.g., eastus, westeurope"
                    value={localSettings.tts.azureRegion}
                    onChange={(e) => updateTts({ azureRegion: e.target.value })}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Selection Section */}
      <div>
        <h3 className="text-lg font-medium">Voice Selection</h3>
        <p className="text-sm text-muted-foreground">
          Choose and test your preferred voice
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Voice</Label>
              <Select
                value={localSettings.tts.voiceURI || "default"}
                onValueChange={(value) =>
                  updateTts({ voiceURI: value === "default" ? null : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  {availableVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={onTestAudio}>
              <Volume2 className="mr-2 h-4 w-4" />
              Test Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Playback Settings */}
      <div>
        <h3 className="text-lg font-medium">Playback</h3>
        <p className="text-sm text-muted-foreground">
          Audio speed and volume controls
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Speed</CardTitle>
            <CardDescription>Adjust playback rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">
                {localSettings.tts.rate.toFixed(1)}x
              </span>
            </div>
            <Slider
              min={0.5}
              max={2}
              step={0.1}
              value={[localSettings.tts.rate]}
              onValueChange={([v]) => updateTts({ rate: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>Adjust output volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">
                {Math.round(localSettings.tts.volume * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[localSettings.tts.volume]}
              onValueChange={([v]) => updateTts({ volume: v })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

# src/features/settings/components/DataSettings.tsx

```typescript
import React, { RefObject } from "react";
import {
  Download,
  Upload,
  Cloud,
  Check,
  Database,
  HardDrive,
  RotateCcw,
  Key,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SyncthingSettings } from "./SyncthingSettings";
import { Switch } from "@/components/ui/switch";

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  jsonInputRef: RefObject<HTMLInputElement>;
  isRestoring: boolean;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
  onSyncthingSave?: () => void;
  onSyncthingLoad?: () => void;
  isSyncthingSaving?: boolean;
  isSyncthingLoading?: boolean;
  lastSyncthingSync?: string | null;
  includeApiKeys: boolean;
  onIncludeApiKeysChange: (checked: boolean) => void;
  importApiKeys: boolean;
  onImportApiKeysChange: (checked: boolean) => void;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onRestoreBackup,
  jsonInputRef,
  isRestoring,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
  onSyncthingSave,
  onSyncthingLoad,
  isSyncthingSaving,
  isSyncthingLoading,
  lastSyncthingSync,
  includeApiKeys,
  onIncludeApiKeysChange,
  importApiKeys,
  onImportApiKeysChange,
}) => (
  <div className="space-y-6 max-w-2xl">
    {/* Import & Export Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">Import & Export</h3>
      <p className="text-sm text-muted-foreground">
        Backup and restore your data
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors"
        onClick={onExport}
      >
        <Download className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="font-medium text-foreground">Export Backup</span>
        <span className="text-sm text-muted-foreground font-normal">
          Download complete data archive
        </span>
      </Button>

      <Button
        variant="outline"
        className={`h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors ${
          isRestoring ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={() => !isRestoring && jsonInputRef.current?.click()}
        disabled={isRestoring}
      >
        <RotateCcw
          className={`h-8 w-8 text-muted-foreground mb-2 ${
            isRestoring ? "animate-spin" : ""
          }`}
        />
        <span className="font-medium text-foreground">
          {isRestoring ? "Restoring..." : "Restore Backup"}
        </span>
        <span className="text-sm text-muted-foreground font-normal">
          Import from JSON backup file
        </span>
      </Button>
    </div>

    {/* Import Cards Section */}
    <Button
      variant="outline"
      className="w-full h-auto flex items-center justify-start gap-4 p-4 hover:bg-muted/50 transition-colors"
      onClick={() => csvInputRef.current?.click()}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <div className="text-left">
        <div className="font-medium text-foreground">Import Cards</div>
        <div className="text-sm text-muted-foreground font-normal">
          Add flashcards from CSV file (without replacing existing)
        </div>
      </div>
    </Button>

    <Separator className="my-6" />

    {/* API Key Options Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">API Key Options</h3>
      <p className="text-sm text-muted-foreground">
        Control how API keys are handled
      </p>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Include API Keys in Export</h4>
          <p className="text-sm text-muted-foreground">
            Include your API keys when exporting backup files
          </p>
        </div>
        <Switch
          checked={includeApiKeys}
          onCheckedChange={onIncludeApiKeysChange}
        />
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Import API Keys from Backup</h4>
          <p className="text-sm text-muted-foreground">
            Restore API keys when importing backup files
          </p>
        </div>
        <Switch
          checked={importApiKeys}
          onCheckedChange={onImportApiKeysChange}
        />
      </div>
    </div>

    <Separator className="my-6" />

    {/* Cloud Storage Section */}
    <div className="mb-6">
      <h3 className="text-lg font-medium">Cloud Storage</h3>
      <p className="text-sm text-muted-foreground">Sync data across devices</p>
    </div>
    <Card className={syncComplete ? "border-green-500/50" : ""}>
      <CardContent className="flex items-center gap-4 py-4">
        {syncComplete ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Cloud className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h4 className="font-medium">
            {syncComplete ? "Synchronized" : "Sync to Cloud"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isSyncingToCloud
              ? "Uploading data..."
              : syncComplete
              ? "Your data is backed up"
              : "Migrate local database to cloud"}
          </p>
        </div>
        {!syncComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </Button>
        )}
      </CardContent>
    </Card>

    <Separator className="my-6" />

    {/* Syncthing Sync Section */}
    {onSyncthingSave && onSyncthingLoad && (
      <SyncthingSettings
        onSave={onSyncthingSave}
        onLoad={onSyncthingLoad}
        isSaving={isSyncthingSaving || false}
        isLoading={isSyncthingLoading || false}
        lastSync={lastSyncthingSync || null}
      />
    )}

    <input
      type="file"
      ref={csvInputRef}
      accept=".csv,.txt"
      className="hidden"
      onChange={onImport}
    />
    <input
      type="file"
      ref={jsonInputRef}
      accept=".json"
      className="hidden"
      onChange={onRestoreBackup}
    />

    {/* Help Text */}
    <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">Restore Backup:</span>{" "}
        Replaces all data with a previous JSON backup.
      </p>
      <p>
        <span className="font-semibold text-foreground">Import Cards:</span>{" "}
        Adds cards from CSV without replacing existing data.
      </p>
    </div>
  </div>
);
```

# src/features/settings/components/FloatingSyncButton.tsx

```typescript
import React, { useState, useEffect } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { useSyncthingSync } from "@/features/settings/hooks/useSyncthingSync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingSyncButtonProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export const FloatingSyncButton: React.FC<FloatingSyncButtonProps> = ({
  className,
  position = "bottom-right",
}) => {
  const { saveToSyncFile, isSaving, lastSync } = useSyncthingSync();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    const success = await saveToSyncFile();
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const positionClasses = {
    "bottom-right": "bottom-20 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <Button
      onClick={handleSave}
      disabled={isSaving}
      variant="ghost"
      className={cn(
        "fixed z-50 flex items-center gap-2 px-4 py-6 h-auto",
        "bg-card/95 backdrop-blur-sm border border-border/50",
        "hover:border-primary/50 hover:bg-card transition-all duration-200",
        "shadow-lg shadow-black/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "group",
        positionClasses[position],
        className
      )}
      title={
        lastSync
          ? `Last synced: ${new Date(lastSync).toLocaleString()}`
          : "Save changes to sync file"
      }
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm  text-muted-foreground">Saving...</span>
        </>
      ) : showSuccess ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm  text-green-500">Saved!</span>
        </>
      ) : (
        <>
          <Save className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm  text-muted-foreground group-hover:text-foreground transition-colors">
            Save Changes
          </span>
        </>
      )}
    </Button>
  );
};
```

# src/features/settings/components/GeneralSettings.tsx

```typescript
import React from "react";
import { User, Globe, Sparkles, Settings } from "lucide-react";
import { LANGUAGE_NAMES } from "@/constants";
import { UserSettings } from "@/types";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  username: string;
  setUsername: (username: string) => void;
  languageLevel: string;
  onUpdateLevel: (level: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  localSettings,
  setLocalSettings,
  username,
  setUsername,
  languageLevel,
  onUpdateLevel,
}) => {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Section */}
      <div>
        <h3 className="text-lg font-medium">Identity</h3>
        <p className="text-sm text-muted-foreground">
          Your public profile information
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Displayed on global leaderboards and achievements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Language Section */}
      <div>
        <h3 className="text-lg font-medium">Language</h3>
        <p className="text-sm text-muted-foreground">
          Active course configuration
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Course</CardTitle>
            <CardDescription>
              Select the language you are currently learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={localSettings.language}
              onValueChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  language: value as UserSettings["language"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_NAMES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proficiency Level</CardTitle>
            <CardDescription>
              Controls the complexity of AI-generated content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={languageLevel || "A1"} onValueChange={onUpdateLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "A1", label: "A1 - Beginner" },
                  { value: "A2", label: "A2 - Elementary" },
                  { value: "B1", label: "B1 - Intermediate" },
                  { value: "C1", label: "C1 - Advanced" },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Accent</CardTitle>
            <CardDescription>
              Customize the accent color for this language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ColorPicker
              label=""
              value={
                localSettings.languageColors?.[localSettings.language] ||
                "0 0% 0%"
              }
              onChange={(newColor) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  languageColors: {
                    ...(prev.languageColors || {}),
                    [prev.language]: newColor,
                  } as any,
                }))
              }
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* API Section */}
      <div>
        <h3 className="text-lg font-medium">AI Integration</h3>
        <p className="text-sm text-muted-foreground">
          Gemini API configuration
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>
            Powers sentence generation and linguistic analysis features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            value={localSettings.geminiApiKey || ""}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                geminiApiKey: e.target.value,
              }))
            }
            placeholder="Enter your API key"
            className="font-mono"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Behavior Toggles */}
      <div>
        <h3 className="text-lg font-medium">Behavior</h3>
        <p className="text-sm text-muted-foreground">
          Study session preferences
        </p>
      </div>
      <div className="space-y-4">
        {[
          {
            label: "Automatic Audio",
            desc: "Play pronunciation when card is revealed",
            key: "autoPlayAudio",
          },
          {
            label: "Listening Mode",
            desc: "Hide text until audio completes",
            key: "blindMode",
          },
          {
            label: "Show Translation",
            desc: "Display native language meaning",
            key: "showTranslationAfterFlip",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between space-x-2 border p-4 rounded-lg"
          >
            <div className="space-y-0.5">
              <Label className="text-base">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={(localSettings as any)[item.key]}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

# src/features/settings/components/SettingsLayout.tsx

```typescript
import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Volume2,
  Target,
  Sliders,
  Database,
  Skull,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SettingsLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: "/settings/general", label: "General", icon: Settings },
    { path: "/settings/audio", label: "Audio", icon: Volume2 },
    { path: "/settings/study", label: "Limits", icon: Target },
    { path: "/settings/fsrs", label: "FSRS", icon: Sliders },
    { path: "/settings/data", label: "Data", icon: Database },
    { path: "/settings/danger", label: "Danger", icon: Skull },
  ];

  const currentTab =
    tabs.find((tab) => location.pathname.startsWith(tab.path))?.path ||
    tabs[0].path;

  return (
    <div className="container max-w-4xl py-6 lg:py-10 space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <div className="flex-1 lg:max-w-full">
          <Tabs
            value={currentTab}
            onValueChange={(value) => navigate(value)}
            className="w-full space-y-6"
          >
            <div className="relative overflow-x-auto pb-2">
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.path} value={tab.path}>
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <Outlet />
          </Tabs>
        </div>
      </div>
    </div>
  );
};
```

# src/features/settings/components/SettingsSync.tsx

```typescript
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  migrateLocalSettingsToDatabase,
  getFullSettings,
} from "@/db/repositories/settingsRepository";

export const SettingsSync: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const setSettingsLoading = useSettingsStore((s) => s.setSettingsLoading);
  const initializeStore = useSettingsStore((s) => s.initializeStore);

  useEffect(() => {
    const loadSettingsFromDb = async () => {
      if (authLoading) return;

      const userId = user?.id || "local-user";

      setSettingsLoading(true);
      try {
        await migrateLocalSettingsToDatabase(userId);

        const dbSettings = await getFullSettings(userId);
        if (dbSettings) {
          initializeStore(userId, dbSettings);
        } else {
          const { DEFAULT_SETTINGS } = await import(
            "@/stores/useSettingsStore"
          );
          initializeStore(userId, DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettingsFromDb();
  }, [user, authLoading, initializeStore, setSettingsLoading]);

  return null;
};
```

# src/features/settings/components/StudySettings.tsx

```typescript
import React from "react";
import { Target, ListOrdered, ToggleLeft, Clock } from "lucide-react";
import { UserSettings } from "@/types";
import { Input } from "@/components/ui/input";
import { LANGUAGE_NAMES } from "@/constants";
import { CARD_ORDER } from "@/constants/settings";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew =
    localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview =
    localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;
  const [stepsInput, setStepsInput] = React.useState(
    localSettings.learningSteps?.join(" ") || "1 10"
  );

  const handleStepsChange = (val: string) => {
    setStepsInput(val);
    const steps = val
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    if (steps.length > 0) {
      setLocalSettings((prev) => ({ ...prev, learningSteps: steps }));
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info Banner */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 p-4">
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Daily study configuration for{" "}
            <span className="text-foreground font-medium">
              {currentLangName}
            </span>
            . Limits reset at 4:00 AM.
          </p>
        </CardContent>
      </Card>

      {/* Daily Limits Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Daily Limits
        </h3>
        <p className="text-sm text-muted-foreground">Maximum cards per day</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                New Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyNew}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings((prev) => ({
                  ...prev,
                  dailyNewLimits: {
                    ...prev.dailyNewLimits,
                    [prev.language]: val,
                  },
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">
              Unseen vocabulary
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Review Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyReview}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings((prev) => ({
                  ...prev,
                  dailyReviewLimits: {
                    ...prev.dailyReviewLimits,
                    [prev.language]: val,
                  },
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">
              Due for review
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Study Preferences Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ToggleLeft
            className="w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          Study Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          Session behavior options
        </p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock
                  className="w-4 h-4 text-muted-foreground/60"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground ">
                  Learning Steps
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">
                Minutes between reviews (e.g. "1 10")
              </p>
            </div>
            <Input
              type="text"
              value={stepsInput}
              className="w-32 bg-transparent border-0 border-b border-border/30 text-sm  focus:outline-none focus:border-primary/60 transition-colors py-1 px-1 text-right text-foreground font-light shadow-none focus-visible:ring-0 rounded-none h-auto"
              onChange={(e) => handleStepsChange(e.target.value)}
              placeholder="1 10"
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered
                  className="w-4 h-4 text-muted-foreground/60"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground ">
                  Card Order
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">
                Choose presentation priority
              </p>
            </div>
            <Select
              value={localSettings.cardOrder || CARD_ORDER.NEW_FIRST}
              onValueChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  cardOrder: value as any,
                }))
              }
            >
              <SelectTrigger className="w-[140px] border-0 border-b border-border/30 rounded-none shadow-none focus:ring-0 px-2 h-8">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CARD_ORDER.NEW_FIRST}>New First</SelectItem>
                <SelectItem value={CARD_ORDER.REVIEW_FIRST}>
                  Review First
                </SelectItem>
                <SelectItem value={CARD_ORDER.MIXED}>Mixed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">
                  Binary Rating
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">
                Simplified pass/fail grading reduces decision fatigue
              </p>
            </div>
            <Switch
              checked={localSettings.binaryRatingMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  binaryRatingMode: checked,
                }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">
                  Full Sentence Front
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">
                Show the full sentence on the front of the card instead of just
                the target word
              </p>
            </div>
            <Switch
              checked={localSettings.showWholeSentenceOnFront}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  showWholeSentenceOnFront: checked,
                }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">
                  Skip Learning Wait
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">
                Continue reviewing other due cards instead of waiting for
                learning steps to cool down
              </p>
            </div>
            <Switch
              checked={localSettings.ignoreLearningStepsWhenNoCards}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  ignoreLearningStepsWhenNoCards: checked,
                }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

# src/features/settings/components/SyncthingSettings.tsx

```typescript
import React from "react";
import { Save, Download, FolderSync, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SyncthingSettingsProps {
  onSave: () => void;
  onLoad: () => void;
  isSaving: boolean;
  isLoading: boolean;
  lastSync: string | null;
}

export const SyncthingSettings: React.FC<SyncthingSettingsProps> = ({
  onSave,
  onLoad,
  isSaving,
  isLoading,
  lastSync,
}) => {
  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <FolderSync
            className="w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          Syncthing Sync
        </h3>
        <p className="text-sm text-muted-foreground">
          Sync data between devices using a shared file
        </p>
      </div>

      {/* Last Sync Status */}
      <Card className="border-border/30">
        <CardContent className="flex items-center gap-3 p-4">
          <Clock
            className="w-4 h-4 text-muted-foreground/60"
            strokeWidth={1.5}
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground/60 font-light">
              Last synced
            </p>
            <p className="text-sm text-foreground">
              {formatLastSync(lastSync)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Save Changes Button */}
        <Button
          variant="outline"
          className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${
            isSaving ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={onSave}
          disabled={isSaving}
        >
          <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
            <Save
              className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${
                isSaving ? "animate-pulse" : ""
              }`}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isSaving ? "Saving..." : "Save Changes"}
            </p>
            <p className="text-xs text-muted-foreground/60 font-normal">
              Write to sync file for Syncthing
            </p>
          </div>
        </Button>

        {/* Load from Sync File Button */}
        <Button
          variant="outline"
          className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${
            isLoading ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={onLoad}
          disabled={isLoading}
        >
          <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
            <Download
              className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isLoading ? "Loading..." : "Load from File"}
            </p>
            <p className="text-xs text-muted-foreground/60 font-normal">
              Import data from sync file
            </p>
          </div>
        </Button>
      </div>

      {/* Instructions */}
      <Card className="border-border/20">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
          <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-2">
            <p>
              <strong className="text-muted-foreground/70">
                How it works:
              </strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Set up Syncthing to sync a folder between your devices</li>
              <li>Click "Save Changes" to write your data to the sync file</li>
              <li>
                Syncthing will automatically sync the file to other devices
              </li>
              <li>On the other device, click "Load from File" to import</li>
            </ol>
            <p className="mt-2">
              <strong className="text-muted-foreground/70">Note:</strong> On
              mobile, the file is saved to the Documents folder. Make sure
              Syncthing has access to it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

# src/features/settings/hooks/useAccountManagement.ts

```typescript
import { useState } from "react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { clearAllCards, saveAllCards } from "@/db/repositories/cardRepository";
import { clearHistory } from "@/db/repositories/historyRepository";
import { db } from "@/db/dexie";
import { useDeckActions } from "@/hooks/useDeckActions";
import { initialCards } from "@/data/initialCards";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";

export const useAccountManagement = () => {
  const language = useSettingsStore((s) => s.language);
  const { refreshDeckData } = useDeckActions();
  const { user, deleteAccount } = useAuth();
  const { updateLanguageLevel } = useProfile();

  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
  const [confirmResetAccount, setConfirmResetAccount] = useState(false);

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
      setConfirmResetDeck(true);
      toast.warning(
        "Click again to confirm deck reset. This cannot be undone."
      );
      setTimeout(() => setConfirmResetDeck(false), 3000);
      return;
    }

    try {
      await clearAllCards();
      await clearHistory();
      await db.revlog.clear();
      await db.aggregated_stats.clear();

      const beginnerCards = initialCards.map((c) => ({
        ...c,
        user_id: user?.id || "local-user",
        language,
      }));
      await saveAllCards(beginnerCards as any);
      await updateLanguageLevel("A1");

      refreshDeckData();
      toast.success("Deck has been reset to beginner course.");
      setConfirmResetDeck(false);
    } catch (error) {
      console.error("Failed to reset deck", error);
      toast.error("Failed to reset deck.");
    }
  };

  const handleResetAccount = async () => {
    if (!confirmResetAccount) {
      setConfirmResetAccount(true);
      toast.error(
        "Click again to confirm account deletion. ALL DATA WILL BE LOST FOREVER."
      );
      setTimeout(() => setConfirmResetAccount(false), 3000);
      return;
    }

    try {
      await deleteAccount();
      toast.success("Account deleted.");
    } catch (error) {
      console.error("Failed to delete account", error);
      toast.error("Failed to delete account.");
    }
  };

  return {
    handleResetDeck,
    handleResetAccount,
    confirmResetDeck,
    confirmResetAccount,
  };
};
```

# src/features/settings/hooks/useCloudSync.ts

```typescript
import { toast } from "sonner";

export const useCloudSync = () => {
  const handleSyncToCloud = async () => {
    toast.info("This is a local-only app. Your data is stored on this device.");
  };

  return {
    handleSyncToCloud,
    isSyncingToCloud: false,
    syncComplete: false,
  };
};
```

# src/features/settings/hooks/useSyncthingSync.ts

```typescript
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  saveSyncFile,
  loadSyncFile,
  importSyncData,
  checkSyncFile,
  getLastSyncTime,
  setLastSyncTime,
} from "@/lib/sync/syncService";

export const useSyncthingSync = () => {
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastSyncTime().then(setLastSync);
  }, []);

  const saveToSyncFile = useCallback(async () => {
    setIsSaving(true);
    try {
      const settings = useSettingsStore.getState().settings;
      const result = await saveSyncFile(settings);

      if (result.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        setLastSync(now);
        toast.success("Changes saved to sync file");
        return true;
      } else {
        toast.error(result.error || "Failed to save sync file");
        return false;
      }
    } catch (error: any) {
      console.error("[Sync] Save error:", error);
      toast.error(`Save failed: ${error.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadFromSyncFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadSyncFile();

      if (!result.success) {
        toast.error(result.error || "Failed to load sync file");
        return false;
      }

      if (!result.data) {
        toast.error("No data found in sync file");
        return false;
      }

      const syncData = result.data;
      const confirmed = window.confirm(
        `Load data from sync file?\n\n` +
          `Last synced: ${new Date(syncData.lastSynced).toLocaleString()}\n` +
          `Device: ${syncData.deviceId?.slice(0, 8)}...\n` +
          `Cards: ${syncData.cards.length}\n\n` +
          `This will replace your current data. Continue?`
      );

      if (!confirmed) {
        return false;
      }

      const importResult = await importSyncData(syncData, updateSettings);

      if (importResult.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        setLastSync(now);
        toast.success(`Loaded ${syncData.cards.length} cards from sync file`);

        queryClient.invalidateQueries();

        setTimeout(() => window.location.reload(), 1000);
        return true;
      } else {
        toast.error(importResult.error || "Failed to import sync data");
        return false;
      }
    } catch (error: any) {
      console.error("[Sync] Load error:", error);
      toast.error(`Load failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateSettings, queryClient]);

  const checkSyncStatus = useCallback(async () => {
    try {
      const result = await checkSyncFile();
      return result;
    } catch (error) {
      console.error("[Sync] Check error:", error);
      return { exists: false };
    }
  }, []);

  return {
    saveToSyncFile,
    loadFromSyncFile,
    checkSyncStatus,
    isSaving,
    isLoading,
    lastSync,
  };
};
```

# src/features/settings/logic/optimizer.ts

```typescript
import { LinguaFlowDB } from "@/db/dexie";
import { State } from "ts-fsrs";

export const exportRevlogToCSV = async (db: LinguaFlowDB): Promise<void> => {
  const revlogs = await db.revlog.toArray();

  const header = [
    "card_id",
    "review_time",
    "review_rating",
    "review_state",
    "review_duration",
  ].join(",");

  const rows = revlogs.map((log) => {
    const duration = 0;

    return [
      log.card_id,
      new Date(log.created_at).getTime(),
      log.grade,
      log.state,
      duration,
    ].join(",");
  });

  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `revlog_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

# src/features/settings/routes/SettingsRoute.tsx

```typescript
import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDeckActions } from "@/hooks/useDeckActions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { UserSettings, Language } from "@/types";
import { ttsService, VoiceOption } from "@/lib/tts";
import {
  saveAllCards,
  getCardSignatures,
  getCards,
  clearAllCards,
} from "@/db/repositories/cardRepository";
import {
  getHistory,
  saveFullHistory,
  clearHistory,
} from "@/db/repositories/historyRepository";
import { db } from "@/db/dexie";
import {
  parseCardsFromCsv,
  signatureForCard,
} from "@/features/generator/services/csvImport";
import { useCloudSync } from "@/features/settings/hooks/useCloudSync";
import { useAccountManagement } from "@/features/settings/hooks/useAccountManagement";
import { useSyncthingSync } from "@/features/settings/hooks/useSyncthingSync";

import { SettingsLayout } from "../components/SettingsLayout";
import { GeneralSettings } from "../components/GeneralSettings";
import { AudioSettings } from "../components/AudioSettings";
import { StudySettings } from "../components/StudySettings";
import { AlgorithmSettings } from "../components/AlgorithmSettings";
import { DataSettings } from "../components/DataSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AlertCircle, Trash2 } from "lucide-react";

const useDebouncedUsername = (
  localUsername: string,
  updateUsername: (name: string) => Promise<void>,
  currentUsername?: string
) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localUsername && localUsername !== currentUsername) {
        updateUsername(localUsername).then(() =>
          toast.success("Username updated", { id: "username-update" })
        );
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [localUsername, updateUsername, currentUsername]);
};

const GeneralSettingsFinal = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  const { profile, updateUsername, updateLanguageLevel } = useProfile();
  const [localUsername, setLocalUsername] = useState(profile?.username || "");

  useEffect(() => {
    if (profile?.username) setLocalUsername(profile.username);
  }, [profile?.username]);

  useDebouncedUsername(
    localUsername,
    async (name) => {
      await updateUsername(name);
    },
    profile?.username
  );

  return (
    <GeneralSettings
      localSettings={settings}
      setLocalSettings={setSettings}
      username={localUsername}
      setUsername={setLocalUsername}
      languageLevel={profile?.language_level || "A1"}
      onUpdateLevel={updateLanguageLevel}
    />
  );
};

const AudioSettingsPage = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);

  useEffect(() => {
    const loadVoices = async () => {
      const voices = await ttsService.getAvailableVoices(
        settings.language,
        settings.tts
      );
      setAvailableVoices(voices);
    };
    loadVoices();
  }, [
    settings.language,
    settings.tts.provider,
    settings.tts.googleApiKey,
    settings.tts.azureApiKey,
  ]);

  const handleTestAudio = () => {
    const testText = {
      polish: "Cześć, to jest test.",
      norwegian: "Hei, dette er en test.",
      japanese: "こんにちは、テストです。",
      spanish: "Hola, esto es una prueba.",
      german: "Hallo, das ist ein Test.",
    };
    ttsService.speak(
      testText[settings.language] || "Test audio",
      settings.language,
      settings.tts
    );
  };

  return (
    <AudioSettings
      localSettings={settings}
      setLocalSettings={setSettings}
      availableVoices={availableVoices}
      onTestAudio={handleTestAudio}
    />
  );
};

const StudySettingsPage = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  return (
    <StudySettings localSettings={settings} setLocalSettings={setSettings} />
  );
};

const AlgorithmSettingsPage = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  return (
    <AlgorithmSettings
      localSettings={settings}
      setLocalSettings={setSettings}
    />
  );
};

const DataSettingsPage = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  const { user } = useAuth();
  const { refreshDeckData } = useDeckActions();

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [includeApiKeys, setIncludeApiKeys] = useState(false);
  const [importApiKeys, setImportApiKeys] = useState(false);

  const { handleSyncToCloud, isSyncingToCloud, syncComplete } = useCloudSync();
  const {
    saveToSyncFile,
    loadFromSyncFile,
    isSaving: isSyncthingSaving,
    isLoading: isSyncthingLoading,
    lastSync: lastSyncthingSync,
  } = useSyncthingSync();

  const handleExport = async () => {
    try {
      const cards = await getCards();
      const history = await getHistory();
      const revlog = await db.revlog.toArray();

      const safeSettings = {
        ...settings,
        tts: {
          ...settings.tts,
          googleApiKey: includeApiKeys ? settings.tts.googleApiKey : "",
          azureApiKey: includeApiKeys ? settings.tts.azureApiKey : "",
        },
        geminiApiKey: includeApiKeys ? settings.geminiApiKey : "",
      };

      const cleanCards = cards.map(({ user_id, ...rest }) => rest);
      const cleanRevlog = revlog.map(({ user_id, ...rest }) => rest);

      const exportData = {
        version: 2,
        date: new Date().toISOString(),
        cards: cleanCards,
        history,
        revlog: cleanRevlog,
        settings: safeSettings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup - ${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Export complete.");
    } catch (e) {
      toast.error("Export failed.");
    }
  };

  const handleRestoreBackup = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        toast.error("Invalid backup file.");
        return;
      }

      if (!data.cards || !Array.isArray(data.cards)) {
        toast.error("Invalid backup: missing cards.");
        return;
      }

      if (
        !confirm(
          `Replace current data with backup from ${data.date}?\nCards: ${data.cards.length} `
        )
      ) {
        return;
      }

      await clearAllCards();
      await clearHistory();
      await db.revlog.clear();
      await db.aggregated_stats.clear();

      const currentUserId = user?.id || "local-user";

      if (data.cards.length > 0) {
        const cardsWithUser = data.cards.map((c: any) => ({
          ...c,
          user_id: currentUserId,
        }));
        await saveAllCards(cardsWithUser);
      }

      if (data.history && typeof data.history === "object") {
        const languages = new Set(
          data.cards.map((c: any) => c.language).filter(Boolean)
        );
        const primaryLanguage =
          languages.size > 0
            ? (Array.from(languages)[0] as Language)
            : settings.language;
        await saveFullHistory(data.history, primaryLanguage);
      }

      if (data.revlog) {
        const revlogWithUser = data.revlog.map((r: any) => ({
          ...r,
          user_id: currentUserId,
        }));
        await db.revlog.bulkPut(revlogWithUser);
      }

      if (data.settings) {
        const restoredSettings: Partial<UserSettings> = {
          ...data.settings,
          geminiApiKey:
            importApiKeys && data.settings.geminiApiKey
              ? data.settings.geminiApiKey
              : settings.geminiApiKey,
          tts: {
            ...data.settings.tts,
            googleApiKey:
              importApiKeys && data.settings.tts?.googleApiKey
                ? data.settings.tts.googleApiKey
                : settings.tts.googleApiKey,
            azureApiKey:
              importApiKeys && data.settings.tts?.azureApiKey
                ? data.settings.tts.azureApiKey
                : settings.tts.azureApiKey,
          } as UserSettings["tts"],
        };

        setSettings((prev) => ({
          ...prev,
          ...restoredSettings,
          tts: { ...prev.tts, ...(restoredSettings.tts || {}) },
          fsrs: { ...prev.fsrs, ...(restoredSettings.fsrs || {}) },
        }));
      }

      const { recalculateAllStats } = await import(
        "@/db/repositories/aggregatedStatsRepository"
      );
      await recalculateAllStats();

      refreshDeckData();
      toast.success(`Restored ${data.cards.length} cards.`);
    } catch (error) {
      console.error("Backup restore failed:", error);
      toast.error("Failed to restore backup.");
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedCards = parseCardsFromCsv(text, settings.language);

      if (parsedCards.length === 0) {
        toast.error("No valid rows found.");
        return;
      }

      const existingSignatures = await getCardSignatures(settings.language);
      const seen = new Set(
        existingSignatures.map((card) =>
          signatureForCard(card.target_sentence, settings.language)
        )
      );

      const newCards = parsedCards.filter((card) => {
        const signature = signatureForCard(
          card.targetSentence,
          (card.language || settings.language) as Language
        );
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      });

      if (!newCards.length) {
        toast.info("All rows already exist.");
        return;
      }

      await saveAllCards(newCards);
      refreshDeckData();
      toast.success(`Imported ${newCards.length} cards.`);
    } catch (error) {
      console.error("CSV import failed", error);
      toast.error("Import failed.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <DataSettings
      onExport={handleExport}
      onImport={handleImport}
      csvInputRef={csvInputRef as React.RefObject<HTMLInputElement>}
      onRestoreBackup={handleRestoreBackup}
      jsonInputRef={jsonInputRef as React.RefObject<HTMLInputElement>}
      isRestoring={isRestoring}
      onSyncToCloud={handleSyncToCloud}
      isSyncingToCloud={isSyncingToCloud}
      syncComplete={syncComplete}
      onSyncthingSave={saveToSyncFile}
      onSyncthingLoad={loadFromSyncFile}
      isSyncthingSaving={isSyncthingSaving}
      isSyncthingLoading={isSyncthingLoading}
      lastSyncthingSync={lastSyncthingSync}
      includeApiKeys={includeApiKeys}
      onIncludeApiKeysChange={setIncludeApiKeys}
      importApiKeys={importApiKeys}
      onImportApiKeysChange={setImportApiKeys}
    />
  );
};

const DangerSettingsPage = () => {
  const settings = useSettingsStore();
  const {
    handleResetDeck,
    handleResetAccount,
    confirmResetDeck,
    confirmResetAccount,
  } = useAccountManagement();

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-medium text-foreground tracking-tight ">
          Danger Zone
        </h2>
        <span className="flex-1 h-px bg-linear-to-r from-destructive/30 via-border/30 to-transparent" />
      </div>

      <Card className="border-primary/30 hover:border-primary/50 transition-colors p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-full">
              <AlertCircle
                className="text-primary"
                size={18}
                strokeWidth={1.5}
              />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-medium text-foreground  tracking-wide">
                Reset Current Deck
              </h4>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Delete all cards, history, and progress for{" "}
                <span className="text-foreground">{settings.language}</span>.
                Restores beginner course.
              </p>
            </div>
          </div>
          <Button
            onClick={handleResetDeck}
            variant={confirmResetDeck ? "default" : "secondary"}
            className={cn(
              "w-full",
              confirmResetDeck && "bg-primary hover:bg-orange-600"
            )}
          >
            {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
          </Button>
        </div>
      </Card>

      <Separator className="my-8" />

      <Card className="border-destructive/30 hover:border-destructive/50 transition-colors p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
              <Trash2 className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className=" font-medium text-foreground">Delete Account</h3>
              <p className="text-xs text-muted-foreground/60 font-light max-w-[280px]">
                Permanently remove all data
              </p>
            </div>
          </div>
          <Button
            onClick={handleResetAccount}
            variant={confirmResetAccount ? "destructive" : "secondary"}
            className={cn(
              "w-full",
              confirmResetAccount && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {confirmResetAccount
              ? "Confirm Complete Reset"
              : "Reset Everything"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const SettingsRoute: React.FC = () => {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<GeneralSettingsFinal />} />
        <Route path="audio" element={<AudioSettingsPage />} />
        <Route path="study" element={<StudySettingsPage />} />
        <Route path="fsrs" element={<AlgorithmSettingsPage />} />
        <Route path="data" element={<DataSettingsPage />} />
        <Route path="danger" element={<DangerSettingsPage />} />
      </Route>
    </Routes>
  );
};
```

# src/features/study/components/AnalysisModal.tsx

```typescript
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AnalysisResult {
  originalText: string;
  definition: string;
  partOfSpeech: string;
  contextMeaning: string;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  result: AnalysisResult | null;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-card border border-border p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="space-y-3 border-b border-border/40 pb-6">
            <div className="flex justify-between items-start gap-6">
              <h2 className="text-3xl font-light tracking-tight text-foreground wrap-break-word">
                {result?.originalText}
              </h2>
              <Badge variant="outline" className="whitespace-nowrap shrink-0">
                {result?.partOfSpeech}
              </Badge>
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Definition
              </h3>
              <p className="text-lg font-light leading-relaxed text-foreground/90 wrap-break-word">
                {result?.definition}
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Context
              </h3>
              <div className="relative pl-4 border-l-2 border-primary/20">
                <p className="text-base italic text-muted-foreground/75 leading-relaxed wrap-break-word">
                  {result?.contextMeaning}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

# src/features/study/components/CramModal.tsx

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getTags } from "@/db/repositories/cardRepository";

interface CramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {
  const language = useSettingsStore((s) => s.language);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [limit, setLimit] = useState([50]);
  const navigate = useNavigate();

  const { data: tags = [] } = useQuery({
    queryKey: ["tags", language],
    queryFn: () => getTags(language),
    enabled: isOpen,
  });

  const handleStart = () => {
    const params = new URLSearchParams();
    params.set("mode", "cram");
    if (selectedTag && selectedTag !== "all") params.set("tag", selectedTag);
    params.set("limit", limit[0].toString());
    navigate(`/study?${params.toString()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0 bg-background border border-border  overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Cram Session
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review cards without affecting your long-term statistics.
            </DialogDescription>
          </div>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Filter by Tag
              </label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full h-10 px-3 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Cards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cards</SelectItem>
                  {tags.map((t: string) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Card Limit
                </label>
                <span className="text-sm font-mono font-medium bg-secondary px-2 py-0.5 rounded text-foreground">
                  {limit[0]} cards
                </span>
              </div>
              <Slider
                min={10}
                max={200}
                step={10}
                value={limit}
                onValueChange={setLimit}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                <span>10</span>
                <span>200</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/20 border-t border-border flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart} className="gap-2">
            Start Session <ArrowRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

# src/features/study/components/Flashcard.tsx

```typescript
import React, { useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, Language, LanguageId } from "@/types";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useCardText } from "@/features/collection/hooks/useCardText";
import { Mic, Volume2 } from "lucide-react";
import { FuriganaRenderer } from "@/components/ui/furigana-renderer";
import { useTextSelection } from "@/features/study/hooks/useTextSelection";
import { AnalysisModal } from "@/features/study/components/AnalysisModal";
import { SelectionMenu } from "@/features/study/components/SelectionMenu";
import { useFlashcardAudio } from "@/features/study/hooks/useFlashcardAudio";
import { useAIAnalysis } from "@/features/study/hooks/useAIAnalysis";
import { useCardInteraction } from "@/features/study/hooks/useCardInteraction";
import { Button } from "@/components/ui/button";
import { useCardSentence } from "@/features/study/hooks/useCardSentence";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

export const Flashcard = React.memo<FlashcardProps>(
  ({
    card,
    isFlipped,
    autoPlayAudio = false,
    blindMode = false,
    showTranslation = true,
    language = LanguageId.Polish,
    onAddCard,
  }) => {
    const { geminiApiKey, showWholeSentenceOnFront, tts } = useSettingsStore(
      useShallow((s) => ({
        geminiApiKey: s.geminiApiKey,
        showWholeSentenceOnFront: s.showWholeSentenceOnFront,
        tts: s.tts,
      }))
    );
    const { displayedTranslation, isGaslit, processText } = useCardText(card);
    const { selection, handleMouseUp, clearSelection } = useTextSelection();

    useEffect(() => {
      clearSelection();
    }, [card.id, clearSelection]);

    const { isRevealed, handleReveal, handleKeyDown } = useCardInteraction({
      cardId: card.id,
      blindMode,
      isFlipped,
    });

    const { speak, playSlow } = useFlashcardAudio({
      card,
      language,
      tts,
      isFlipped,
      autoPlayAudio,
    });

    const {
      isAnalyzing,
      analysisResult,
      isAnalysisOpen,
      setIsAnalysisOpen,
      isGeneratingCard,
      handleAnalyze,
      handleGenerateCard,
    } = useAIAnalysis({
      card,
      language,
      apiKey: geminiApiKey,
      selection,
      clearSelection,
      onAddCard,
    });

    const displayedSentence = processText(card.targetSentence);

    const fontSizeClass = useMemo(() => {
      const len = displayedSentence.length;
      if (len < 6) return "text-5xl md:text-7xl font-normal tracking-tight";
      if (len < 15) return "text-4xl md:text-6xl font-normal tracking-tight";
      if (len < 30) return "text-3xl md:text-5xl font-light";
      if (len < 60) return "text-2xl md:text-4xl font-light";
      return "text-xl md:text-3xl font-light";
    }, [displayedSentence]);

    const parsedContent = useCardSentence(card, language);

    const RenderedSentence = useMemo(() => {
      const baseClasses = cn(
        "text-center text-balance select-text leading-[1.3] text-foreground font-light",
        fontSizeClass
      );

      if (!isRevealed) {
        return (
          <div
            onClick={handleReveal}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Reveal card content"
            className="cursor-pointer group flex flex-col items-center gap-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {blindMode && (
              <Button
                variant="outline"
                size="icon"
                className="h-20 w-20 rounded-xl"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  speak();
                }}
              >
                <Mic
                  size={28}
                  strokeWidth={1}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                />
              </Button>
            )}
            <p
              className={cn(
                baseClasses,
                "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-500"
              )}
            >
              {card.targetWord && !showWholeSentenceOnFront
                ? processText(card.targetWord)
                : displayedSentence}
            </p>
          </div>
        );
      }

      if (!isFlipped && card.targetWord && !showWholeSentenceOnFront) {
        if (language === LanguageId.Japanese) {
          return (
            <FuriganaRenderer
              text={card.targetWord}
              className={baseClasses}
              processText={processText}
            />
          );
        }
        return <p className={baseClasses}>{processText(card.targetWord)}</p>;
      }

      if (parsedContent.type === "japanese") {
        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {parsedContent.segments.map((segment, i) => {
              const isTarget = parsedContent.targetIndices.has(i);
              if (segment.furigana) {
                return (
                  <ruby
                    key={i}
                    className="group/ruby"
                    style={{ rubyAlign: "center" }}
                  >
                    <span className={isTarget ? "text-primary/90" : ""}>
                      {processText(segment.text)}
                    </span>
                    <rt
                      className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center"
                      style={{ textAlign: "center" }}
                    >
                      {processText(segment.furigana)}
                    </rt>
                  </ruby>
                );
              }
              return (
                <span key={i} className={isTarget ? "text-primary/90" : ""}>
                  {processText(segment.text)}
                </span>
              );
            })}
          </div>
        );
      }

      if (parsedContent.type === "highlight") {
        return (
          <p className={baseClasses}>
            {parsedContent.parts.map((part, i) =>
              part.toLowerCase() ===
              parsedContent.matchedWord?.toLowerCase() ? (
                <span key={i} className="text-primary/90 font-bold">
                  {processText(part)}
                </span>
              ) : (
                <span key={i}>{processText(part)}</span>
              )
            )}
          </p>
        );
      }

      return <p className={baseClasses}>{displayedSentence}</p>;
    }, [
      isRevealed,
      isFlipped,
      blindMode,
      showWholeSentenceOnFront,
      fontSizeClass,
      parsedContent,
      handleReveal,
      handleKeyDown,
      speak,
      processText,
      card.targetWord,
      displayedSentence,
      language,
    ]);

    const containerClasses = cn(
      "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full"
    );

    return (
      <>
        <div
          className={containerClasses}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
        >
          {/* Main content */}
          <div
            className={cn(
              "w-full px-8 md:px-16 flex flex-col items-center z-10 transition-all duration-700 ease-out",
              isFlipped && "-translate-y-[80%]"
            )}
          >
            {RenderedSentence}

            {isRevealed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={speak}
                className="mt-6 text-muted-foreground/40 hover:text-primary/70"
              >
                <Volume2
                  size={24}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-all duration-300",
                    playSlow && "text-primary"
                  )}
                />
              </Button>
            )}
          </div>

          {/* Translation reveal */}
          {isFlipped && (
            <div className="absolute top-1/2 left-0 right-0 bottom-4 text-center flex flex-col items-center gap-3 z-0 pointer-events-none overflow-y-auto">
              {showTranslation && (
                <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {card.targetWord && (
                    <div className="flex flex-col items-center gap-0.5 mb-1">
                      <div className="flex items-center gap-2">
                        <FuriganaRenderer
                          text={card.targetWord}
                          className="text-xl md:text-2xl font-light text-primary/90"
                          processText={processText}
                        />
                      </div>
                      {card.targetWordTranslation && (
                        <span className="text-base text-muted-foreground/80 font-light italic">
                          {card.targetWordTranslation}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="max-w-3xl">
                    <p
                      className={cn(
                        "text-base md:text-xl text-foreground/70 font-light italic text-center leading-relaxed text-balance transition-colors duration-300",
                        isGaslit
                          ? "text-destructive/70"
                          : "group-hover:text-foreground/85"
                      )}
                    >
                      {processText(displayedTranslation)}
                    </p>
                  </div>
                  {isGaslit && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-6 -right-8 opacity-80"
                    >
                      Suspicious
                    </Badge>
                  )}
                </div>
              )}

              {card.notes && (
                <div className="mt-2 pointer-events-auto shrink-0 px-6">
                  <FuriganaRenderer
                    text={card.notes}
                    className="text-xs  font-light text-foreground text-center tracking-wide leading-relaxed block"
                    processText={processText}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {selection && (
          <SelectionMenu
            top={selection.top}
            left={selection.left}
            onAnalyze={handleAnalyze}
            onGenerateCard={onAddCard ? handleGenerateCard : undefined}
            isAnalyzing={isAnalyzing}
            isGeneratingCard={isGeneratingCard}
          />
        )}

        <AnalysisModal
          isOpen={isAnalysisOpen}
          onClose={setIsAnalysisOpen}
          result={analysisResult}
        />
      </>
    );
  }
);
```

# src/features/study/components/SelectionMenu.tsx

```typescript
import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { ButtonLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

interface SelectionMenuProps {
  top: number;
  left: number;
  onAnalyze: () => void;
  onGenerateCard?: () => void;
  isAnalyzing: boolean;
  isGeneratingCard: boolean;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  top,
  left,
  onAnalyze,
  onGenerateCard,
  isAnalyzing,
  isGeneratingCard,
}) => {
  return (
    <div
      className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onAnalyze}
        disabled={isAnalyzing || isGeneratingCard}
        className="bg-card shadow-sm gap-2"
      >
        {isAnalyzing ? (
          <ButtonLoader />
        ) : (
          <Sparkles size={14} className="text-primary" />
        )}
        <span>Analyze</span>
      </Button>

      {onGenerateCard && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateCard}
          disabled={isAnalyzing || isGeneratingCard}
          className="bg-card shadow-sm gap-2"
        >
          {isGeneratingCard ? (
            <ButtonLoader />
          ) : (
            <Plus size={14} className="text-primary" />
          )}
          <span>Create Card</span>
        </Button>
      )}
    </div>
  );
};
```

# src/features/study/components/StudyCardArea.tsx

```typescript
import React from "react";
import { Card, Language } from "@/types";
import { Flashcard } from "./Flashcard";
import { StudyFeedback } from "./StudyFeedback";
import { XpFeedback } from "../hooks/useXpSession";

interface StudyCardAreaProps {
  feedback: XpFeedback | null;
  currentCard: Card;
  isFlipped: boolean;
  autoPlayAudio: boolean;
  blindMode: boolean;
  showTranslation: boolean;
  language: Language;
  onAddCard?: (card: Card) => void;
}

export const StudyCardArea: React.FC<StudyCardAreaProps> = React.memo(
  ({
    feedback,
    currentCard,
    isFlipped,
    autoPlayAudio,
    blindMode,
    showTranslation,
    language,
    onAddCard,
  }) => {
    return (
      <main className="flex-1 mx-2  relative flex flex-col items-center justify-center py-8 overflow-hidden">
        <StudyFeedback feedback={feedback} />

        <Flashcard
          card={currentCard}
          isFlipped={isFlipped}
          autoPlayAudio={autoPlayAudio}
          blindMode={blindMode}
          showTranslation={showTranslation}
          language={language}
          onAddCard={onAddCard}
        />
      </main>
    );
  }
);
```

# src/features/study/components/StudyFeedback.tsx

```typescript
import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import clsx from "clsx";
import { XpFeedback } from "../hooks/useXpSession";

export const StudyFeedback = React.memo(
  ({ feedback }: { feedback: XpFeedback | null }) => {
    const [visible, setVisible] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<XpFeedback | null>(
      null
    );

    useEffect(() => {
      if (feedback) {
        setCurrentFeedback(feedback);
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 1500);
        return () => clearTimeout(timer);
      }
    }, [feedback]);

    if (!currentFeedback) return null;

    return (
      <div
        key={currentFeedback.id}
        className={clsx(
          "absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        {/* Feedback panel */}
        <div
          className={clsx(
            "relative flex items-center gap-3 px-4 py-2 rounded-md border shadow-sm bg-background",
            currentFeedback.isBonus
              ? "border-primary/20 text-primary"
              : "border-border text-foreground"
          )}
        >
          <Zap
            size={14}
            className={currentFeedback.isBonus ? "fill-primary" : "fill-none"}
          />
          <span className="text-sm font-medium">{currentFeedback.message}</span>
        </div>
      </div>
    );
  }
);
```

# src/features/study/components/StudyFooter.tsx

```typescript
import React from "react";
import { Grade } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface StudyFooterProps {
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean) => void;
  isProcessing: boolean;
  binaryRatingMode: boolean;
  onGrade: (grade: Grade) => void;
  intervals?: Record<Grade, string>;
}

export const StudyFooter: React.FC<StudyFooterProps> = React.memo(
  ({
    isFlipped,
    setIsFlipped,
    isProcessing,
    binaryRatingMode,
    onGrade,
    intervals,
  }) => {
    return (
      <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] bg-linear-to-t from-muted/30 to-background border-t border-border/30">
        <div className="min-h-20 md:min-h-24 h-auto w-full max-w-3xl mx-auto py-4 px-4 md:px-6 flex flex-col">
          {!isFlipped ? (
            <Button
              onClick={() => setIsFlipped(true)}
              disabled={isProcessing}
              variant="default"
              className="w-full flex-1 text-base md:text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Eye size={18} className="mr-2" />
              Show Answer
              <kbd className="ml-3 px-2 py-0.5 text-[10px] font-medium bg-primary-foreground/20 rounded border border-primary-foreground/10 max-md:hidden">
                SPACE
              </kbd>
            </Button>
          ) : binaryRatingMode ? (
            <div className="grid grid-cols-2 w-full gap-3 flex-1">
              <AnswerButton
                label="Again"
                shortcut="1"
                grade="Again"
                onClick={() => onGrade("Again")}
                disabled={isProcessing}
                interval={intervals?.Again}
              />
              <AnswerButton
                label="Good"
                shortcut="Space"
                grade="Good"
                onClick={() => onGrade("Good")}
                disabled={isProcessing}
                interval={intervals?.Good}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 w-full gap-2 md:gap-3 flex-1">
              <AnswerButton
                label="Again"
                shortcut="1"
                grade="Again"
                onClick={() => onGrade("Again")}
                disabled={isProcessing}
                interval={intervals?.Again}
              />
              <AnswerButton
                label="Hard"
                shortcut="2"
                grade="Hard"
                onClick={() => onGrade("Hard")}
                disabled={isProcessing}
                interval={intervals?.Hard}
              />
              <AnswerButton
                label="Good"
                shortcut="3"
                grade="Good"
                onClick={() => onGrade("Good")}
                disabled={isProcessing}
                interval={intervals?.Good}
              />
              <AnswerButton
                label="Easy"
                shortcut="4"
                grade="Easy"
                onClick={() => onGrade("Easy")}
                disabled={isProcessing}
                interval={intervals?.Easy}
              />
            </div>
          )}
        </div>
      </footer>
    );
  }
);

const gradeStyles: Record<Grade, { bg: string; hover: string; text: string }> =
  {
    Again: {
      bg: "bg-red-500/10 border-red-800/20",
      hover: "hover:bg-red-500/20 hover:border-red-500/30",
      text: "text-red-700 dark:text-red-400",
    },
    Hard: {
      bg: "bg-amber-500/10 border-amber-800/20",
      hover: "hover:bg-amber-500/20 hover:border-amber-500/30",
      text: "text-amber-700 dark:text-amber-400",
    },
    Good: {
      bg: "bg-green-500/10 border-green-800/20",
      hover: "hover:bg-green-500/20 hover:border-green-500/30",
      text: "text-green-700 dark:text-green-400",
    },
    Easy: {
      bg: "bg-emerald-500/10 border-emerald-800/20",
      hover: "hover:bg-emerald-500/20 hover:border-emerald-500/30",
      text: "text-emerald-700 dark:text-emerald-400",
    },
  };

const AnswerButton = React.memo(
  ({
    label,
    shortcut,
    grade,
    className,
    onClick,
    disabled,
    interval,
  }: {
    label: string;
    shortcut: string;
    grade: Grade;
    className?: string;
    onClick: () => void;
    disabled: boolean;
    interval?: string;
  }) => {
    const style = gradeStyles[grade];

    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="outline"
        className={cn(
          "h-full flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all",
          "hover:scale-[1.02] active:scale-[0.98]",
          style.bg,
          style.hover,
          style.text,
          className
        )}
      >
        <span className="text-sm md:text-base font-bold">{label}</span>
        {interval && (
          <span className="text-[10px] md:text-xs font-medium opacity-60">
            {interval}
          </span>
        )}
        <kbd className="text-[9px] font-medium opacity-40 bg-foreground/5 px-1.5 py-0.5 rounded mt-0.5 max-md:hidden">
          {shortcut}
        </kbd>
      </Button>
    );
  }
);
```

# src/features/study/components/StudyHeader.tsx

```typescript
import React from "react";
import {
  Zap,
  TrendingUp,
  Pencil,
  Trash2,
  Archive,
  Undo2,
  X,
  Bookmark,
  Sparkles,
  MoreVertical,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from "clsx";
import { cn } from "@/lib/utils";

interface StudyHeaderProps {
  counts: { unseen: number; learning: number; lapse: number; mature: number };
  currentStatus: { label: string; className: string } | null;
  sessionXp: number;
  multiplierInfo: { value: number; label: string };
  isProcessing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUndo: () => void;
  onExit: () => void;
  canUndo: boolean;
  isBookmarked?: boolean;
  onBookmark: (pressed: boolean) => void;
}

const QueueBadge = ({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "blue" | "amber" | "red" | "emerald";
}) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  const dotClasses = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    emerald: "bg-emerald-500",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 border transition-all hover:scale-105",
        colorClasses[color]
      )}
    >
      <span
        className={cn("size-1.5 rounded-full animate-pulse", dotClasses[color])}
      />
      <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold tabular-nums">{count}</span>
    </Badge>
  );
};

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "ghost",
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "outline";
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={variant}
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn("size-8 rounded-lg", className)}
      >
        <Icon size={15} strokeWidth={1.5} />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {label}
    </TooltipContent>
  </Tooltip>
);

export const StudyHeader: React.FC<StudyHeaderProps> = React.memo(
  ({
    counts,
    currentStatus,
    sessionXp,
    multiplierInfo,
    isProcessing,
    onEdit,
    onDelete,
    onArchive,
    onUndo,
    onExit,
    canUndo,
    isBookmarked,
    onBookmark,
  }) => {
    return (
      <TooltipProvider delayDuration={300}>
        <header className="relative h-14 md:h-16 px-3 md:px-5 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-3 bg-linear-to-b from-background to-background/80 backdrop-blur-sm border-b border-border/30">
          {/* Queue statistics */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <QueueBadge label="New" count={counts.unseen} color="blue" />
            <QueueBadge label="Learn" count={counts.learning} color="amber" />
            <QueueBadge label="Lapse" count={counts.lapse} color="red" />
            <QueueBadge label="Review" count={counts.mature} color="emerald" />

            {currentStatus && (
              <>
                <Separator
                  orientation="vertical"
                  className="h-6 mx-1 hidden sm:block"
                />
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-1 border transition-all animate-in fade-in zoom-in duration-300",
                    currentStatus.className
                  )}
                >
                  <span className="text-[10px] font-bold tracking-wider">
                    {currentStatus.label}
                  </span>
                </Badge>
              </>
            )}
          </div>

          {/* XP display - centered */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 ">
              <div className="relative">
                <Zap
                  size={14}
                  strokeWidth={2.5}
                  className="text-primary fill-primary/20"
                />
              </div>
              <span className="text-sm font-semibold tracking-wide tabular-nums text-foreground">
                {sessionXp.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70">
                XP
              </span>

              {multiplierInfo.value > 1.0 && (
                <>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <span>×{multiplierInfo.value.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-0.5">
              <ActionButton
                icon={Pencil}
                label="Edit Card (E)"
                onClick={onEdit}
                disabled={isProcessing}
              />
              <ActionButton
                icon={Trash2}
                label="Delete Card"
                onClick={onDelete}
                disabled={isProcessing}
                className="hover:text-destructive hover:bg-destructive/10"
              />
              <ActionButton
                icon={Archive}
                label="Mark as Known"
                onClick={onArchive}
                disabled={isProcessing}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={isBookmarked}
                    onPressedChange={onBookmark}
                    aria-label="Toggle bookmark"
                    size="sm"
                    className="size-8 rounded-lg data-[state=on]:bg-amber-500/15 hover:data-[state=on]:bg-amber-500/25 data-[state=on]:text-amber-600 dark:data-[state=on]:text-amber-400"
                  >
                    <Bookmark
                      size={15}
                      strokeWidth={isBookmarked ? 2.5 : 1.5}
                      className={clsx(
                        "transition-all",
                        isBookmarked && "fill-current"
                      )}
                    />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isBookmarked ? "Remove Bookmark" : "Bookmark Card"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                  >
                    <MoreVertical size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit} disabled={isProcessing}>
                    <Pencil className="mr-2 size-4" />
                    <span>Edit Card</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onBookmark(!isBookmarked)}
                    disabled={isProcessing}
                  >
                    <Bookmark
                      className={cn(
                        "mr-2 size-4",
                        isBookmarked && "fill-current"
                      )}
                    />
                    <span>
                      {isBookmarked ? "Remove Bookmark" : "Bookmark Name"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onArchive} disabled={isProcessing}>
                    <Archive className="mr-2 size-4" />
                    <span>Mark as Known</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    disabled={isProcessing}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    <span>Delete Card</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {canUndo && (
              <ActionButton
                icon={Undo2}
                label="Undo (Z)"
                onClick={onUndo}
                className="text-muted-foreground hover:text-foreground"
              />
            )}

            <Separator orientation="vertical" className="h-5 mx-1.5" />

            <ActionButton
              icon={X}
              label="Exit Session (Esc)"
              onClick={onExit}
              className="hover:bg-destructive/10 hover:text-destructive"
            />
          </div>
        </header>
      </TooltipProvider>
    );
  }
);
```

# src/features/study/components/StudySession.tsx

```typescript
import React, { useMemo, useCallback, useState } from "react";
import { Card, Grade } from "@/types";
import { Progress } from "@/components/ui/progress";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useStudySession } from "../hooks/useStudySession";
import { useXpSession } from "../hooks/useXpSession";
import { CardXpPayload, CardRating } from "@/core/gamification/xp";
import { AddCardModal } from "@/features/collection/components/AddCardModal";
import { StudyHeader } from "./StudyHeader";
import { StudyFooter } from "./StudyFooter";
import { StudyCardArea } from "./StudyCardArea";
import { StudySessionSummary } from "./StudySessionSummary";
import { StudySessionWaiting } from "./StudySessionWaiting";
import { useStudyShortcuts } from "../hooks/useStudyShortcuts";
import { useReviewIntervals } from "../hooks/useReviewIntervals";

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: "again",
  Hard: "hard",
  Good: "good",
  Easy: "easy",
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === 0 || (state === undefined && card.status === "new"))
        acc.unseen++;
      else if (
        state === 1 ||
        (state === undefined && card.status === "learning")
      )
        acc.learning++;
      else if (state === 3) acc.lapse++;
      else acc.mature++;
      return acc;
    },
    { unseen: 0, learning: 0, lapse: 0, mature: 0 }
  );
};

interface StudySessionProps {
  dueCards: Card[];
  reserveCards?: Card[];
  onUpdateCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onRecordReview: (
    oldCard: Card,
    newCard: Card,
    grade: Grade,
    xpPayload?: CardXpPayload
  ) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
  onAddCard?: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = React.memo(
  ({
    dueCards,
    reserveCards = [],
    onUpdateCard,
    onDeleteCard,
    onRecordReview,
    onExit,
    onComplete,
    onUndo,
    canUndo,
    isCramMode = false,
    dailyStreak,
    onAddCard,
  }) => {
    const {
      autoPlayAudio,
      blindMode,
      showTranslationAfterFlip,
      language,
      binaryRatingMode,
      cardOrder,
      learningSteps,
      fsrs,
      ignoreLearningStepsWhenNoCards,
    } = useSettingsStore(
      useShallow((s) => ({
        autoPlayAudio: s.autoPlayAudio,
        blindMode: s.blindMode,
        showTranslationAfterFlip: s.showTranslationAfterFlip,
        language: s.language,
        binaryRatingMode: s.binaryRatingMode,
        cardOrder: s.cardOrder,
        learningSteps: s.learningSteps,
        fsrs: s.fsrs,
        ignoreLearningStepsWhenNoCards: s.ignoreLearningStepsWhenNoCards,
      }))
    );

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const {
      sessionXp,
      sessionStreak,
      multiplierInfo,
      feedback,
      processCardResult,
      subtractXp,
    } = useXpSession(dailyStreak, isCramMode);

    const lastXpEarnedRef = React.useRef<number>(0);

    const enhancedRecordReview = useCallback(
      (card: Card, updatedCard: Card, grade: Grade) => {
        const rating = mapGradeToRating(grade);
        const xpResult = processCardResult(rating);
        lastXpEarnedRef.current = xpResult.totalXp;
        const payload: CardXpPayload = {
          ...xpResult,
          rating,
          streakAfter: rating === "again" ? 0 : sessionStreak + 1,
          isCramMode,
          dailyStreak,
          multiplierLabel: multiplierInfo.label,
        };
        onRecordReview(card, updatedCard, grade, payload);
      },
      [
        onRecordReview,
        processCardResult,
        sessionStreak,
        isCramMode,
        dailyStreak,
        multiplierInfo,
      ]
    );

    const handleUndoWithXp = useCallback(() => {
      if (onUndo && lastXpEarnedRef.current > 0) {
        subtractXp(lastXpEarnedRef.current);
        lastXpEarnedRef.current = 0;
      }
      onUndo?.();
    }, [onUndo, subtractXp]);

    const {
      sessionCards,
      currentCard,
      currentIndex,
      isFlipped,
      setIsFlipped,
      sessionComplete,
      handleGrade,
      handleMarkKnown,
      handleUndo,
      progress,
      isProcessing,
      isWaiting,
      removeCardFromSession,
      updateCardInSession,
    } = useStudySession({
      dueCards,
      reserveCards,
      cardOrder,
      ignoreLearningStepsWhenNoCards: !!ignoreLearningStepsWhenNoCards,
      fsrs,
      learningSteps,
      onUpdateCard,
      onRecordReview: enhancedRecordReview,
      canUndo,
      onUndo: handleUndoWithXp,
    });

    const handleBookmark = useCallback(
      (pressed: boolean) => {
        if (!currentCard) return;
        const updatedCard = { ...currentCard, isBookmarked: pressed };
        onUpdateCard(updatedCard);
        updateCardInSession(updatedCard);
      },
      [currentCard, onUpdateCard, updateCardInSession]
    );

    const handleDelete = useCallback(async () => {
      if (!currentCard) return;
      if (confirm("Are you sure you want to delete this card?")) {
        setIsDeleting(true);
        try {
          await onDeleteCard(currentCard.id);
          removeCardFromSession(currentCard.id);
        } catch (error) {
          console.error("Failed to delete card", error);
        } finally {
          setIsDeleting(false);
        }
      }
    }, [currentCard, removeCardFromSession, onDeleteCard]);

    const counts = useMemo(
      () => getQueueCounts(sessionCards.slice(currentIndex)),
      [sessionCards, currentIndex]
    );

    const currentStatus = useMemo(() => {
      if (!currentCard) return null;
      if (isCramMode)
        return {
          label: "CRAM",
          className: "text-chart-5 border-chart-5/20 bg-chart-5/10",
        };

      const s = currentCard.state;

      if (s === 0 || (s === undefined && currentCard.status === "new")) {
        return {
          label: "NEW",
          className: "text-chart-1 border-chart-1/20 bg-chart-1/10",
        };
      }
      if (s === 1 || (s === undefined && currentCard.status === "learning")) {
        return {
          label: "LRN",
          className: "text-chart-2 border-chart-2/20 bg-chart-2/10",
        };
      }
      if (s === 3) {
        return {
          label: "LAPSE",
          className: "text-destructive border-destructive/20 bg-destructive/10",
        };
      }
      return {
        label: "REV",
        className: "text-chart-3 border-chart-3/20 bg-chart-3/10",
      };
    }, [currentCard, isCramMode]);

    const intervals = useReviewIntervals(currentCard, fsrs, learningSteps);

    useStudyShortcuts({
      currentCardId: currentCard?.id,
      sessionComplete,
      isFlipped,
      setIsFlipped,
      isProcessing,
      handleGrade,
      handleUndo: handleUndo,
      onExit,
      canUndo: !!canUndo,
      binaryRatingMode: !!binaryRatingMode,
    });

    if (isWaiting) {
      return <StudySessionWaiting onExit={onExit} />;
    }

    if (sessionComplete) {
      return (
        <StudySessionSummary
          cardsReviewed={currentIndex}
          sessionXp={sessionXp}
          sessionStreak={sessionStreak}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    }

    if (!currentCard) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <div className="relative h-2 w-full bg-card border-b border-primary/10 overflow-hidden">
          <Progress value={progress} className="h-full w-full rounded-none" />
        </div>

        <StudyHeader
          counts={counts}
          currentStatus={currentStatus}
          sessionXp={sessionXp}
          multiplierInfo={multiplierInfo}
          isProcessing={isProcessing || isDeleting}
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={handleDelete}
          onArchive={handleMarkKnown}
          onUndo={handleUndo}
          onExit={onExit}
          canUndo={!!canUndo}
          isBookmarked={currentCard?.isBookmarked}
          onBookmark={handleBookmark}
        />

        <StudyCardArea
          feedback={feedback}
          currentCard={currentCard}
          isFlipped={isFlipped}
          autoPlayAudio={autoPlayAudio || blindMode}
          blindMode={blindMode}
          showTranslation={showTranslationAfterFlip}
          language={language}
          onAddCard={onAddCard}
        />

        <StudyFooter
          isFlipped={isFlipped}
          setIsFlipped={setIsFlipped}
          isProcessing={isProcessing}
          binaryRatingMode={binaryRatingMode}
          onGrade={handleGrade}
          intervals={intervals}
        />

        <AddCardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onAdd={(updatedCard) => {
            onUpdateCard(updatedCard);
            setIsEditModalOpen(false);
          }}
          initialCard={currentCard}
        />
      </div>
    );
  }
);
```

# src/features/study/components/StudySessionSummary.tsx

```typescript
import React from "react";
import { Target, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudySessionSummaryProps {
  cardsReviewed: number;
  sessionXp: number;
  sessionStreak: number;
  onComplete?: () => void;
  onExit: () => void;
}

export const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({
  cardsReviewed,
  sessionXp,
  sessionStreak,
  onComplete,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500 p-4">
      <div className="text-center space-y-8 max-w-lg w-full">
        <div className="space-y-4">
          <h2 className="text-4xl font-light tracking-tight text-foreground">
            Session Complete
          </h2>
          <p className="text-muted-foreground">
            Great job! Here is your summary.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Target
                size={20}
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="text-3xl font-semibold tabular-nums">
                {cardsReviewed}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Cards
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Zap size={20} className="text-primary" strokeWidth={1.5} />
              <span className="text-3xl font-semibold text-primary tabular-nums">
                +{sessionXp}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                XP Earned
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6">
              <Sparkles
                size={20}
                className="text-muted-foreground"
                strokeWidth={1.5}
              />
              <span className="text-3xl font-semibold tabular-nums">
                {sessionStreak}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Streak
              </span>
            </CardContent>
          </Card>
        </div>

        <Button
          size="lg"
          onClick={() => (onComplete ? onComplete() : onExit())}
          className="w-full sm:w-auto min-w-[200px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
```

# src/features/study/components/StudySessionWaiting.tsx

```typescript
import React from "react";
import { Button } from "@/components/ui/button";

interface StudySessionWaitingProps {
  onExit: () => void;
}

export const StudySessionWaiting: React.FC<StudySessionWaitingProps> = ({
  onExit,
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
      <div className="text-center space-y-6 px-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            Waiting for learning steps...
          </h2>
          <p className="text-sm text-muted-foreground">
            Cards are cooling down. Take a short break.
          </p>
        </div>
        <Button onClick={onExit} variant="secondary" className="px-6">
          Exit Session
        </Button>
      </div>
    </div>
  );
};
```

# src/features/study/hooks/useAIAnalysis.ts

```typescript
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { aiService } from "@/lib/ai";
import { getCardByTargetWord } from "@/db/repositories/cardRepository";
import { db } from "@/db/dexie";
import { parseFurigana } from "@/lib/utils";
import { Card, Language, LanguageId } from "@/types";

interface UseAIAnalysisProps {
  card: Card;
  language: Language;
  apiKey?: string;
  selection: { text: string } | null;
  clearSelection: () => void;
  onAddCard?: (card: Card) => void;
}

export function useAIAnalysis({
  card,
  language,
  apiKey,
  selection,
  clearSelection,
  onAddCard,
}: UseAIAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    originalText: string;
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  useEffect(() => {
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
  }, [card.id]);

  const handleAnalyze = async () => {
    if (!selection) return;
    if (!apiKey) {
      toast.error("API Key required.");
      clearSelection();
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeWord(
        selection.text,
        card.targetSentence,
        language,
        apiKey
      );
      setAnalysisResult({ ...result, originalText: selection.text });
      setIsAnalysisOpen(true);
      clearSelection();
    } catch (e) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCard = async () => {
    if (!selection) return;
    if (!apiKey) {
      toast.error("API Key required.");
      clearSelection();
      return;
    }
    if (!onAddCard) {
      toast.error("Cannot add card from here.");
      clearSelection();
      return;
    }
    setIsGeneratingCard(true);
    try {
      const lemma = await aiService.lemmatizeWord(
        selection.text,
        language,
        apiKey
      );

      const existingCard = await getCardByTargetWord(lemma, language);
      if (existingCard) {
        const isPrioritizable = existingCard.status === "new";
        toast.error(`Card already exists for "${lemma}"`, {
          action: isPrioritizable
            ? {
                label: "Prioritize",
                onClick: async () => {
                  try {
                    await db.cards
                      .where("id")
                      .equals(existingCard.id)
                      .modify({ dueDate: new Date(0).toISOString() });
                    toast.success(`"${lemma}" moved to top of queue`);
                  } catch (e) {
                    toast.error("Failed to prioritize card");
                  }
                },
              }
            : undefined,
          duration: 5000,
        });
        clearSelection();
        setIsGeneratingCard(false);
        return;
      }

      const result = await aiService.generateSentenceForWord(
        lemma,
        language,
        apiKey
      );

      let targetSentence = result.targetSentence;
      if (language === LanguageId.Japanese && result.furigana) {
        targetSentence = parseFurigana(result.furigana)
          .map((s) => s.text)
          .join("");
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(4, 0, 0, 1);
      const newCard: Card = {
        id: uuidv4(),
        targetSentence,
        targetWord: lemma,
        targetWordTranslation: result.targetWordTranslation,
        targetWordPartOfSpeech: result.targetWordPartOfSpeech,
        nativeTranslation: result.nativeTranslation,
        notes: result.notes,
        furigana: result.furigana,
        language,
        status: "new",
        interval: 0,
        easeFactor: 2.5,
        dueDate: tomorrow.toISOString(),
        reps: 0,
        lapses: 0,
        tags: ["AI-Gen", "From-Study"],
      };

      onAddCard(newCard);
      toast.success(`Card created for "${lemma}" — scheduled for tomorrow`);
      clearSelection();
    } catch (e) {
      toast.error("Failed to generate card.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    isAnalysisOpen,
    setIsAnalysisOpen,
    isGeneratingCard,
    handleAnalyze,
    handleGenerateCard,
  };
}
```

# src/features/study/hooks/useCardInteraction.ts

```typescript
import { useState, useEffect, useCallback } from "react";

interface UseCardInteractionProps {
  cardId: string;
  blindMode: boolean;
  isFlipped: boolean;
}

export function useCardInteraction({
  cardId,
  blindMode,
  isFlipped,
}: UseCardInteractionProps) {
  const [isRevealed, setIsRevealed] = useState(!blindMode);

  useEffect(() => {
    setIsRevealed(!blindMode);
  }, [cardId, blindMode]);

  useEffect(() => {
    if (isFlipped) setIsRevealed(true);
  }, [isFlipped]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsRevealed(true);
    }
  }, []);

  return {
    isRevealed,
    setIsRevealed,
    handleReveal,
    handleKeyDown,
  };
}
```

# src/features/study/hooks/useCardSentence.ts

```typescript
import { useMemo } from "react";
import { Card, Language, LanguageId } from "@/types";
import {
  parseFurigana,
  findInflectedWordInSentence,
  escapeRegExp,
} from "@/lib/utils";

export interface FuriganaSegment {
  text: string;
  furigana?: string;
}

export type JapaneseStructure = {
  type: "japanese";
  segments: FuriganaSegment[];
  targetIndices: Set<number>;
};

export type HighlightStructure = {
  type: "highlight";
  parts: string[];
  matchedWord: string;
};

export type PlainStructure = {
  type: "plain";
};

export type CardSentenceStructure =
  | JapaneseStructure
  | HighlightStructure
  | PlainStructure;

export const useCardSentence = (
  card: Card,
  languageOverride?: Language
): CardSentenceStructure => {
  return useMemo(() => {
    const language = languageOverride ?? card.language;
    const displayedSentence = card.targetSentence;

    if (language === LanguageId.Japanese) {
      const hasFuriganaInDedicatedField =
        card.furigana && /\[.+?\]/.test(card.furigana);
      const hasFuriganaInSentence =
        card.targetSentence && /\[.+?\]/.test(card.targetSentence);

      let furiganaSource: string | undefined;
      if (hasFuriganaInDedicatedField) {
        const furiganaPlainText = parseFurigana(card.furigana!)
          .map((s) => s.text)
          .join("");
        const sentencePlainText = card.targetSentence || "";
        if (furiganaPlainText.length >= sentencePlainText.length * 0.5) {
          furiganaSource = card.furigana;
        }
      }

      if (!furiganaSource && hasFuriganaInSentence) {
        furiganaSource = card.targetSentence;
      }

      if (!furiganaSource) {
        furiganaSource = card.targetSentence;
      }

      if (furiganaSource) {
        const segments = parseFurigana(furiganaSource);
        const hasFurigana = segments.some((s) => s.furigana);

        if (hasFurigana) {
          const targetWordPlain = card.targetWord
            ? parseFurigana(card.targetWord)
                .map((s) => s.text)
                .join("")
            : null;

          const segmentTexts = segments.map((s) => s.text);
          const fullText = segmentTexts.join("");
          const targetIndices = new Set<number>();

          if (targetWordPlain) {
            let targetStart = fullText.indexOf(targetWordPlain);
            let matchedWordLength = targetWordPlain.length;

            if (targetStart === -1) {
              const matchedWord = findInflectedWordInSentence(
                targetWordPlain,
                fullText
              );
              if (matchedWord) {
                targetStart = fullText.indexOf(matchedWord);
                matchedWordLength = matchedWord.length;
              }
            }

            if (targetStart !== -1) {
              const targetEnd = targetStart + matchedWordLength;
              let charIndex = 0;
              for (let i = 0; i < segments.length; i++) {
                const segmentStart = charIndex;
                const segmentEnd = charIndex + segments[i].text.length;
                if (segmentStart < targetEnd && segmentEnd > targetStart) {
                  targetIndices.add(i);
                }
                charIndex = segmentEnd;
              }
            }
          }

          return {
            type: "japanese",
            segments,
            targetIndices,
          };
        }
      }
    }

    if (card.targetWord) {
      const targetWordPlain = parseFurigana(card.targetWord)
        .map((s) => s.text)
        .join("");

      const matchedWord = findInflectedWordInSentence(
        targetWordPlain,
        displayedSentence
      );

      if (matchedWord) {
        const wordBoundaryRegex = new RegExp(
          `(\\b${escapeRegExp(matchedWord)}\\b)`,
          "gi"
        );
        const parts = displayedSentence.split(wordBoundaryRegex);
        return {
          type: "highlight",
          parts,
          matchedWord,
        };
      }
    }

    return { type: "plain" };
  }, [
    card.targetSentence,
    card.targetWord,
    card.furigana,
    card.language,
    languageOverride,
  ]);
};
```

# src/features/study/hooks/useFlashcardAudio.ts

```typescript
import { useState, useCallback, useRef, useEffect } from "react";
import { ttsService } from "@/lib/tts";
import { parseFurigana } from "@/lib/utils";
import { Card, Language } from "@/types";
import { UserSettings } from "@/types";

interface UseFlashcardAudioProps {
  card: Card;
  language: Language;
  tts: UserSettings["tts"];
  isFlipped: boolean;
  autoPlayAudio: boolean;
}

export function useFlashcardAudio({
  card,
  language,
  tts,
  isFlipped,
  autoPlayAudio,
}: UseFlashcardAudioProps) {
  const [playSlow, setPlaySlow] = useState(false);
  const playSlowRef = useRef(playSlow);
  const lastSpokenCardId = useRef<string | null>(null);

  useEffect(() => {
    playSlowRef.current = playSlow;
  }, [playSlow]);

  useEffect(() => {
    setPlaySlow(false);
  }, [card.id]);

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [card.id]);

  const getPlainTextForTTS = useCallback((text: string): string => {
    const segments = parseFurigana(text);
    return segments.map((s) => s.text).join("");
  }, []);

  const speak = useCallback(() => {
    const effectiveRate = playSlowRef.current
      ? Math.max(0.25, tts.rate * 0.6)
      : tts.rate;
    const effectiveSettings = { ...tts, rate: effectiveRate };
    const plainText = getPlainTextForTTS(card.targetSentence);

    ttsService.speak(plainText, language, effectiveSettings).catch((err) => {
      console.error("TTS speak error:", err);
    });
    setPlaySlow((prev) => !prev);
  }, [card.targetSentence, language, tts, getPlainTextForTTS]);

  useEffect(() => {
    if (autoPlayAudio && isFlipped && lastSpokenCardId.current !== card.id) {
      speak();
      lastSpokenCardId.current = card.id;
    }
  }, [card.id, autoPlayAudio, isFlipped, speak]);

  return { speak, playSlow };
}
```

# src/features/study/hooks/useReviewIntervals.ts

```typescript
import { useMemo } from "react";
import { Card, Grade, UserSettings } from "@/types";
import { calculateNextReview } from "@/core/srs/scheduler";
import { formatInterval } from "@/utils/formatInterval";
import { parseISO, differenceInMilliseconds } from "date-fns";

export const useReviewIntervals = (
  card: Card | undefined,
  fsrs: UserSettings["fsrs"],
  learningSteps: number[]
): Record<Grade, string> => {
  return useMemo(() => {
    if (!card) {
      return { Again: "", Hard: "", Good: "", Easy: "" };
    }

    const now = new Date();
    const calculate = (grade: Grade) => {
      try {
        const next = calculateNextReview(card, grade, fsrs, learningSteps);
        const due = parseISO(next.dueDate);
        if (isNaN(due.getTime())) {
          console.warn(
            "[useReviewIntervals] Invalid dueDate from calculateNextReview:",
            next.dueDate
          );
          return "<1m";
        }
        const diff = differenceInMilliseconds(due, now);
        return formatInterval(Math.max(0, diff));
      } catch (error) {
        console.error(
          "[useReviewIntervals] Error calculating interval:",
          error
        );
        return "<1m";
      }
    };

    return {
      Again: calculate("Again"),
      Hard: calculate("Hard"),
      Good: calculate("Good"),
      Easy: calculate("Easy"),
    };
  }, [card, fsrs, learningSteps]);
};
```

# src/features/study/hooks/useStudySession.ts

```typescript
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Card, CardStatus, Grade, UserSettings } from "@/types";
import { calculateNextReview } from "@/core/srs/scheduler";
import { isNewCard } from "@/services/studyLimits";
import { sortCards } from "@/core/srs/cardSorter";

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  cardOrder: UserSettings["cardOrder"];
  ignoreLearningStepsWhenNoCards: boolean;
  fsrs: UserSettings["fsrs"];
  learningSteps: UserSettings["learningSteps"];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, updatedCard: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

import {
  SessionState,
  checkSchedule,
  getInitialStatus,
  reducer,
} from "../logic/sessionReducer";

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [],
  cardOrder,
  ignoreLearningStepsWhenNoCards,
  fsrs,
  learningSteps,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const initializeState = useCallback(
    (
      initialCards: Card[],
      initialReserve: Card[],
      initialOrder: UserSettings["cardOrder"],
      initialIgnoreLearningSteps: boolean
    ): SessionState => {
      const order = initialOrder || "newFirst";
      const sortedCards =
        initialCards.length > 0 ? sortCards(initialCards, order) : [];

      const initialState: SessionState = {
        status: getInitialStatus(sortedCards),
        cards: sortedCards,
        reserveCards: initialReserve,
        currentIndex: 0,
        history: [],
      };

      return checkSchedule(
        initialState,
        new Date(),
        initialIgnoreLearningSteps
      );
    },
    []
  );

  const [state, dispatch] = useReducer(
    reducer,
    {
      status: "COMPLETE",
      cards: dueCards,
      reserveCards: initialReserve,
      currentIndex: 0,
      history: [],
    },
    () =>
      initializeState(
        dueCards,
        initialReserve,
        cardOrder,
        ignoreLearningStepsWhenNoCards
      )
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (dueCards.length > 0) {
      const order = cardOrder || "newFirst";
      const sortedCards = sortCards(dueCards, order);

      dispatch({
        type: "INIT",
        cards: sortedCards,
        reserve: initialReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    }
  }, [dueCards, initialReserve, cardOrder, ignoreLearningStepsWhenNoCards]);

  useEffect(() => {
    if (state.status === "WAITING") {
      const timer = setTimeout(() => {
        dispatch({
          type: "TICK",
          now: new Date(),
          ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.status, ignoreLearningStepsWhenNoCards]);

  const currentCard = state.cards[state.currentIndex];

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (state.status !== "FLIPPED") return;

      dispatch({ type: "START_PROCESSING" });

      try {
        const updatedCard = calculateNextReview(
          currentCard,
          grade,
          fsrs,
          learningSteps
        );
        await onRecordReview(currentCard, updatedCard, grade);

        const isLast = state.currentIndex === state.cards.length - 1;
        const addedCardId =
          updatedCard.status === "learning" && !isLast ? updatedCard.id : null;

        dispatch({
          type: "GRADE_SUCCESS",
          updatedCard,
          addedCardId,
          isLast,
          now: new Date(),
          ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
        });
      } catch (e) {
        console.error("Grade failed", e);
        dispatch({ type: "GRADE_FAILURE" });
      }
    },
    [
      state.status,
      state.currentIndex,
      state.cards,
      currentCard,
      fsrs,
      learningSteps,
      ignoreLearningStepsWhenNoCards,
      onRecordReview,
    ]
  );

  const handleMarkKnown = useCallback(async () => {
    if (state.status === "PROCESSING") return;

    dispatch({ type: "START_PROCESSING" });

    try {
      const wasNew = isNewCard(currentCard);
      const updatedCard: Card = { ...currentCard, status: CardStatus.KNOWN };

      await onUpdateCard(updatedCard);

      let newCardFromReserve: Card | null = null;
      if (wasNew && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }

      dispatch({
        type: "REMOVE_CARD",
        cardId: currentCard.id,
        newCardFromReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    } catch (e) {
      console.error("Mark Known failed", e);
      dispatch({ type: "GRADE_FAILURE" });
    }
  }, [
    state.status,
    currentCard,
    state.reserveCards,
    ignoreLearningStepsWhenNoCards,
    onUpdateCard,
  ]);

  const handleUndo = useCallback(() => {
    if (state.status === "PROCESSING" || !canUndo || !onUndo) return;
    onUndo();
    dispatch({ type: "UNDO" });
  }, [state.status, canUndo, onUndo]);

  const removeCardFromSession = useCallback(
    (cardId: string) => {
      const card = state.cards.find((c) => c.id === cardId);
      let newCardFromReserve: Card | null = null;
      if (card && isNewCard(card) && state.reserveCards.length > 0) {
        newCardFromReserve = state.reserveCards[0];
      }
      dispatch({
        type: "REMOVE_CARD",
        cardId,
        newCardFromReserve,
        now: new Date(),
        ignoreLearningSteps: ignoreLearningStepsWhenNoCards,
      });
    },
    [state.cards, state.reserveCards, ignoreLearningStepsWhenNoCards]
  );

  const updateCardInSession = useCallback((card: Card) => {
    dispatch({ type: "UPDATE_CARD", card });
  }, []);

  const setIsFlipped = (flipped: boolean) => {
    if (flipped) dispatch({ type: "FLIP" });
  };

  return {
    sessionCards: state.cards,
    currentCard,
    currentIndex: state.currentIndex,
    isFlipped: state.status === "FLIPPED",
    sessionComplete: state.status === "COMPLETE",
    isProcessing: state.status === "PROCESSING",
    isWaiting: state.status === "WAITING",
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress: state.cards.length
      ? (state.currentIndex / state.cards.length) * 100
      : 0,
    removeCardFromSession,
    updateCardInSession,
    setIsFlipped,
  };
};
```

# src/features/study/hooks/useStudyShortcuts.ts

```typescript
import { useEffect } from "react";
import { Grade } from "@/types";

interface UseStudyShortcutsProps {
  currentCardId: string | undefined;
  sessionComplete: boolean;
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean) => void;
  isProcessing: boolean;
  handleGrade: (grade: Grade) => void;
  handleUndo: () => void;
  onExit: () => void;
  canUndo: boolean;
  binaryRatingMode: boolean;
}

export const useStudyShortcuts = ({
  currentCardId,
  sessionComplete,
  isFlipped,
  setIsFlipped,
  isProcessing,
  handleGrade,
  handleUndo,
  onExit,
  canUndo,
  binaryRatingMode,
}: UseStudyShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCardId && !sessionComplete) return;

      if (
        !isFlipped &&
        !sessionComplete &&
        (e.code === "Space" || e.code === "Enter")
      ) {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped && !sessionComplete && !isProcessing) {
        if (binaryRatingMode) {
          if (e.key === "1") {
            e.preventDefault();
            handleGrade("Again");
          } else if (
            ["2", "3", "4", "Space", "Enter"].includes(e.key) ||
            e.code === "Space"
          ) {
            e.preventDefault();
            handleGrade("Good");
          }
        } else {
          if (e.code === "Space" || e.key === "3") {
            e.preventDefault();
            handleGrade("Good");
          } else if (e.key === "1") {
            e.preventDefault();
            handleGrade("Again");
          } else if (e.key === "2") {
            e.preventDefault();
            handleGrade("Hard");
          } else if (e.key === "4") {
            e.preventDefault();
            handleGrade("Easy");
          }
        }
      }

      if (e.key === "z" && canUndo) {
        e.preventDefault();
        handleUndo();
      }

      if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentCardId,
    sessionComplete,
    isFlipped,
    setIsFlipped,
    isProcessing,
    handleGrade,
    handleUndo,
    canUndo,
    onExit,
    binaryRatingMode,
  ]);
};
```

# src/features/study/hooks/useTextSelection.ts

```typescript
import { useState, useCallback, useEffect } from "react";

interface SelectionState {
  text: string;
  top: number;
  left: number;
}

export const useTextSelection = () => {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelection({
      text,
      top: rect.top - 60,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const clear = () => setSelection(null);
    window.addEventListener("resize", clear);
    window.addEventListener("scroll", clear, true);
    return () => {
      window.removeEventListener("resize", clear);
      window.removeEventListener("scroll", clear, true);
    };
  }, []);

  return {
    selection,
    handleMouseUp,
    clearSelection,
  };
};
```

# src/features/study/hooks/useXpSession.ts

```typescript
import { useState, useCallback } from "react";
import {
  CardRating,
  calculateCardXp,
  XpCalculationResult,
  getDailyStreakMultiplier,
} from "@/core/gamification/xp";

export interface XpFeedback {
  id: number;
  message: string;
  isBonus: boolean;
  amount: number;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);

  const multiplierInfo = getDailyStreakMultiplier(dailyStreak);

  const processCardResult = useCallback(
    (rating: CardRating): XpCalculationResult => {
      const result = calculateCardXp(
        rating,
        sessionStreak,
        dailyStreak,
        isCramMode
      );

      setSessionXp((prev) => prev + result.totalXp);

      if (rating === "again") {
        setSessionStreak(0);
      } else {
        setSessionStreak((prev) => prev + 1);
      }

      if (result.totalXp > 0) {
        setFeedback({
          id: Date.now(),
          message: `+${result.totalXp} XP`,
          isBonus: result.multiplier > 1,
          amount: result.totalXp,
        });
      }

      return result;
    },
    [sessionStreak, dailyStreak, isCramMode]
  );

  const subtractXp = useCallback((amount: number) => {
    setSessionXp((prev) => Math.max(0, prev - amount));
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback,
    processCardResult,
    subtractXp,
  };
};
```

# src/features/study/logic/sessionReducer.ts

```typescript
import { Card } from "@/types";
import { isCardDue } from "@/core/srs/scheduler";

export type SessionStatus =
  | "IDLE"
  | "WAITING"
  | "FLIPPED"
  | "PROCESSING"
  | "COMPLETE";

export interface SessionState {
  status: SessionStatus;
  cards: Card[];
  reserveCards: Card[];
  currentIndex: number;
  history: { addedCardId: string | null }[];
}

export type Action =
  | {
      type: "INIT";
      cards: Card[];
      reserve: Card[];
      now: Date;
      ignoreLearningSteps: boolean;
    }
  | { type: "FLIP" }
  | { type: "START_PROCESSING" }
  | {
      type: "GRADE_SUCCESS";
      status?: SessionStatus;
      updatedCard?: Card | null;
      addedCardId?: string | null;
      isLast?: boolean;
      now: Date;
      ignoreLearningSteps: boolean;
    }
  | { type: "GRADE_FAILURE" }
  | { type: "UNDO" }
  | { type: "TICK"; now: Date; ignoreLearningSteps: boolean }
  | {
      type: "REMOVE_CARD";
      cardId: string;
      newCardFromReserve?: Card | null;
      now: Date;
      ignoreLearningSteps: boolean;
    }
  | { type: "UPDATE_CARD"; card: Card };

export const getInitialStatus = (cards: Card[]): SessionStatus => {
  return cards.length > 0 ? "IDLE" : "COMPLETE";
};

export const checkSchedule = (
  state: SessionState,
  now: Date,
  ignoreLearningSteps: boolean
): SessionState => {
  if (state.status === "PROCESSING" || state.status === "FLIPPED") return state;

  const current = state.cards[state.currentIndex];
  if (!current) {
    if (state.cards.length === 0) return { ...state, status: "COMPLETE" };
    return state;
  }

  if (isCardDue(current, now)) {
    return { ...state, status: "IDLE" };
  }

  const nextDueIndex = state.cards.findIndex(
    (c, i) => i > state.currentIndex && isCardDue(c, now)
  );
  if (nextDueIndex !== -1) {
    const newCards = [...state.cards];
    const [card] = newCards.splice(nextDueIndex, 1);
    newCards.splice(state.currentIndex, 0, card);
    return { ...state, cards: newCards, status: "IDLE" };
  }

  if (ignoreLearningSteps) {
    return { ...state, status: "IDLE" };
  }

  return { ...state, status: "WAITING" };
};

export const reducer = (state: SessionState, action: Action): SessionState => {
  switch (action.type) {
    case "INIT": {
      const newState = {
        ...state,
        cards: action.cards,
        reserveCards: action.reserve,
        currentIndex: 0,
        status: getInitialStatus(action.cards),
        history: [],
      };
      return checkSchedule(newState, action.now, action.ignoreLearningSteps);
    }

    case "FLIP":
      if (state.status !== "IDLE") return state;
      return { ...state, status: "FLIPPED" };

    case "START_PROCESSING":
      if (state.status !== "FLIPPED" && state.status !== "IDLE") return state;
      return { ...state, status: "PROCESSING" };

    case "GRADE_SUCCESS": {
      const { updatedCard, addedCardId, isLast, now, ignoreLearningSteps } =
        action;
      let newCards = [...state.cards];
      let newIndex = state.currentIndex;
      let newHistory = [...state.history, { addedCardId: addedCardId ?? null }];

      if (updatedCard) {
        if (updatedCard.status === "learning") {
          if (isLast) {
            newCards[state.currentIndex] = updatedCard;
            const newState = {
              ...state,
              cards: newCards,
              status: "IDLE" as SessionStatus,
              history: newHistory,
            };
            return checkSchedule(newState, now, ignoreLearningSteps);
          } else {
            newCards.push(updatedCard);
          }
        }
      } else if (addedCardId) {
      }

      if (newIndex < newCards.length - 1) {
        const newState = {
          ...state,
          cards: newCards,
          currentIndex: newIndex + 1,
          status: "IDLE" as SessionStatus,
          history: newHistory,
        };
        return checkSchedule(newState, now, ignoreLearningSteps);
      } else {
        return {
          ...state,
          cards: newCards,
          currentIndex: newIndex,
          status: "COMPLETE",
          history: newHistory,
        };
      }
    }

    case "GRADE_FAILURE":
      return {
        ...state,
        status: state.history.length > 0 ? "FLIPPED" : "IDLE",
      };

    case "UNDO":
      if (state.status === "PROCESSING") return state;
      if (
        state.history.length === 0 &&
        state.currentIndex === 0 &&
        !state.status.match(/COMPLETE/)
      )
        return state;

      const history = state.history;
      const lastAction = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      let undoCards = [...state.cards];
      if (lastAction?.addedCardId) {
        const lastCard = undoCards[undoCards.length - 1];
        if (lastCard && lastCard.id === lastAction.addedCardId) {
          undoCards.pop();
        }
      }

      const prevIndex = Math.max(0, state.currentIndex - 1);

      return {
        ...state,
        cards: undoCards,
        currentIndex: prevIndex,
        status: "FLIPPED",
        history: newHistory,
      };

    case "TICK":
      return checkSchedule(state, action.now, action.ignoreLearningSteps);

    case "REMOVE_CARD": {
      const { cardId, newCardFromReserve, now, ignoreLearningSteps } = action;
      const index = state.cards.findIndex((c) => c.id === cardId);
      if (index === -1) return state;

      let newCards = state.cards.filter((c) => c.id !== cardId);
      let newReserve = [...state.reserveCards];

      if (newCardFromReserve) {
        newCards.push(newCardFromReserve);
        newReserve = newReserve.filter((c) => c.id !== newCardFromReserve.id);
      }

      let newStatus = state.status;
      let newIndex = state.currentIndex;

      if (index < newIndex) {
        newIndex = Math.max(0, newIndex - 1);
      } else if (index === newIndex) {
        newStatus = "IDLE";
        if (newIndex >= newCards.length) {
          newIndex = Math.max(0, newCards.length - 1);
        }
      }

      if (newCards.length === 0) newStatus = "COMPLETE";

      const newState = {
        ...state,
        cards: newCards,
        reserveCards: newReserve,
        currentIndex: newIndex,
        status: newStatus,
      };

      if (newStatus === "COMPLETE") return newState;

      return checkSchedule(newState, now, ignoreLearningSteps);
    }

    case "UPDATE_CARD": {
      const { card } = action;
      const newCards = state.cards.map((c) => (c.id === card.id ? card : c));
      return { ...state, cards: newCards };
    }

    default:
      return state;
  }
};
```

# src/hooks/use-mobile.ts

```typescript
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

# src/hooks/useChartColors.ts

```typescript
import { useMemo } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "@/contexts/ThemeContext";

const getCssVarValue = (name: string) => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

const normalizeColor = (value: string, fallback: string) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;

  if (/^(#|rgb|hsl|oklch|var)/i.test(candidate)) return candidate;

  if (candidate.includes(" ")) return `hsl(${candidate})`;
  return candidate;
};

export const useChartColors = () => {
  const { theme } = useTheme();
  const { language, languageColors } = useSettingsStore(
    useShallow((s) => ({
      language: s.settings.language,
      languageColors: s.settings.languageColors,
    }))
  );

  return useMemo(() => {
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return {
      primary: normalizeColor(getCssVarValue("--primary"), "#3b82f6"),
      background: normalizeColor(getCssVarValue("--background"), "#ffffff"),
      foreground: normalizeColor(getCssVarValue("--foreground"), "#000000"),
      muted: normalizeColor(getCssVarValue("--muted"), "#e5e7eb"),
      mutedForeground: normalizeColor(
        getCssVarValue("--muted-foreground"),
        "#6b7280"
      ),
      border: normalizeColor(getCssVarValue("--border"), "#d1d5db"),
      isDark: theme === "dark" || (theme === "system" && prefersDark),
    };
  }, [theme, language, languageColors]);
};
```

# src/hooks/useDeckActions.ts

```typescript
import { useCallback } from "react";
import { Card, Grade } from "@/types";
import { CardXpPayload } from "@/core/gamification/xp";
import {
  useRecordReviewMutation,
  useUndoReviewMutation,
} from "@/features/collection/hooks/useDeckQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUTCDateString } from "@/constants";
import { getSRSDate } from "@/core/srs/scheduler";
import { useDeckStore } from "@/stores/useDeckStore";

export const useDeckActions = () => {
  const queryClient = useQueryClient();
  const recordReviewMutation = useRecordReviewMutation();
  const undoReviewMutation = useUndoReviewMutation();

  const recordReview = useCallback(
    async (
      oldCard: Card,
      newCard: Card,
      grade: Grade,
      xpPayload?: CardXpPayload
    ) => {
      const today = getUTCDateString(getSRSDate(new Date()));
      const xpEarned = xpPayload?.totalXp ?? 0;

      useDeckStore
        .getState()
        .setLastReview({ card: oldCard, date: today, xpEarned });

      try {
        await recordReviewMutation.mutateAsync({
          card: oldCard,
          newCard,
          grade,
          xpPayload,
        });
      } catch (error) {
        console.error("Failed to record review", error);
        toast.error("Failed to save review progress");
        const currentLast = useDeckStore.getState().lastReview;
        if (currentLast?.card.id === oldCard.id) {
          useDeckStore.getState().clearLastReview();
        }
      }
    },
    [recordReviewMutation]
  );

  const undoReview = useCallback(async () => {
    const lastReview = useDeckStore.getState().lastReview;
    if (!lastReview) return;
    const { card, date, xpEarned } = lastReview;

    try {
      await undoReviewMutation.mutateAsync({ card, date, xpEarned });
      useDeckStore.getState().clearLastReview();
      toast.success("Review undone");
    } catch (error) {
      console.error("Failed to undo review", error);
      toast.error("Failed to undo review");
    }
  }, [undoReviewMutation]);

  const refreshDeckData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["deckStats"] });
    queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    queryClient.invalidateQueries({ queryKey: ["reviewsToday"] });
    queryClient.invalidateQueries({ queryKey: ["history"] });
    queryClient.invalidateQueries({ queryKey: ["cards"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardCards"] });
  }, [queryClient]);

  return {
    recordReview,
    undoReview,
    refreshDeckData,
  };
};
```

# src/hooks/usePlatformSetup.ts

```typescript
import { useEffect } from "react";

export const usePlatformSetup = () => {
  useEffect(() => {}, []);
};
```

# src/lib/ai/gemini.ts

```typescript
import { LanguageId } from "@/types";
import { parseAIJSON } from "../../utils/jsonParser";
import { z } from "zod";

const LemmatizeSchema = z.object({
  lemma: z.string(),
});

const AnalyzeWordSchema = z.object({
  definition: z.string(),
  partOfSpeech: z.string(),
  contextMeaning: z.string(),
});

const GenerateSentenceSchema = z.object({
  targetSentence: z.string(),
  nativeTranslation: z.string(),
  targetWordTranslation: z.string(),
  targetWordPartOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
  ]),
  notes: z.string(),
  furigana: z.string().optional(),
});

const GenerateCardSchema = z.object({
  translation: z.string(),
  targetWord: z.string().optional(),
  targetWordTranslation: z.string().optional(),
  targetWordPartOfSpeech: z
    .enum(["noun", "verb", "adjective", "adverb", "pronoun"])
    .optional(),
  notes: z.string(),
  furigana: z.string().optional(),
});

const GeneratedCardDataSchema = z.object({
  targetSentence: z.string(),
  nativeTranslation: z.string(),
  targetWord: z.string(),
  targetWordTranslation: z.string(),
  targetWordPartOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
  ]),
  grammaticalCase: z.string().optional(),
  gender: z.string().optional(),
  notes: z.string(),
  furigana: z.string().optional(),
});

type GeneratedCardData = z.infer<typeof GeneratedCardDataSchema>;

interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: GeminiResponseSchema;
    temperature?: number;
  };
}

interface GeminiSchemaProperty {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY";
  enum?: string[];
  description?: string;
}

interface GeminiResponseSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN";
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
}

export type WordType =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection";

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: (typeof LanguageId)[keyof typeof LanguageId];
  learnedWords?: string[];
  proficiencyLevel?: string;
  difficultyMode?: "beginner" | "immersive";
  wordTypeFilters?: WordType[];
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

async function callGemini(
  prompt: string,
  apiKey: string,
  responseSchema?: GeminiResponseSchema,
  retries = 3
): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please add it in Settings.");
  }

  const body: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (responseSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema,
    };
  }

  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          const text = await response.text();
          throw new Error(
            `Gemini API Error: ${response.status} ${response.statusText} - ${text}`
          );
        }
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", errorData);
        throw new Error(
          errorData.error?.message || "AI Service failed. Check your API key."
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No response from AI");
      }
      return text;
    } catch (e) {
      console.warn(`Gemini attempt ${i + 1} failed:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < retries - 1) {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini after multiple attempts");
}

function getLangName(
  language: (typeof LanguageId)[keyof typeof LanguageId]
): string {
  return language === LanguageId.Norwegian
    ? "Norwegian"
    : language === LanguageId.Japanese
    ? "Japanese"
    : language === LanguageId.Spanish
    ? "Spanish"
    : "Polish";
}

export const aiService = {
  async lemmatizeWord(
    word: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string
  ): Promise<string> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        lemma: { type: "STRING" },
      },
      required: ["lemma"],
    };

    const prompt = `
      Role: Expert ${langName} linguist.
      Task: Convert the ${langName} word "${word}" to its dictionary/base form (lemma).
      
      Rules:
      - For verbs: return the infinitive form
      - For nouns: return the nominative singular form
      - For adjectives: return the masculine nominative singular form (or base form for languages without gender)
      - For adverbs: return the base form
      - If already in base form, return as-is
      - Return ONLY the lemma, nothing else
      
      Output: { "lemma": "the base form" }
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      const data = LemmatizeSchema.parse(parsed);
      return data.lemma;
    } catch (e) {
      console.error("Failed to parse lemmatize response", e);
      return word;
    }
  },

  async translateText(
    text: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string
  ): Promise<string> {
    const langName = getLangName(language);
    const prompt = `
      Role: Expert Translator.
      Task: Translate the following ${langName} text to English.
      Constraint: Provide ONLY the direct English translation. No detailed explanations, no markdown, no conversational filler.
      
      Text: "${text}"
    `;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(
    word: string,
    contextSentence: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string
  ): Promise<z.infer<typeof AnalyzeWordSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        definition: { type: "STRING" },
        partOfSpeech: { type: "STRING" },
        contextMeaning: { type: "STRING" },
      },
      required: ["definition", "partOfSpeech", "contextMeaning"],
    };

    const prompt = `
      Role: Expert Language Tutor.
      Task: Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      
      Requirements:
      - definition: A concise, context-relevant English definition (max 10 words).
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) AND the specific grammatical form/case used in the sentence if applicable.
      - contextMeaning: The specific nuance or meaning of the word *exactly* as it is used in this sentence.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return AnalyzeWordSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context",
      };
    }
  },

  async generateSentenceForWord(
    targetWord: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string
  ): Promise<z.infer<typeof GenerateSentenceSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        targetSentence: { type: "STRING" },
        nativeTranslation: { type: "STRING" },
        targetWordTranslation: { type: "STRING" },
        targetWordPartOfSpeech: {
          type: "STRING",
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"],
        },
        notes: { type: "STRING" },
        ...(language === LanguageId.Japanese
          ? { furigana: { type: "STRING" } }
          : {}),
      },
      required: [
        "targetSentence",
        "nativeTranslation",
        "targetWordTranslation",
        "targetWordPartOfSpeech",
        "notes",
      ],
    };

    let prompt = `
      Role: Native Speaker & Language Teacher.
      Task: Generate a practical, natural ${langName} sentence using the word "${targetWord}".
      
      Guidelines:
      - The sentence must be colloquially natural but grammatically correct.
      - Useful for a learner (A2/B1 level).
      - Context should make the meaning of "${targetWord}" clear.
      
      Fields:
      - targetSentence: A natural ${langName} sentence containing "${targetWord}".
      - nativeTranslation: Natural English translation.
      - targetWordTranslation: English translation of "${targetWord}".
      - targetWordPartOfSpeech: Exactly one of: "noun", "verb", "adjective", "adverb", "pronoun".
      - notes: A brief, helpful grammar note about how the word is functioning in this specific sentence (e.g. case usage, conjugation). Max 2 sentences.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL targetSentence with furigana in the format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。" (Ensure the brackets are correct).
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return GenerateSentenceSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      throw new Error("Failed to generate sentence for word");
    }
  },

  async generateCardContent(
    sentence: string,
    language: (typeof LanguageId)[keyof typeof LanguageId] = LanguageId.Polish,
    apiKey: string
  ): Promise<z.infer<typeof GenerateCardSchema>> {
    const langName = getLangName(language);

    const responseSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: {
        translation: { type: "STRING" },
        targetWord: { type: "STRING" },
        targetWordTranslation: { type: "STRING" },
        targetWordPartOfSpeech: {
          type: "STRING",
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"],
        },
        notes: { type: "STRING" },
        ...(language === LanguageId.Japanese
          ? { furigana: { type: "STRING" } }
          : {}),
      },
      required: [
        "translation",
        "targetWord",
        "targetWordTranslation",
        "targetWordPartOfSpeech",
        "notes",
      ],
    };

    let prompt = `
      Role: Expert Language Teacher.
      Task: Create a high-quality flashcard from this ${langName} sentence: "${sentence}".
      
      Fields:
      - translation: Natural, idiomatic English translation.
      - targetWord: The single most important vocabulary word in the sentence (lemma form if possible, or the word as is if more appropriate for beginners).
      - targetWordTranslation: English translation of the target word.
      - targetWordPartOfSpeech: One of: noun, verb, adjective, adverb, pronoun.
      - notes: Concise grammar explanation (max 2 sentences). specific to this sentence's structure or the target word's usage.
    `;

    if (language === LanguageId.Japanese) {
      prompt += `
      - furigana: The FULL sentence with furigana in format "Kanji[reading]" for ALL Kanji. 
        Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
      `;
    }

    const result = await callGemini(prompt, apiKey, responseSchema);
    try {
      const parsed = parseAIJSON(result);
      return GenerateCardSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result);
      return {
        translation: "",
        notes: "",
      };
    }
  },

  async generateBatchCards({
    instructions,
    count,
    language,
    apiKey,
    learnedWords,
    proficiencyLevel = "A1",
    difficultyMode = "immersive",
    wordTypeFilters,
  }: BatchGenerationOptions & { apiKey: string }): Promise<
    GeneratedCardData[]
  > {
    const langName = getLangName(language);

    const hasLearnedWords = learnedWords && learnedWords.length > 0;

    let progressionRules = "";

    if (difficultyMode === "beginner") {
      if (hasLearnedWords) {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Continued Learning):
        This is a SEQUENTIAL LESSON extending the user's existing knowledge.

        User ALREADY KNOWS: ${learnedWords!.length} words.
        
        1.  **NO SINGLE WORDS**: Do NOT generate cards with just 1 word.
        2.  **Contextual Learning**: Combine [Known Word] + [NEW Word].
        3.  **Progression**:
            - Cards 1-${Math.ceil(
              count / 2
            )}: Simple phrases using *mostly* known words + 1 NEW word.
            - Cards ${
              Math.ceil(count / 2) + 1
            }-${count}: Complete simple sentences.
        
        INTERNAL STATE REQUIREMENT:
        - Track "Introduced Vocabulary".
        - **Constraint**: A card should NOT contain more than 1 unknown word (a word that is NOT in "LearnedWords" and NOT in "Introduced Vocabulary").
        `;
      } else {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Zero-to-Hero):
        This is a SEQUENTIAL LESSON. Card N must build upon Cards 1...(N-1).

        1.  **Card 1-2**: Foundation. ABSOLUTE BASICS. 1-2 words max.
        2.  **Card 3-${Math.ceil(
          count / 2
        )}**: Simple combinations. Reuse words from Cards 1-2.
        3.  **Card ${
          Math.ceil(count / 2) + 1
        }-${count}**: Basic sentences. STRICTLY REUSE specific vocabulary from previous cards + introduce ONLY 1 new word per card.
        
        INTERNAL STATE REQUIREMENT:
        - Track the "Introduced Vocabulary" list internally as you generate.
        `;
      }
    } else {
      const iPlusOneRule = hasLearnedWords
        ? `- **Comprehensible Input**: Prioritize using words from "Known Vocabulary" to construct the sentence, ensuring the context is understood, while teaching the NEW "targetWord".`
        : "";

      progressionRules = `
        CRITICAL: Each card MUST contain a COMPLETE, NATURAL SENTENCE.
        - The sentence must demonstrate vivid, real usage of the target vocabulary word.
        - NEVER return just the word alone — always wrap it in a meaningful context.
        ${iPlusOneRule}
        - Sentence complexity should match ${proficiencyLevel} level.
        - Variety: Mix statements, questions, and imperatives.
        - **DIVERSITY REQUIREMENT**: Generate ${count} DISTINCT target words. 
        - **CONSTRAINT**: Do NOT use the same "targetWord" more than once in this batch.
        `;
    }

    const shuffledLearnedWords = learnedWords
      ? [...learnedWords].sort(() => 0.5 - Math.random()).slice(0, 1000)
      : [];

    const knownWordsContext = hasLearnedWords
      ? `
        KNOWN VOCABULARY (User knows ${learnedWords!.length} words, showing ${
          shuffledLearnedWords.length
        } sample):
        [${shuffledLearnedWords.join(", ")}]
        
        Use these known words to provide context. The "targetWord" MUST be a NEW word not in this list.
        `
      : "User has NO prior vocabulary. Start from scratch.";

    const allWordTypes: WordType[] = [
      "noun",
      "verb",
      "adjective",
      "adverb",
      "pronoun",
      "preposition",
      "conjunction",
      "interjection",
    ];
    const wordTypesForSchema =
      wordTypeFilters && wordTypeFilters.length > 0
        ? wordTypeFilters
        : allWordTypes;

    const cardSchemaProperties: Record<string, GeminiSchemaProperty> = {
      targetSentence: {
        type: "STRING",
        description: `A natural ${langName} sentence utilizing the target word.`,
      },
      nativeTranslation: {
        type: "STRING",
        description: "Natural English translation.",
      },
      targetWord: {
        type: "STRING",
        description: "The main word being taught (lemma form preferred).",
      },
      targetWordTranslation: { type: "STRING" },
      targetWordPartOfSpeech: {
        type: "STRING",
        enum: wordTypesForSchema,
      },
      grammaticalCase: { type: "STRING" },
      gender: { type: "STRING" },
      notes: {
        type: "STRING",
        description: "Brief grammar note (max 2 sentences).",
      },
    };

    const requiredFields = [
      "targetSentence",
      "nativeTranslation",
      "targetWord",
      "targetWordTranslation",
      "targetWordPartOfSpeech",
      "notes",
    ];

    if (language === LanguageId.Japanese) {
      cardSchemaProperties.furigana = {
        type: "STRING",
        description:
          "The FULL targetSentence with kanji readings in Kanji[reading] format for ALL kanji characters",
      };
      requiredFields.push("furigana");
    }

    const cardSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: cardSchemaProperties,
      required: requiredFields,
    };

    const responseSchema: GeminiResponseSchema = {
      type: "ARRAY",
      items: cardSchema,
    };

    const prompt = `
      Role: Expert ${langName} curriculum designer.
      Task: Generate a set of ${count} high-quality flashcards.
      Topic: "${instructions}"
      
      ${progressionRules}
      
      ${
        wordTypeFilters && wordTypeFilters.length > 0
          ? `
      WORD TYPE CONSTRAINT:
      - The "targetWord" in EACH card MUST be one of: ${wordTypeFilters.join(
        ", "
      )}.
      `
          : ""
      }
      
      Style Guidelines:
      - Tone: Natural, friendly, helpful.
      - **Vocabulary Strategy**: 
          - Repeats of *learned* words is encouraged for context.
          - **Target Words**: MUST BE UNIQUE.
      - Content: Tangible, visual, and concrete concepts first.
      
      ${knownWordsContext}
      
      IMPORTANT: Generate exactly ${count} cards.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    try {
      const parsed = parseAIJSON(result);

      if (!Array.isArray(parsed)) {
        console.warn("Gemini did not return an array:", parsed);
        return [];
      }

      const validCards: GeneratedCardData[] = [];
      for (const item of parsed) {
        const validation = GeneratedCardDataSchema.safeParse(item);
        if (validation.success) {
          validCards.push(validation.data);
        } else {
          console.warn(
            "Skipping invalid card from batch:",
            item,
            validation.error
          );
        }
      }

      const filtered = validCards.filter((c) => {
        const matchesType =
          !wordTypeFilters ||
          wordTypeFilters.length === 0 ||
          (c.targetWordPartOfSpeech &&
            wordTypeFilters.includes(c.targetWordPartOfSpeech as WordType));
        return matchesType;
      });

      const seenWords = new Set<string>();
      const uniqueCards: GeneratedCardData[] = [];

      for (const card of filtered) {
        const normalizedWord = card.targetWord.trim().toLowerCase();
        if (!seenWords.has(normalizedWord)) {
          seenWords.add(normalizedWord);
          uniqueCards.push(card);
        }
      }

      return uniqueCards;
    } catch (e) {
      console.error("Failed to parse AI batch response", e, "\nRaw:", result);
      throw new Error("Failed to generate valid cards");
    }
  },
};
```

# src/lib/ai/index.ts

```typescript
export * from "./gemini";
```

# src/lib/fsrsOptimizer.ts

```typescript
import { ReviewLog } from "@/types";
import { computeCardLoss } from "./fsrsShared";

export const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {
  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach((log) => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const learningRate = 0.002;
  const iterations = 500;
  const batchSize = Math.min(cardGroups.length, 64);

  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12];

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

    const h = 0.0001;

    for (const logs of batch) {
      totalLoss += computeCardLoss(logs, w);
    }

    for (const idx of targetIndices) {
      const wPlus = [...w];
      wPlus[idx] += h;

      let lossPlus = 0;
      for (const logs of batch) {
        lossPlus += computeCardLoss(logs, wPlus);
      }

      gradients[idx] = (lossPlus - totalLoss) / h;
    }

    for (const idx of targetIndices) {
      w[idx] -= learningRate * gradients[idx];
      if (w[idx] < 0.01) w[idx] = 0.01;
    }

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};
```

# src/lib/fsrsShared.ts

```typescript
import { ReviewLog } from "@/types";

export const DECAY = -0.6;
export const FACTOR = 0.9 ** (1 / DECAY) - 1;

export const getRetrievability = (
  elapsedDays: number,
  stability: number
): number => {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

export const nextStability = (
  s: number,
  d: number,
  r: number,
  rating: number,
  w: number[]
): number => {
  if (rating === 1) {
    return (
      w[11] *
      Math.pow(d, -w[12]) *
      (Math.pow(s + 1, w[13]) - 1) *
      Math.exp(w[14] * (1 - r))
    );
  }
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  return (
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
};

export const nextDifficulty = (
  d: number,
  rating: number,
  w: number[]
): number => {
  const nextD = d - w[6] * (rating - 3);
  return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7]));
};

export const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
  let loss = 0;
  let s = w[0];
  let d = w[4];

  for (const log of logs) {
    const { grade, elapsed_days, state } = log;

    if (state === 0 || state === 1) {
      s = w[grade - 1];
      d = w[4] - w[5] * (grade - 3);
      d = Math.max(1, Math.min(10, d));
      continue;
    }

    const r = getRetrievability(elapsed_days, s);
    const y = grade > 1 ? 1 : 0;
    const p = Math.max(0.0001, Math.min(0.9999, r));

    loss -= y * Math.log(p) + (1 - y) * Math.log(1 - p);

    if (grade === 1) {
      s = nextStability(s, d, r, 1, w);
      d = nextDifficulty(d, 1, w);
    } else {
      s = nextStability(s, d, r, grade, w);
      d = nextDifficulty(d, grade, w);
    }
  }

  return loss;
};
```

# src/lib/memeUtils.ts

```typescript
export const uwuify = (text: string) => {
  return text
    .replace(/r/g, "w")
    .replace(/R/g, "W")
    .replace(/l/g, "w")
    .replace(/L/g, "W")
    .replace(/ma/g, "mwa")
    .replace(/mo/g, "mwo")
    .replace(/\./g, " UwU.")
    .replace(/!/g, " >w<");
};

export const FAKE_ANSWERS = [
  "A type of small cheese",
  "The capital of Peru",
  "It means 'To Explode'",
  "Mathematical equation",
  "Just a random noise",
  "Something forbidden",
  "Approximately 42",
  "I don't know either",
  "Your mom",
  "Bitcoin",
];
```

# src/lib/sync/index.ts

```typescript
export {
  exportSyncData,
  saveSyncFile,
  loadSyncFile,
  checkSyncFile,
  importSyncData,
  getSyncFilePath,
  setSyncFilePath,
  getLastSyncTime,
  setLastSyncTime,
  clearSyncFileHandle,
  type SyncData,
} from "./syncService";
```

# src/lib/sync/syncService.ts

```typescript
import { db } from "@/db/dexie";
import {
  getCards,
  saveAllCards,
  clearAllCards,
  getCurrentUserId,
} from "@/db/repositories/cardRepository";
import {
  getHistory,
  saveFullHistory,
  clearHistory,
} from "@/db/repositories/historyRepository";
import {
  getFullSettings,
  getSystemSetting,
  setSystemSetting,
} from "@/db/repositories/settingsRepository";
import { UserSettings, Card } from "@/types";

export interface SyncData {
  version: number;
  lastSynced: string;
  deviceId: string;
  cards: Card[];
  history: Record<string, number>;
  revlog: Array<{
    id: string;
    card_id: string;
    grade: number;
    state: number;
    elapsed_days: number;
    scheduled_days: number;
    stability: number;
    difficulty: number;
    created_at: string;
  }>;
  settings: Partial<UserSettings>;
  profile: {
    id: string;
    username?: string;
    xp: number;
    points: number;
    level: number;
    language_level?: string;
    initial_deck_generated?: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  aggregatedStats: Array<{
    id: string;
    language: string;
    metric: string;
    value: number;
    updated_at: string;
  }>;
}

const SYNC_FILENAME = "linguaflow-sync.json";

let cachedFileHandle: FileSystemFileHandle | null = null;

const getDeviceId = async (): Promise<string> => {
  const storageKey = "deviceId";
  let deviceId = await getSystemSetting<string>(storageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await setSystemSetting(storageKey, deviceId);
  }
  return deviceId;
};

export const getSyncFilePath = async (): Promise<string> => {
  const customPath = await getSystemSetting<string>("syncPath");
  return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = async (path: string): Promise<void> => {
  await setSystemSetting("syncPath", path);
};

export const clearSyncFileHandle = (): void => {
  cachedFileHandle = null;
};

export const exportSyncData = async (
  settings: Partial<UserSettings>
): Promise<SyncData> => {
  const cards = await getCards();
  const history = await getHistory();
  const revlog = await db.revlog.toArray();
  const profiles = await db.profile.toArray();
  const aggregatedStats = await db.aggregated_stats.toArray();

  const safeSettings: Partial<UserSettings> = {
    ...settings,
    geminiApiKey: "",
  };

  if (settings.tts) {
    safeSettings.tts = {
      ...settings.tts,
      googleApiKey: "",
      azureApiKey: "",
    };
  }

  const profileForExport =
    profiles.length > 0
      ? {
          ...profiles[0],
          username: undefined,
        }
      : null;

  const cleanCards = cards.map(({ user_id, ...rest }) => rest);
  const cleanRevlog = revlog.map(({ user_id, ...rest }) => rest);
  const cleanStats = aggregatedStats.map(({ user_id, ...rest }) => rest);

  return {
    version: 3,
    lastSynced: new Date().toISOString(),
    deviceId: await getDeviceId(),
    cards: cleanCards,
    history,
    revlog: cleanRevlog,
    settings: safeSettings,
    profile: profileForExport,
    aggregatedStats: cleanStats,
  };
};

export const saveSyncFile = async (
  settings: Partial<UserSettings>
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const syncData = await exportSyncData(settings);
    const jsonContent = JSON.stringify(syncData, null, 2);
    const filename = await getSyncFilePath();

    if ("showSaveFilePicker" in window) {
      try {
        let handle = cachedFileHandle;

        if (handle) {
          const permission = await (handle as any).queryPermission({
            mode: "readwrite",
          });
          if (permission !== "granted") {
            const requestResult = await (handle as any).requestPermission({
              mode: "readwrite",
            });
            if (requestResult !== "granted") {
              handle = null;
            }
          }
        }

        if (!handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: "JSON Files",
                accept: { "application/json": [".json"] },
              },
            ],
          });
          cachedFileHandle = handle;
        }

        const writable = await handle!.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        return { success: true, path: handle!.name };
      } catch (e: any) {
        if (e.name === "AbortError") {
          return { success: false, error: "Save cancelled" };
        }
        if (cachedFileHandle) {
          cachedFileHandle = null;
          return saveSyncFile(settings);
        }
        throw e;
      }
    } else {
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, path: filename };
    }
  } catch (error: any) {
    console.error("[Sync] Save failed:", error);
    return { success: false, error: error.message };
  }
};

export const loadSyncFile = async (): Promise<{
  success: boolean;
  data?: SyncData;
  error?: string;
}> => {
  try {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text) as SyncData;
        return { success: true, data };
      } catch (e: any) {
        if (e.name === "AbortError") {
          return { success: false, error: "Load cancelled" };
        }
        throw e;
      }
    } else {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.style.display = "none";
        document.body.appendChild(input);

        const cleanup = () => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        };

        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            try {
              const text = await file.text();
              const data = JSON.parse(text) as SyncData;
              resolve({ success: true, data });
            } catch (error: any) {
              resolve({ success: false, error: error.message });
            }
          } else {
            resolve({ success: false, error: "No file selected" });
          }
          cleanup();
        };

        input.addEventListener("cancel", () => {
          resolve({ success: false, error: "Load cancelled" });
          cleanup();
        });

        input.click();
      });
    }
  } catch (error: any) {
    console.error("[Sync] Load failed:", error);
    return { success: false, error: error.message };
  }
};

export const checkSyncFile = async (): Promise<{
  exists: boolean;
  lastSynced?: string;
  deviceId?: string;
}> => {
  return { exists: false };
};

export const importSyncData = async (
  data: SyncData,
  updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!data.cards || !Array.isArray(data.cards)) {
      return { success: false, error: "Invalid sync data: missing cards" };
    }

    const existingProfiles = await db.profile.toArray();
    const existingProfile =
      existingProfiles.length > 0 ? existingProfiles[0] : null;

    await clearAllCards();
    await clearHistory();
    await db.revlog.clear();
    await db.aggregated_stats.clear();

    if (data.cards.length > 0) {
      await saveAllCards(data.cards);
    }

    if (data.history && typeof data.history === "object") {
      const languages = new Set(
        data.cards.map((c) => c.language).filter(Boolean)
      );
      const primaryLanguage = languages.size > 0 ? [...languages][0] : "polish";
      await saveFullHistory(data.history, primaryLanguage);
    }

    if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
      const currentUserId = getCurrentUserId();
      const revlogWithUser = data.revlog.map((r) => ({
        ...r,
        user_id: currentUserId || undefined,
      }));
      await db.revlog.bulkPut(revlogWithUser);
    }

    if (data.profile && existingProfile) {
      const mergedProfile = {
        ...data.profile,
        id: existingProfile.id,
        username: existingProfile.username,
      };
      await db.profile.put(mergedProfile);
    } else if (existingProfile) {
    }

    if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
      const currentUserId = getCurrentUserId();
      const statsWithUser = data.aggregatedStats.map((s) => ({
        ...s,
        user_id: currentUserId || undefined,
      }));
      await db.aggregated_stats.bulkPut(statsWithUser);
    }

    if (data.settings) {
      const restoredProfile = data.profile;
      let preservedKeys: Partial<UserSettings> | UserSettings["tts"] = {};
      if (restoredProfile) {
        const existingSettings = await getFullSettings(restoredProfile.id);
        if (existingSettings) {
          preservedKeys = {
            geminiApiKey: existingSettings.geminiApiKey,
            tts: {
              provider: existingSettings.tts?.provider || "browser",
              googleApiKey:
                existingSettings.googleTtsApiKey ||
                existingSettings.tts?.googleApiKey,
              azureApiKey:
                existingSettings.azureTtsApiKey ||
                existingSettings.tts?.azureApiKey,
            } as any,
          };
        }
      }

      const restoredSettings: Partial<UserSettings> = {
        ...data.settings,
        geminiApiKey: preservedKeys.geminiApiKey || "",
        tts: {
          ...(data.settings.tts || {}),
          googleApiKey: (preservedKeys.tts as any)?.googleApiKey || "",
          azureApiKey: (preservedKeys.tts as any)?.azureApiKey || "",
        } as UserSettings["tts"],
      };
      updateSettings(restoredSettings);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Sync] Import failed:", error);
    return { success: false, error: error.message };
  }
};

export const getLastSyncTime = async (): Promise<string | null> => {
  return (await getSystemSetting<string>("lastSync")) || null;
};

export const setLastSyncTime = async (time: string): Promise<void> => {
  await setSystemSetting("lastSync", time);
};
```

# src/lib/tts/index.ts

```typescript
import { Language, TTSSettings, TTSProvider } from "@/types";
import { toast } from "sonner";

const LANG_CODE_MAP: Record<Language, string[]> = {
  polish: ["pl-PL", "pl"],
  norwegian: ["nb-NO", "no-NO", "no"],
  japanese: ["ja-JP", "ja"],
  spanish: ["es-ES", "es-MX", "es"],
  german: ["de-DE", "de-AT", "de-CH", "de"],
};

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  provider: TTSProvider;
  gender?: "MALE" | "FEMALE" | "NEUTRAL";
}

class TTSService {
  private browserVoices: SpeechSynthesisVoice[] = [];
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentOperationId = 0;
  private abortController: AbortController | null = null;
  private resumeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.updateVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.updateVoices();
      };
    }
  }

  private updateVoices() {
    this.browserVoices = window.speechSynthesis.getVoices();
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  async getAvailableVoices(
    language: Language,
    settings: TTSSettings
  ): Promise<VoiceOption[]> {
    const validCodes = LANG_CODE_MAP[language];

    if (settings.provider === "browser") {
      return this.browserVoices
        .filter((v) =>
          validCodes.some((code) =>
            v.lang.toLowerCase().startsWith(code.toLowerCase())
          )
        )
        .map((v) => ({
          id: v.voiceURI,
          name: v.name,
          lang: v.lang,
          provider: "browser",
        }));
    }

    if (
      settings.provider === "azure" &&
      settings.azureApiKey &&
      settings.azureRegion
    ) {
      try {
        const response = await fetch(
          `https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
          {
            headers: {
              "Ocp-Apim-Subscription-Key": settings.azureApiKey,
            },
          }
        );
        const data = await response.json();
        return data
          .filter((v: any) =>
            validCodes.some((code) =>
              v.Locale.toLowerCase().startsWith(code.toLowerCase())
            )
          )
          .map((v: any) => ({
            id: v.ShortName,
            name: `${v.LocalName} (${v.ShortName})`,
            lang: v.Locale,
            provider: "azure",
          }));
      } catch (e) {
        console.error("Failed to fetch Azure voices", e);
      }
    }

    if (settings.provider === "google" && settings.googleApiKey) {
      try {
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/voices?key=${settings.googleApiKey}`
        );
        const data = await response.json();

        if (data.voices) {
          return data.voices
            .filter((v: any) =>
              v.languageCodes.some((code: string) =>
                validCodes.some((validCode) =>
                  code.toLowerCase().startsWith(validCode.toLowerCase())
                )
              )
            )
            .map((v: any) => ({
              id: v.name,
              name: `${v.name} (${v.ssmlGender})`,
              lang: v.languageCodes[0],
              provider: "google",
              gender: v.ssmlGender,
            }));
        }
      } catch (e) {
        console.error("Failed to fetch Google voices", e);
      }
    }

    return [];
  }

  async speak(text: string, language: Language, settings: TTSSettings) {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.stop();
    const opId = ++this.currentOperationId;
    this.abortController = new AbortController();

    if (settings.provider === "browser") {
      await this.speakBrowser(text, language, settings);
    } else if (settings.provider === "azure") {
      await this.speakAzure(text, language, settings, opId);
    } else if (settings.provider === "google") {
      await this.speakGoogle(text, language, settings, opId);
    }
  }

  private async speakBrowser(
    text: string,
    language: Language,
    settings: TTSSettings
  ) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODE_MAP[language][0];
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    if (settings.voiceURI && settings.voiceURI !== "default") {
      const selectedVoice = this.browserVoices.find(
        (v) => v.voiceURI === settings.voiceURI
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      this.resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
          }
        } else if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    utterance.onend = () => {
      if (this.resumeInterval) {
        clearInterval(this.resumeInterval);
        this.resumeInterval = null;
      }
    };

    utterance.onerror = (event) => {
      if (this.resumeInterval) {
        clearInterval(this.resumeInterval);
        this.resumeInterval = null;
      }
      if (event.error !== "interrupted") {
        console.error("Speech synthesis error:", event.error);
      }
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }

  private async speakAzure(
    text: string,
    language: Language,
    settings: TTSSettings,
    opId: number
  ) {
    if (!settings.azureApiKey || !settings.azureRegion) return;

    try {
      const voiceName = settings.voiceURI || "en-US-JennyNeural";
      const ssml = `
                <speak version='1.0' xml:lang='${LANG_CODE_MAP[language][0]}'>
                    <voice xml:lang='${
                      LANG_CODE_MAP[language][0]
                    }' xml:gender='Female' name='${voiceName}'>
                        <prosody rate='${settings.rate}' pitch='${
        (settings.pitch - 1) * 50
      }%' volume='${settings.volume * 100}'>
                            ${text}
                        </prosody>
                    </voice>
                </speak>
            `;

      const response = await fetch(
        `https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": settings.azureApiKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
            "User-Agent": "LinguaFlow",
          },
          signal: this.abortController?.signal,
          body: ssml,
        }
      );

      if (!response.ok) throw new Error(await response.text());
      if (this.currentOperationId !== opId) return;

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      this.playAudioBuffer(arrayBuffer, opId);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("Azure TTS error", e);
      toast.error("Azure TTS failed. Check your API key and region.");
    }
  }

  private async speakGoogle(
    text: string,
    language: Language,
    settings: TTSSettings,
    opId: number
  ) {
    if (!settings.googleApiKey) return;

    try {
      const requestBody = {
        input: { text },
        voice: {
          languageCode: LANG_CODE_MAP[language][0],
          name:
            settings.voiceURI && settings.voiceURI !== "default"
              ? settings.voiceURI
              : undefined,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: settings.rate,
          pitch: (settings.pitch - 1) * 20,
          volumeGainDb: (settings.volume - 1) * 10,
        },
      };

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          signal: this.abortController?.signal,
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || response.statusText);
      }
      if (this.currentOperationId !== opId) return;

      const data = await response.json();

      const binaryString = window.atob(data.audioContent);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      this.playAudioBuffer(bytes.buffer, opId);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("Google TTS error", e);
      toast.error(`Google TTS failed: ${e.message}`);
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private async playAudioBuffer(buffer: ArrayBuffer, opId: number) {
    try {
      const ctx = this.getAudioContext();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const decodedBuffer = await ctx.decodeAudioData(buffer.slice(0));
      if (this.currentOperationId !== opId) return;

      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch {}
      }

      this.currentSource = ctx.createBufferSource();
      this.currentSource.buffer = decodedBuffer;
      this.currentSource.connect(ctx.destination);

      this.currentSource.onended = () => {
        this.currentSource = null;
      };

      this.currentSource.start(0);
    } catch (e) {
      console.error("Audio playback error", e);
    }
  }

  async stop() {
    this.currentOperationId++;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
  }
}

export const ttsService = new TTSService();
```

# src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getLevelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
  const nextLevelStartXP = 100 * Math.pow(level, 2);
  const xpGainedInLevel = xp - currentLevelStartXP;
  const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;
  const progressPercent = Math.min(
    100,
    Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100)
  );
  const xpToNextLevel = nextLevelStartXP - xp;

  return { level, progressPercent, xpToNextLevel };
}

export function parseFurigana(text: string): FuriganaSegment[] {
  const regex = /([^\s\[\]]+)\[([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;
  let match;

  const punctuationRegex = /^([、。！？「」『』（）\(\),.!?:;""''—\-–]+)(.*)/;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const betweenText = text.slice(lastIndex, match.index);

      betweenText.split(/(\s+)/).forEach((part) => {
        if (part) {
          segments.push({ text: part });
        }
      });
    }

    let kanjiText = match[1];
    const furigana = match[2];

    while (true) {
      const punctuationMatch = kanjiText.match(punctuationRegex);
      if (punctuationMatch && punctuationMatch[2]) {
        segments.push({ text: punctuationMatch[1] });
        kanjiText = punctuationMatch[2];
        continue;
      }

      const kanaRegex = /^([\u3040-\u30ff]+)(.*)/;
      const kanaMatch = kanjiText.match(kanaRegex);

      if (kanaMatch && kanaMatch[2]) {
        segments.push({ text: kanaMatch[1] });
        kanjiText = kanaMatch[2];
        continue;
      }

      break;
    }

    segments.push({ text: kanjiText, furigana: furigana });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    remainingText.split(/(\s+)/).forEach((part) => {
      if (part) {
        segments.push({ text: part });
      }
    });
  }

  return segments;
}

export function findInflectedWordInSentence(
  targetWord: string,
  sentence: string
): string | null {
  if (!targetWord || !sentence) return null;

  const targetLower = targetWord.toLowerCase();

  const words = sentence.match(/[\p{L}]+/gu) || [];

  const exactMatch = words.find((w) => w.toLowerCase() === targetLower);
  if (exactMatch) return exactMatch;

  const minStemLength =
    targetWord.length <= 4
      ? 2
      : Math.min(4, Math.ceil(targetWord.length * 0.5));

  let bestMatch: string | null = null;
  let bestMatchScore = 0;

  for (const word of words) {
    const wordLower = word.toLowerCase();

    let sharedLength = 0;
    const maxLength = Math.min(targetLower.length, wordLower.length);

    for (let i = 0; i < maxLength; i++) {
      if (targetLower[i] === wordLower[i]) {
        sharedLength++;
      } else {
        break;
      }
    }

    if (sharedLength >= minStemLength) {
      const lengthDiff = Math.abs(targetWord.length - word.length);
      const score = sharedLength * 10 - lengthDiff;

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = word;
      }
    }
  }

  return bestMatch;
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}
```

# src/main.tsx

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

# src/reproduce_issue.ts

```typescript
import { addMinutes, differenceInMilliseconds, parseISO } from "date-fns";

const runTests = () => {
  try {
    const d = addMinutes(new Date(), NaN);
  } catch (e) {}

  try {
    const invalidDate = new Date("invalid");
    const diff = differenceInMilliseconds(invalidDate, new Date());
  } catch (e) {}

  try {
    const d = parseISO("invalid-date-string");
    const diff = differenceInMilliseconds(d, new Date());
  } catch (e) {}
};

runTests();
```

# src/router.tsx

```typescript
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

const DashboardRoute = lazy(() =>
  import("@/routes/DashboardRoute").then((m) => ({ default: m.DashboardRoute }))
);
const StudyRoute = lazy(() =>
  import("@/routes/StudyRoute").then((m) => ({ default: m.StudyRoute }))
);
const CardsRoute = lazy(() =>
  import("@/routes/CardsRoute").then((m) => ({ default: m.CardsRoute }))
);
const SettingsRoute = lazy(() =>
  import("@/features/settings/routes/SettingsRoute").then((m) => ({
    default: m.SettingsRoute,
  }))
);
const TestStatsRoute = lazy(() =>
  import("@/routes/TestStatsRoute").then((m) => ({ default: m.TestStatsRoute }))
);

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-4 w-4 border border-foreground/20 border-t-foreground" />
      <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
        Loading
      </span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/study" element={<StudyRoute />} />
      <Route path="/cards" element={<CardsRoute />} />
      <Route path="/test-stats" element={<TestStatsRoute />} />
      <Route path="/settings/*" element={<SettingsRoute />} />
    </Routes>
  </Suspense>
);
```

# src/routes/CardsRoute.tsx

```typescript
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Sparkles,
  BookOpen,
  Zap,
  Trash2,
  Filter,
  Bookmark,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useDeckStats } from "@/features/collection/hooks/useDeckStats";
import { Card } from "@/types";
import { AddCardModal } from "@/features/collection/components/AddCardModal";
import { GenerateCardsModal } from "@/features/generator/components/GenerateCardsModal";
import { CardHistoryModal } from "@/features/collection/components/CardHistoryModal";
import { CardList } from "@/features/collection/components/CardList";
import { useCardOperations } from "@/features/collection/hooks/useCardOperations";
import {
  useCardsQuery,
  CardFilters,
} from "@/features/collection/hooks/useCardsQuery";

import { cn } from "@/lib/utils";

export const CardsRoute: React.FC = () => {
  const { stats } = useDeckStats();
  const {
    addCard,
    addCardsBatch,
    updateCard,
    deleteCard,
    deleteCardsBatch,
    prioritizeCards,
  } = useCardOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CardFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 50;

  const { data, isLoading } = useCardsQuery(
    page,
    pageSize,
    debouncedSearch,
    filters
  );
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const activeFilterCount =
    (filters.status && filters.status !== "all" ? 1 : 0) +
    (filters.bookmarked ? 1 : 0) +
    (filters.leech ? 1 : 0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, [page, debouncedSearch, filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsAddModalOpen(true);
  };

  const handleViewHistory = (card: Card) => {
    setSelectedCard(card);
    setIsHistoryModalOpen(true);
  };

  const handleToggleSelect = useCallback(
    (id: string, index: number, isShift: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (isShift && lastSelectedIndex !== null) {
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          const idsInRange = cards.slice(start, end + 1).map((c) => c.id);
          const shouldSelect = !prev.has(id);
          idsInRange.forEach((rangeId) =>
            shouldSelect ? next.add(rangeId) : next.delete(rangeId)
          );
        } else {
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setLastSelectedIndex(index);
        }
        return next;
      });
    },
    [cards, lastSelectedIndex]
  );

  const handleBatchPrioritize = async () => {
    if (selectedIds.size === 0) return;
    await prioritizeCards(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} card${
          selectedIds.size === 1 ? "" : "s"
        }? This action cannot be undone.`
      )
    ) {
      const ids = Array.from(selectedIds);
      await deleteCardsBatch(ids);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = useCallback(() => {
    const allCurrentPageIds = cards.map((c) => c.id);
    const allSelected = allCurrentPageIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [cards, selectedIds]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative bg-background">
      {/* Search & Header */}
      <header className="px-4 md:px-8 pb-2 border-b">
        <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Collection
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="tabular-nums">{stats.total} Cards</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="tabular-nums">{stats.learned} Mastered</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>

            <div className="relative">
              <Button
                variant={activeFilterCount > 0 ? "secondary" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter Cards"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>

              {/* Filter Dropdown */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-popover border text-popover-foreground shadow-md rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-sm font-semibold">Filters</span>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            "all",
                            "new",
                            "learning",
                            "graduated",
                            "known",
                          ] as const
                        ).map((status) => (
                          <Button
                            key={status}
                            variant={
                              filters.status === status ||
                              (!filters.status && status === "all")
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                status: status === "all" ? undefined : status,
                              }))
                            }
                            className="capitalize h-8 text-xs font-normal"
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Quick Filters
                      </label>
                      <div className="space-y-1.5">
                        <Button
                          variant={filters.bookmarked ? "secondary" : "outline"}
                          size="sm"
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              bookmarked: !f.bookmarked,
                            }))
                          }
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.bookmarked &&
                              "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                          )}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmarked</span>
                        </Button>
                        <Button
                          variant={filters.leech ? "destructive" : "outline"}
                          size="sm"
                          onClick={() =>
                            setFilters((f) => ({ ...f, leech: !f.leech }))
                          }
                          className={cn(
                            "w-full justify-start gap-2 h-8 text-xs font-normal",
                            filters.leech
                              ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20"
                              : ""
                          )}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Leech Cards</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGenerateModalOpen(true)}
              title="Generate Cards"
            >
              <Sparkles className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              onClick={() => setIsAddModalOpen(true)}
              title="Add Card"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg">
              Loading...
            </span>
          </div>
        ) : (
          <CardList
            cards={cards}
            searchTerm=""
            onEditCard={handleEditCard}
            onDeleteCard={(id) => deleteCard(id)}
            onViewHistory={handleViewHistory}
            onPrioritizeCard={(id) => prioritizeCards([id])}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Floating Selection Bar */}
      <div
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto min-w-[300px] transition-all duration-200",
          selectedIds.size > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-foreground text-background rounded-full shadow-lg px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-semibold tabular-nums">
              {selectedIds.size}
            </span>
            <span className="text-sm opacity-80">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchPrioritize}
              className="text-background hover:bg-background/20 h-8"
            >
              <Zap className="w-4 h-4 mr-2" />
              Prioritize
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBatchDelete}
              className="text-red-300 hover:text-red-200 hover:bg-red-900/30 h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <div className="w-px h-4 bg-background/20" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds(new Set())}
              className="text-background/60 hover:text-background hover:bg-transparent h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedCard(undefined);
        }}
        onAdd={(card) => (selectedCard ? updateCard(card) : addCard(card))}
        initialCard={selectedCard}
      />
      <GenerateCardsModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={(cards) => addCardsBatch(cards)}
      />
      <CardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedCard(undefined);
        }}
        card={selectedCard}
      />
    </div>
  );
};
```

# src/routes/DashboardRoute.tsx

```typescript
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { useDeckStats } from "@/features/collection/hooks/useDeckStats";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getDashboardStats } from "@/db/repositories/statsRepository";
import { getCardsForDashboard } from "@/db/repositories/cardRepository";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeckStats();
  const language = useSettingsStore((s) => s.language);
  const navigate = useNavigate();

  const {
    data: dashboardStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery({
    queryKey: ["dashboardStats", language],
    queryFn: () => getDashboardStats(language),
  });

  const {
    data: cards,
    isLoading: isCardsLoading,
    isError: isCardsError,
  } = useQuery({
    queryKey: ["dashboardCards", language],
    queryFn: () => getCardsForDashboard(language),
  });

  if (isStatsLoading || isCardsLoading) {
    return (
      <LoadingScreen
        title="Loading Dashboard"
        subtitle="Fetching your progress..."
      />
    );
  }

  if (isStatsError || isCardsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-red-500">Failed to load dashboard data.</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!dashboardStats || !cards) {
    return <div>No data found.</div>;
  }

  const metrics = {
    total:
      dashboardStats.counts.new +
      dashboardStats.counts.learning +
      dashboardStats.counts.review +
      dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.review,
    known: dashboardStats.counts.known,
  };

  const xp = dashboardStats.languageXp;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  return (
    <Dashboard
      metrics={metrics}
      languageXp={{ xp, level }}
      stats={stats}
      history={history}
      onStartSession={() => navigate("/study")}
      cards={cards as any}
    />
  );
};
```

# src/routes/StudyRoute.tsx

```typescript
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Grade } from "@/types";
import { StudySession } from "@/features/study/components/StudySession";
import { useDeckActions } from "@/hooks/useDeckActions";
import { useDeckStats } from "@/features/collection/hooks/useDeckStats";
import { useDeckStore } from "@/stores/useDeckStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { useCardOperations } from "@/features/collection/hooks/useCardOperations";
import { isNewCard } from "@/services/studyLimits";
import { getCramCards, getDueCards } from "@/db/repositories/cardRepository";
import { getTodayReviewStats } from "@/db/repositories/statsRepository";
import { useClaimDailyBonusMutation } from "@/features/collection/hooks/useDeckQueries";
import { CardXpPayload } from "@/core/gamification/xp";
import { LoadingScreen } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sortCards, CardOrder } from "@/core/srs/cardSorter";

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview } = useDeckActions();
  const { stats } = useDeckStats();
  const lastReview = useDeckStore((state) => state.lastReview);
  const canUndo = !!lastReview;

  const { updateCard, deleteCard, addCard } = useCardOperations();

  const { language, dailyNewLimits, dailyReviewLimits, cardOrder } =
    useSettingsStore(
      useShallow((s) => ({
        language: s.language,
        dailyNewLimits: s.dailyNewLimits,
        dailyReviewLimits: s.dailyReviewLimits,
        cardOrder: s.cardOrder,
      }))
    );

  const claimBonus = useClaimDailyBonusMutation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get("mode");
  const isCramMode = mode === "cram";

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get("limit") || "50", 10);
          const tag = searchParams.get("tag") || undefined;
          const cramCards = await getCramCards(limit, tag, language);
          if (isMounted) {
            setSessionCards(cramCards);
            setReserveCards([]);
          }
        } else {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 15000)
          );

          const [due, reviewsToday] = (await Promise.race([
            Promise.all([
              getDueCards(new Date(), language),
              getTodayReviewStats(language),
            ]),
            timeoutPromise,
          ])) as [Card[], { newCards: number; reviewCards: number }];

          if (!isMounted) return;

          const dailyNewLimit = dailyNewLimits?.[language] ?? 20;
          const dailyReviewLimit = dailyReviewLimits?.[language] ?? 100;

          const active: Card[] = [];
          const reserve: Card[] = [];

          let newCount = reviewsToday.newCards || 0;
          let reviewCount = reviewsToday.reviewCards || 0;

          const hasLimit = (val: number) => val > 0;

          for (const card of due) {
            if (isNewCard(card)) {
              if (hasLimit(dailyNewLimit) && newCount >= dailyNewLimit) {
                reserve.push(card);
              } else {
                active.push(card);
                if (hasLimit(dailyNewLimit)) newCount++;
              }
            } else {
              if (
                hasLimit(dailyReviewLimit) &&
                reviewCount >= dailyReviewLimit
              ) {
                continue;
              }
              active.push(card);
              if (hasLimit(dailyReviewLimit)) reviewCount++;
            }
          }

          const sortedActive = sortCards(
            active,
            (cardOrder as CardOrder) || "newFirst"
          );

          setSessionCards(sortedActive);
          setReserveCards(reserve);
        }
      } catch (err) {
        console.error("Failed to load cards", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load cards");
          toast.error("Failed to load study session. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCards();

    return () => {
      isMounted = false;
    };
  }, [
    language,
    isCramMode,
    searchParams,
    dailyNewLimits,
    dailyReviewLimits,
    cardOrder,
  ]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === "known") {
        updateCard(card, { silent: true });
      }
      return;
    }
    updateCard(card, { silent: true });
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);
  };

  const handleRecordReview = async (
    card: Card,
    newCard: Card,
    grade: Grade,
    xpPayload?: CardXpPayload
  ) => {
    if (!isCramMode) {
      await recordReview(card, newCard, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate("/");
  };

  if (isLoading) {
    return (
      <LoadingScreen
        title="Loading Session"
        subtitle="Preparing your cards..."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium">Failed to load study session</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/")} size="default">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      dueCards={sessionCards}
      reserveCards={reserveCards}
      onUpdateCard={handleUpdateCard}
      onDeleteCard={handleDeleteCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate("/")}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
      onAddCard={addCard}
    />
  );
};
```

# src/routes/TestStatsRoute.tsx

```typescript
import React, { useEffect, useState } from "react";
import { db } from "@/db/dexie";
import { Card } from "@/types";

export const TestStatsRoute: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      const germanCards = await db.cards
        .where("language")
        .equals("German")
        .toArray();
      setCards(germanCards);
      setLoading(false);
    };
    fetchCards();
  }, []);

  if (loading) return <div>Loading debug data...</div>;

  const byStatus = cards.reduce((acc, card) => {
    acc[card.status] = (acc[card.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const masteredCandidates = cards.filter(
    (c) =>
      c.status === "known" || (c.status === "graduated" && c.interval >= 180)
  );

  return (
    <div className="p-8 font-mono text-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug: German Deck Stats</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Summary Counts</h2>
        <pre>{JSON.stringify(byStatus, null, 2)}</pre>
        <div className="mt-2 text-blue-600 font-bold">
          Mastered Count (Calc): {masteredCandidates.length}
        </div>
      </div>

      {masteredCandidates.length > 0 && (
        <div>
          <h2 className="font-bold mb-2">First 5 "Mastered" Cards</h2>
          <div className="space-y-4">
            {masteredCandidates.slice(0, 5).map((card) => (
              <div key={card.id} className="border p-2 rounded">
                <div>ID: {card.id}</div>
                <div>Front: {card.targetSentence}</div>
                <div>Back: {card.nativeTranslation}</div>
                <div>Status: {card.status}</div>
                <div>Interval: {card.interval}</div>
                <div>UserID: {card.user_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="text-red-500 font-bold">
          No cards found with language="German"
        </div>
      )}
    </div>
  );
};
```

# src/services/studyLimits.ts

```typescript
import { Card, UserSettings } from "../types";
import { State } from "ts-fsrs";

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
  reviewsToday?: {
    newCards: number;
    reviewCards: number;
  };
}

export const isNewCard = (card: Card) => {
  if (card.status === "new") return true;

  if (card.state !== undefined) {
    return card.state === State.New;
  }

  return (card.reps || 0) === 0;
};

const hasLimit = (value?: number) => typeof value === "number" && value > 0;

export const applyStudyLimits = (
  cards: Card[],
  settings: LimitOptions
): Card[] => {
  const { dailyNewLimit, dailyReviewLimit, reviewsToday } = settings;
  const limitedCards: Card[] = [];

  let newCount = reviewsToday?.newCards || 0;
  let reviewCount = reviewsToday?.reviewCards || 0;

  for (const card of cards) {
    const isNew = isNewCard(card);

    if (isNew) {
      if (hasLimit(dailyNewLimit)) {
        if (newCount >= (dailyNewLimit as number)) {
          continue;
        }
        newCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    } else {
      if (hasLimit(dailyReviewLimit)) {
        if (reviewCount >= (dailyReviewLimit as number)) {
          continue;
        }
        reviewCount++;
        limitedCards.push(card);
      } else {
        limitedCards.push(card);
      }
    }
  }

  return limitedCards;
};
```

# src/stores/useDeckStore.ts

```typescript
import { create } from "zustand";
import { Card, DeckStats, ReviewHistory } from "@/types";

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
}

interface DeckState {
  streakStats: StreakStats;

  lastReview: { card: Card; date: string; xpEarned: number } | null;

  setStreakStats: (stats: StreakStats) => void;
  setLastReview: (
    review: { card: Card; date: string; xpEarned: number } | null
  ) => void;
  clearLastReview: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  streakStats: {
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
  },
  lastReview: null,

  setStreakStats: (stats) => set({ streakStats: stats }),
  setLastReview: (review) => set({ lastReview: review }),
  clearLastReview: () => set({ lastReview: null }),
}));
```

# src/stores/useSettingsStore.ts

```typescript
import { create } from "zustand";
import { UserSettings, Language, LanguageId } from "@/types";
import { FSRS_DEFAULTS } from "@/constants";
import {
  UserApiKeys,
  updateUserSettings,
} from "@/db/repositories/settingsRepository";
import { toast } from "sonner";
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  language: LanguageId.Polish,
  languageColors: {
    [LanguageId.Polish]: "#dc2626",
    [LanguageId.Norwegian]: "#ef4444",
    [LanguageId.Japanese]: "#f87171",
    [LanguageId.Spanish]: "#fca5a5",
    [LanguageId.German]: "#facc15",
  },
  dailyNewLimits: {
    [LanguageId.Polish]: 20,
    [LanguageId.Norwegian]: 20,
    [LanguageId.Japanese]: 20,
    [LanguageId.Spanish]: 20,
    [LanguageId.German]: 20,
  },
  dailyReviewLimits: {
    [LanguageId.Polish]: 100,
    [LanguageId.Norwegian]: 100,
    [LanguageId.Japanese]: 100,
    [LanguageId.Spanish]: 100,
    [LanguageId.German]: 100,
  },
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  showWholeSentenceOnFront: false,
  ignoreLearningStepsWhenNoCards: false,
  binaryRatingMode: false,
  cardOrder: "newFirst",
  learningSteps: [1, 10],
  geminiApiKey: "",
  tts: {
    provider: "browser",
    voiceURI: null,
    volume: 1.0,
    rate: 0.9,
    pitch: 1.0,
    googleApiKey: "",
    azureApiKey: "",
    azureRegion: "eastus",
  },
  fsrs: {
    request_retention: FSRS_DEFAULTS.request_retention,
    maximum_interval: FSRS_DEFAULTS.maximum_interval,
    w: FSRS_DEFAULTS.w,
    enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
  },
};

const debouncedSaveSettings = debounce(
  (userId: string, settings: UserSettings) => {
    updateUserSettings(userId, settings).catch((err) => {
      console.error("Failed to auto-save settings", err);
    });
  },
  1000
);

export interface SettingsState extends UserSettings {
  settingsLoading: boolean;
  userId: string | null;

  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  setSettingsLoading: (loading: boolean) => void;
  setFullSettings: (
    settings: UserSettings | ((prev: UserSettings) => UserSettings)
  ) => void;
  initializeStore: (userId: string, settings: UserSettings) => void;
  saveApiKeys: (apiKeys: UserApiKeys) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  settingsLoading: false,
  userId: null,

  updateSettings: (newSettings) => {
    set((state) => {
      const updatedState = {
        ...state,
        ...newSettings,
        fsrs: newSettings.fsrs
          ? { ...state.fsrs, ...newSettings.fsrs }
          : state.fsrs,
        tts: newSettings.tts ? { ...state.tts, ...newSettings.tts } : state.tts,
        languageColors: newSettings.languageColors
          ? {
              ...state.languageColors,
              ...(newSettings.languageColors as Record<Language, string>),
            }
          : state.languageColors,
        dailyNewLimits: newSettings.dailyNewLimits
          ? { ...state.dailyNewLimits, ...newSettings.dailyNewLimits }
          : state.dailyNewLimits,
        dailyReviewLimits: newSettings.dailyReviewLimits
          ? { ...state.dailyReviewLimits, ...newSettings.dailyReviewLimits }
          : state.dailyReviewLimits,
        learningSteps: newSettings.learningSteps || state.learningSteps,
      };

      const userId = state.userId;
      if (userId) {
        const settingsToSave: UserSettings = {
          language: updatedState.language,
          languageColors: updatedState.languageColors,
          dailyNewLimits: updatedState.dailyNewLimits,
          dailyReviewLimits: updatedState.dailyReviewLimits,
          autoPlayAudio: updatedState.autoPlayAudio,
          blindMode: updatedState.blindMode,
          showTranslationAfterFlip: updatedState.showTranslationAfterFlip,
          showWholeSentenceOnFront: updatedState.showWholeSentenceOnFront,
          ignoreLearningStepsWhenNoCards:
            updatedState.ignoreLearningStepsWhenNoCards,
          binaryRatingMode: updatedState.binaryRatingMode,
          cardOrder: updatedState.cardOrder,
          learningSteps: updatedState.learningSteps,
          geminiApiKey: updatedState.geminiApiKey,
          tts: updatedState.tts,
          fsrs: updatedState.fsrs,
        };
        debouncedSaveSettings(userId, settingsToSave);
      }

      return updatedState;
    });
  },

  resetSettings: () => set({ ...DEFAULT_SETTINGS }),
  setSettingsLoading: (loading) => set({ settingsLoading: loading }),

  setFullSettings: (settingsOrUpdater) =>
    set((state) => {
      const newSettings =
        typeof settingsOrUpdater === "function"
          ? settingsOrUpdater(state)
          : settingsOrUpdater;
      return { ...newSettings };
    }),

  initializeStore: (userId, settings) => set({ userId, ...settings }),

  saveApiKeys: async (apiKeys) => {
    set({ settingsLoading: true });
    const { userId } = get();
    if (!userId) {
      console.error("No user ID found during saveApiKeys");
      set({ settingsLoading: false });
      return;
    }

    try {
      await updateUserSettings(userId, apiKeys);
      set((state) => ({
        geminiApiKey:
          apiKeys.geminiApiKey !== undefined
            ? apiKeys.geminiApiKey
            : state.geminiApiKey,
        tts: {
          ...state.tts,
          googleApiKey:
            apiKeys.googleTtsApiKey !== undefined
              ? apiKeys.googleTtsApiKey
              : state.tts.googleApiKey,
          azureApiKey:
            apiKeys.azureTtsApiKey !== undefined
              ? apiKeys.azureTtsApiKey
              : state.tts.azureApiKey,
          azureRegion:
            apiKeys.azureRegion !== undefined
              ? apiKeys.azureRegion
              : state.tts.azureRegion,
        },
      }));

      toast.success("API keys synced to cloud");
    } catch (error) {
      console.error("Failed to save API keys:", error);
      toast.error("Failed to sync API keys");
      throw error;
    } finally {
      set({ settingsLoading: false });
    }
  },
}));
```

# src/types/cardStatus.ts

```typescript
import { State as FsrsState } from "ts-fsrs";

export enum CardStatus {
  NEW = "new",
  LEARNING = "learning",
  REVIEW = "review",
  KNOWN = "known",
}

export const mapFsrsStateToStatus = (state: FsrsState): CardStatus => {
  switch (state) {
    case FsrsState.New:
      return CardStatus.NEW;
    case FsrsState.Learning:
      return CardStatus.LEARNING;
    case FsrsState.Relearning:
      return CardStatus.LEARNING;
    case FsrsState.Review:
      return CardStatus.REVIEW;
    default:
      return CardStatus.NEW;
  }
};

export const mapStatusToFsrsState = (status: CardStatus): FsrsState => {
  switch (status) {
    case CardStatus.NEW:
      return FsrsState.New;
    case CardStatus.LEARNING:
      return FsrsState.Learning;
    case CardStatus.REVIEW:
      return FsrsState.Review;
    case CardStatus.KNOWN:
      return FsrsState.Review;
    default:
      return FsrsState.New;
  }
};
```

# src/types/index.ts

```typescript
import { CardOrderValue, TTSProviderValue } from "@/constants/settings";
import { Card as FSRSCard, State as FSRSState } from "ts-fsrs";

export type Difficulty = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

import { CardStatus } from "./cardStatus";
export {
  CardStatus,
  mapFsrsStateToStatus,
  mapStatusToFsrsState,
} from "./cardStatus";

export interface Card extends Omit<Partial<FSRSCard>, "due" | "last_review"> {
  id: string;
  targetSentence: string;
  targetWord?: string;
  targetWordTranslation?: string;
  targetWordPartOfSpeech?: string;
  nativeTranslation: string;
  furigana?: string;
  gender?: string;
  grammaticalCase?: string;
  notes: string;
  tags?: string[];
  language?: Language;
  status: CardStatus;

  interval: number;
  easeFactor: number;
  dueDate: string;

  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  due?: string;
  last_review?: string;
  first_review?: string;
  learningStep?: number;
  leechCount?: number;
  isLeech?: boolean;
  isBookmarked?: boolean;
  precise_interval?: number;
  user_id?: string;
}

export type Grade = "Again" | "Hard" | "Good" | "Easy";

export type ReviewHistory = Record<string, number>;

export interface DeckStats {
  total: number;
  due: number;
  newDue: number;
  reviewDue: number;
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

import { Language } from "./languages";
export type { Language } from "./languages";
export { LanguageId, LANGUAGE_LABELS } from "./languages";

export type TTSProvider = TTSProviderValue;

export interface TTSSettings {
  provider: TTSProvider;
  voiceURI: string | null;
  volume: number;
  rate: number;
  pitch: number;
  googleApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export interface UserSettings {
  language: Language;
  languageColors?: Record<Language, string>;

  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  blindMode: boolean;
  showTranslationAfterFlip: boolean;
  showWholeSentenceOnFront?: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean;
  cardOrder: CardOrderValue;
  learningSteps: number[];
  tts: TTSSettings;
  fsrs: {
    request_retention: number;
    maximum_interval: number;
    w?: number[];
    enable_fuzzing?: boolean;
  };
  geminiApiKey: string;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  grade: number;
  state: number;
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}
```

# src/types/languages.ts

```typescript
export const LanguageId = {
  Polish: "polish",
  Norwegian: "norwegian",
  Japanese: "japanese",
  Spanish: "spanish",
  German: "german",
} as const;

export type Language = (typeof LanguageId)[keyof typeof LanguageId];

export const LANGUAGE_LABELS: Record<Language, string> = {
  [LanguageId.Polish]: "Polish",
  [LanguageId.Norwegian]: "Norwegian",
  [LanguageId.Japanese]: "Japanese",
  [LanguageId.Spanish]: "Spanish",
  [LanguageId.German]: "German",
};
```

# src/types/multiplayer.ts

```typescript
export type GameStatus = "waiting" | "playing" | "finished";

export interface GameQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface GameRoom {
  id: string;
  code: string;
  host_id: string;
  language: string;
  level: string;
  status: GameStatus;
  questions: GameQuestion[];
  current_question_index: number;
  timer_duration: number;
  max_players: number;
}

export interface GamePlayer {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  score: number;
  is_ready: boolean;
}
```

# src/utils/formatInterval.ts

```typescript
export const formatInterval = (diffMs: number): string => {
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  if (months < 12) return `${months}mo`;
  return `${years}y`;
};
```

# src/utils/jsonParser.ts

````typescript
export const repairJSON = (jsonString: string): string => {
  let cleaned = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1");

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else {
    start = Math.max(firstBrace, firstBracket);
  }

  if (start !== -1) {
    cleaned = cleaned.substring(start);
  }

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);

  if (end !== -1) {
    cleaned = cleaned.substring(0, end + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
};

export const parseAIJSON = <T>(jsonString: string): T => {
  const repaired = repairJSON(jsonString);
  try {
    return JSON.parse(repaired) as T;
  } catch (e) {
    console.error("JSON Parse Error on:", jsonString, "\nRepaired:", repaired);
    throw new Error("Failed to parse AI output.");
  }
};
````

# src/vite-env.d.ts

```typescript
declare const __APP_VERSION__: string;
```

# src/vitest.setup.ts

```typescript
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

type SpeechWindow = typeof window & {
  SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
};

class MockSpeechSynthesisUtterance {
  text: string;
  lang?: string;
  constructor(text: string) {
    this.text = text;
  }
}

if (typeof window !== "undefined") {
  const globalWindow = window as SpeechWindow;
  const speechSynthesisMock = {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as SpeechSynthesis["onvoiceschanged"],
  };

  Object.defineProperty(globalWindow, "speechSynthesis", {
    value: speechSynthesisMock,
    writable: true,
  });

  if (!globalWindow.SpeechSynthesisUtterance) {
    globalWindow.SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  }

  Object.defineProperty(globalWindow, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
```

# src/workers/fsrs.worker.ts

```typescript
import { ReviewLog } from "@/types";
import { computeCardLoss } from "@/lib/fsrsShared";

const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {
  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach((log) => {
    if (!cardHistory[log.card_id]) cardHistory[log.card_id] = [];
    cardHistory[log.card_id].push(log);
  });

  const cardGroups = Object.values(cardHistory);

  if (cardGroups.length < 5) {
    throw new Error("Insufficient history (need 5+ cards with reviews)");
  }

  let w = [...currentW];
  const learningRate = 0.002;
  const iterations = 500;
  const batchSize = Math.min(cardGroups.length, 64);
  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12];

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

    const h = 0.0001;

    for (const logs of batch) {
      totalLoss += computeCardLoss(logs, w);
    }

    for (const idx of targetIndices) {
      const wPlus = [...w];
      wPlus[idx] += h;

      let lossPlus = 0;
      for (const logs of batch) {
        lossPlus += computeCardLoss(logs, wPlus);
      }

      gradients[idx] = (lossPlus - totalLoss) / h;
    }

    for (const idx of targetIndices) {
      w[idx] -= learningRate * gradients[idx];
      if (w[idx] < 0.01) w[idx] = 0.01;
    }

    if (iter % 20 === 0) {
      onProgress((iter / iterations) * 100);
    }
  }

  onProgress(100);
  return w;
};

self.onmessage = async (e: MessageEvent) => {
  const { logs, currentW } = e.data;
  try {
    const optimizedW = await optimizeFSRS(logs, currentW, (progress) => {
      self.postMessage({ type: "progress", progress });
    });
    self.postMessage({ type: "result", w: optimizedW });
  } catch (error) {
    self.postMessage({ type: "error", error: (error as Error).message });
  }
};
```

# vite.config.ts

```typescript
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { version } from "./package.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
    },
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-radix": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-select",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-switch",
              "@radix-ui/react-slider",
              "@radix-ui/react-progress",
              "@radix-ui/react-scroll-area",
              "@radix-ui/react-separator",
              "@radix-ui/react-toggle",
              "@radix-ui/react-label",
              "@radix-ui/react-slot",
            ],
            "vendor-charts": ["recharts"],
            "vendor-db": ["dexie", "dexie-react-hooks", "idb"],
            "vendor-motion": ["framer-motion"],
            "vendor-icons": ["lucide-react"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-srs": ["ts-fsrs"],
            "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "uuid"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/vitest.setup.ts",
      coverage: {
        reporter: ["text", "lcov"],
        include: [
          "src/services/**/*.ts",
          "src/components/**/*.tsx",
          "src/contexts/**/*.tsx",
          "src/routes/**/*.tsx",
        ],
      },
    },
  };
});
```
