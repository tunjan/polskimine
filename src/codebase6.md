
## App.tsx
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
import { OnboardingFlow } from '@/features/auth/OnboardingFlow'; // Add this import
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

  // --- NEW: Check if user has completed onboarding (Level + Deck) ---
  if (!profile.initial_deck_generated) {
    return <OnboardingFlow />;
  }
  // -----------------------------------------------------------------

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
## components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
## components/common/LanguageThemeManager.tsx
import React, { useLayoutEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

const STYLE_TAG_ID = 'custom-language-theme';

export const LanguageThemeManager: React.FC = () => {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const previousLanguage = root.getAttribute('data-language');
    if (previousLanguage && previousLanguage !== settings.language) {
      root.removeAttribute('data-language');
    }

    if (!settings.language) return;

    root.setAttribute('data-language', settings.language);

    const customColor = settings.languageColors?.[settings.language];
    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    if (customColor && typeof customColor === 'string') {
      const [h, s, l] = customColor.split(' ').map(v => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL = normalizedL < 50 ? Math.min(normalizedL + 30, 90) : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${settings.language}"] {
          --primary: ${customColor};
          --ring: ${customColor};
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }


    return () => {
      root.removeAttribute('data-language');
      const existingStyleTag = document.getElementById(STYLE_TAG_ID);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
    };
  }, [settings.language, settings.languageColors]);

  return null;
};
## components/form/EditorialInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input';

interface EditorialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const EditorialInput: React.FC<EditorialInputProps> = (props) => (
  <Input {...props} />
);
## components/form/EditorialSelect.tsx
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import clsx from 'clsx';

export interface EditorialSelectOption {
  value: string;
  label: string;
}

interface EditorialSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: EditorialSelectOption[];
  placeholder?: string;
  className?: string;
}

export const EditorialSelect: React.FC<EditorialSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className 
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={clsx("w-full", className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
## components/form/EditorialTextarea.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditorialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const EditorialTextarea: React.FC<EditorialTextareaProps> = (props) => (
  <Textarea {...props} />
);
## components/form/MetaLabel.tsx
import React from 'react';
import clsx from 'clsx';

interface MetaLabelProps {
  className?: string;
  children: React.ReactNode;
}

export const MetaLabel: React.FC<MetaLabelProps> = ({ className, children }) => (
  <label className={clsx('block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3', className)}>
    {children}
  </label>
);
## components/layout/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  List as ListIcon,
  Settings,
  LogOut,
  Plus,
  Zap,
  Skull,
  Trophy,
  Swords,
  ChevronUp,
  Check,
  Command
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { CramModal } from '@/features/study/components/CramModal';
import { SabotageStore } from '@/features/sabotage/SabotageStore';
import { SabotageNotification } from '@/features/sabotage/SabotageNotification';
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PolishFlag, NorwegianFlag, JapaneseFlag, SpanishFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
import clsx from 'clsx';

// --- Types ---

interface NavActionProps {
  onOpenAdd: () => void;
  onOpenCram: () => void;
  onOpenSabotage: () => void;
  onOpenSettings: () => void;
  onCloseMobileMenu?: () => void;
}

// --- Shadcn Sidebar Component ---

const AppSidebar: React.FC<NavActionProps> = ({
  onOpenAdd,
  onOpenCram,
  onOpenSabotage,
  onOpenSettings,
  onCloseMobileMenu
}) => {
  const location = useLocation();
  const { settings, updateSettings } = useSettings();
  const { signOut, user } = useAuth();

  const languages = [
    { code: 'polish', name: 'Polish', Flag: PolishFlag },
    { code: 'norwegian', name: 'Norwegian', Flag: NorwegianFlag },
    { code: 'japanese', name: 'Japanese', Flag: JapaneseFlag },
    { code: 'spanish', name: 'Spanish', Flag: SpanishFlag },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

  const mainNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/cards', icon: ListIcon, label: 'Index' },
    { to: '/study', icon: GraduationCap, label: 'Study' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/multiplayer', icon: Swords, label: 'Deck Wars' },
  ];

  const toolItems = [
    { icon: Plus, label: 'Add Entry', onClick: () => { onOpenAdd(); onCloseMobileMenu?.(); } },
    { icon: Zap, label: 'Cram Mode', onClick: () => { onOpenCram(); onCloseMobileMenu?.(); } },
    { icon: Skull, label: 'Sabotage', onClick: () => { onOpenSabotage(); onCloseMobileMenu?.(); } },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <div className="w-5 h-5 bg-foreground text-background rounded-[4px] flex items-center justify-center shrink-0">
              <Command size={12} strokeWidth={3} />
            </div>
            <span className="font-semibold tracking-tight text-sm whitespace-nowrap">LinguaFlow</span>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = item.to === '/multiplayer'
                  ? location.pathname.startsWith(item.to)
                  : location.pathname === item.to;

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={onCloseMobileMenu}
                    >
                      <Link to={item.to}>
                        <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton onClick={item.onClick}>
                    <item.icon size={18} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          {/* Language Selector */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="w-4 h-4 flex items-center justify-center ">
                    <currentLanguage.Flag className="w-full h-auto rounded-xs" />
                  </div>
                  <span>{currentLanguage.name}</span>
                  <ChevronUp className="ml-auto" size={14} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-1 bg-background border-border">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-3 py-2 text-xs font-medium"
                  >
                    <lang.Flag className="w-3.5 h-auto rounded-xs" />
                    <span className="flex-1">{lang.name}</span>
                    {settings.language === lang.code && <Check size={14} className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { onOpenSettings(); onCloseMobileMenu?.(); }}>
              <Settings size={18} strokeWidth={1.5} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { signOut(); onCloseMobileMenu?.(); }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Email */}
        {user && (
          <div className="px-3 pt-2 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-mono text-muted-foreground/40 truncate">
              {user.email}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

// --- Extracted Mobile Nav Component ---

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/cards', icon: ListIcon, label: 'Index' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between h-16 px-6 max-w-md mx-auto relative">

        {/* Left Items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center w-12 gap-1 group"
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={clsx(
                  "transition-all duration-200",
                  isActive ? "text-primary -translate-y-0.5" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
            </Link>
          );
        })}

        {/* Center FAB (Study) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <Link
            to="/study"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground  /20 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-background"
          >
            <GraduationCap size={24} strokeWidth={2} className="ml-0.5" />
          </Link>
        </div>

        {/* Right Items */}
        <Link
          to="/leaderboard"
          className="flex flex-col items-center justify-center w-12 gap-1 group"
        >
          <Trophy
            size={20}
            strokeWidth={location.pathname === '/leaderboard' ? 2.5 : 1.5}
            className={clsx(
              "transition-all duration-200",
              location.pathname === '/leaderboard' ? "text-primary -translate-y-0.5" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </Link>

        {/* Menu Trigger using SidebarTrigger */}
        <SidebarTrigger className="flex flex-col items-center justify-center w-12 gap-1" />
      </div>
    </nav>
  );
};

// --- Main Layout Component ---

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addCard } = useCardOperations();
  const location = useLocation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const [isSabotageOpen, setIsSabotageOpen] = useState(false);

  const isStudyMode = location.pathname === '/study';

  const sidebarProps: NavActionProps = {
    onOpenAdd: () => setIsAddModalOpen(true),
    onOpenCram: () => setIsCramModalOpen(true),
    onOpenSabotage: () => setIsSabotageOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
  };

  // For study mode, don't render the sidebar at all
  if (isStudyMode) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
        <main className="min-h-screen p-0">
          {children}
          <SabotageNotification />
        </main>

        {/* Global Modals */}
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
        <SabotageStore isOpen={isSabotageOpen} onClose={() => setIsSabotageOpen(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground flex w-full">

        {/* Desktop Sidebar */}
        <AppSidebar {...sidebarProps} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Top Bar */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <div className="w-5 h-5 bg-foreground text-background rounded-[4px] flex items-center justify-center">
                <Command size={12} strokeWidth={3} />
              </div>
              <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 pt-14 md:pt-0 pb-20 md:pb-0">
            <div className="w-full h-full mx-auto max-w-7xl p-4 md:p-12">
              {children}
              <SabotageNotification />
            </div>
          </main>

          {/* Mobile Navigation */}
          <MobileBottomNav />
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      <SabotageStore isOpen={isSabotageOpen} onClose={() => setIsSabotageOpen(false)} />
    </SidebarProvider>
  );
};
## components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground  hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground  hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
## components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-mono uppercase tracking-wider font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground  hover:bg-primary/90 border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground  hover:bg-destructive/90",
        outline:
          "border border-input bg-background  hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground  hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-[10px]",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
## components/ui/card.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground ",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
## components/ui/checkbox.tsx
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
## components/ui/color-picker.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToHSL, hslToHex } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string; // Expects format "H S% L%" e.g., "346 84% 45%"
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = React.useMemo(() => {
    try {
      // FIX 1: Parse the string "H S% L%" into numbers before calling hslToHex
      if (!value) return '#000000';
      const [h, s, l] = value.split(' ').map(v => parseFloat(v));
      
      if (isNaN(h) || isNaN(s) || isNaN(l)) return '#000000';
      
      return hslToHex(h, s, l);
    } catch (e) {
      return '#000000';
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const { h, s, l } = hexToHSL(newHex);
    // FIX 2: Format the object back into the CSS variable string format expected by SettingsContext
    onChange(`${h} ${s}% ${l}%`);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
        const { h, s, l } = hexToHSL(newHex);
        // FIX 2: Same fix here
        onChange(`${h} ${s}% ${l}%`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-md overflow-hidden border border-input ">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <Input 
            defaultValue={hexValue}
            key={hexValue} // Force re-render on external change
            onBlur={handleTextChange}
            className="w-24 font-mono uppercase"
            maxLength={7}
        />
      </div>
    </div>
  );
};
## components/ui/dialog.tsx
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(

      "fixed inset-0 z-50 bg-black/50 dark:bg-black/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(

        "fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6  rounded-lg sm:rounded-xl",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(

      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}

    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
## components/ui/dropdown-menu.tsx
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground ",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
## components/ui/flags.tsx
import React from 'react';

interface FlagProps {
  className?: string;
}

export const PolishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <rect y="12" width="32" height="12" fill="#DC143C"/>
  </svg>
);

export const NorwegianFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#BA0C2F"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#FFFFFF" strokeWidth="6"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#00205B" strokeWidth="3"/>
  </svg>
);

export const JapaneseFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <circle cx="16" cy="12" r="7" fill="#BC002D"/>
  </svg>
);

export const SpanishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#AA151B"/>
    <rect y="6" width="32" height="12" fill="#F1BF00"/>
  </svg>
);

## components/ui/input.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base  transition-[color,box-] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

## components/ui/label.tsx
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
## components/ui/progress.tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
## components/ui/select.tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 hover:border-foreground/20 transition-colors",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
## components/ui/separator.tsx
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

## components/ui/sheet.tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4  transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

## components/ui/sidebar.tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-none group-data-[variant=floating]:border"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]: md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full ", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/50 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-sm px-2 text-[10px] uppercase tracking-wider font-bold outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-sm p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-sm p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background [0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-sm p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-sm px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-3 rounded-sm px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-sm"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-3 overflow-hidden rounded-sm px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

## components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

## components/ui/slider.tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
## components/ui/switch.tsx
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent  transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background  ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
## components/ui/table.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
## components/ui/tabs.tsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

## components/ui/textarea.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-border bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-foreground/20 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
## components/ui/tooltip.tsx
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

## constants.ts
import { Card, ReviewHistory } from './types';

export const MOCK_CARDS: Card[] = [
  {
    id: '1',
    targetSentence: "Cześć, jak się masz?",
    targetWord: "Cześć",
    nativeTranslation: "Hi, how are you?",
    notes: "Informal greeting. Also means 'Bye' depending on context.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '2',
    targetSentence: "Dziękuję za pomoc.",
    targetWord: "Dziękuję",
    nativeTranslation: "Thank you for the help.",
    notes: "First person singular of dziękować.",
    status: 'learning',
    interval: 1,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Due yesterday
  },
  {
    id: '3',
    targetSentence: "Ten mężczyzna jest wysoki.",
    targetWord: "mężczyzna",
    nativeTranslation: "That man is tall.",
    notes: "Noun, Masculine Personal.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
  {
    id: '4',
    targetSentence: "Lubię pić kawę rano.",
    targetWord: "kawę",
    nativeTranslation: "I like to drink coffee in the morning.",
    notes: "Accusative case of 'kawa'.",
    status: 'graduated',
    interval: 10,
    easeFactor: 2.7,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Due in 5 days
  },
  {
    id: '5',
    targetSentence: "Wszystko w porządku?",

    nativeTranslation: "Is everything okay?",
    notes: "Common phrase used to ask if someone is fine or if a situation is resolved.",
    status: 'new',
    interval: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
  },
];


/**
 * Helper to convert a Date to YYYY-MM-DD string using LOCAL time.
 * Matches date-fns format('yyyy-MM-dd') usage elsewhere to avoid UTC drift
 * (e.g., dates near midnight appearing as previous/next day in some timezones).
 */
export const getUTCDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = getUTCDateString(pastDate);
    

    history[dateKey] = (history[dateKey] || 0) + Math.floor(Math.random() * 10) + 1;
  }
  return history;
};

export const MOCK_HISTORY = generateMockHistory();

export const STORAGE_KEY = 'language_mining_deck_v1';
export const HISTORY_KEY = 'language_mining_history_v1';

export const SRS_CONFIG = {
  CUTOFF_HOUR: 4,
};

export const FSRS_DEFAULTS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzzing: true,
  w: [0.40255, 1.18385, 3.173, 15.69105, 7.19605, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 2.9605, 2.27315, 0.20375, 0.37325, 0.89045, 0.02495],
};

export const LANGUAGE_NAMES = {
  polish: 'Polish',
  norwegian: 'Norwegian',
  japanese: 'Japanese',
  spanish: 'Spanish'
} as const;
## contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
interface Profile {
  id: string;
  username: string | null;
  xp: number;     // Lifetime accumulation for Ranking
  points: number; // Spendable currency for Sabotage
  level: number;
  avatar_url?: string | null;
  updated_at?: string | null;
  language_level?: string | null; // User's proficiency level (A1, A2, B1, B2, C1, C2)
  initial_deck_generated?: boolean; // Whether user completed initial deck setup
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, languageLevel?: string) => Promise<any>;
  updateUsername: (username: string) => Promise<void>;
  markInitialDeckGenerated: () => Promise<void>;
  loading: boolean;
  incrementXPOptimistically: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      const nextSession = data.session;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as Profile;


          setProfile(prev => {
            if (!prev) return newProfile;

            if (prev.xp > newProfile.xp || prev.points > newProfile.points) {
              return prev;
            }
            return newProfile;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to load profile', error);
      return;
    }


    const safeData = {
      ...data,
      points: data.points ?? 0
    };

    setProfile(safeData as Profile);
  };

  const signInWithGoogle = async () => {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'com.linguaflow.app://auth/callback'
      : window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({ // <--- Destructure 'data'
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Capacitor.isNativePlatform()
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (Capacitor.isNativePlatform() && data?.url) {
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Signed out');
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string, languageLevel?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, language_level: languageLevel },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    return data;
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update username');
      throw error;
    }

    // Manually update local state to trigger re-render in App.tsx immediately
    setProfile((prev) => prev ? { ...prev, username: newUsername } : null);
  };

  const incrementXPOptimistically = (amount: number) => {
    if (!profile) return;

    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        xp: (prev.xp || 0) + amount,
        points: (prev.points || 0) + amount,
        level: Math.floor(Math.sqrt(((prev.xp || 0) + amount) / 100)) + 1
      };
    });
  };

  const markInitialDeckGenerated = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ initial_deck_generated: true })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to mark initial deck as generated:', error);
      return;
    }

    setProfile((prev) => prev ? { ...prev, initial_deck_generated: true } : null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, updateUsername, loading, incrementXPOptimistically, markInitialDeckGenerated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
## contexts/DeckContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Card, DeckStats, Grade, ReviewHistory } from '@/types';
import { getUTCDateString } from '@/constants';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getSRSDate } from '@/features/study/logic/srs';
import { useQueryClient } from '@tanstack/react-query';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import { supabase } from '@/lib/supabase';
import {
  useDeckStatsQuery,
  useDueCardsQuery,
  useReviewsTodayQuery,
  useHistoryQuery,
  useRecordReviewMutation,
  useUndoReviewMutation,
} from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';

interface DeckContextValue {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  recordReview: (card: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
  undoReview: () => Promise<void>;
  canUndo: boolean;
  refreshDeckData: () => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

const languageLabel = (language: string) => {
  if (language === 'norwegian') return 'Norwegian';
  if (language === 'japanese') return 'Japanese';
  if (language === 'spanish') return 'Spanish';
  return 'Polish';
};

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user } = useAuth();


  const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
  const { data: reviewsToday, isLoading: reviewsLoading } = useReviewsTodayQuery();
  const { data: history, isLoading: historyLoading } = useHistoryQuery();


  const recordReviewMutation = useRecordReviewMutation();
  const undoReviewMutation = useUndoReviewMutation();

  const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

  const isLoading = statsLoading || dueCardsLoading || reviewsLoading || historyLoading;


  const isSeeding = useRef(false);

  const seededLanguages = useRef<Set<string>>(new Set());



  const streakStats = useMemo(() => {

    const sortedDates = Object.keys(history || {}).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const totalReviews = Object.values(history || {}).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );


    const srsToday = getSRSDate(new Date());
    const todayStr = getUTCDateString(srsToday);
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = getUTCDateString(srsYesterday);

    if (history?.[todayStr]) {
      currentStreak = 1;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = getUTCDateString(checkDate);
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (history?.[yesterdayStr]) {
      currentStreak = 0;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = getUTCDateString(checkDate);
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      }
    }

    return { currentStreak, longestStreak, totalReviews };
  }, [history]); // Only recalculate when history object reference changes









  const stats = useMemo<DeckStats>(() => {
    if (!dbStats || !dueCards || !reviewsToday) {
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

    const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
    const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

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
      due: limitedCards.length, // Source of truth: client-side filtered array
      newDue,
      reviewDue,
      streak: streakStats.currentStreak,
      totalReviews: streakStats.totalReviews,
      longestStreak: streakStats.longestStreak,
    };
  }, [dbStats, dueCards, reviewsToday, settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, streakStats]);


  useEffect(() => {
    const loadBeginnerDeck = async () => {

      if (isSeeding.current || seededLanguages.current.has(settings.language)) return;

      if (!statsLoading && dbStats && dbStats.total === 0 && user) {
        // Skip auto-loading if user already went through enhanced signup
        // which would have set initial_deck_generated = true
        const { data: profileData } = await supabase
          .from('profiles')
          .select('initial_deck_generated')
          .eq('id', user.id)
          .single();

        if (profileData?.initial_deck_generated) {
          // User already completed initial deck setup (AI or manual)
          seededLanguages.current.add(settings.language);
          return;
        }

        isSeeding.current = true;

        const rawDeck =
          settings.language === 'norwegian'
            ? NORWEGIAN_BEGINNER_DECK
            : settings.language === 'japanese'
              ? JAPANESE_BEGINNER_DECK
              : settings.language === 'spanish'
                ? SPANISH_BEGINNER_DECK
                : POLISH_BEGINNER_DECK;


        const deck = rawDeck.map(card => ({
          ...card,
          id: crypto.randomUUID(),
          dueDate: new Date().toISOString()
        }));

        try {
          await saveAllCards(deck);

          seededLanguages.current.add(settings.language);
          toast.success(`Loaded Beginner ${languageLabel(settings.language)} course!`);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] }),
            queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] }),
            queryClient.invalidateQueries({ queryKey: ['cards'] })
          ]);
        } catch (e) {
          console.error("Failed to load beginner deck", e);
        } finally {

          isSeeding.current = false;
        }
      }
    };

    loadBeginnerDeck();
  }, [dbStats, statsLoading, user, settings.language, queryClient]);

  const recordReview = useCallback(async (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    const today = getUTCDateString(getSRSDate(new Date()));
    setLastReview({ card: oldCard, date: today });

    try {
      await recordReviewMutation.mutateAsync({ card: oldCard, grade, xpPayload });
    } catch (error) {
      console.error("Failed to record review", error);
      toast.error("Failed to save review progress");

      setLastReview(prev => (prev?.card.id === oldCard.id ? null : prev));
    }
  }, [recordReviewMutation]);

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;

    try {
      await undoReviewMutation.mutateAsync({ card, date });
      setLastReview(null);
      toast.success('Review undone');
    } catch (error) {
      console.error("Failed to undo review", error);
      toast.error("Failed to undo review");
    }
  }, [lastReview, undoReviewMutation]);

  const refreshDeckData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deckStats'] });
    queryClient.invalidateQueries({ queryKey: ['dueCards'] });
    queryClient.invalidateQueries({ queryKey: ['reviewsToday'] });
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      history: history || {},
      stats,
      reviewsToday: reviewsToday || { newCards: 0, reviewCards: 0 },
      isLoading,
      dataVersion: 0,
      recordReview,
      undoReview,
      canUndo: !!lastReview,
      refreshDeckData,
    }),
    [history, stats, reviewsToday, isLoading, recordReview, undoReview, lastReview, refreshDeckData]
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};
## contexts/SabotageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type CurseType = 'comic_sans' | 'blur' | 'uwu' | 'rotate' | 'gaslight';

interface ActiveCurse {
  id: string;
  curse_type: CurseType;
  expires_at: string;
  origin_user_id?: string;
  sender_username?: string;
}

interface SabotageContextType {
  activeCurses: ActiveCurse[];
  isCursedWith: (type: CurseType) => boolean;
  notificationQueue: ActiveCurse[];
  dismissNotification: () => void;
}

const SabotageContext = createContext<SabotageContextType | undefined>(undefined);

export const SabotageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeCurses, setActiveCurses] = useState<ActiveCurse[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<ActiveCurse[]>([]);

  const fetchCurses = async () => {
    if (!user) return;

    const { data: cursesData, error } = await supabase
      .from('active_curses')
      .select('*')
      .eq('target_user_id', user.id)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching curses:', error);
      return;
    }

    const rawCurses = (cursesData || []) as ActiveCurse[];

    const enrichedCurses = await Promise.all(
      rawCurses.map(async (curse) => {

        if (curse.origin_user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', curse.origin_user_id)
            .single();
          

          return { ...curse, sender_username: profile?.username || 'Unknown Rival' };
        }

        return { ...curse, sender_username: 'Anonymous' };
      })
    );

    setActiveCurses(enrichedCurses);

    const seenIds: string[] = JSON.parse(localStorage.getItem('linguaflow_seen_curses') || '[]');
    const newCurses = enrichedCurses.filter((c) => !seenIds.includes(c.id));
    if (newCurses.length > 0) {
      setNotificationQueue(newCurses);
    }
  };

  useEffect(() => {
    fetchCurses();
    if (!user) return;

    const channel = supabase
      .channel('sabotage_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_curses',
          filter: `target_user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newCurse = payload.new as ActiveCurse;
          let senderName = 'Anonymous';

          if (newCurse.origin_user_id) {

            senderName = 'Unknown Rival';
            
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', newCurse.origin_user_id)
              .single();
            
            if (data?.username) {
              senderName = data.username;
            }
          }

          const enriched = { ...newCurse, sender_username: senderName };
          setActiveCurses((prev) => [...prev, enriched]);
          setNotificationQueue((prev) => [...prev, enriched]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setActiveCurses((prev) => {
        const valid = prev.filter((c) => c.expires_at > now);
        return valid.length !== prev.length ? valid : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCursedWith = (type: CurseType) => activeCurses.some((c) => c.curse_type === type);

  const dismissNotification = () => {
    setNotificationQueue((prev) => {
      if (prev.length === 0) return prev;
      const [dismissed, ...rest] = prev;
      const seenIds: string[] = JSON.parse(localStorage.getItem('linguaflow_seen_curses') || '[]');
      if (!seenIds.includes(dismissed.id)) {
        seenIds.push(dismissed.id);
        localStorage.setItem('linguaflow_seen_curses', JSON.stringify(seenIds));
      }
      return rest;
    });
  };

  return (
    <SabotageContext.Provider
      value={{ activeCurses, isCursedWith, notificationQueue, dismissNotification }}
    >
      {children}
    </SabotageContext.Provider>
  );
};

export const useSabotage = () => {
  const context = useContext(SabotageContext);
  if (!context) {
    throw new Error('useSabotage must be used within SabotageProvider');
  }
  return context;
};
## contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Language } from '../types';
import { FSRS_DEFAULTS } from '../constants';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings, migrateLocalSettingsToDatabase, UserApiKeys } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';


const createLimits = (val: number): Record<Language, number> => ({
  polish: val,
  norwegian: val,
  japanese: val,
  spanish: val
});

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'polish',
  languageColors: {
    polish: '346 84% 45%',
    norwegian: '200 90% 40%',
    japanese: '330 85% 65%',
    spanish: '45 100% 50%', // Yellow/Goldish
  },
  dailyNewLimits: createLimits(20),
  dailyReviewLimits: createLimits(100),
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  ignoreLearningStepsWhenNoCards: false,
  binaryRatingMode: false,
  cardOrder: 'newFirst',
  geminiApiKey: '',
  tts: {
    provider: 'browser',
    voiceURI: null,
    volume: 1.0,
    rate: 0.9,
    pitch: 1.0,
    googleApiKey: '',
    azureApiKey: '',
    azureRegion: 'eastus'
  },
  fsrs: {
    request_retention: FSRS_DEFAULTS.request_retention,
    maximum_interval: FSRS_DEFAULTS.maximum_interval,
    w: FSRS_DEFAULTS.w,
    enable_fuzzing: FSRS_DEFAULTS.enable_fuzzing,
  }
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  settingsLoading: boolean;
  saveApiKeys: (apiKeys: UserApiKeys) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('language_mining_settings');
      if (saved) {
        const parsed = JSON.parse(saved);

        let migratedDailyNewLimits = parsed.dailyNewLimits;
        if (typeof parsed.dailyNewLimit === 'number') {
          migratedDailyNewLimits = createLimits(parsed.dailyNewLimit);
        }
        let migratedDailyReviewLimits = parsed.dailyReviewLimits;
        if (typeof parsed.dailyReviewLimit === 'number') {
          migratedDailyReviewLimits = createLimits(parsed.dailyReviewLimit);
        }

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          dailyNewLimits: migratedDailyNewLimits || DEFAULT_SETTINGS.dailyNewLimits,
          dailyReviewLimits: migratedDailyReviewLimits || DEFAULT_SETTINGS.dailyReviewLimits,
          fsrs: { ...DEFAULT_SETTINGS.fsrs, ...(parsed.fsrs || {}) },
          tts: { ...DEFAULT_SETTINGS.tts, ...(parsed.tts || {}) },
          languageColors: { ...DEFAULT_SETTINGS.languageColors, ...(parsed.languageColors || {}) },
          // API keys will be loaded from database, keep empty for now
          geminiApiKey: '',
        };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load API keys from database on mount
  useEffect(() => {
    const loadCloudSettings = async () => {
      if (!user) return;

      setSettingsLoading(true);
      try {
        // First, try to migrate from localStorage
        const migrated = await migrateLocalSettingsToDatabase(user.id);
        if (migrated) {
          toast.success('Settings migrated to cloud');
        }

        // Then load from database
        const cloudSettings = await getUserSettings(user.id);
        if (cloudSettings) {
          setSettings(prev => ({
            ...prev,
            geminiApiKey: cloudSettings.geminiApiKey || '',
            tts: {
              ...prev.tts,
              googleApiKey: cloudSettings.googleTtsApiKey || '',
              azureApiKey: cloudSettings.azureTtsApiKey || '',
              azureRegion: cloudSettings.azureRegion || 'eastus',
            }
          }));
        }
      } catch (error) {
        console.error('Failed to load cloud settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadCloudSettings();
  }, [user]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      fsrs: { ...prev.fsrs, ...(newSettings.fsrs || {}) },
      tts: { ...prev.tts, ...(newSettings.tts || {}) },
      languageColors: { ...prev.languageColors, ...(newSettings.languageColors || {}) },
      dailyNewLimits: { ...prev.dailyNewLimits, ...(newSettings.dailyNewLimits || {}) },
      dailyReviewLimits: { ...prev.dailyReviewLimits, ...(newSettings.dailyReviewLimits || {}) },
    }));
  };

  // Save API keys to database
  const saveApiKeys = async (apiKeys: UserApiKeys) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setSettingsLoading(true);
      await updateUserSettings(user.id, apiKeys);

      // Update local state
      setSettings(prev => ({
        ...prev,
        geminiApiKey: apiKeys.geminiApiKey || '',
        tts: {
          ...prev.tts,
          googleApiKey: apiKeys.googleTtsApiKey || '',
          azureApiKey: apiKeys.azureTtsApiKey || '',
          azureRegion: apiKeys.azureRegion || 'eastus',
        }
      }));

      toast.success('API keys synced to cloud');
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Failed to sync API keys');
      throw error;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Save local settings (non-API keys) to localStorage
  useEffect(() => {
    const localSettings = {
      ...settings,
      // Don't save API keys to localStorage anymore
      geminiApiKey: '',
      tts: {
        ...settings.tts,
        googleApiKey: '',
        azureApiKey: '',
      }
    };
    localStorage.setItem('language_mining_settings', JSON.stringify(localSettings));
  }, [settings]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, settingsLoading, saveApiKeys }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
## contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

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
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {

  const theme = 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  const value: ThemeContextState = {
    theme,
    setTheme: () => {}, // No-op
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
## features/auth/AuthPage.tsx
import React, { useState } from 'react';
import { ArrowRight, Loader2, Command, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty } from '@/types';
import clsx from 'clsx';

type SignupStep = 'credentials' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, markInitialDeckGenerated } = useAuth();
  const { settings } = useSettings();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Signup flow state
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      toast.success('Session established.');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Move to level selection
    setSignupStep('level');
  };

  const handleLevelSelected = () => {
    if (!selectedLevel) {
      toast.error('Please select a proficiency level');
      return;
    }
    setSignupStep('deck');
  };

  const handleDeckSetup = async (useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      // First, create the account
      const authData = await signUpWithEmail(email, password, username, selectedLevel);

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      const userId = authData.user.id;

      // If using AI, save API key and generate deck
      if (useAI && apiKey) {
        // Save API key to database
        await updateUserSettings(userId, { geminiApiKey: apiKey });

        // Generate AI deck
        const cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });

        // Save cards to database
        await saveAllCards(cards);
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        // Default deck will be auto-loaded by DeckContext
        toast.success('Account created! Loading beginner course...');
      }

      // Mark initial deck as generated
      await markInitialDeckGenerated();

      // Success toast already shown above
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Setup failed');
      throw error; // Re-throw so DeckGenerationStep can handle it
    } finally {
      setLoading(false);
    }
  };

  const resetSignupFlow = () => {
    setSignupStep('credentials');
    setSelectedLevel(null);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetSignupFlow();
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">

      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {mode === 'signin'
                ? 'Welcome back.'
                : signupStep === 'credentials'
                  ? 'Initialize account.'
                  : signupStep === 'level'
                    ? 'Select level.'
                    : 'Setup deck.'}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {mode === 'signin'
                ? 'Enter credentials to continue.'
                : signupStep === 'credentials'
                  ? 'Begin your sequence.'
                  : signupStep === 'level'
                    ? `Step 2 of 3`
                    : `Step 3 of 3`}
            </p>
          </div>
        </div>

        {/* Signin Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-8">

            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Email Address
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="user@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Password
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    Connect
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full h-11 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-3 rounded-[2px]"
              >
                Google Auth
              </button>
            </div>
          </form>
        )}

        {/* Signup Form - Step 1: Credentials */}
        {mode === 'signup' && signupStep === 'credentials' && (
          <form onSubmit={handleSignUpCredentials} className="flex flex-col gap-8">

            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Username
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="User_01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Email Address
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="user@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="group relative">
              <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                Password
              </label>
              <input
                className="w-full bg-transparent border-b border-border py-2 text-base outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* Signup Step 2: Level Selection */}
        {mode === 'signup' && signupStep === 'level' && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSignupStep('credentials')}
                className="h-11 px-4 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 rounded-[2px]"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={handleLevelSelected}
                disabled={!selectedLevel}
                className="flex-1 h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Signup Step 3: Deck Generation */}
        {mode === 'signup' && signupStep === 'deck' && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              language={settings.language}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckSetup}
            />

            <button
              type="button"
              onClick={() => setSignupStep('level')}
              disabled={loading}
              className="h-11 border border-border text-foreground text-xs font-mono uppercase tracking-widest hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2 rounded-[2px] disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </div>
        )}

        {/* Footer / Toggle */}
        {signupStep === 'credentials' && (
          <div className="flex justify-center">
            <button
              onClick={toggleMode}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
            >
              <span>{mode === 'signin' ? 'No account?' : 'Have an account?'}</span>
              <span className="border-b border-muted-foreground/30 group-hover:border-foreground pb-0.5">
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </span>
            </button>
          </div>
        )}

      </div>

      {/* Version Tag */}
      <div className="fixed bottom-6 left-6 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
        System v2.0
      </div>
    </div>
  );
};
## features/auth/components/DeckGenerationStep.tsx
import React, { useState } from 'react';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';
import { Difficulty, Language } from '@/types';
import clsx from 'clsx';

interface DeckGenerationStepProps {
    language: Language;
    proficiencyLevel: Difficulty;
    onComplete: (useAI: boolean, apiKey?: string) => Promise<void>;
}

type DeckOption = 'ai' | 'default' | null;

export const DeckGenerationStep: React.FC<DeckGenerationStepProps> = ({
    language,
    proficiencyLevel,
    onComplete,
}) => {
    const [selectedOption, setSelectedOption] = useState<DeckOption>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (selectedOption === 'ai' && !apiKey.trim()) {
            setError('Please enter your Gemini API key');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onComplete(selectedOption === 'ai', selectedOption === 'ai' ? apiKey : undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to complete setup');
            setLoading(false);
        }
    };

    const languageName = language === 'norwegian' ? 'Norwegian' :
        (language === 'japanese' ? 'Japanese' :
            (language === 'spanish' ? 'Spanish' : 'Polish'));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-light tracking-tight text-foreground">
                    Initialize your deck.
                </h2>
                <p className="text-xs font-mono text-muted-foreground">
                    Choose how to start learning {languageName} at {proficiencyLevel} level.
                </p>
            </div>

            {/* Options */}
            <div className="grid gap-3">
                {/* AI Generated Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('ai')}
                    disabled={loading}
                    className={clsx(
                        'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                        'hover:bg-secondary/30 disabled:opacity-50',
                        selectedOption === 'ai'
                            ? 'border-foreground bg-secondary/20'
                            : 'border-border/40'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-foreground/10 rounded-[2px] flex items-center justify-center">
                            <Sparkles size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-sm font-mono font-medium text-foreground">
                                AI-Generated Deck
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Generate 50 personalized flashcards using Gemini AI, tailored to {proficiencyLevel} level.
                                Requires your API key.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Default Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('default')}
                    disabled={loading}
                    className={clsx(
                        'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                        'hover:bg-secondary/30 disabled:opacity-50',
                        selectedOption === 'default'
                            ? 'border-foreground bg-secondary/20'
                            : 'border-border/40'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-foreground/10 rounded-[2px] flex items-center justify-center">
                            <BookOpen size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-sm font-mono font-medium text-foreground">
                                Default Beginner Course
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Start with our curated beginner deck. No API key needed. You can generate custom cards later.
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* API Key Input (shown only if AI option selected) */}
            {selectedOption === 'ai' && (
                <div className="group relative animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                        Gemini API Key
                    </label>
                    <input
                        className="w-full bg-transparent border-b border-border py-2 text-sm outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none font-mono"
                        placeholder="AIza..."
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                    />
                    <p className="mt-2 text-[10px] text-muted-foreground font-mono">
                        Your API key will be saved securely and synced across all your devices.
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[2px]">
                    <p className="text-xs text-destructive font-mono">{error}</p>
                </div>
            )}

            {/* Continue Button */}
            <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedOption || loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
            >
                {loading ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        {selectedOption === 'ai' ? 'Generating...' : 'Setting up...'}
                    </>
                ) : (
                    'Continue'
                )}
            </button>

            {loading && selectedOption === 'ai' && (
                <p className="text-center text-[10px] text-muted-foreground font-mono animate-pulse">
                    This may take 20-30 seconds...
                </p>
            )}
        </div>
    );
};

## features/auth/components/LanguageLevelSelector.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import clsx from 'clsx';

interface LanguageLevelSelectorProps {
    selectedLevel: Difficulty | null;
    onSelectLevel: (level: Difficulty) => void;
}

const LEVELS: { level: Difficulty; name: string; description: string }[] = [
    { level: 'A1', name: 'Beginner', description: 'Basic phrases, greetings, simple present tense' },
    { level: 'A2', name: 'Elementary', description: 'Everyday expressions, simple past, basic questions' },
    { level: 'B1', name: 'Intermediate', description: 'Connected text, express opinions, common idioms' },
    { level: 'B2', name: 'Upper Intermediate', description: 'Complex topics, abstract ideas, nuanced expressions' },
    { level: 'C1', name: 'Advanced', description: 'Sophisticated vocabulary, idiomatic expressions' },
    { level: 'C2', name: 'Mastery', description: 'Near-native fluency, literary expressions' },
];

export const LanguageLevelSelector: React.FC<LanguageLevelSelectorProps> = ({
    selectedLevel,
    onSelectLevel,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h2 className="text-xl font-light tracking-tight text-foreground">
                    Select your proficiency level.
                </h2>
                <p className="text-xs font-mono text-muted-foreground">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <div className="grid gap-3">
                {LEVELS.map(({ level, name, description }) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onSelectLevel(level)}
                        className={clsx(
                            'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                            'hover:bg-secondary/30',
                            selectedLevel === level
                                ? 'border-foreground bg-secondary/20'
                                : 'border-border/40'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={clsx(
                                    'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                    selectedLevel === level
                                        ? 'border-foreground bg-foreground'
                                        : 'border-border group-hover:border-foreground/50'
                                )}
                            >
                                {selectedLevel === level && (
                                    <Check size={12} className="text-background" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-mono font-medium text-foreground">
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

## features/auth/LoginScreen.tsx
import React from 'react';
import { LogIn, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
            Sign in to sync your decks, earn XP, and climb the global leaderboard.
          </p>
        </div>
      </div>
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 font-medium "
      >
        <LogIn size={18} />
        Continue with Google
      </button>
      <p className="text-[11px] uppercase text-muted-foreground tracking-[0.2em]">
        Powered by Supabase Auth
      </p>
    </div>
  );
};
## features/auth/OnboardingFlow.tsx
import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { Difficulty, Card } from '@/types';
import { toast } from 'sonner';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { Command, LogOut } from 'lucide-react';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

export const OnboardingFlow: React.FC = () => {
  const { user, markInitialDeckGenerated, signOut } = useAuth();
  const { settings } = useSettings();
  const [step, setStep] = useState<'level' | 'deck'>('level');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep('deck');
  };

  const handleDeckComplete = async (useAI: boolean, apiKey?: string) => {
    if (!user || !selectedLevel) return;

    try {
      // 1. If AI is chosen, save the API Key first
      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }

      // 2. Generate or Load Deck
      let cards: Card[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language: settings.language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
      } else {
        // Load Default Beginner Deck based on language
        const rawDeck = 
          settings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK : 
          (settings.language === 'japanese' ? JAPANESE_BEGINNER_DECK : 
          (settings.language === 'spanish' ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
        
        cards = rawDeck.map(c => ({
          ...c,
          id: uuidv4(),
          dueDate: new Date().toISOString(),
          // Add tag for the selected level even on default deck
          tags: [...(c.tags || []), selectedLevel]
        }));
      }

      // 3. Save Cards to DB
      if (cards.length > 0) {
        await saveAllCards(cards);
        toast.success(`Loaded ${cards.length} cards into your deck.`);
      }

      // 4. Mark flow as complete (triggers App.tsx to render main router)
      await markInitialDeckGenerated();

    } catch (error: any) {
      console.error('Onboarding failed:', error);
      toast.error(error.message || 'Setup failed. Please try again.');
      throw error; // Re-throw to let the child component handle loading state reset if needed
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 selection:bg-foreground selection:text-background">
      
      {/* Header / Nav */}
      <div className="fixed top-6 right-6">
        <button 
          onClick={() => signOut()}
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="w-full max-w-[320px] flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Branding */}
        <div className="flex flex-col gap-6 items-start">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center rounded-[2px]">
            <Command size={16} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              {step === 'level' ? 'Proficiency Level.' : 'Initialize Deck.'}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === 'level' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === 'level' && (
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        )}

        {step === 'deck' && selectedLevel && (
          <div className="flex flex-col gap-6">
            <DeckGenerationStep
              language={settings.language}
              proficiencyLevel={selectedLevel}
              onComplete={handleDeckComplete}
            />
            <button
              onClick={() => setStep('level')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Back to Level Selection
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
## features/auth/UsernameSetup.tsx
import React, { useState } from 'react';
import { ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const UsernameSetup: React.FC = () => {
  const { updateUsername, user } = useAuth();
  const [username, setUsername] = useState('');
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-4">
                Step 02 / Identity
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground leading-tight">
                How should we <br/> call you?
            </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="relative group">
            <input
              className="w-full bg-transparent border-b border-border py-4 text-2xl md:text-3xl font-light outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none text-foreground"
              placeholder="Type name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              minLength={3}
              maxLength={20}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
                <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">
                    {username.length} / 20
                </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                ID: {user?.email}
            </div>

            <button 
              type="submit" 
              className="group flex items-center gap-3 text-sm font-medium hover:text-foreground/70 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !username}
            >
              {isSubmitting ? 'Processing' : 'Confirm'}
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
## features/dashboard/components/Dashboard.tsx
import React from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, Info } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { LevelProgressBar } from './LevelProgressBar';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

interface DashboardProps {
    metrics: { new: number; learning: number; graduated: number; known: number };
    forecast: { day: string; fullDate: string; count: number }[];
    stats: DeckStats;
    history: ReviewHistory;
    onStartSession: () => void;
    cards: any[];
    languageXp: number;
}

const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-2">
        <span className="text-4xl md:text-5xl font-light tracking-tighter tabular-nums">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </div>
  </div>
);

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

export const Dashboard: React.FC<DashboardProps> = ({
        metrics,
        stats,
        history,
        onStartSession,
        cards,
        languageXp
}) => {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const currentLevel = calculateLevel(languageXp);

  const { data: revlogStats } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  return (
    <div className="space-y-24 animate-in fade-in duration-700 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left: Main Counter */}
        <div className="lg:col-span-7 space-y-12">
          <div className="flex items-center gap-3">
             <div className={`h-1.5 w-1.5 rounded-full bg-primary`} />
             <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
               {settings.language} Deck
             </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-8xl sm:text-9xl lg:text-[10rem] font-light tracking-tighter text-foreground -ml-1 leading-[0.8]">
                {stats.due}
            </h1>
            <p className="text-xl text-muted-foreground font-light tracking-tight pl-2">
                Cards due today
            </p>
          </div>

          <div className="flex gap-16 pt-4 pl-1">
             <div className="flex flex-col gap-1">
                <span className="text-3xl font-light tabular-nums">{stats.newDue}</span>
                {/* Changed label from "Unseen" to "New" */}
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">New</span>
             </div>
             <div className="w-px bg-border/60 h-12" />
             <div className="flex flex-col gap-1">
                <span className="text-3xl font-light tabular-nums">{stats.reviewDue}</span>
                {/* Changed label from "Mature" to "Reviews" to avoid collision with "Learning" */}
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Reviews</span>
             </div>
          </div>
        </div>

        {/* Right: Action & Profile */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full gap-16 pt-4">
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="group w-full bg-transparent hover:bg-transparent text-foreground transition-all flex items-center justify-between gap-4 disabled:opacity-30 disabled:cursor-not-allowed border-b border-foreground/20 hover:border-foreground pb-6"
            >
                <span className="font-light tracking-tight text-4xl md:text-5xl">Start Session</span>
                <ArrowRight size={40} className="group-hover:translate-x-4 transition-transform opacity-50 group-hover:opacity-100" strokeWidth={1} />
            </button>

            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Level {currentLevel}</span>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums">
                            {languageXp.toLocaleString()} <span className="text-sm text-muted-foreground font-mono">XP</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Balance</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={10} className="text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs p-3 font-mono text-xs">
                                        Points are used in the Sabotage Store.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-3xl font-light tracking-tight tabular-nums text-foreground">
                            {profile?.points?.toLocaleString() ?? 0} <span className="text-sm text-muted-foreground font-mono">PTS</span>
                        </div>
                    </div>
                </div>
                <LevelProgressBar xp={languageXp} level={currentLevel} />
            </div>
        </div>
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- STATS GRID --- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-12">
        {/* Labels kept as requested, but data source is now bucketed by interval */}
        <StatCard label="Unseen" value={metrics.new} />
        <StatCard label="Learning" value={metrics.learning} />
        <StatCard label="Mature" value={metrics.graduated} />
        <StatCard label="Known" value={metrics.known} />
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- ACTIVITY HEATMAP --- */}
      <section className="space-y-8">
          <div className="flex items-end justify-between">
              <div className="space-y-1">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Activity Map</h3>
                  <p className="text-3xl font-light tracking-tight">{stats.streak} Day Streak</p>
              </div>
              <div className="hidden md:block text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Reviews</span>
                    <p className="text-xl font-mono font-light">{stats.totalReviews.toLocaleString()}</p>
              </div>
          </div>
          
          <div className="w-full overflow-hidden">
              <Heatmap history={history} />
          </div>
      </section>

      <div className="w-full h-px bg-border" />

      {/* --- ANALYTICS SECTION --- */}
      {revlogStats && (
        <section className="space-y-12">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h2 className="text-sm font-medium tracking-tight">Performance Analytics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 h-auto md:h-64">
                {/* 1. Volume */}
                <div className="col-span-1">
                    <ReviewVolumeChart data={revlogStats.activity} />
                </div>

                {/* 2. Retention */}
                <div className="col-span-1 border-t md:border-t-0 md:border-l border-border/50 pt-8 md:pt-0 md:pl-8">
                    <TrueRetentionChart 
                        data={revlogStats.retention} 
                        targetRetention={settings.fsrs.request_retention} 
                    />
                </div>a
            </div>
        </section>
      )}
      
      <div className="w-full h-px bg-border" />

      {/* --- WORKLOAD & STABILITY --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <RetentionStats cards={cards} />
      </section>
    </div>
  );
};
## features/dashboard/components/GradeDistributionChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

interface GradeDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

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
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Answer Distribution</h3>
      </div>
      
      <div className="flex-1 flex items-center gap-8">
        <div className="h-[160px] w-[160px] shrink-0 relative">
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-light tracking-tighter">{total}</span>
                <span className="text-[9px] font-mono uppercase text-muted-foreground">Reviews</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={data}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                </Pie>
                <Tooltip 
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        return (
                            <div className="bg-background border border-border px-2 py-1 text-xs font-mono ">
                                {payload[0].name}: {payload[0].value}
                            </div>
                        );
                        }
                        return null;
                    }}
                />
            </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex flex-col gap-2 flex-1">
            {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
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

## features/dashboard/components/Heatmap.tsx
import React, { useMemo } from 'react';
import { ReviewHistory } from '@/types';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { clsx } from 'clsx';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    let startDate = subDays(today, 364);
    const dayOfWeek = startDate.getDay(); // 0 is Sunday
    startDate = subDays(startDate, dayOfWeek); 
    
    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const dateKey = format(d, 'yyyy-MM-dd');
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today
      });
    }
    return days;
  }, [history]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-secondary/40';
    if (count <= 2) return 'bg-foreground/20';
    if (count <= 5) return 'bg-foreground/40';
    if (count <= 9) return 'bg-foreground/70';
    return 'bg-foreground';
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto no-scrollbar">
          <div className="min-w-max">
              <div className="grid grid-rows-7 grid-flow-col gap-[4px]">
              {calendarData.map((day) => (
                  <Tooltip key={day.dateKey} delayDuration={0}>
                      <TooltipTrigger asChild>
                          <div
                              className={clsx(
                                  "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[1px] transition-all duration-300",
                                  day.inFuture ? 'opacity-0 pointer-events-none' : getColorClass(day.count)
                              )}
                          />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-mono uppercase tracking-wider bg-foreground text-background border-none px-3 py-1.5">
                          {format(day.date, 'MMM d')}: <span className="font-bold">{day.count}</span> reviews
                      </TooltipContent>
                  </Tooltip>
              ))}
              </div>
          </div>
      </div>
    </TooltipProvider>
  );
};
## features/dashboard/components/LevelProgressBar.tsx
import React, { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LevelProgressBarProps {
  xp: number;
  level: number;
  className?: string;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ xp, level, className }) => {
  const progressData = useMemo(() => {


    const currentLevelStartXP = 100 * Math.pow(level - 1, 2);
    const nextLevelStartXP = 100 * Math.pow(level, 2);

    const xpGainedInLevel = xp - currentLevelStartXP;
    const xpRequiredForLevel = nextLevelStartXP - currentLevelStartXP;

    const percentage = Math.min(100, Math.max(0, (xpGainedInLevel / xpRequiredForLevel) * 100));
    const xpRemaining = nextLevelStartXP - xp;

    return { percentage, xpRemaining, nextLevelStartXP };
  }, [xp, level]);

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current Level</span>
          <span className="text-sm font-medium font-mono">{level}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Next Level</span>
          <span className="text-xs font-mono text-muted-foreground">-{progressData.xpRemaining.toLocaleString()} XP</span>
        </div>
      </div>
      {/* Bar */}
      <Progress value={progressData.percentage} className="h-1 bg-secondary" />
    </div>
  );
};

## features/dashboard/components/RetentionStats.tsx
import React, { useMemo, useState } from 'react';
import { Card } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { differenceInCalendarDays, parseISO, format, addDays, addMonths, eachMonthOfInterval } from 'date-fns';
import { useChartColors } from '@/hooks/useChartColors';
import clsx from 'clsx';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const colors = useChartColors();
  const [forecastRange, setForecastRange] = useState<'7d' | '1m' | '1y'>('7d');


  const forecastData = useMemo(() => {
    const today = new Date();
    let data: { label: string; count: number; fullDate?: Date }[] = [];

    if (forecastRange === '7d') {
      data = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'EEE'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1m') {
       data = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'd'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1y') {
        const months = eachMonthOfInterval({ start: today, end: addMonths(today, 11) });
        data = months.map(date => ({ label: format(date, 'MMM'), count: 0, fullDate: date }));
    }

    cards.forEach(card => {
      if (card.status === 'known' || !card.dueDate) return;
      const dueDate = parseISO(card.dueDate);
      const diffDays = differenceInCalendarDays(dueDate, today);
      
      if (diffDays < 0) return; 

      if (forecastRange === '7d' && diffDays < 7) data[diffDays].count++;
      else if (forecastRange === '1m' && diffDays < 30) data[diffDays].count++;
      else if (forecastRange === '1y') {
          const monthIndex = data.findIndex(d => d.fullDate && d.fullDate.getMonth() === dueDate.getMonth() && d.fullDate.getFullYear() === dueDate.getFullYear());
          if (monthIndex !== -1) data[monthIndex].count++;
      }
    });
    return data;
  }, [cards, forecastRange]);

  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '3d', min: 1, max: 3, count: 0 },
      { label: '1w', min: 3, max: 7, count: 0 },
      { label: '2w', min: 7, max: 14, count: 0 },
      { label: '1m', min: 14, max: 30, count: 0 },
      { label: '3m', min: 30, max: 90, count: 0 },
      { label: '3m+', min: 90, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [cards]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background text-[10px] font-mono uppercase tracking-wider px-3 py-2  border-none">
          <span className="opacity-70">{label}:</span> <span className="font-bold">{payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  if (!cards || cards.length === 0) {
    return <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No data available</div>;
  }

  return (
    <>
        {/* Forecast Chart */}
        <div className="flex flex-col h-64">
            <div className="flex items-baseline justify-between mb-8">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Workload Forecast</h3>
                <div className="flex gap-4">
                    {(['7d', '1m', '1y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setForecastRange(range)}
                            className={clsx(
                                "text-[10px] font-mono uppercase tracking-widest transition-colors",
                                forecastRange === range 
                                    ? "text-foreground border-b border-foreground" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
                            axisLine={false}
                            tickLine={false}
                            interval={forecastRange === '1m' ? 2 : 0}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.1 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                            {forecastData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Stability Chart */}
        <div className="flex flex-col h-64">
            <div className="flex items-baseline justify-between mb-8">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Memory Stability</h3>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Retention Interval
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stabilityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 10, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.1 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                             {stabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.5 + (index * 0.05)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </>
  );
};
## features/dashboard/components/ReviewVolumeChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const colors = useChartColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border px-3 py-2 ">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.date}</div>
          <div className="text-sm font-medium">
            <span className="font-mono">{payload[0].value}</span> reviews
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
              axisLine={false}
              tickLine={false}
              interval={2}
              dy={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.2 }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors.foreground} 
                  fillOpacity={entry.count === 0 ? 0.1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

## features/dashboard/components/TrueRetentionChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({ data, targetRetention }) => {
  const colors = useChartColors();
  const targetPercent = targetRetention * 100;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border px-3 py-2 ">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium font-mono">{payload[0].value.toFixed(1)}%</span>
             <span className="text-[10px] text-muted-foreground">Pass Rate</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">True Retention (30d)</h3>
        <div className="flex items-center gap-2">
            <div className="w-2 h-px bg-muted-foreground/50" />
            <span className="text-[9px] font-mono uppercase text-muted-foreground">Target: {targetPercent}%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
              axisLine={false}
              tickLine={false}
              interval={4}
              dy={10}
            />
            <YAxis 
                domain={[60, 100]} 
                tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.muted, strokeWidth: 1 }} />
            <ReferenceLine y={targetPercent} stroke={colors.mutedForeground} strokeDasharray="3 3" opacity={0.5} />
            <Line 
                type="monotone" 
                dataKey="rate" 
                stroke={colors.foreground} 
                strokeWidth={1.5}
                dot={{ r: 2, fill: colors.background, strokeWidth: 1.5 }}
                activeDot={{ r: 4, fill: colors.primary }}
                connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

## features/deck/components/AddCardModal.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { EditorialInput } from "@/components/form/EditorialInput";
import { EditorialTextarea } from "@/components/form/EditorialTextarea";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
  const { settings } = useSettings();
  const [form, setForm] = useState({
    sentence: "",
    targetWord: "",
    translation: "",
    notes: "",
    furigana: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const isMounted = React.useRef(false);
  

  const wasOpen = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {


    if (isOpen && !wasOpen.current) {
        if (initialCard) {
            const isJapanese = initialCard.language === 'japanese' || (!initialCard.language && settings.language === 'japanese');
            setForm({
                sentence: (isJapanese && initialCard.furigana) ? initialCard.furigana : initialCard.targetSentence,
                targetWord: initialCard.targetWord || "",
                translation: initialCard.nativeTranslation,
                notes: initialCard.notes,
                furigana: initialCard.furigana || ""
            });
        } else {
            setForm({ sentence: "", targetWord: "", translation: "", notes: "", furigana: "" });
        }
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialCard, settings.language]);

    const handleAutoFill = async () => {
        if (!form.sentence) return;
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }
    setIsGenerating(true);
    try {
        const targetLanguage = initialCard?.language || settings.language;
                const result = await aiService.generateCardContent(form.sentence, targetLanguage, settings.geminiApiKey);
        
        if (isMounted.current) {
            setForm(prev => ({ 
                ...prev, 
                sentence: (targetLanguage === 'japanese' && result.furigana) ? result.furigana : prev.sentence,
                translation: result.translation, 
                notes: result.notes,
                furigana: result.furigana || prev.furigana 
            }));
            toast.success("Content generated");
        }
    } catch (e) {
        if (isMounted.current) toast.error("Generation failed");
    } finally {
        if (isMounted.current) setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sentence || !form.translation) {
      toast.error("Sentence and translation required");
      return;
    }
    
    if (form.targetWord && !form.sentence.toLowerCase().includes(form.targetWord.toLowerCase())) {
        toast.error("Target word provided but not found in sentence");
        return;
    }

    const cardBase = initialCard || { id: uuidv4(), status: "new", interval: 0, easeFactor: 2.5, dueDate: new Date().toISOString(), reps: 0, lapses: 0 } as Card;
    
    const targetLanguage = initialCard?.language || settings.language;
    let targetSentence = form.sentence;
    let furigana = form.furigana || undefined;

    if (targetLanguage === 'japanese') {


        furigana = form.sentence;

        targetSentence = parseFurigana(form.sentence).map(s => s.text).join("");
    }

    const newCard: Card = {
      ...cardBase,
      targetSentence: targetSentence,
      targetWord: form.targetWord || undefined,
      nativeTranslation: form.translation,
      notes: form.notes,
      furigana: furigana,
      language: targetLanguage
    };
    onAdd(newCard);
    setForm({ sentence: "", targetWord: "", translation: "", notes: "", furigana: "" });
    onClose();
  };


  const HighlightedPreview = useMemo(() => {
      if (!form.sentence) return null;
      
      const targetLanguage = initialCard?.language || settings.language;

      if (targetLanguage === 'japanese') {
          const segments = parseFurigana(form.sentence);
          return (
            <div className="mt-6 text-2xl font-light text-muted-foreground select-none">
                {segments.map((segment, i) => {
                    const isTarget = form.targetWord && segment.text === form.targetWord;
                    if (segment.furigana) {
                        return (
                            <ruby key={i} className="group mr-1">
                                <span className={isTarget ? "text-foreground font-normal border-b border-foreground pb-0.5" : "text-foreground"}>{segment.text}</span>
                                <rt className="text-sm text-muted-foreground font-normal select-none">{segment.furigana}</rt>
                            </ruby>
                        );
                    }
                    return <span key={i} className={isTarget ? "text-foreground font-normal border-b border-foreground pb-0.5" : ""}>{segment.text}</span>;
                })}
            </div>
          );
      }

      if (!form.targetWord) return null;
      const parts = form.sentence.split(new RegExp(`(${escapeRegExp(form.targetWord)})`, "gi"));
      return (
        <div className="mt-6 text-2xl font-light text-muted-foreground select-none">
            {parts.map((part, i) => part.toLowerCase() === form.targetWord.toLowerCase() ? <span key={i} className="text-foreground font-normal border-b border-foreground pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
        </div>
      );
  }, [form.sentence, form.targetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-12 bg-background border border-border  sm:rounded-xl gap-0">
                <DialogDescription className="sr-only">Form to add or edit a flashcard</DialogDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <DialogTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {initialCard ? "Edit" : "New"} Entry
                </DialogTitle>
                <button 
                    type="button"
                    onClick={handleAutoFill}
                    disabled={isGenerating || !form.sentence}
                    className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline disabled:opacity-30"
                >
                    {isGenerating ? "Analyzing..." : "AI Auto-Fill"}
                </button>
            </div>

            {/* Hero Input */}
            <div className="space-y-2">
                <textarea
                    placeholder="Enter target sentence..."
                    className="w-full text-3xl md:text-4xl font-light bg-transparent border-none outline-none placeholder:text-muted-foreground/20 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground"
                    value={form.sentence}
                    onChange={e => setForm({...form, sentence: e.target.value})}
                    rows={2}
                    autoFocus
                />
                {HighlightedPreview}
            </div>

            {/* Grid inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Translation</label>
                    <EditorialInput 
                        value={form.translation}
                        onChange={e => setForm({...form, translation: e.target.value})}
                        placeholder="e.g., This is a house."
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Target Word (Match)</label>
                    <EditorialInput 
                        value={form.targetWord}
                        onChange={e => setForm({...form, targetWord: e.target.value})}
                        placeholder="e.g., house"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Context Notes</label>
                <EditorialTextarea 
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                />
            </div>

            <div className="flex justify-end pt-6">
                <button 
                    type="submit" 
                    className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-3 rounded-md text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                    Save <ArrowRight size={16} />
                </button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
## features/deck/components/CardHistoryModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/types';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import clsx from 'clsx';

interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({ 
  label, 
  value, 
  subtext 
}: { 
  label: string, 
  value: string | number, 
  subtext?: string 
}) => (
  <div className="flex flex-col justify-center p-6 md:p-8 border-b border-r border-border/40 last:border-r-0 [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">{label}</span>
    <span className="text-4xl md:text-5xl font-light tracking-tighter tabular-nums text-foreground">{value}</span>
    {subtext && <span className="text-xs text-muted-foreground mt-2 font-light">{subtext}</span>}
  </div>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);
  
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="text-right">
        <span className="text-sm font-light">{format(date, 'PPP')}</span>
        <span className="text-xs text-muted-foreground ml-2 opacity-50">{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>
    </div>
  );
};

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, isOpen, onClose }) => {
  if (!card) return null;

  const difficultyPercent = Math.min(100, Math.round(((card.difficulty || 0) / 10) * 100));
  const stability = card.stability ? parseFloat(card.stability.toFixed(2)) : 0;


  const getFsrsLabel = (state?: number) => {
      if (state === 0) return 'New';
      if (state === 1) return 'Learning';
      if (state === 2) return 'Review';
      if (state === 3) return 'Relearning';
      return 'Unknown';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-background border border-border  sm:rounded-xl p-0 gap-0 overflow-hidden">
        
        {/* Header: Clean, Spaced out */}
        <div className="p-8 md:p-10 border-b border-border/40">
          <div className="flex justify-between items-start mb-6">
             <DialogTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Card Analysis
             </DialogTitle>
             <div className="px-2 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {getFsrsLabel(card.state)}
             </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-tight">
                {card.targetSentence}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed opacity-70">
                {card.nativeTranslation}
            </p>
          </div>
          <DialogDescription className="sr-only">Detailed statistics for this flashcard</DialogDescription>
        </div>

        {/* Stats Grid: 2x2 utilitarian grid */}
        <div className="grid grid-cols-2 border-b border-border/40">
            <StatBox 
              label="Total Reviews" 
              value={card.reps || 0}
              subtext="Repetitions"
            />
            <StatBox 
              label="Lapses" 
              value={card.lapses || 0}
              subtext="Forgotten count"
            />
            <StatBox 
              label="Stability" 
              value={`${stability}d`}
              subtext="Retention Interval"
            />
            <StatBox 
              label="Difficulty" 
              value={`${(card.difficulty || 0).toFixed(1)}`}
              subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
            />
        </div>

        {/* Footer: Timeline */}
        <div className="p-8 md:p-10 bg-secondary/5">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
              Lifecycle
            </h3>
            <div className="space-y-1">
              <TimelineEvent label="Created" dateStr={card.first_review || card.dueDate} />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
## features/deck/components/CardList.tsx
import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MoreHorizontal, Zap, History, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import clsx from 'clsx';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: Card) => void;
  onPrioritizeCard: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, index: number, isShift: boolean) => void;
}

// --- Atomic Components ---

const StatusIndicator = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    new: 'text-blue-600 dark:text-blue-400',
    learning: 'text-orange-600 dark:text-orange-400',
    graduated: 'text-emerald-600 dark:text-emerald-400',
    known: 'text-zinc-400 dark:text-zinc-600',
  };

  // Minimalist dot + mono text
  return (
    <div className="flex items-center gap-2">
      <div className={clsx("w-1.5 h-1.5 rounded-full", status === 'known' ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-current', colors[status])} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {status}
      </span>
    </div>
  );
};

const ScheduleInfo = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
  if (status === 'new') return <span className="text-muted-foreground/30 text-[10px] font-mono tracking-widest">QUEUE</span>;
  
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;

  // Priority check
  if (date.getFullYear() === 1970) {
      return <span className="text-amber-600 font-mono text-[10px] uppercase tracking-widest font-medium">PRIORITY</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs font-mono text-foreground tabular-nums">
        {interval}<span className="text-[9px] text-muted-foreground ml-0.5">D</span>
      </span>
      <span className="text-[10px] text-muted-foreground/60 truncate font-mono tracking-tight">
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    </div>
  );
};

const Row = memo(({ index, style, data }: ListChildComponentProps<any>) => {
  const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
  const card = cards[index];
  if (!card) return null;

  const isSelected = selectedIds.has(card.id);

  return (
    <div 
        style={style} 
        className={clsx(
            "group flex items-center border-b border-zinc-100 dark:border-zinc-800 transition-colors duration-150",
            isSelected ? "bg-zinc-50 dark:bg-zinc-900/50" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
        )}
    >
      {/* 1. Selection (Invisible until hover or selected) */}
      <div 
        className="w-10 h-full flex items-center justify-center shrink-0 cursor-pointer"
        onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(card.id, index, e.shiftKey);
        }}
      >
          <div className={clsx(
              "w-3 h-3 border transition-all duration-200",
              isSelected 
                ? "bg-foreground border-foreground" 
                : "border-zinc-300 dark:border-zinc-700 opacity-0 group-hover:opacity-100"
          )} />
      </div>

      {/* 2. Main Content - High Contrast Typography */}
      <div 
        className="flex-1 min-w-0 pr-8 py-3 cursor-pointer flex flex-col justify-center h-full"
        onClick={() => onViewHistory(card)}
      >
          <div className="flex items-baseline gap-4">
             <span className={clsx(
                 "text-base font-light tracking-tight truncate transition-colors",
                 isSelected ? "text-foreground font-normal" : "text-zinc-900 dark:text-zinc-100"
             )}>
                {card.targetSentence}
             </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal truncate mt-1">
            {card.nativeTranslation}
          </span>
      </div>

      {/* 3. Metadata Grid - Strictly Monospace */}
      <div className="hidden md:flex items-center h-full mr-2">
          
          {/* Status */}
          <div className="w-32 px-4 flex items-center h-full">
              <StatusIndicator status={card.status} />
          </div>

          {/* Stats */}
          <div className="w-20 px-4 flex items-center justify-end h-full">
              <span className="text-xs font-mono text-zinc-500 tabular-nums">
                {card.reps}
              </span>
          </div>

          {/* Schedule */}
          <div className="w-32 px-4 flex items-center justify-end h-full">
               <ScheduleInfo dateStr={card.dueDate} status={card.status} interval={card.interval} />
          </div>
      </div>
      
      {/* 4. Actions - Ghost Trigger */}
      <div className="w-12 h-full flex items-center justify-center">
        <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-foreground transition-colors outline-none opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreHorizontal size={16} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none border-border p-1 bg-background  border">
                <DropdownMenuItem onClick={() => onPrioritizeCard(card.id)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <Zap size={12} className="mr-3" /> Prioritize
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewHistory(card)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <History size={12} className="mr-3" /> History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditCard(card)} className="rounded-none text-xs font-mono uppercase tracking-wider cursor-pointer">
                    <Pencil size={12} className="mr-3" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="rounded-none text-xs font-mono uppercase tracking-wider text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 size={12} className="mr-3" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}, areEqual);

export const CardList: React.FC<CardListProps> = (props) => {
  if (props.cards.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-300 dark:text-zinc-700 space-y-4">
              <div className="w-px h-12 bg-current" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Empty Index</p>
          </div>
      );
  }

  return (
    <div className="flex-1 h-full w-full bg-background">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={props.cards.length}
            itemSize={80} // Taller rows for breathability
            itemData={props}
            className="no-scrollbar"
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};
## features/deck/components/GenerateCardsModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditorialInput } from '@/components/form/EditorialInput';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Check, X as XIcon, Loader2, ArrowRight } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, Difficulty } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana } from '@/lib/utils';

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCards: (cards: Card[]) => void;
}

const DIFFICULTIES: Difficulty[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
  const { settings } = useSettings();
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [loading, setLoading] = useState(false);
  

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('A1');
  const [count, setCount] = useState([5]);


  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }
    if (!settings.geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings > General");
      return;
    }

    setLoading(true);
    try {
      const results = await aiService.generateBatchCards({
        difficulty,
        topic,
        count: count[0],
        language: settings.language,
        apiKey: settings.geminiApiKey
      });
      
      setGeneratedData(results);

      setSelectedIndices(new Set(results.map((_, i) => i)));
      setStep('preview');
    } catch (e) {
      toast.error("Failed to generate cards. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleSave = () => {
    const cardsToSave: Card[] = generatedData
      .filter((_, i) => selectedIndices.has(i))
      .map(item => {
        let targetSentence = item.targetSentence;

        if (settings.language === 'japanese' && item.furigana) {
            targetSentence = parseFurigana(item.furigana).map(s => s.text).join("");
        }

        return {
          id: uuidv4(),
          targetSentence: targetSentence,
          nativeTranslation: item.nativeTranslation,
          targetWord: item.targetWord,
          notes: item.notes,
          furigana: item.furigana,
          language: settings.language,
          status: 'new',
          interval: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          reps: 0,
          lapses: 0,
          tags: [`${difficulty}`, 'AI-Gen', topic.toLowerCase().replace(/\s+/g, '-')]
        } as Card;
      });

    onAddCards(cardsToSave);
    toast.success(`Added ${cardsToSave.length} cards to deck`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('config');
    setTopic('');
    setGeneratedData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-3xl p-12 bg-white dark:bg-black border border-border  sm:rounded-xl gap-0">
        
        <div className="flex justify-between items-start mb-10">
          <div>
             <DialogTitle className="text-3xl font-light tracking-tight mb-2">AI Generator</DialogTitle>
             <DialogDescription className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Target Language: {settings.language}
             </DialogDescription>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <Sparkles size={20} strokeWidth={1.5} />
          </div>
        </div>

        {step === 'config' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <MetaLabel>Difficulty Level</MetaLabel>
                <EditorialSelect
                  value={difficulty}
                  onChange={(value) => setDifficulty(value as Difficulty)}
                  options={DIFFICULTIES.map(d => ({ value: d, label: `${d} Level` }))}
                />
              </div>
              <div>
                 <div className="flex justify-between mb-4">
                    <MetaLabel className="mb-0">Quantity</MetaLabel>
                    <span className="font-mono text-xl font-light">{count[0]}</span>
                 </div>
                 <Slider
                    value={count}
                    onValueChange={setCount}
                    min={3}
                    max={300}
                    step={1}
                    className="py-2"
                 />
              </div>
            </div>

            <div>
              <MetaLabel>Topic / Context</MetaLabel>
              <EditorialInput 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Business Meetings, Ordering Food..."
                autoFocus
              />
            </div>

            <div className="flex justify-end pt-8">
              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-auto h-12 px-8">
                {loading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2" size={16} /> Generate Cards</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
            <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 custom-scrollbar">
               {generatedData.map((card, idx) => (
                 <div 
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`
                        p-6 rounded-xl border cursor-pointer transition-all duration-200 relative group
                        ${selectedIndices.has(idx) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/50 hover:border-border hover:bg-secondary/30'
                        }
                    `}
                 >
                    <div className="absolute top-6 right-6">
                        {selectedIndices.has(idx) ? <Check size={20} className="text-primary" /> : <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />}
                    </div>
                    <div className="pr-12">
                        <div className="font-medium text-xl mb-2 tracking-tight">{card.targetSentence}</div>
                        <div className="text-sm text-muted-foreground font-mono opacity-70">{card.nativeTranslation}</div>
                        <div className="flex gap-3 mt-4">
                            {card.targetWord && <span className="text-[10px] bg-secondary px-2 py-1 rounded font-mono text-foreground uppercase tracking-wider">{card.targetWord}</span>}
                            <span className="text-[10px] border border-border px-2 py-1 rounded font-mono text-muted-foreground uppercase tracking-wider">{difficulty}</span>
                        </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
                <button onClick={() => setStep('config')} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Back to Config
                </button>
                <Button onClick={handleSave} disabled={selectedIndices.size === 0} className="h-12 px-8">
                    Save {selectedIndices.size} Cards <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
## features/deck/data/japaneseBeginnerDeck.ts
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = '', furigana?: string): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  furigana,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'japanese'
});

export const JAPANESE_BEGINNER_DECK: Card[] = [

  createCard("はじめまして、田中です。", "Nice to meet you, I am Tanaka.", "はじめまして", "", "はじめまして、 田中[たなか]です。"),
  createCard("よろしくお願いします。", "Please treat me well.", "願い", "Set phrase for introductions.", "よろしくお 願[ねが]いします。"),
  createCard("お元気ですか？", "How are you?", "元気", "", "お 元気[げんき]ですか？"),
  createCard("英語を話せますか？", "Can you speak English?", "話せます", "Potential form.", "英語[えいご]を 話[はな]せますか？"),
  createCard("日本語が少し分かります。", "I understand a little Japanese.", "分かります", "", "日本語[にほんご]が 少[すこ]し 分[わ]かります。"),
  createCard("おはようございます。", "Good morning.", "おはよう", "Polite.", "おはようございます。"),
  createCard("こんにちは。", "Hello / Good afternoon.", "こんにちは", "", "こんにちは。"),
  createCard("こんばんは。", "Good evening.", "こんばんは", "", "こんばんは。"),
  createCard("ありがとうございます。", "Thank you very much.", "ありがとう", "", "ありがとうございます。"),
  createCard("すみません。", "Excuse me / I'm sorry.", "すみません", "", "すみません。"),
  createCard("ごめんなさい。", "I am sorry.", "ごめんなさい", "", "ごめんなさい。"),


  createCard("これは何ですか？", "What is this?", "何", "", "これは 何[なん]ですか？"),
  createCard("それは私のペンです。", "That is my pen.", "私", "", "それは 私[わたし]のペンです。"),
  createCard("トイレはどこですか？", "Where is the toilet?", "どこ", "", "トイレはどこですか？"),
  createCard("駅はあそこです。", "The station is over there.", "駅", "", "駅[えき]はあそこです。"),
  createCard("私は学生です。", "I am a student.", "学生", "", "私[わたし]は 学生[がくせい]です。"),
  createCard("彼は先生ではありません。", "He is not a teacher.", "先生", "", "彼[かれ]は 先生[せんせい]ではありません。"),


  createCard("私は寿司を食べます。", "I eat sushi.", "食べます", "", "私[わたし]は 寿司[すし]を 食[た]べます。"),
  createCard("何を飲みますか？", "What will you drink?", "飲みます", "", "何[なに]を 飲[の]みますか？"),
  createCard("毎日、日本語を勉強します。", "I study Japanese every day.", "勉強", "", "毎日[まいにち]、 日本語[にほんご]を 勉強[べんきょう]します。"),
  createCard("テレビを見ました。", "I watched TV.", "見ました", "Past tense.", "テレビを 見[み]ました。"),
  createCard("音楽を聴きます。", "I listen to music.", "聴きます", "", "音楽[おんがく]を 聴[き]きます。"),
  createCard("新聞を読みます。", "I read the newspaper.", "読みます", "", "新聞[しんぶん]を 読[よ]みます。"),
  createCard("写真を撮ります。", "I take a photo.", "撮ります", "", "写真[しゃしん]を 撮[と]ります。"),
  createCard("手紙を書きます。", "I write a letter.", "書きます", "", "手紙[てがみ]を 書[か]きます。"),


  createCard("明日、東京に行きます。", "I will go to Tokyo tomorrow.", "行きます", "", "明日[あした]、 東京[とうきょう]に 行[い]きます。"),
  createCard("何時に帰りますか？", "What time will you go home?", "帰り", "", "何時[なんじ]に 帰[かえ]りますか？"),
  createCard("友達と来ました。", "I came with a friend.", "来ました", "", "友達[ともだち]と 来[き]ました。"),
  createCard("いつ日本に来ましたか？", "When did you come to Japan?", "いつ", "", "いつ 日本[にほん]に 来[き]ましたか？"),
  createCard("バスで学校へ行きます。", "I go to school by bus.", "学校", "", "バスで 学校[がっこう]へ 行[い]きます。"),


  createCard("猫がいます。", "There is a cat.", "います", "Used for living things.", "猫[ねこ]がいます。"),
  createCard("お金がありません。", "I don't have money.", "ありません", "Negative existence (inanimate).", "お 金[かね]がありません。"),
  createCard("コンビニがありますか？", "Is there a convenience store?", "あります", "", "コンビニがありますか？"),
  createCard("誰がいますか？", "Who is there?", "誰", "", "誰[だれ]がいますか？"),
  createCard("机の上に本があります。", "There is a book on the desk.", "机", "", "机[つくえ]の 上[うえ]に 本[ほん]があります。"),


  createCard("このラーメンは美味しいです。", "This ramen is delicious.", "美味しい", "", "このラーメンは 美味[おい]しいです。"),
  createCard("今日は暑いですね。", "It is hot today, isn't it?", "暑い", "", "今日[きょう]は 暑[あつ]いですね。"),
  createCard("日本の夏は蒸し暑いです。", "Japanese summers are humid.", "蒸し暑い", "", "日本[にほん]の 夏[なつ]は 蒸[む]し 暑[あつ]いです。"),
  createCard("それは面白そうですね。", "That looks interesting.", "面白", "", "それは 面白[おもしろ]そうですね。"),
  createCard("この部屋は広いです。", "This room is spacious.", "広い", "", "この 部屋[へや]は 広[ひろ]いです。"),
  createCard("あの映画はつまらないです。", "That movie is boring.", "つまらない", "", "あの 映画[えいが]はつまらないです。"),
  createCard("忙しいですか？", "Are you busy?", "忙しい", "", "忙[いそが]しいですか？"),


  createCard("これをください。", "Please give me this.", "ください", "", "これをください。"),
  createCard("ちょっと待ってください。", "Please wait a moment.", "待って", "Te-form + kudasai.", "ちょっと 待[ま]ってください。"),
  createCard("もう一度言ってください。", "Please say it one more time.", "言って", "", "もう 一度[いちど] 言[い]ってください。"),
  createCard("手伝ってもらえますか？", "Could you help me?", "手伝って", "", "手伝[てつだ]ってもらえますか？"),
  createCard("助けて！", "Help!", "助けて", "", "助[たす]けて！"),
  createCard("分かりません。", "I don't understand.", "分かり", "", "分[わ]かりません。"),
  createCard("お腹が空きました。", "I am hungry.", "空き", "", "お 腹[なか]が 空[す]きました。")
];

## features/deck/data/norwegianBeginnerDeck.ts
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'norwegian'
});

export const NORWEGIAN_BEGINNER_DECK: Card[] = [

  createCard("Hei, hvordan går det?", "Hi, how is it going?", "Hei", "Common informal greeting."),
  createCard("God morgen.", "Good morning.", "morgen", ""),
  createCard("Takk skal du ha.", "Thank you.", "Takk", "Literally: Thanks shall you have."),
  createCard("Unnskyld, jeg forstår ikke.", "Excuse me, I don't understand.", "forstår", "Verb: å forstå."),
  createCard("Snakker du engelsk?", "Do you speak English?", "Snakker", ""),
  createCard("Ha det bra!", "Goodbye!", "Ha", "Literally: Have it good."),
  createCard("Vær så snill.", "Please.", "snill", "Literally: Be so kind."),
  createCard("Ja, gjerne.", "Yes, gladly / please.", "gjerne", ""),
  createCard("Nei, takk.", "No, thanks.", "Nei", ""),
  createCard("Hva heter du?", "What is your name?", "heter", "Verb: å hete (to be called)."),


  createCard("Jeg er trøtt.", "I am tired.", "er", "Verb: å være (to be)."),
  createCard("Det er kaldt i dag.", "It is cold today.", "er", ""),
  createCard("Hvor er toalettet?", "Where is the toilet?", "er", ""),
  createCard("Vi er fra Norge.", "We are from Norway.", "er", ""),
  createCard("Er du sulten?", "Are you hungry?", "Er", ""),
  createCard("Det er min venn.", "That is my friend.", "er", ""),
  createCard("Er det sant?", "Is that true?", "Er", ""),


  createCard("Jeg har en bil.", "I have a car.", "har", "Verb: å ha (to have)."),
  createCard("Har du tid?", "Do you have time?", "Har", ""),
  createCard("Vi har ikke penger.", "We don't have money.", "har", ""),
  createCard("Hun har lyst på kaffe.", "She wants coffee.", "lyst", "Idiom: Ha lyst på (want/crave)."),
  createCard("Jeg har vondt i hodet.", "I have a headache.", "vondt", "Idiom: Ha vondt (have pain)."),


  createCard("Hva gjør du?", "What are you doing?", "gjør", "Verb: å gjøre (to do)."),
  createCard("Jeg går på jobb.", "I am going to work.", "går", "Verb: å gå (to go/walk)."),
  createCard("Kan du si det igjen?", "Can you say that again?", "si", "Verb: å si (to say)."),
  createCard("Jeg vet ikke.", "I don't know.", "vet", "Verb: å vite (to know)."),
  createCard("Hva tenker du på?", "What are you thinking about?", "tenker", "Verb: å tenke (to think)."),
  createCard("Jeg tar bussen.", "I am taking the bus.", "tar", "Verb: å ta (to take)."),
  createCard("Kan jeg få en øl?", "Can I get a beer?", "få", "Verb: å få (to get/receive)."),
  createCard("Jeg liker å lese.", "I like to read.", "liker", "Verb: å like (to like)."),
  createCard("Vi må dra nå.", "We have to leave now.", "må", "Modal verb: måtte (must)."),
  createCard("Jeg kommer snart.", "I am coming soon.", "kommer", "Verb: å komme (to come)."),
  createCard("Jeg ser deg.", "I see you.", "ser", "Verb: å se (to see)."),
  createCard("Hører du meg?", "Do you hear me?", "Hører", "Verb: å høre (to hear)."),
  createCard("Jeg tror det.", "I think so / I believe so.", "tror", "Verb: å tro (to believe)."),


  createCard("Hvem er det?", "Who is that?", "Hvem", ""),
  createCard("Hva er dette?", "What is this?", "Hva", ""),
  createCard("Hvor bor du?", "Where do you live?", "Hvor", ""),
  createCard("Når kommer toget?", "When is the train coming?", "Når", ""),
  createCard("Hvorfor gråter du?", "Why are you crying?", "Hvorfor", ""),
  createCard("Hvordan kommer jeg dit?", "How do I get there?", "Hvordan", ""),
  createCard("Hvilken liker du?", "Which one do you like?", "Hvilken", ""),


  createCard("Hjelp!", "Help!", "Hjelp", ""),
  createCard("Jeg trenger en lege.", "I need a doctor.", "trenger", "Verb: å trenge (to need)."),
  createCard("Hvor mye koster det?", "How much does it cost?", "koster", ""),
  createCard("Jeg elsker deg.", "I love you.", "elsker", ""),
  createCard("Bare hyggelig.", "You're welcome.", "hyggelig", "Response to thank you."),
  createCard("Unnskyld meg.", "Excuse me.", "Unnskyld", ""),
  createCard("Jeg er enig.", "I agree.", "enig", ""),
  createCard("Det går bra.", "It's going well / It's fine.", "går", ""),


  createCard("Norge er et vakkert land.", "Norway is a beautiful country.", "vakkert", ""),
  createCard("Det er veldig bra.", "That is very good.", "bra", ""),
  createCard("Jeg er glad.", "I am happy.", "glad", ""),
  createCard("Det er vanskelig.", "It is difficult.", "vanskelig", ""),
  createCard("Maten er god.", "The food is good.", "god", ""),
  createCard("Jeg er opptatt.", "I am busy.", "opptatt", ""),


  createCard("Vi ses i morgen.", "See you tomorrow.", "morgen", ""),
  createCard("Nå eller aldri.", "Now or never.", "Nå", ""),
  createCard("Det er her.", "It is here.", "her", ""),
  createCard("Det er der borte.", "It is over there.", "der", "")
];

## features/deck/data/polishBeginnerDeck.ts
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'polish'
});

export const POLISH_BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something."),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", ""),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć."),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", ""),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular."),
  createCard("Cześć, jak się masz?", "Hi, how are you?", "Cześć", "Informal greeting."),
  createCard("Dobranoc.", "Good night.", "Dobranoc", ""),
  createCard("Do widzenia.", "Goodbye.", "widzenia", "Formal."),
  createCard("Proszę.", "Please / Here you go.", "Proszę", ""),
  createCard("Tak, poproszę.", "Yes, please.", "Tak", ""),
  createCard("Nie, dziękuję.", "No, thank you.", "Nie", ""),


  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", ""),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", ""),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here."),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'."),
  createCard("Gdzie oni są?", "Where are they?", "są", ""),
  createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", ""),
  createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense."),


  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation)."),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na..."),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural."),
  createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", ""),


  createCard("Co robisz?", "What are you doing?", "robisz", ""),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement."),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive."),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", ""),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć."),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase."),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci)."),
  createCard("Myślę, że tak.", "I think so.", "Myślę", ""),
  createCard("Nie wiem.", "I don't know.", "wiem", ""),
  createCard("Robię obiad.", "I am making lunch.", "Robię", ""),
  createCard("Weź to.", "Take this.", "Weź", "Imperative."),
  createCard("Daj mi to.", "Give me that.", "Daj", "Imperative."),
  createCard("Widzę cię.", "I see you.", "Widzę", ""),
  createCard("Słyszysz mnie?", "Do you hear me?", "Słyszysz", ""),


  createCard("Kto to jest?", "Who is this?", "Kto", ""),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", ""),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", ""),
  createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", ""),
  createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?"),
  createCard("Co to jest?", "What is this?", "Co", ""),
  createCard("Ile to kosztuje?", "How much does it cost?", "Ile", ""),


  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", ""),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard."),
  createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", ""),
  createCard("Smacznego.", "Bon appétit.", "Smacznego", ""),
  createCard("Pomocy!", "Help!", "Pomocy", ""),
  createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", ""),
  createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", ""),


  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", ""),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", ""),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'."),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", ""),
  createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", ""),
  createCard("To jest trudne.", "This is difficult.", "trudne", ""),


  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case."),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", ""),
  createCard("Teraz czy później?", "Now or later?", "Teraz", ""),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", ""),
  createCard("To jest daleko.", "It is far.", "daleko", "")
];

## features/deck/data/spanishBeginnerDeck.ts
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const createCard = (sentence: string, translation: string, targetWord?: string, notes: string = ''): Card => ({
  id: uuidv4(),
  targetSentence: sentence,
  targetWord,
  nativeTranslation: translation,
  notes,
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language: 'spanish'
});

export const SPANISH_BEGINNER_DECK: Card[] = [

  createCard("Hola, ¿cómo estás?", "Hello, how are you?", "estás", "Informal 'you'."),
  createCard("Buenos días, mucho gusto.", "Good morning, nice to meet you.", "gusto", ""),
  createCard("Me llamo Sofía.", "My name is Sofia.", "llamo", "Reflexive: llamarse."),
  createCard("Por favor, una cerveza.", "One beer, please.", "cerveza", ""),
  createCard("Gracias por tu ayuda.", "Thanks for your help.", "ayuda", ""),
  createCard("De nada.", "You're welcome.", "nada", ""),
  createCard("Lo siento.", "I am sorry.", "siento", ""),
  createCard("Disculpe.", "Excuse me (formal).", "Disculpe", ""),
  createCard("No hablo español.", "I don't speak Spanish.", "hablo", ""),
  createCard("¿Hablas inglés?", "Do you speak English?", "Hablas", ""),


  createCard("Soy de España.", "I am from Spain.", "Soy", "Ser: Origin/Permanent."),
  createCard("Estoy cansado.", "I am tired.", "Estoy", "Estar: Condition/Temporary."),
  createCard("Ella es inteligente.", "She is intelligent.", "es", "Ser: Characteristic."),
  createCard("¿Dónde estás?", "Where are you?", "estás", "Estar: Location."),
  createCard("La fiesta es mañana.", "The party is tomorrow.", "es", "Ser: Time/Event."),
  createCard("Estamos listos.", "We are ready.", "Estamos", "Estar: Condition."),
  createCard("Eres mi mejor amigo.", "You are my best friend.", "Eres", "Ser: Relationship."),


  createCard("No entiendo español.", "I don't understand Spanish.", "entiendo", "Verb: entender (stem changing)."),
  createCard("Quiero comer tacos.", "I want to eat tacos.", "Quiero", "Verb: querer."),
  createCard("¿Puedes hablar más despacio?", "Can you speak more slowly?", "Puedes", "Verb: poder."),
  createCard("Tengo que irme.", "I have to leave.", "Tengo", "Tener que + infinitive = Have to."),
  createCard("Me gusta este lugar.", "I like this place.", "gusta", "Literally: This place pleases me."),
  createCard("Voy al supermercado.", "I am going to the supermarket.", "Voy", "Verb: ir."),
  createCard("Hago ejercicio todos los días.", "I do exercise every day.", "Hago", "Verb: hacer."),
  createCard("¿Qué haces?", "What are you doing?", "haces", ""),
  createCard("Dime la verdad.", "Tell me the truth.", "Dime", "Imperative of decir + me."),
  createCard("No sé.", "I don't know.", "sé", "Verb: saber."),
  createCard("Creo que sí.", "I think so.", "Creo", "Verb: creer."),
  createCard("Tomo un café.", "I take/drink a coffee.", "Tomo", "Verb: tomar."),


  createCard("¿Qué hora es?", "What time is it?", "hora", ""),
  createCard("¿Dónde está el baño?", "Where is the bathroom?", "baño", ""),
  createCard("¿Cuánto cuesta esto?", "How much does this cost?", "cuesta", ""),
  createCard("Vamos a la playa.", "Let's go to the beach.", "playa", ""),
  createCard("La cuenta, por favor.", "The check, please.", "cuenta", ""),
  createCard("¿Quién es él?", "Who is he?", "Quién", ""),
  createCard("¿Por qué preguntas?", "Why do you ask?", "Por", ""),
  createCard("¿Cuándo llegas?", "When do you arrive?", "Cuándo", ""),
  createCard("¿Cómo te llamas?", "What is your name?", "llamas", ""),


  createCard("¡Ayuda!", "Help!", "Ayuda", ""),
  createCard("Necesito un médico.", "I need a doctor.", "Necesito", ""),
  createCard("Estoy perdido.", "I am lost (male).", "perdido", ""),
  createCard("¡Salud!", "Cheers! / Bless you!", "Salud", ""),
  createCard("Buen provecho.", "Bon appétit.", "provecho", ""),
  createCard("Tengo hambre.", "I am hungry.", "hambre", "Literally: I have hunger."),
  createCard("Tengo sed.", "I am thirsty.", "sed", "Literally: I have thirst."),
  createCard("Hace calor.", "It is hot.", "calor", "Literally: It makes heat."),
  createCard("Hace frío.", "It is cold.", "frío", "Literally: It makes cold."),


  createCard("Es muy bonito.", "It is very pretty.", "bonito", ""),
  createCard("Es difícil.", "It is difficult.", "difícil", ""),
  createCard("Es fácil.", "It is easy.", "fácil", ""),
  createCard("El coche es rojo.", "The car is red.", "rojo", ""),
  createCard("La casa es grande.", "The house is big.", "grande", "")
];

## features/deck/hooks/useCardOperations.ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types';
import {
  deleteCard as deleteCardFromRepo,
  saveCard,
  saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { useDeck } from '@/contexts/DeckContext';
import { supabase } from '@/lib/supabase';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  prioritizeCards: (ids: string[]) => Promise<void>;
}

export const useCardOperations = (): CardOperations => {
  const { refreshDeckData } = useDeck();
  const queryClient = useQueryClient();

  const addCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card added successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to add card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const addCardsBatch = useCallback(
    async (cards: Card[]) => {
      try {
        await saveAllCards(cards);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${cards.length} cards added successfully`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to add cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const updateCard = useCallback(
    async (card: Card) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to update card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      try {
        await deleteCardFromRepo(id);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success('Card deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete card');
      }
    },
    [queryClient, refreshDeckData]
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {

        const { error } = await supabase
          .from('cards')
          .update({ due_date: new Date(0).toISOString() })
          .in('id', ids);

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ['cards'] });

        await queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        refreshDeckData();
        toast.success(`${ids.length} card${ids.length === 1 ? '' : 's'} moved to top of queue`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to prioritize cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  return { addCard, addCardsBatch, updateCard, deleteCard, prioritizeCards };
};
## features/deck/hooks/useCardsQuery.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { mapToCard } from '@/services/db/repositories/cardRepository';

export const useCardsQuery = (page = 0, pageSize = 50, searchTerm = '') => {
  const { settings } = useSettings();
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('cards')
        .select('*', { count: 'exact' })
        .eq('language', language)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.textSearch('fts', searchTerm, { 
          type: 'websearch',
          config: 'simple' 
        });
      }
      
      const { data, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;

      return {
        data: (data ?? []).map(mapToCard),
        count: count ?? 0
      };
    },
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
  });
};
## features/deck/hooks/useDeckQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/services/db/repositories/statsRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/services/db/repositories/historyRepository';
import { getDueCards, saveCard } from '@/services/db/repositories/cardRepository';
import { addReviewLog } from '@/services/db/repositories/revlogRepository';
import { Card, Grade } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { format, differenceInMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CardXpPayload } from '@/features/xp/xpUtils';

export const useDeckStatsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['deckStats', settings.language],
    queryFn: () => fetchStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['dueCards', settings.language],
    queryFn: () => getDueCards(new Date(), settings.language),
    staleTime: 60 * 1000, // Cache for 1 minute to reduce refetch thrashing
  });
};

export const useReviewsTodayQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['reviewsToday', settings.language],
    queryFn: () => getTodayReviewStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ['history', settings.language],
    queryFn: () => fetchHistory(settings.language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user, incrementXPOptimistically } = useAuth();

  return useMutation({
    mutationFn: async ({ card, grade, xpPayload }: { card: Card; grade: Grade; xpPayload?: CardXpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      // 1. Calculate Metrics for Log
      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;
      
      // Calculate elapsed days with decimal precision (critical for FSRS)
      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440; // 1440 mins in a day

      const scheduledDays = card.interval || 0;

      // 2. Save Log (Fire and forget, or await if strict)
      await addReviewLog(card, grade, elapsedDays, scheduledDays);

      // await incrementHistory(today, 1, card.language || settings.language);
        const xpAmount = xpPayload?.totalXp ?? 0;

      if (user) {

        await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            activity_type: card.status === 'new' ? 'new_card' : 'review',
            xp_awarded: xpAmount,
            language: card.language || settings.language,
          });

        if (xpAmount > 0) {
          const { error: xpError } = await supabase.rpc('increment_profile_xp', {
            user_id: user.id,
            amount: xpAmount
          });
          if (xpError) console.error('Failed to update profile XP:', xpError);
        }
      }
      
      return { card, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] }) // Added: prevent overwrite of optimistic language XP
      ]);
      

      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]); // Added snapshot
      

      queryClient.setQueryData(['history', settings.language], (old: any) => {
        if (!old) return { [today]: 1 };
        return { ...old, [today]: (old[today] || 0) + 1 };
      });
      

      queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
         if (!old) return { newCards: 0, reviewCards: 0 };
         return {
             newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
             reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
         };
      });




      queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter(c => c.id !== card.id);
      });






      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXPOptimistically(xpAmount);


        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                languageXp: (old.languageXp || 0) + xpAmount
            };
        });
      }

      return { previousHistory, previousReviewsToday, previousDueCards, previousDashboardStats };
    },
    onError: (err, newTodo, context) => {

      if (context) {
        queryClient.setQueryData(['history', settings.language], context.previousHistory);
        queryClient.setQueryData(['reviewsToday', settings.language], context.previousReviewsToday);
        queryClient.setQueryData(['dueCards', settings.language], context.previousDueCards);
        queryClient.setQueryData(['dashboardStats', settings.language], context.previousDashboardStats);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', settings.language] });
    },
  });
};


export const useClaimDailyBonusMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const { user, incrementXPOptimistically } = useAuth();
  const BONUS_AMOUNT = 20; // Big reward for finishing

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('claim_daily_bonus', {
        p_user_id: user.id,
        p_language: settings.language,
        p_xp_amount: BONUS_AMOUNT
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.success) {
        toast.success(`Daily Goal Complete! +${BONUS_AMOUNT} XP`);
        incrementXPOptimistically(BONUS_AMOUNT);
        

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                languageXp: (old.languageXp || 0) + BONUS_AMOUNT
            };
        });
      }
    }
  });
};

export const useUndoReviewMutation = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  return useMutation({
    mutationFn: async ({ card, date }: { card: Card; date: string }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || settings.language);
      return { card, date };
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cards'] });
       queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
       queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    }
  });
};

## features/deck/services/ai.ts
import { supabase } from '@/lib/supabase';
import type { GameQuestion } from '@/types/multiplayer';

interface BatchGenerationOptions {
  difficulty: string;
  topic: string;
  count: number;
  language: 'polish' | 'norwegian' | 'japanese' | 'spanish';
}

function extractJSON(text: string): string {

  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1];
  }
  

  const firstOpenBrace = text.indexOf('{');
  const firstOpenBracket = text.indexOf('[');
  
  let firstOpen = -1;
  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    firstOpen = Math.min(firstOpenBrace, firstOpenBracket);
  } else {
    firstOpen = Math.max(firstOpenBrace, firstOpenBracket);
  }

  if (firstOpen !== -1) {

    const lastCloseBrace = text.lastIndexOf('}');
    const lastCloseBracket = text.lastIndexOf(']');
    const lastClose = Math.max(lastCloseBrace, lastCloseBracket);
    
    if (lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
    }
  }

  return text;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please add it in Settings.');
  }


  const { data, error } = await supabase.functions.invoke('generate-card', {
    body: JSON.stringify({ prompt, apiKey }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) {
    console.error("AI Service Error:", error);

    try {
      const body = error instanceof Response ? await error.json() : null;
      if (body?.error) throw new Error(body.error);
    } catch (_) {

    }
    throw new Error('AI Service failed. Check console for details.');
  }
  
  return data.text;
}

export const aiService = {
  async translateText(text: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<string> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    const prompt = `Translate the following ${langName} text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(word: string, contextSentence: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    const prompt = `
      Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;
    
    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context"
      };
    }
  },

  async generateCardContent(sentence: string, language: 'polish' | 'norwegian' | 'japanese' | 'spanish' = 'polish', apiKey: string): Promise<{
    translation: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    
    let prompt = `
      Analyze the following ${langName} sentence for a flashcard: "${sentence}".
      Return a JSON object with:
      - translation: The natural English translation.
      - notes: Brief grammar notes, explaining any interesting cases, conjugations, or idioms used in the sentence. Keep it concise (max 2-3 sentences).
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています。"
      `;
    }

    prompt += `
      Return ONLY the JSON object, no markdown formatting.
    `;

    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return {
        translation: "",
        notes: ""
      };
    }
  },

  async generateQuiz(prompt: string, apiKey: string): Promise<GameQuestion[]> {
    const result = await callGemini(prompt, apiKey);
    try {
      const cleanResult = extractJSON(result);
      const parsed = JSON.parse(cleanResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse quiz response', e);
      return [];
    }
  },

  async generateBatchCards({ difficulty, topic, count, language, apiKey }: BatchGenerationOptions & { apiKey: string }): Promise<any[]> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : (language === 'spanish' ? 'Spanish' : 'Polish'));
    
    let prompt = `
      Generate ${count} flashcards for a ${difficulty} level ${langName} learner.
      The topic is: "${topic}".
      
      Return a JSON ARRAY of objects. Each object must have:
      - targetSentence: A sentence in ${langName} appropriate for ${difficulty} level.
      - nativeTranslation: English translation.
      - targetWord: The key vocabulary word being taught in the sentence.
      - notes: Brief grammar explanation or context (max 1 sentence).
    `;

    if (language === 'japanese') {
      prompt += `
      - furigana: The sentence with furigana in the format "Kanji[reading]". Example: "私[わたし]は..."
      `;
    }

    prompt += `
      Strictly return ONLY the JSON array. No markdown code blocks, no introduction.
    `;

    const result = await callGemini(prompt, apiKey);
    
    try {
      const cleanResult = extractJSON(result);
      const parsed = JSON.parse(cleanResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse AI batch response", e);
      throw new Error("Failed to generate valid cards");
    }
  }
};
## features/deck/services/deckGeneration.ts
import { aiService } from '@/features/deck/services/ai';
import { Card, Difficulty, Language } from '@/types';

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

/**
 * Generate a personalized initial deck using Gemini AI via aiService
 * Uses client-side logic to call the 'generate-card' function indirectly
 */
export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    if (!options.apiKey) {
        throw new Error('API Key is required for AI deck generation');
    }

    try {
        // Use aiService.generateBatchCards which uses the existing 'generate-card' edge function
        // We define a broad topic suitable for the user's level
        const topic = `Essential daily life phrases, greetings, and basic survival vocabulary for ${options.proficiencyLevel} level`;

        // We request 20 cards to ensure the AI response fits within timeouts/token limits
        // (50 cards often causes JSON parsing errors due to length)
        const generatedData = await aiService.generateBatchCards({
            language: options.language,
            difficulty: options.proficiencyLevel,
            topic: topic,
            count: 20, 
            apiKey: options.apiKey,
        });

        if (!generatedData || !Array.isArray(generatedData)) {
            throw new Error('Invalid response format from AI service');
        }

        // Convert raw AI response to full Card objects
        const cards: Card[] = generatedData.map((card: any) => ({
            id: crypto.randomUUID(),
            targetSentence: card.targetSentence,
            nativeTranslation: card.nativeTranslation,
            targetWord: card.targetWord,
            notes: card.notes,
            furigana: card.furigana,
            language: options.language,
            status: 'new' as const,
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date().toISOString(),
            tags: [options.proficiencyLevel, 'Starter', 'AI-Gen'],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw new Error(error.message || 'Failed to generate deck via AI service');
    }
}
## features/leaderboard/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import { Trophy, Info, Globe, Calendar, Filter, Crown, Medal, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDailyStreakMultiplier } from '@/features/xp/xpUtils';
import clsx from 'clsx';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  xp: number;
  level?: number;
  streak?: number | null;
  avatar?: string | null;
}

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'lifetime';
type LanguageFilter = 'all' | 'polish' | 'norwegian' | 'japanese' | 'spanish';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown size={20} className="text-yellow-500 fill-yellow-500/20" />;
  if (rank === 2) return <Medal size={20} className="text-slate-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-700" />;
  return (
    <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank}</span>
  );
};

const StreakMultiplierBadge = ({ days }: { days: number }) => {
  if (!days) return <span className="text-muted-foreground/40">-</span>;

  const { value, label } = getDailyStreakMultiplier(days);
  const intensity = Math.min(Math.max(value - 1, 0), 1);

  const colorClass =
    intensity > 0.9
      ? 'text-purple-500 bg-purple-500/10 border-purple-500/20'
      : intensity > 0.7
      ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      : intensity > 0.4
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      : intensity > 0.1
      ? 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      : 'text-muted-foreground bg-secondary border-transparent';

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
        colorClass
      )}
    >
      <Flame size={12} fill="currentColor" className="opacity-80" />
      <div className="flex flex-col leading-none gap-0.5">
        <span>{days} days</span>
        <span className="text-[9px] opacity-70 font-mono tracking-wide">
          {label.replace(/\s*\(([^)]*)\)/, (_, inner) => `· ${inner}`)}
        </span>
      </div>
    </div>
  );
};

const getInitials = (value?: string | null) => {
  if (!value) return '??';
  return value
    .trim()
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_leaderboard', {
          time_range: timeRange,
          language_filter: languageFilter,
        });
        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange, languageFilter]);

  const xpLabel = timeRange === 'lifetime' ? 'Lifetime XP' : 'XP Gained';

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-10 md:space-y-16 animate-in fade-in duration-700">
      <header className="space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Trophy size={20} strokeWidth={1.5} />
          <span className="text-xs font-mono uppercase tracking-[0.4em]">Global Rankings</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground leading-[0.9]">
                Top Miners
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={22} className="text-muted-foreground hover:text-foreground transition-colors mt-1" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-xs p-4">
                    <div className="space-y-2 text-sm">
                      <p>Rankings reflect XP earned over the selected timeframe.</p>
                      <p className="text-xs text-muted-foreground">
                        Reviews now grant 1-8 base XP with combo bonuses and daily multiplier tiers—consistency beats marathons.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Weekly standings, lifetime grinders, and everyone chasing their streak multiplier.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-44">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <Globe size={10} /> Language
              </label>
              <Select value={languageFilter} onValueChange={(v) => setLanguageFilter(v as LanguageFilter)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="polish">Polish</SelectItem>
                  <SelectItem value="norwegian">Norwegian</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <Calendar size={10} /> Period
              </label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">Last 30 Days</SelectItem>
                  <SelectItem value="yearly">Last Year</SelectItem>
                  <SelectItem value="lifetime">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="border border-border/40 rounded-xl overflow-hidden bg-card/60 backdrop-blur">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/30 border-b border-border/40 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6 md:col-span-5">User</div>
          <div className="col-span-3 md:col-span-3 text-right">Streak</div>
          <div className="col-span-2 md:col-span-3 text-right">{xpLabel}</div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
            <Filter size={24} className="opacity-50" />
            <span className="font-mono text-xs tracking-widest">Calculating ranks...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No data for this period.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {profiles.map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = profile.id === user?.id;
              const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
              const streak = profile.streak ?? 0;
              const avatar = profile.avatar ?? getInitials(profile.username);

              return (
                <div
                  key={profile.id}
                  className={clsx(
                    'grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-secondary/20',
                    isCurrentUser && 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    <RankIcon rank={rank} />
                  </div>

                  <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-secondary-foreground border-border'
                      )}
                    >
                      {avatar}
                    </div>
                    <div className="flex flex-col">
                      <span className={clsx('text-sm font-medium', isCurrentUser && 'text-primary')}>
                        {profile.username || 'Anonymous'} {isCurrentUser && '(You)'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Lvl {level}</span>
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-3 flex justify-end">
                    <StreakMultiplierBadge days={streak} />
                  </div>

                  <div className="col-span-2 md:col-span-3 text-right">
                    <span className="text-lg md:text-2xl font-semibold tracking-tight tabular-nums">
                      {profile.xp.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-1">xp</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
## features/multiplayer/GameArena.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Loader2, Trophy, Copy, Play } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { multiplayerService } from '@/services/multiplayer';
import type { GamePlayer, GameRoom } from '@/types/multiplayer';

const TIMER_SECONDS = 10;

export const GameArena: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchInitialState = async () => {
      const { data: roomData } = await supabase.from('game_rooms').select('*').eq('id', roomId).single();
      const { data: playersData } = await supabase.from('game_players').select('*').eq('room_id', roomId);

      if (roomData) {
        setRoom(roomData as GameRoom);
        setIsHost(roomData.host_id === user.id);
      }
      if (playersData) {
        setPlayers(playersData as GamePlayer[]);
      }
    };

    fetchInitialState();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as GameRoom);
        if (payload.new && 'host_id' in payload.new) {
          setIsHost((payload.new as GameRoom).host_id === user.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${roomId}` }, async () => {
        const { data } = await supabase.from('game_players').select('*').eq('room_id', roomId);
        if (data) {
          setPlayers(data as GamePlayer[]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user]);

  const roomRef = useRef(room);
  useEffect(() => { roomRef.current = room; }, [room]);

  const handleNextQuestion = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const nextIdx = r.current_question_index + 1;
    if (nextIdx >= r.questions.length) {
      await multiplayerService.endGame(r.id);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      await multiplayerService.nextQuestion(r.id, nextIdx);
    }
  }, []);

  // Reset timer when question changes
  useEffect(() => {
    if (room?.status === 'playing') {
      setTimeLeft(room.timer_duration || TIMER_SECONDS);
      setSelectedAnswer(null);
    }
  }, [room?.current_question_index, room?.status, room?.timer_duration]);

  // Timer countdown
  useEffect(() => {
    if (room?.status !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isHost) {
            handleNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.status, isHost, handleNextQuestion]);

  const handleStartGame = async () => {
    if (!room) return;

    const apiKey = settings.geminiApiKey;
    if (!apiKey) {
      toast.error('Host needs a Gemini API Key in Settings.');
      return;
    }

    setIsGenerating(true);
    try {
      const questions = await multiplayerService.generateQuestions(room.language, room.level, 10, apiKey);
      if (!questions.length) {
        throw new Error('AI generation failed');
      }
      await multiplayerService.startGame(room.id, questions);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start game');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer || timeLeft <= 0 || !room || !user) return;
    setSelectedAnswer(answer);

    const currentQuestion = room.questions[room.current_question_index];
    if (!currentQuestion) return;

    if (answer === currentQuestion.correctAnswer) {
      const myPlayer = players.find((p) => p.user_id === user.id);
      if (!myPlayer) return;

      const points = 100 + timeLeft * 10;
      try {
        await multiplayerService.updateScore(myPlayer.id, myPlayer.score + points);
        toast.success(`Correct! +${points}`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to update score');
      }
    } else {
      toast.error('Wrong answer');
    }
  };

  const copyCode = async () => {
    if (!room?.code) return;
    try {
      await navigator.clipboard.writeText(room.code);
      toast.success('Code copied');
    } catch (error) {
      console.error(error);
      toast.error('Unable to copy code');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (room.status === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light">Lobby</h1>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-3 text-5xl md:text-7xl font-mono font-bold tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
          >
            {room.code}
            <Copy size={24} className="text-muted-foreground" />
          </button>
          <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            {room.language} • {room.level}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.id} className="bg-secondary/20 border border-border p-4 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {player.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium truncate">{player.username}</span>
              {player.user_id === room.host_id && <Trophy size={14} className="text-yellow-500 ml-auto" />}
            </div>
          ))}
        </div>

        {isHost && (
          <div className="flex justify-center pt-8">
            <button
              onClick={handleStartGame}
              disabled={players.length < 2 || isGenerating}
              className="bg-primary text-primary-foreground px-12 py-4 rounded-full text-sm font-mono uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Play />}
              {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (room.status === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-8">
        <Trophy size={64} className="mx-auto text-yellow-500" />
        <h1 className="text-4xl font-bold">Game Over</h1>

        <div className="space-y-4">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={clsx(
                'flex items-center justify-between p-4 rounded-lg border',
                index === 0 ? 'bg-yellow-500/10 border-yellow-500' : 'bg-card border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xl font-bold w-6">{index + 1}</span>
                <span className="font-medium">{player.username}</span>
              </div>
              <span className="font-mono text-xl">{player.score}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/multiplayer')}
          className="text-sm font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const currentQuestion = room.questions[room.current_question_index];
  const isTimeUp = timeLeft <= 0;
  const shouldReveal = selectedAnswer !== null || isTimeUp;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full bg-secondary text-xs flex items-center justify-center border border-border"
                title={player.username}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-mono mt-1">{player.score}</span>
            </div>
          ))}
        </div>
        <div className="font-mono text-2xl font-bold tabular-nums">00:{timeLeft.toString().padStart(2, '0')}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-12">
        <div className="text-center space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Question {room.current_question_index + 1} / {room.questions.length}
          </span>
          <h2 className="text-3xl md:text-5xl font-light leading-tight">{currentQuestion?.question}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion?.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;

            let stateClass = 'border-border hover:bg-secondary/50';
            if (shouldReveal) {
              if (isSelected && isCorrect) stateClass = 'bg-green-500 text-white border-green-500';
              else if (isSelected && !isCorrect) stateClass = 'bg-red-500 text-white border-red-500';
              else if (!isSelected && isCorrect) stateClass = 'border-green-500 text-green-500';
              else stateClass = 'opacity-50';
            }

            return (
              <button
                key={idx}
                disabled={selectedAnswer !== null || isTimeUp}
                onClick={() => handleAnswer(option)}
                className={clsx(
                  'h-20 rounded-xl border-2 text-lg font-medium transition-all active:scale-95',
                  stateClass
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-1 bg-secondary mt-8 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (room.timer_duration || TIMER_SECONDS)) * 100}%` }}
        />
      </div>
    </div>
  );
};

## features/multiplayer/MultiplayerLobby.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { multiplayerService } from '@/services/multiplayer';
import { EditorialSelect } from '@/components/form/EditorialSelect';

export const MultiplayerLobby: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [level, setLevel] = useState('A1');
  const [language, setLanguage] = useState('polish');
  const [timerDuration, setTimerDuration] = useState('10');
  const [maxPlayers, setMaxPlayers] = useState('4');

  const handleCreate = async () => {
    if (!user || !profile?.username) {
      toast.error('You need an account with a username to host.');
      return;
    }

    setIsCreating(true);
    try {
      const room = await multiplayerService.createRoom(
        user.id, 
        profile.username, 
        language, 
        level,
        parseInt(timerDuration),
        parseInt(maxPlayers)
      );
      navigate(`/multiplayer/${room.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !profile?.username) {
      toast.error('Sign in to join a lobby.');
      return;
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    if (normalizedCode.length !== 6) {
      toast.error('Room code must be 6 letters.');
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('code', normalizedCode)
        .single();

      if (error || !data) {
        throw error ?? new Error('Room not found');
      }

      await multiplayerService.joinRoom(data.id, user.id, profile.username);
      navigate(`/multiplayer/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Invalid room code');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <Users size={32} />
        </div>
        <h1 className="text-4xl font-light tracking-tight">Deck Wars</h1>
        <p className="text-muted-foreground">Compete in real-time battles.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Join Existing</h3>
          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 bg-secondary/20 border-border border rounded-md px-4 font-mono uppercase tracking-widest outline-none focus:border-primary transition-colors"
              maxLength={6}
            />
            <button
              onClick={handleJoin}
              disabled={isJoining || roomCode.length < 6}
              className="bg-secondary hover:bg-secondary/80 text-foreground px-4 rounded-md disabled:opacity-50 flex items-center justify-center"
            >
              {isJoining ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </button>
          </div>
        </div>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-border"></div>
          <span className="shrink-0 mx-4 text-xs text-muted-foreground font-mono uppercase">OR CREATE NEW</span>
          <div className="grow border-t border-border"></div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Language</label>
              <EditorialSelect
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'polish', label: 'Polish' },
                  { value: 'spanish', label: 'Spanish' },
                  { value: 'japanese', label: 'Japanese' },
                  { value: 'norwegian', label: 'Norwegian' },
                ]}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Level</label>
              <EditorialSelect
                value={level}
                onChange={setLevel}
                options={['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => ({ value: lvl, label: lvl }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Timer (Sec)</label>
              <EditorialSelect
                value={timerDuration}
                onChange={setTimerDuration}
                options={['10', '15', '20', '30', '60'].map((t) => ({ value: t, label: `${t}s` }))}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Max Players</label>
              <EditorialSelect
                value={maxPlayers}
                onChange={setMaxPlayers}
                options={['2', '4', '8', '16', '32'].map((p) => ({ value: p, label: p }))}
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : <Globe size={16} />}
            Create Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

## features/sabotage/SabotageNotification.tsx
import React, { useEffect, useState } from 'react';
import { Skull, AlertTriangle } from 'lucide-react';
import { useSabotage, CurseType } from '@/contexts/SabotageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const CURSE_DETAILS: Record<CurseType, { name: string; description: string }> = {
  comic_sans: { name: 'Comic Sans Hell', description: 'Your font has been downgraded. Permanently.' },
  blur: { name: 'Beer Goggles', description: 'Everything is a little bit fuzzy...' },
  uwu: { name: 'The UwUifier', description: 'Your deck is feeling... kawaiii.' },
  rotate: { name: 'Australian Mode', description: 'Hope you can read upside down.' },
  gaslight: { name: 'Gaslight Pro', description: 'Are you sure that was the translation?' },
};

export const SabotageNotification: React.FC = () => {
  const { notificationQueue, dismissNotification } = useSabotage();
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);

  const currentNotification = notificationQueue[0];

  useEffect(() => {
    if (currentNotification) {
      setIsOpen(true);
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const details = CURSE_DETAILS[currentNotification.curse_type] || { name: 'Unknown Curse', description: 'Something bad happened.' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismissNotification()}>
      <DialogContent
        className={cn(
          'sm:max-w-md border-destructive/50 bg-destructive/10 backdrop-blur-xl [0_0_50px_-12px_rgba(239,68,68,0.5)]',
          shake && 'animate-shake'
        )}
      >
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive blur-2xl opacity-20 animate-pulse rounded-full" />
            <div className="relative bg-background p-4 rounded-full border-2 border-destructive ">
              <Skull size={48} className="text-destructive animate-[wiggle_1s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter text-destructive uppercase">Sabotaged!</h2>
            <p className="text-lg font-medium text-foreground">
              <span className="font-bold text-destructive">{currentNotification.sender_username}</span> attacked you!
            </p>
          </div>

            <div className="w-full bg-background/50 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                <AlertTriangle size={16} />
                <span className="text-xs font-mono uppercase tracking-widest">Active Effect</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{details.name}</h3>
              <p className="text-sm text-muted-foreground">{details.description}</p>
            </div>

          <button
            onClick={dismissNotification}
            className="w-full bg-destructive text-destructive-foreground font-bold uppercase tracking-widest py-4 rounded-md hover:bg-destructive/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Accept My Fate
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

## features/sabotage/SabotageStore.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skull, Type, EyeOff, RefreshCcw, Zap, Wallet } from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
}

const CURSES = [
  { id: 'comic_sans', name: 'Comic Sans Hell', cost: 200, icon: Type, desc: 'Forces their font to Comic Sans.' },
  { id: 'blur', name: 'Beer Goggles', cost: 350, icon: EyeOff, desc: 'Makes text pulse in and out of focus.' },
  { id: 'uwu', name: 'The UwUifier', cost: 500, icon: Skull, desc: 'Converts all sentences into UwU speak.' },
  { id: 'rotate', name: 'Australian Mode', cost: 600, icon: RefreshCcw, desc: 'Upside down text. Good luck.' },
  { id: 'gaslight', name: 'Gaslight Pro', cost: 1000, icon: Zap, desc: 'Randomly shows the WRONG answer before correcting itself.' },
] as const;

interface SabotageStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SabotageStore: React.FC<SabotageStoreProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [victims, setVictims] = useState<Profile[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVictims = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('id', user?.id)
        .limit(20);

      if (error) {
        toast.error('Failed to load victims.');
        console.error(error);
        return;
      }

      setVictims(data ?? []);
    };

    fetchVictims();
  }, [isOpen, user?.id]);

  const handlePurchase = async (curseId: string, cost: number) => {
    if (!selectedVictim) {
      toast.error('Select a victim first!');
      return;
    }


    if ((profile?.points || 0) < cost) {
        toast.error("Not enough points! Keep reviewing cards.");
        return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc('buy_curse', {
      target_user_id: selectedVictim,
      curse_type_input: curseId,
      cost,
    });

    setLoading(false);

    if (error) {
      toast.error('Transaction failed.');
      console.error(error);
      return;
    }

    if (data?.success) {
      toast.success('Curse cast! Pure evil.');
      onClose();
      return;
    }

    toast.error(data?.message ?? 'Something went wrong.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-popover border border-destructive/20 text-popover-foreground">
        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-destructive">
          <Skull /> The Sabotage Store
        </DialogTitle>

        <div className="mb-4 p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-center flex flex-col items-center gap-1">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Wallet Balance</span>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Wallet className="text-destructive" size={24} />
            <span>{profile?.points ?? 0} pts</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Lifetime XP: {profile?.xp} (Safe from spending)</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Select Victim</label>
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {victims.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVictim(v.id)}
                  className={`px-4 py-2 rounded-md border text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedVictim === v.id
                      ? 'bg-destructive text-destructive-foreground border-destructive'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  {v.username ?? '???'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {CURSES.map(curse => (
              <button
                key={curse.id}
                disabled={loading || !selectedVictim}
                onClick={() => handlePurchase(curse.id, curse.cost)}
                className="flex items-center gap-4 p-3 rounded-md border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all disabled:opacity-50 text-left group"
              >
                <div className="p-2 bg-secondary rounded group-hover:bg-destructive/20 transition-colors">
                  <curse.icon size={20} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{curse.name}</div>
                  <div className="text-xs text-muted-foreground">{curse.desc}</div>
                </div>
                <div className="font-mono text-destructive text-sm whitespace-nowrap">-{curse.cost} pts</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
## features/settings/components/AlgorithmSettings.tsx
import React, { useState } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewLogs } from '@/services/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

// ...existing code...
export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ reviews: number; } | null>(null);

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
      const optimizedW = await optimizeFSRS(logs, currentW, setProgress);
      setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: optimizedW } }));
      setReport({ reviews: logs.length });
      toast.success("Optimization complete");
    } catch (e) {
      toast.error("Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-16 max-w-xl">
      <section className="space-y-8">
        <div className="flex justify-between items-end">
            <MetaLabel className="mb-0 text-xs">Request Retention</MetaLabel>
            <span className="text-5xl font-light tabular-nums">
                {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-lg text-muted-foreground/40 ml-1">%</span>
            </span>
        </div>
        
        <div className="space-y-4">
            <Slider
                min={0.7} max={0.99} step={0.01}
                value={[localSettings.fsrs.request_retention]}
                onValueChange={([value]) =>
                    setLocalSettings((prev) => ({
                    ...prev, fsrs: { ...prev.fsrs, request_retention: value },
                    }))
                }
                className="py-2"
            />
            <div className="flex justify-between text-[9px] font-mono uppercase text-muted-foreground/40 tracking-widest">
                <span>Efficiency (0.70)</span>
                <span>Precision (0.99)</span>
            </div>
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex justify-between items-baseline">
            <MetaLabel className="mb-0 text-xs">Parameter Optimization</MetaLabel>
            {report && <span className="text-[10px] font-mono text-green-600 uppercase tracking-wider">Optimized</span>}
        </div>
        
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-md">
            Analyzes {report ? report.reviews : 'your'} review history to calculate custom weights for the FSRS algorithm.
        </p>

        {isOptimizing ? (
            <div className="space-y-2">
                <Progress value={progress} className="h-0.5 rounded-none bg-secondary" />
                <div className="flex justify-between text-[9px] font-mono uppercase text-muted-foreground">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
        ) : (
            <Button 
                onClick={handleOptimize}
                variant="outline"
                className="w-full h-12 text-[10px] font-mono uppercase tracking-widest border-border/40 hover:bg-foreground hover:text-background hover:border-foreground transition-all rounded-none"
            >
                <Wand2 size={12} className="mr-2" /> Run Optimizer
            </Button>
        )}
      </section>

      <section className="space-y-8 pt-4">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Max Interval (Days)</MetaLabel>
            <EditorialInput
                type="number"
                className="font-mono text-sm bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                value={localSettings.fsrs.maximum_interval}
                onChange={(e) =>
                    setLocalSettings((prev) => ({
                        ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                    }))
                }
            />
        </div>

        <div className="flex items-center justify-between group">
            <div className="space-y-1">
                <div className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Fuzzing</div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Avoid Due Date Clustering</div>
            </div>
            <Switch
                checked={localSettings.fsrs.enable_fuzzing}
                onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
                }
            />
        </div>
      </section>

      <div className="pt-8">
        <button 
            onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
            className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 hover:text-red-500 transition-colors flex items-center gap-2"
        >
            <RefreshCw size={10} /> Reset Weights
        </button>
      </div>
    </div>
  );
};

## features/settings/components/AudioSettings.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface VoiceOption { id: string; name: string; }

interface AudioSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  availableVoices: VoiceOption[];
  onTestAudio: () => void;
}

// ...existing code...
export const AudioSettings: React.FC<AudioSettingsProps> = ({
  localSettings,
  setLocalSettings,
  availableVoices,
  onTestAudio,
}) => {
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-16 max-w-xl">
      <section className="space-y-8">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Provider</MetaLabel>
            <EditorialSelect
                value={localSettings.tts.provider}
                onChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
                options={[
                    { value: 'browser', label: 'Browser Native' },
                    { value: 'google', label: 'Google Cloud' },
                    { value: 'azure', label: 'Microsoft Azure' },
                ]}
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        {localSettings.tts.provider !== 'browser' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <MetaLabel className="text-xs">API Credentials</MetaLabel>
                <EditorialInput
                    type="password"
                    placeholder={localSettings.tts.provider === 'google' ? "GOOGLE API KEY" : "AZURE KEY"}
                    value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                    onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                    className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                />
                {localSettings.tts.provider === 'azure' && (
                     <EditorialInput
                        placeholder="REGION (e.g. eastus)"
                        value={localSettings.tts.azureRegion}
                        onChange={(e) => updateTts({ azureRegion: e.target.value })}
                        className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                    />
                )}
            </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Voice Model</MetaLabel>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onTestAudio}
                    className="text-[10px] font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground h-auto px-2 py-1 hover:bg-transparent"
                >
                    <Volume2 size={12} className="mr-2" /> Test
                </Button>
            </div>
            <EditorialSelect
                value={localSettings.tts.voiceURI || 'default'}
                onChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
                options={[{ value: 'default', label: 'System Default' }, ...availableVoices.map(v => ({ value: v.id, label: v.name }))]}
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        <div className="grid grid-cols-2 gap-16 pt-4">
            <div className="space-y-6">
                <div className="flex justify-between">
                    <MetaLabel className="mb-0 text-xs">Speed</MetaLabel>
                    <span className="text-xs font-mono text-muted-foreground">{localSettings.tts.rate.toFixed(1)}x</span>
                </div>
                <Slider
                    min={0.5} max={2} step={0.1}
                    value={[localSettings.tts.rate]}
                    onValueChange={([v]) => updateTts({ rate: v })}
                    className="py-2"
                />
            </div>
            <div className="space-y-6">
                <div className="flex justify-between">
                    <MetaLabel className="mb-0 text-xs">Volume</MetaLabel>
                    <span className="text-xs font-mono text-muted-foreground">{Math.round(localSettings.tts.volume * 100)}%</span>
                </div>
                <Slider
                    min={0} max={1} step={0.1}
                    value={[localSettings.tts.volume]}
                    onValueChange={([v]) => updateTts({ volume: v })}
                    className="py-2"
                />
            </div>
        </div>
      </section>
    </div>
  );
};

## features/settings/components/DataSettings.tsx
import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check } from 'lucide-react';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
}

// ...existing code...
export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
}) => (
  <div className="space-y-16 max-w-xl">
    
    <section className="space-y-8">
        <MetaLabel className="text-xs">Local I/O</MetaLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button 
                variant="outline"
                onClick={onExport}
                className="flex flex-col items-center justify-center gap-4 h-40 border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all"
            >
                <Download className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
                <div className="text-center space-y-2">
                    <div className="text-xs font-medium uppercase tracking-widest">Export JSON</div>
                    <div className="text-[9px] text-muted-foreground/60 font-mono">Full Backup</div>
                </div>
            </Button>

            <Button 
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 h-40 border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all"
            >
                <Upload className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
                <div className="text-center space-y-2">
                    <div className="text-xs font-medium uppercase tracking-widest">Import CSV</div>
                    <div className="text-[9px] text-muted-foreground/60 font-mono">Bulk Add</div>
                </div>
            </Button>
        </div>
    </section>

    <section className="space-y-8 pt-4">
        <MetaLabel className="text-xs">Cloud Sync</MetaLabel>
        <Button
            variant={syncComplete ? "default" : "outline"}
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud || syncComplete}
            className="flex flex-col items-center justify-center gap-4 h-40 w-full border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5"
        >
            {syncComplete ? (
                <Check className="text-primary transition-colors" strokeWidth={1} size={24} />
            ) : (
                <Cloud className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
            )}
            <div className="text-center space-y-2">
                <div className="text-xs font-medium uppercase tracking-widest">{syncComplete ? "Synced" : "Sync to Cloud"}</div>
                <div className="text-[9px] text-muted-foreground/60 font-mono">{isSyncingToCloud ? "Processing..." : "Migrate LocalDB to Supabase"}</div>
            </div>
        </Button>
    </section>

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    
    <div className="p-0 text-[10px] text-muted-foreground/40 font-mono leading-relaxed uppercase tracking-wide">
        CSV Format: sentence, translation, targetWord, notes, tags. Delimiter auto-detected.
    </div>
  </div>
);

## features/settings/components/GeneralSettings.tsx
import React from 'react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  username: string;
  setUsername: (username: string) => void;
}

// ...existing code...
export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  localSettings, 
  setLocalSettings,
  username,
  setUsername
}) => {
  return (
    <div className="space-y-16 max-w-xl">
      {/* Profile Section */}
      <section className="space-y-8">
        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Identity</MetaLabel>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Public</span>
            </div>
            <div className="space-y-2">
                <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="USERNAME"
                    className="font-mono text-sm bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground h-auto py-3 placeholder:text-muted-foreground/20 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground/60">Visible on global leaderboards.</p>
            </div>
        </div>
      </section>

      {/* Language Section */}
      <section className="space-y-8">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Active Course</MetaLabel>
            <EditorialSelect
                value={localSettings.language}
                onChange={(value) =>
                    setLocalSettings((prev) => ({
                    ...prev,
                    language: value as UserSettings['language'],
                    }))
                }
                options={Object.entries(LANGUAGE_NAMES).map(([key, label]) => ({
                    value: key,
                    label: label,
                }))}
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus:ring-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        <div className="space-y-4">
             <ColorPicker
                label="THEME ACCENT"
                value={localSettings.languageColors?.[localSettings.language] || '0 0% 0%'}
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
        </div>
      </section>

      {/* API Section */}
      <section className="space-y-8">
         <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Intelligence</MetaLabel>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Gemini API</span>
            </div>
            <Input
                type="password"
                value={localSettings.geminiApiKey || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="ENTER API KEY"
                className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground h-auto py-3 placeholder:text-muted-foreground/20 transition-colors"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Required for sentence generation and linguistic analysis.
            </p>
         </div>
      </section>

      {/* Toggles */}
      <section className="space-y-8 pt-4">
        {[
            { label: 'Auto-play Audio', desc: 'Trigger TTS on reveal', key: 'autoPlayAudio' },
            { label: 'Blind Mode', desc: 'Hide text until audio plays', key: 'blindMode' },
            { label: 'Show Translation', desc: 'Display native meaning', key: 'showTranslationAfterFlip' }
        ].map((item) => (
            <div key={item.key} className="flex items-center justify-between group">
                <div className="space-y-1">
                    <div className="text-sm font-medium group-hover:text-foreground transition-colors font-mono uppercase tracking-wider text-muted-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground/60">{item.desc}</div>
                </div>
                <Switch
                    checked={(localSettings as any)[item.key]}
                    onCheckedChange={(checked) =>
                        setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
                    }
                />
            </div>
        ))}
      </section>
    </div>
  );
};

## features/settings/components/SettingsModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut, Skull } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useDeck } from '@/contexts/DeckContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Language } from '@/types';
import { ttsService, VoiceOption } from '@/services/tts';
import {
    deleteCardsByLanguage,
    saveAllCards,
    getCardSignatures,
    getCards,
} from '@/services/db/repositories/cardRepository';
import { getDB } from '@/services/db/client';
import { getHistory } from '@/services/db/repositories/historyRepository';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { GeneralSettings } from './GeneralSettings';
import { AudioSettings } from './AudioSettings';
import { StudySettings } from './StudySettings';
import { AlgorithmSettings } from './AlgorithmSettings';
import { DataSettings } from './DataSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'audio' | 'study' | 'algorithm' | 'data' | 'danger';

const CLOUD_SYNC_FLAG = 'linguaflow_cloud_sync_complete';
const readCloudSyncFlag = () =>
    typeof window !== 'undefined' && localStorage.getItem(CLOUD_SYNC_FLAG) === '1';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const detectDelimiter = (sample: string) => {
    if (sample.includes('\t')) return '\t';
    const commaCount = (sample.match(/,/g) || []).length;
    const semicolonCount = (sample.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
};

const parseCsvLine = (line: string, delimiter: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current);
    return cells;
};

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
    value === 'polish' || value === 'norwegian' || value === 'japanese' || value === 'spanish';

const rowToCard = (row: CsvRow, fallbackLanguage: Language): Card | null => {
    const sentence = pickValue(row, ['target_sentence', 'sentence', 'text', 'front', 'prompt']);
    const translation = pickValue(row, ['native_translation', 'translation', 'back', 'answer']);

    if (!sentence || !translation) {
        return null;
    }

    const languageCandidate = pickValue(row, ['language', 'lang'])?.toLowerCase();
    const language = isLanguage(languageCandidate) ? languageCandidate : fallbackLanguage;
    const tagsRaw = pickValue(row, ['tags', 'tag_list', 'labels']);
    const notes = pickValue(row, ['notes', 'context', 'hint']) || '';
    const targetWord = pickValue(row, ['target_word', 'keyword', 'cloze']);
    const furigana = pickValue(row, ['furigana', 'reading', 'ruby']);

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
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
    };
};

const parseCardsFromCsv = (payload: string, fallbackLanguage: Language): Card[] => {
    const sanitized = payload.replace(/\r\n/g, '\n').trim();
    if (!sanitized) return [];

    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];
        
        if (char === '"') {
            if (inQuotes && sanitized[i + 1] === '"') {
                current += '""';
                i++;
            } else {
                inQuotes = !inQuotes;
                current += char;
            }
        } else if (char === '\n' && !inQuotes) {
            if (current.trim().length > 0) {
                lines.push(current);
            }
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim().length > 0) {
        lines.push(current);
    }

    if (lines.length < 2) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const cards: Card[] = [];

    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        const values = parseCsvLine(rawLine, delimiter);
        if (values.every((value) => !value.trim())) continue;

        const row: CsvRow = {};
        headers.forEach((header, index) => {
            if (!header) return;
            row[header] = values[index]?.trim() ?? '';
        });

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
    const { refreshDeckData } = useDeck();
    const { signOut, profile, updateUsername } = useAuth();
    const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localUsername, setLocalUsername] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
  const [confirmResetAccount, setConfirmResetAccount] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);
    const [hasSyncedToCloud, setHasSyncedToCloud] = useState(() => readCloudSyncFlag());
    const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
        const voices = await ttsService.getAvailableVoices(localSettings.language, localSettings.tts);
        setAvailableVoices(voices);
    };

    if (isOpen) {
        setLocalSettings(settings);
        setLocalUsername(profile?.username || '');
        setConfirmResetDeck(false);
        setConfirmResetAccount(false);
        setActiveTab('general');
        loadVoices();
        setHasSyncedToCloud(readCloudSyncFlag());
    }
  }, [isOpen, settings, profile]);

  useEffect(() => {
      const loadVoices = async () => {
          const voices = await ttsService.getAvailableVoices(localSettings.language, localSettings.tts);
          setAvailableVoices(voices);
      };

      const timer = setTimeout(() => {
          loadVoices();
      }, 1000);

      return () => clearTimeout(timer);
  }, [localSettings.language, localSettings.tts.provider, localSettings.tts.googleApiKey, localSettings.tts.azureApiKey]);

  const handleSave = async () => {
    const languageChanged = localSettings.language !== settings.language;
    updateSettings(localSettings);

    if (localUsername !== profile?.username) {
        try {
            await updateUsername(localUsername);
        } catch (error) {
            return;
        }
    }

    toast.success(languageChanged ? "Language switched." : "Preferences saved.");
    onClose();
  };

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
        setConfirmResetDeck(true);
        return;
    }
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('xp, points, level')
            .eq('id', user.id)
            .single();

        await deleteCardsByLanguage(localSettings.language);
        await supabase.from('study_history').delete().eq('user_id', user.id).eq('language', localSettings.language);
        await supabase.from('activity_log').delete().eq('user_id', user.id).eq('language', localSettings.language);

        const { error: recalcError } = await supabase.rpc('recalculate_user_xp', {
            target_user_id: user.id
        });

        if (recalcError) {
            console.error('Error recalculating XP:', recalcError);
            toast.error('Failed to recalculate XP');
            return;
        }

        const rawDeck = 
            localSettings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK : 
            (localSettings.language === 'japanese' ? JAPANESE_BEGINNER_DECK : 
            (localSettings.language === 'spanish' ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
        const deck = rawDeck.map(c => ({ ...c, id: uuidv4(), dueDate: new Date().toISOString() }));
        await saveAllCards(deck);
        
        toast.success("Deck reset successfully");
        queryClient.clear();
        setTimeout(() => window.location.reload(), 500);
    } catch (e) {
        console.error(e);
        toast.error("Failed to reset deck");
    }
  };

  const handleResetAccount = async () => {
    if (!confirmResetAccount) {
        setConfirmResetAccount(true);
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
             toast.error("User not found");
             return;
        }

        await supabase.from('cards').delete().eq('user_id', user.id);
        await supabase.from('study_history').delete().eq('user_id', user.id);
        await supabase.from('activity_log').delete().eq('user_id', user.id);
        await supabase.from('profiles').update({ xp: 0, points: 0, level: 1 }).eq('id', user.id);

        localStorage.removeItem('language_mining_settings');
        localStorage.removeItem(CLOUD_SYNC_FLAG);

        toast.success("Account reset successfully. Restarting...");
        queryClient.clear();
        setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
        console.error("Account reset failed", error);
        toast.error(`Reset failed: ${error.message}`);
    }
  };

  const handleTestAudio = () => {
      const testText = {
          polish: "Cześć, to jest test.",
          norwegian: "Hei, dette er en test.",
          japanese: "こんにちは、テストです。"
      };
      ttsService.speak(testText[localSettings.language], localSettings.language, localSettings.tts);
  };

    const handleSyncToCloud = async () => {
        if (hasSyncedToCloud || isSyncingToCloud) {
            if (hasSyncedToCloud) {
                toast.info('Cloud sync already completed.');
            }
            return;
        }

        setIsSyncingToCloud(true);
        try {
            const db = await getDB();
            const cards = await db.getAll('cards');
            const historyEntries = await db.getAll('history');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            if (!cards.length && !historyEntries.length) {
                localStorage.setItem(CLOUD_SYNC_FLAG, '1');
                setHasSyncedToCloud(true);
                toast.success('No local data found. You are already in sync.');
                return;
            }

            if (cards.length > 0) {
                const normalizedCards = cards.map((card) => ({
                    id: card.id,
                    user_id: user.id,
                    target_sentence: card.targetSentence,
                    target_word: card.targetWord ?? null,
                    native_translation: card.nativeTranslation,
                    furigana: card.furigana ?? null,
                    notes: card.notes ?? '',
                    language: card.language || 'polish',
                    status: card.status,
                    interval: card.interval ?? 0,
                    ease_factor: card.easeFactor ?? 2.5,
                    due_date: card.dueDate,
                    stability: card.stability ?? 0,
                    difficulty: card.difficulty ?? 0,
                    elapsed_days: card.elapsed_days ?? 0,
                    scheduled_days: card.scheduled_days ?? 0,
                    reps: card.reps ?? 0,
                    lapses: card.lapses ?? 0,
                    state: card.state ?? null,
                    last_review: card.last_review ?? null,
                    learning_step: card.learningStep ?? null,
                    leech_count: card.leechCount ?? 0,
                    is_leech: card.isLeech ?? false,
                    tags: card.tags ?? null,
                }));
                
                const { error: cardError } = await supabase.from('cards').upsert(normalizedCards);
                if (cardError) throw cardError;
            }

            if (historyEntries.length > 0) {
                const normalizedHistory = historyEntries.map(entry => ({
                    user_id: user.id,
                    date: entry.date,
                    language: settings.language || 'polish', 
                    count: entry.count
                }));

                const { error: historyError } = await supabase
                    .from('study_history')
                    .upsert(normalizedHistory, { onConflict: 'user_id, date, language' });
                
                if (historyError) throw historyError;
            }

            localStorage.setItem(CLOUD_SYNC_FLAG, '1');
            setHasSyncedToCloud(true);
            refreshDeckData();
            toast.success(`Synced cards and history to the cloud.`);
        } catch (error: any) {
            console.error('Cloud sync failed', error);
            toast.error(`Cloud sync failed: ${error.message}`);
        } finally {
            setIsSyncingToCloud(false);
        }
    };

    const handleExport = async () => {
        try {
            const cards = await getCards();
            const history = await getHistory();
            
            const safeSettings = {
                ...localSettings,
                tts: {
                    ...localSettings.tts,
                    googleApiKey: '',
                    azureApiKey: ''
                }
            };

            const exportData = { 
                version: 1, 
                date: new Date().toISOString(), 
                cards, 
                history, 
                settings: safeSettings 
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Export complete.");
        } catch (e) {
            toast.error("Export failed.");
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsedCards = parseCardsFromCsv(text, localSettings.language);

            if (parsedCards.length === 0) {
                toast.error('No valid rows found. Ensure the CSV includes "sentence" and "translation" headers.');
                return;
            }

            const existingSignatures = await getCardSignatures(localSettings.language);
            const seen = new Set(
                existingSignatures.map((card) =>
                    signatureForCard(card.target_sentence, localSettings.language)
                )
            );

            const newCards = parsedCards.filter((card) => {
                const signature = signatureForCard(
                    card.targetSentence,
                    (card.language || localSettings.language) as Language
                );
                if (seen.has(signature)) {
                    return false;
                }
                seen.add(signature);
                return true;
            });

            if (!newCards.length) {
                toast.info('All rows already exist in your deck.');
                return;
            }

            await saveAllCards(newCards);
            refreshDeckData();
            toast.success(`Imported ${newCards.length} card${newCards.length === 1 ? '' : 's'}.`);
        } catch (error) {
            console.error('CSV import failed', error);
            toast.error('Import failed. Double-check the CSV format.');
        } finally {
            event.target.value = '';
        }
    };

  // ...existing code...
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'audio', label: 'Audio' },
    { id: 'study', label: 'Limits' },
    { id: 'algorithm', label: 'FSRS' },
    { id: 'data', label: 'Data' },
    { id: 'danger', label: 'Danger' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* UPDATED: Responsive height and padding */}
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl h-[90vh] md:h-[600px] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-background border border-border  rounded-xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-secondary border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-col justify-between shrink-0">
            <div>
                <DialogTitle className="font-bold tracking-tight text-lg mb-4 md:mb-8 flex items-center gap-2">
                    Settings
                </DialogTitle>
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                                activeTab === item.id 
                                    ? "bg-secondary text-foreground font-medium" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="hidden md:block text-[10px] font-mono text-muted-foreground/60">
                ID: {settings.language.toUpperCase()}_V1
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 p-4 md:p-10 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <GeneralSettings 
                        localSettings={localSettings} 
                        setLocalSettings={setLocalSettings}
                        username={localUsername}
                        setUsername={setLocalUsername}
                    />
                )}

                {activeTab === 'audio' && (
                    <AudioSettings
                        localSettings={localSettings}
                        setLocalSettings={setLocalSettings}
                        availableVoices={availableVoices}
                        onTestAudio={handleTestAudio}
                    />
                )}

                {activeTab === 'study' && (
                    <StudySettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
                )}

                {activeTab === 'algorithm' && (
                    <AlgorithmSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
                )}

                {activeTab === 'data' && (
                    <DataSettings
                        onExport={handleExport}
                        onImport={handleImport}
                        csvInputRef={csvInputRef}
                        onSyncToCloud={handleSyncToCloud}
                        isSyncingToCloud={isSyncingToCloud}
                        syncComplete={hasSyncedToCloud}
                    />
                )}

                {activeTab === 'danger' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Reset Deck */}
                        <div className="p-4 md:p-6 border border-border bg-secondary/10 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wide">Reset Current Deck</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        This will delete all cards, history, XP, and Points earned for <strong>{localSettings.language}</strong> and reload the beginner course.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetDeck}
                                className={clsx(
                                    "w-full py-3 text-xs font-mono uppercase tracking-widest transition-all rounded",
                                    confirmResetDeck 
                                        ? "bg-orange-600 text-white hover:bg-orange-700" 
                                        : "bg-background border border-border hover:bg-secondary"
                                )}
                            >
                                {confirmResetDeck ? "Are you sure? Click to confirm." : "Reset Deck & Progress"}
                            </button>
                        </div>

                        {/* Hard Reset Account */}
                        <div className="p-4 md:p-6 border border-destructive/20 bg-destructive/5 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <Skull className="text-destructive shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-destructive uppercase tracking-wide">Hard Reset Account</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        <span className="text-destructive font-medium">Warning:</span> This will permanently wipe <strong>ALL</strong> data associated with your user: Cards (all languages), History, XP, Points, and Settings. Your username will be kept.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetAccount}
                                className={clsx(
                                    "w-full py-3 text-xs font-mono uppercase tracking-widest transition-all rounded",
                                    confirmResetAccount 
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                                        : "bg-background border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                )}
                            >
                                {confirmResetAccount ? "ABSOLUTELY SURE? CLICK TO WIPE." : "Hard Reset Account"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-border bg-background flex justify-between items-center gap-4 shrink-0 flex-wrap">
                <button 
                    onClick={() => {
                        onClose();
                        signOut();
                    }}
                    className="text-xs font-mono uppercase tracking-wider text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-md transition-colors flex items-center gap-2"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                </button>
                <div className="flex gap-4 ml-auto">
                    <button 
                        onClick={onClose} 
                        className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-foreground text-background px-6 py-2 text-sm font-medium rounded hover:opacity-90 transition-opacity"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
## features/settings/components/StudySettings.tsx
import React from 'react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { MetaLabel } from '@/components/form/MetaLabel';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

// ...existing code...
export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-16 max-w-xl">
      <div className="flex items-start gap-4 p-0">
        <div className="w-1 h-1 mt-2 bg-foreground rounded-full shrink-0" />
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed uppercase tracking-wide max-w-md">
          Configuration for <span className="text-foreground font-medium">{currentLangName}</span> deck. Limits reset daily at 04:00.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-16">
        <div className="space-y-4">
          <MetaLabel className="text-xs">New Cards</MetaLabel>
          <EditorialInput
            type="number"
            value={currentDailyNew}
            className="text-5xl font-light h-auto py-2 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums bg-transparent"
            onChange={(event) => {
              const val = parseInt(event.target.value, 10) || 0;
              setLocalSettings(prev => ({
                ...prev,
                dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
              }));
            }}
          />
        </div>
        <div className="space-y-4">
          <MetaLabel className="text-xs">Review Limit</MetaLabel>
          <EditorialInput
            type="number"
            value={currentDailyReview}
            className="text-5xl font-light h-auto py-2 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums bg-transparent"
            onChange={(event) => {
              const val = parseInt(event.target.value, 10) || 0;
              setLocalSettings(prev => ({
                ...prev,
                dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
              }));
            }}
          />
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Card Order</div>
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Prioritize New or Reviews</div>
          </div>
          <select
            value={localSettings.cardOrder || 'newFirst'}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, cardOrder: e.target.value as any }))}
            className="bg-transparent border-b border-border/40 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-foreground transition-colors py-1 text-foreground"
          >
            <option value="newFirst" className="bg-background text-foreground">New First</option>
            <option value="reviewFirst" className="bg-background text-foreground">Review First</option>
            <option value="mixed" className="bg-background text-foreground">Mixed</option>
          </select>
        </div>

        <div className="flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Binary Rating</div>
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pass / Fail Only</div>
          </div>
          <Switch
            checked={localSettings.binaryRatingMode}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-sm">
          Reduces cognitive load by removing "Hard" and "Easy" options. Recommended for rapid review sessions.
        </p>
      </section>
    </div>
  );
};

## features/study/components/CramModal.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTags } from "@/services/db/repositories/cardRepository";

interface CramModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {
    const { settings } = useSettings();
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [limit, setLimit] = useState([50]);
    const navigate = useNavigate();

    const { data: tags = [] } = useQuery({
        queryKey: ['tags', settings.language],
        queryFn: () => getTags(settings.language),
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
                        <DialogTitle className="text-lg font-semibold tracking-tight">Cram Session</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Review cards without affecting your long-term statistics.
                        </DialogDescription>
                    </div>
                    
                    <div className="space-y-6 py-2">
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by Tag</label>
                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                                <SelectTrigger className="w-full h-10 px-3 bg-secondary/30 border-transparent hover:bg-secondary/50 transition-colors focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="All Cards" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Cards</SelectItem>
                                    {tags.map((t: string) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Card Limit</label>
                                <span className="text-sm font-mono font-medium bg-secondary px-2 py-0.5 rounded text-foreground">
                                    {limit[0]} cards
                                </span>
                            </div>
                            <Slider 
                                min={10} max={200} step={10} 
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
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleStart}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors rounded-md "
                    >
                        Start Session <ArrowRight size={14} />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
## features/study/components/Flashcard.tsx
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { useSabotage } from '@/contexts/SabotageContext';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { Play, Sparkles, Loader2, Quote, Mic, Volume2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { aiService } from '@/features/deck/services/ai';
import { toast } from 'sonner';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
}

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = 'polish'
}) => {
  const { settings } = useSettings();
  const { isCursedWith } = useSabotage();
  const [isRevealed, setIsRevealed] = useState(!blindMode);
  const [playSlow, setPlaySlow] = useState(false);
  const playSlowRef = React.useRef(playSlow);
  const hasSpokenRef = React.useRef<string | null>(null);
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
  const [isGaslit, setIsGaslit] = useState(false);

  // Analysis State
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ originalText: string; definition: string; partOfSpeech: string; contextMeaning: string } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => { setIsRevealed(!blindMode); }, [card.id, blindMode]);
  useEffect(() => { if (isFlipped) setIsRevealed(true); }, [isFlipped]);

  useEffect(() => {
    setSelection(null);
    setAnalysisResult(null);
    setIsAnalysisOpen(false);
    setPlaySlow(false);
  }, [card.id]);

  useEffect(() => {
    playSlowRef.current = playSlow;
  }, [playSlow]);

  useEffect(() => {
    if (isCursedWith('gaslight') && Math.random() > 0.5) {
      const randomFake = FAKE_ANSWERS[Math.floor(Math.random() * FAKE_ANSWERS.length)];
      setDisplayedTranslation(randomFake);
      setIsGaslit(true);
    } else {
      setDisplayedTranslation(card.nativeTranslation);
      setIsGaslit(false);
    }
  }, [card.id, isCursedWith]);

  const processText = (text: string) => isCursedWith('uwu') ? uwuify(text) : text;

  const speak = useCallback(() => {
    const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
    const effectiveSettings = { ...settings.tts, rate: effectiveRate };
    ttsService.speak(card.targetSentence, language, effectiveSettings);
    setPlaySlow(prev => !prev);
  }, [card.targetSentence, language, settings.tts]);

  // --- FIX START ---
  // Split effects to prevent stopping audio when 'speak' identity changes due to playSlow toggle

  // 1. Cleanup Effect: Only stop audio when the card changes or component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, [card.id]);

  // 2. AutoPlay Effect: Triggers audio but doesn't handle cleanup
  useEffect(() => {
    if (hasSpokenRef.current !== card.id) {
      hasSpokenRef.current = null;
    }
    if (autoPlayAudio && hasSpokenRef.current !== card.id) {
      speak();
      hasSpokenRef.current = card.id;
    }
  }, [card.id, autoPlayAudio, speak]);
  // --- FIX END ---

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
    setSelection({ text, top: rect.top - 60, left: rect.left + (rect.width / 2) });
  }, []);

  useEffect(() => {
    const clear = () => setSelection(null);
    window.addEventListener('resize', clear);
    window.addEventListener('scroll', clear, true);
    return () => {
      window.removeEventListener('resize', clear);
      window.removeEventListener('scroll', clear, true);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!selection) return;
    if (!settings.geminiApiKey) {
      toast.error("API Key required.");
      setSelection(null);
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeWord(selection.text, card.targetSentence, language, settings.geminiApiKey);
      setAnalysisResult({ ...result, originalText: selection.text });
      setIsAnalysisOpen(true);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayedSentence = processText(card.targetSentence);

  const fontSizeClass = useMemo(() => {
    const len = displayedSentence.length;
    if (len < 6) return "text-7xl md:text-9xl tracking-tighter font-medium";
    if (len < 15) return "text-6xl md:text-8xl tracking-tighter font-medium";
    if (len < 30) return "text-5xl md:text-7xl tracking-tight font-normal";
    if (len < 60) return "text-4xl md:text-6xl tracking-tight font-light";
    return "text-3xl md:text-5xl font-light";
  }, [displayedSentence]);

  const RenderedSentence = useMemo(() => {
    const baseClasses = cn(
      "text-center text-balance select-text leading-[1.1] text-foreground font-sans",
      fontSizeClass
    );

    if (!isRevealed) {
      return (
        <div onClick={() => setIsRevealed(true)} className="cursor-pointer group flex flex-col items-center gap-6">
          {blindMode && (
            <button onClick={(e) => { e.stopPropagation(); speak(); }} className="p-4 rounded-full border border-foreground/10 hover:border-foreground/30 transition-colors mb-4">
              <Mic size={32} strokeWidth={1} />
            </button>
          )}
          <p className={cn(baseClasses, "blur-2xl opacity-10 group-hover:opacity-20")}>
            {displayedSentence}
          </p>
        </div>
      );
    }

    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      return (
        <div className={cn(baseClasses, "flex flex-wrap justify-center items-end gap-x-[0.2em]")}>
          {segments.map((segment, i) => {
            const isTarget = card.targetWord && (card.targetWord === segment.text || card.targetWord.includes(segment.text));
            if (segment.furigana) {
              return (
                <div key={i} className="group flex flex-col items-center justify-end">
                  <span className="text-[0.4em] text-muted-foreground mb-[0.2em] select-none opacity-0 group-hover:opacity-100 transition-opacity leading-none font-mono">
                    {processText(segment.furigana)}
                  </span>
                  <span className={isTarget ? "text-primary font-bold" : ""}>{processText(segment.text)}</span>
                </div>
              );
            }
            return <span key={i} className={isTarget ? "text-primary font-bold" : ""}>{processText(segment.text)}</span>;
          })}
        </div>
      );
    }

    if (card.targetWord) {
      const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
      return (
        <p className={baseClasses}>
          {parts.map((part, i) =>
            part.toLowerCase() === card.targetWord?.toLowerCase()
              ? <span key={i} className="text-primary font-bold">{processText(part)}</span>
              : <span key={i}>{processText(part)}</span>
          )}
        </p>
      );
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass, blindMode, speak]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full",
    isCursedWith('rotate') && "rotate-180",
    isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
    isCursedWith('blur') && "animate-pulse blur-[1px]"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        {/* Question Block: Stays stationary because it's the only item in the flex flow */}
        <div className="w-full px-6 flex flex-col items-center gap-8 z-10">
          {RenderedSentence}

          {isRevealed && (
            <button
              onClick={speak}
              className="group flex items-center gap-2 text-muted-foreground/40 hover:text-foreground transition-all duration-300"
            >
              <Volume2 size={24} className={cn("transition-all", playSlow && "text-primary")} />
            </button>
          )}
        </div>

        {/* Answer Reveal: Absolute positioning removes it from flex flow, preventing shift */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 pt-32 md:pt-40 flex flex-col items-center gap-4 z-0 pointer-events-none">

            {showTranslation && (
              <div className="relative group pointer-events-auto px-6">
                <p className={cn(
                  "text-lg md:text-xl text-foreground/90 font-serif italic text-center max-w-2xl leading-relaxed text-balance transition-colors duration-300",
                  isGaslit ? "text-destructive/80" : "group-hover:text-foreground"
                )}>
                  {processText(displayedTranslation)}
                </p>
                {isGaslit && <span className="absolute -top-4 -right-8 text-[8px] font-mono uppercase text-destructive tracking-widest rotate-12">Sus</span>}
              </div>
            )}

            {card.notes && (
              <p className="text-xs font-mono text-muted-foreground/70 max-w-md text-center tracking-widest uppercase pointer-events-auto mt-4">
                {processText(card.notes)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Floating Context Menu */}
      {selection && (
        <div
          className="fixed z-50 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: selection.top, left: selection.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-foreground text-background px-4 py-2 rounded-full  hover:scale-105 transition-transform text-[10px] font-mono uppercase tracking-widest flex items-center gap-2"
          >
            {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
            Explain
          </button>
        </div>
      )}

      {/* Analysis Modal */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="sm:max-w-lg bg-background border border-border p-8 md:p-12 ">
          <div className="space-y-8">
            <div className="space-y-2 border-b border-border pb-6">
              <div className="flex justify-between items-start">
                <h2 className="text-3xl font-light">{analysisResult?.originalText}</h2>
                <span className="text-[10px] font-mono uppercase border border-border px-2 py-1 rounded text-muted-foreground">
                  {analysisResult?.partOfSpeech}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">Definition</span>
                <p className="text-lg font-light leading-relaxed">{analysisResult?.definition}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Quote size={10} /> In Context
                </span>
                <p className="text-sm text-muted-foreground font-light italic border-l-2 border-primary/20 pl-4 py-1">
                  {analysisResult?.contextMeaning}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
## features/study/components/StudyFeedback.tsx
import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { XpFeedback } from '@/features/xp/hooks/useXpSession';

export const StudyFeedback = ({ feedback }: { feedback: XpFeedback | null }) => {
  const [visible, setVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<XpFeedback | null>(null);

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
      <div className={clsx(
        "flex items-center gap-3 px-4 py-2 rounded-sm border backdrop-blur-sm",
        currentFeedback.isBonus 
          ? "bg-amber-500/5 border-amber-500/30 text-amber-600" 
          : "bg-background/80 border-border/40 text-muted-foreground"
      )}>
        <Zap size={12} className={currentFeedback.isBonus ? "fill-amber-600" : "fill-none"} />
        <span className="text-xs font-mono uppercase tracking-[0.2em]">
          {currentFeedback.message}
        </span>
      </div>
    </div>
  );
};

## features/study/components/StudySession.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { X, Undo2, Archive } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { useStudySession } from '../hooks/useStudySession';
import clsx from 'clsx';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';

const gradeToRatingMap: Record<Grade, CardRating> = {
  Again: 'again',
  Hard: 'hard',
  Good: 'good',
  Easy: 'easy',
};

const mapGradeToRating = (grade: Grade): CardRating => gradeToRatingMap[grade];

const getQueueCounts = (cards: Card[]) => {
  return cards.reduce(
    (acc, card) => {
      const state = card.state;
      if (state === 0 || (state === undefined && card.status === 'new')) acc.unseen++;
      else if (state === 1 || (state === undefined && card.status === 'learning')) acc.learning++;
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
  onRecordReview: (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
}

export const StudySession: React.FC<StudySessionProps> = ({
  dueCards,
  reserveCards = [],
  onUpdateCard,
  onRecordReview,
  onExit,
  onComplete,
  onUndo,
  canUndo,
  isCramMode = false,
  dailyStreak,
}) => {
  const { settings } = useSettings();
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult } = useXpSession(dailyStreak, isCramMode);

  const enhancedRecordReview = useCallback((card: Card, grade: Grade) => {
      const rating = mapGradeToRating(grade);
      const xpResult = processCardResult(rating); 
      const payload: CardXpPayload = {
        ...xpResult,
        rating,
        streakAfter: rating === 'again' ? 0 : sessionStreak + 1,
        isCramMode,
        dailyStreak,
        multiplierLabel: multiplierInfo.label
      };
      onRecordReview(card, grade, payload);
    }, [onRecordReview, processCardResult, sessionStreak, isCramMode, dailyStreak, multiplierInfo]);

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
  } = useStudySession({
    dueCards,
    reserveCards,
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo,
  });

  const counts = useMemo(() => getQueueCounts(sessionCards.slice(currentIndex)), [sessionCards, currentIndex]);
  const totalRemaining = counts.unseen + counts.learning + counts.lapse + counts.mature;

  const currentStatus = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) return { label: 'CRAM', className: 'text-purple-500 border-purple-500/20 bg-purple-500/5' };

    const s = currentCard.state;
    // 0=New, 1=Learning, 2=Review, 3=Relearning
    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
        return { label: 'NEW', className: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
        return { label: 'LRN', className: 'text-orange-500 border-orange-500/20 bg-orange-500/5' };
    }
    if (s === 3) {
        return { label: 'LAPSE', className: 'text-red-500 border-red-500/20 bg-red-500/5' };
    }
    return { label: 'REV', className: 'text-green-500 border-green-500/20 bg-green-500/5' };
  }, [currentCard, isCramMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard && !sessionComplete) return;
      
      // Flip Logic
      if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) { 
        e.preventDefault(); 
        setIsFlipped(true); 
      }
      // Grade Logic
      else if (isFlipped && !sessionComplete && !isProcessing) {
        if (settings.binaryRatingMode) {
            // Binary Mode: 1=Fail, Space/2/3/4=Pass
            if (e.key === '1') { 
                e.preventDefault(); 
                handleGrade('Again'); 
            } else if (['2', '3', '4', 'Space', 'Enter'].includes(e.key) || e.code === 'Space') { 
                e.preventDefault(); 
                handleGrade('Good'); 
            }
        } else {
            // Standard Mode
            if (e.code === 'Space' || e.key === '3') { e.preventDefault(); handleGrade('Good'); }
            else if (e.key === '1') { e.preventDefault(); handleGrade('Again'); }
            else if (e.key === '2') { e.preventDefault(); handleGrade('Hard'); }
            else if (e.key === '4') { e.preventDefault(); handleGrade('Easy'); }
        }
      }

      if (e.key === 'z' && canUndo && onUndo) { e.preventDefault(); handleUndo(); }
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, sessionComplete, isFlipped, isProcessing, handleGrade, handleUndo, canUndo, onUndo, onExit, settings.binaryRatingMode]);

  if (sessionComplete) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="text-center space-y-12">
          <div className="space-y-4">
             <h2 className="text-5xl md:text-8xl font-thin tracking-tighter">Session Clear</h2>
             <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">All cards reviewed</p>
          </div>
          <button onClick={() => onComplete ? onComplete() : onExit()} className="group relative px-8 py-4 bg-transparent hover:bg-primary/5 border border-border hover:border-primary transition-all rounded text-sm font-mono uppercase tracking-widest">
            <span className="relative z-10 group-hover:text-primary transition-colors">Finish & Claim</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden font-sans selection:bg-primary/10">
      
      {/* 1. Ultra-Minimal Progress Line */}
      <div className="h-px w-full bg-foreground/5">
        <div className="h-full w-full bg-foreground transition-transform duration-500 ease-out origin-left" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      {/* 2. Heads-Up Display (HUD) */}
      <header className="h-16 px-6 md:px-12 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)]">
         
         {/* Queue Stats (Left) */}
         <div className="flex items-center gap-3 md:gap-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'NEW' ? "text-blue-500 opacity-100 font-medium scale-105" : (counts.unseen > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'NEW' && "animate-pulse")} />
                <span className="hidden sm:inline">New</span>
                <span>{counts.unseen}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'LRN' ? "text-orange-500 opacity-100 font-medium scale-105" : (counts.learning > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'LRN' && "animate-pulse")} />
                <span className="hidden sm:inline">Lrn</span>
                <span>{counts.learning}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'LAPSE' ? "text-red-500 opacity-100 font-medium scale-105" : (counts.lapse > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'LAPSE' && "animate-pulse")} />
                <span className="hidden sm:inline">Lapse</span>
                <span>{counts.lapse}</span>
            </div>
            <div className={clsx("flex items-center gap-1.5 transition-all duration-300", currentStatus?.label === 'REV' ? "text-green-500 opacity-100 font-medium scale-105" : (counts.mature > 0 ? "text-grey" : "text-muted-foreground/80 opacity-80"))}>
                <span className={clsx("w-1 h-1 rounded-full bg-current", currentStatus?.label === 'REV' && "animate-pulse")} />
                <span className="hidden sm:inline">Rev</span>
                <span>{counts.mature}</span>
            </div>
         </div>

         {/* Meta & Tools (Right) */}
         <div className="flex items-center gap-6 md:gap-8">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-muted-foreground">
                    <span>{sessionXp} XP</span>
                    {multiplierInfo.value > 1.0 && (
                        <span className="text-[9px] text-primary opacity-80">
                            {multiplierInfo.value.toFixed(1)}x
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground/40">
                <button onClick={handleMarkKnown} disabled={isProcessing} className="p-2 hover:text-foreground transition-colors" title="Archive (K)">
                    <Archive size={14} strokeWidth={1.5} />
                </button>
                {canUndo && (
                    <button onClick={handleUndo} className="p-2 hover:text-foreground transition-colors" title="Undo (Z)">
                        <Undo2 size={14} strokeWidth={1.5} />
                    </button>
                )}
                <button onClick={onExit} className="p-2 hover:text-destructive transition-colors" title="Exit (Esc)">
                    <X size={14} strokeWidth={1.5} />
                </button>
            </div>
         </div>
      </header>

      {/* 3. The Stage (Flashcard) */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center">
         
         {/* Status Indicator Removed - Integrated into Header Stats */}

         <StudyFeedback feedback={feedback} />
         
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </main>

      {/* 4. Disciplined Controls (Bottom) */}
      <footer className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="h-20 md:h-24 w-full max-w-3xl mx-auto px-6">
          {!isFlipped ? (
               <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="w-full h-full flex items-center justify-center group"
               >
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/30 group-hover:text-foreground/60 transition-colors duration-500">
                    Tap to Reveal
                </span>
               </button>
          ) : (
              settings.binaryRatingMode ? (
                  <div className="grid grid-cols-2 h-full w-full gap-4 md:gap-12 items-center">
                      <AnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Good" 
                          shortcut="Spc" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-4 h-full w-full gap-2 md:gap-4 items-center">
                      <AnswerButton 
                          label="Again" 
                          shortcut="1" 
                          intent="danger"
                          onClick={() => handleGrade('Again')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Hard" 
                          shortcut="2" 
                          intent="warning"
                          onClick={() => handleGrade('Hard')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Good" 
                          shortcut="3" 
                          intent="success"
                          onClick={() => handleGrade('Good')} 
                          disabled={isProcessing} 
                      />
                      <AnswerButton 
                          label="Easy" 
                          shortcut="4" 
                          intent="info"
                          onClick={() => handleGrade('Easy')} 
                          disabled={isProcessing} 
                      />
                  </div>
              )
          )}
        </div>
      </footer>
    </div>
  );
};

const AnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: { 
    label: string; 
    shortcut: string; 
    intent: 'danger' | 'warning' | 'success' | 'info'; 
    onClick: () => void; 
    disabled: boolean;
}) => {
    const colorMap = {
        danger: 'text-red-500',
        warning: 'text-orange-500',
        success: 'text-emerald-500',
        info: 'text-blue-500'
    };
    
    const textColor = colorMap[intent];

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none transition-all duration-300",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Label */}
            <span className={clsx(
                "text-xs md:text-sm font-mono uppercase tracking-[0.25em] transition-all duration-300",
                "text-muted-foreground group-hover:scale-110",
                `group-hover:${textColor}`
            )}>
                {label}
            </span>

            {/* Shortcut Hint */}
            <span className="absolute -bottom-4 text-[9px] font-mono text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bottom-2">
                {shortcut}
            </span>
        </button>
    );
});
## features/study/hooks/useStudySession.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';
import { isNewCard } from '@/services/studyLimits'; // Make sure to import this!

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[]; // Accept reserve cards
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [], // Default
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [reserveCards, setReserveCards] = useState<Card[]>(initialReserve); // Local state for reserve
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(dueCards.length === 0);
  const [actionHistory, setActionHistory] = useState<{ addedCard: boolean }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialized = useRef(false);


  const isProcessingRef = useRef(false);


  useEffect(() => {
    if (!isInitialized.current && dueCards.length > 0) {
      let sortedCards = [...dueCards];

      if (settings.cardOrder === 'newFirst') {
        sortedCards.sort((a, b) => {
          const aIsNew = isNewCard(a);
          const bIsNew = isNewCard(b);
          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;
          return 0;
        });
      } else if (settings.cardOrder === 'reviewFirst') {
        sortedCards.sort((a, b) => {
          const aIsNew = isNewCard(a);
          const bIsNew = isNewCard(b);
          if (!aIsNew && bIsNew) return -1;
          if (aIsNew && !bIsNew) return 1;
          return 0;
        });
      }

      setSessionCards(sortedCards);
      setReserveCards(initialReserve);
      setCurrentIndex(0);
      setSessionComplete(dueCards.length === 0);
      setActionHistory([]);
      isInitialized.current = true;
    }
  }, [dueCards, initialReserve, settings.cardOrder]);

  const currentCard = sessionCards[currentIndex];

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    const now = new Date();
    return isCardDue(currentCard, now);
  }, [currentCard]);

  const handleGrade = useCallback(
    async (grade: Grade) => {
      if (!currentCard || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
        await Promise.resolve(onUpdateCard(updatedCard));
        await Promise.resolve(onRecordReview(currentCard, grade));

        let appended = false;
        if (updatedCard.status === 'learning') {
          setSessionCards((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === updatedCard.id) return prev;
            return [...prev, updatedCard];
          });
          appended = true;
        }
        setActionHistory((prev) => [...prev, { addedCard: appended }]);

        if (currentIndex < sessionCards.length - 1 || appended) {
          setIsFlipped(false);
          setCurrentIndex((prev) => prev + 1);
        } else {
          setSessionComplete(true);
        }
      } catch (e) {
        console.error("Review failed", e);
        return;
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [currentCard, currentIndex, onRecordReview, onUpdateCard, sessionCards.length, settings.fsrs]
  );

  const handleMarkKnown = useCallback(async () => {
    if (!currentCard || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const wasNew = isNewCard(currentCard); // Check if card was new

      const updatedCard: Card = {
        ...currentCard,
        status: 'known',
      };

      await Promise.resolve(onUpdateCard(updatedCard));


      let replacementAdded = false;
      if (wasNew && reserveCards.length > 0) {
        const nextNew = reserveCards[0];
        setSessionCards(prev => [...prev, nextNew]);
        setReserveCards(prev => prev.slice(1));
        replacementAdded = true;
      }


      setActionHistory((prev) => [...prev, { addedCard: replacementAdded }]);

      if (currentIndex < sessionCards.length - 1 || replacementAdded) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    } catch (e) {
      console.error("Mark known failed", e);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [currentCard, currentIndex, onUpdateCard, sessionCards.length, reserveCards]);

  const handleUndo = useCallback(() => {
    if (!canUndo || !onUndo) return;
    onUndo();

    if (currentIndex > 0 || sessionComplete) {
      setActionHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        const lastAction = prev[prev.length - 1];



        if (lastAction?.addedCard) {
          setSessionCards((prevCards) => prevCards.slice(0, -1));
        }

        return newHistory;
      });

      setSessionComplete(false);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsFlipped(true);
    }
  }, [canUndo, currentIndex, onUndo, sessionComplete]);

  const progress = sessionCards.length
    ? (currentIndex / sessionCards.length) * 100
    : 0;

  return {
    sessionCards,
    currentCard,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionComplete,
    isCurrentCardDue,
    handleGrade,
    handleMarkKnown,
    handleUndo,
    progress,
    isProcessing,
  };
};
## features/study/logic/srs.ts
import { addDays, startOfDay, subHours, isBefore, isSameDay, addMinutes } from 'date-fns';
import { Card, Grade, UserSettings, CardStatus } from '@/types';
import { SRS_CONFIG, FSRS_DEFAULTS } from '@/constants';
import { FSRS, Card as FSRSCard, Rating, State, generatorParameters } from 'ts-fsrs';

let cachedFSRS: FSRS | null = null;
let lastConfig: UserSettings['fsrs'] | null = null;

export const getSRSDate = (date: Date = new Date()): Date => {

  return startOfDay(subHours(date, SRS_CONFIG.CUTOFF_HOUR));
};

const mapGradeToRating = (grade: Grade): Rating => {
  switch (grade) {
    case 'Again': return Rating.Again;
    case 'Hard': return Rating.Hard;
    case 'Good': return Rating.Good;
    case 'Easy': return Rating.Easy;
  }
};

const mapStateToStatus = (state: State): CardStatus => {
  if (state === State.New) return 'new';
  if (state === State.Learning || state === State.Relearning) return 'learning';
  return 'graduated';
};

function getFSRS(settings?: UserSettings['fsrs']) {
   if (!cachedFSRS || 
       lastConfig?.request_retention !== settings?.request_retention ||
       lastConfig?.maximum_interval !== settings?.maximum_interval ||
       lastConfig?.w !== settings?.w ||
       lastConfig?.enable_fuzzing !== settings?.enable_fuzzing) {
       
       const paramsConfig = {
        request_retention: settings?.request_retention || FSRS_DEFAULTS.request_retention,
        maximum_interval: settings?.maximum_interval || FSRS_DEFAULTS.maximum_interval,
        w: settings?.w || FSRS_DEFAULTS.w,
        enable_fuzz: settings?.enable_fuzzing ?? FSRS_DEFAULTS.enable_fuzzing,
      };
       const params = generatorParameters(paramsConfig);
       cachedFSRS = new FSRS(params);
       lastConfig = settings || null;
   }
   return cachedFSRS;
}

/**
 * Calculates the next interval and scheduling info using FSRS.
 */
export const calculateNextReview = (card: Card, grade: Grade, settings?: UserSettings['fsrs']): Card => {
  const f = getFSRS(settings);
  const now = new Date();
  

  let currentState = card.state;
  if (currentState === undefined) {
      if (card.status === 'new') currentState = State.New;
      else if (card.status === 'learning') currentState = State.Learning;
      else currentState = State.Review;
  }

  const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;


  if (currentState === State.Review && !lastReviewDate) {
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
    last_review: lastReviewDate
  } as FSRSCard;

  const rating = mapGradeToRating(grade);
  

  const schedulingCards = f.repeat(fsrsCard, now);
  const log = schedulingCards[rating].card;
  
  const isNew = currentState === State.New || (card.reps || 0) === 0;
  const tentativeStatus = mapStateToStatus(log.state);
  


  


  const status = card.status === 'graduated' && tentativeStatus === 'learning' && grade !== 'Again'
    ? 'graduated'
    : tentativeStatus;


  const totalLapses = log.lapses;
  let isLeech = card.isLeech || false;

  if (totalLapses > 8) {
    isLeech = true;
  }

  return {
    ...card,
    dueDate: log.due.toISOString(),
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: log.scheduled_days,
    reps: log.reps,
    lapses: log.lapses,
    state: log.state,
    last_review: log.last_review ? log.last_review.toISOString() : now.toISOString(),
    first_review: card.first_review || (isNew ? now.toISOString() : undefined),
    status,
    interval: log.scheduled_days,
    learningStep: undefined, // Clean up legacy/custom field
    leechCount: totalLapses,
    isLeech
  };
};

/**
 * Checks if a card is due for review.
 */
export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  const due = new Date(card.dueDate);
  
  if (card.status === 'learning' || card.state === State.Learning || card.state === State.Relearning) {
      return due <= now;
  }

  const srsToday = getSRSDate(now);


  return isBefore(due, srsToday) || due <= now;
};
## features/xp/hooks/useXpSession.ts
import { useState, useCallback, useRef } from 'react';
import { calculateCardXp, CardRating, getDailyStreakMultiplier, XpCalculationResult } from '../xpUtils';

// New type for UI feedback
export interface XpFeedback {
  id: number; // Unique ID to trigger animations
  amount: number;
  message: string;
  isBonus: boolean;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean = false) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);
  
  // Ref to ensure unique IDs for animations
  const feedbackIdRef = useRef(0);

  const multiplierInfo = getDailyStreakMultiplier(dailyStreak);

  const processCardResult = useCallback((rating: CardRating): XpCalculationResult => {
    let newStreak = sessionStreak;
    
    if (rating === 'again') {
      newStreak = 0;
    } else {
      newStreak += 1;
    }
    setSessionStreak(newStreak);

    const result = calculateCardXp(rating, newStreak, dailyStreak, isCramMode);
    setSessionXp(prev => prev + result.totalXp);

    return result; // FIXED: Returning full object instead of just totalXp number
  }, [sessionStreak, dailyStreak, isCramMode]);

  const resetSession = useCallback(() => {
    setSessionXp(0);
    setSessionStreak(0);
    setFeedback(null);
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback, // <--- Expose this
    processCardResult,
    resetSession
  };
};
## features/xp/xpUtils.ts
export type CardRating = 'again' | 'hard' | 'good' | 'easy';

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
  if (days <= 0) return { value: 1.0, label: 'Standard (1.00x)' };

  const rawCurve = Math.tanh(days / XP_CONFIG.ASYMPTOTE_SCALE);
  // Round to exactly 2 decimal places to ensure calculation consistency
  const value = Math.round((1 + rawCurve) * 100) / 100;

  let tier = 'Rookie';
  if (value >= 1.9) tier = 'Godlike';
  else if (value >= 1.75) tier = 'Grandmaster';
  else if (value >= 1.5) tier = 'Master';
  else if (value >= 1.25) tier = 'Elite';
  else if (value >= 1.1) tier = 'Pro';

  return {
    value,
    label: `${tier} (${value.toFixed(2)}x)`
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

/**
 * Calculates the XP reward for a single card interaction.
 * Keeps logic pure so it can run on both client and server.
 */
export const calculateCardXp = (
  rating: CardRating,
  sessionStreak: number,
  dailyStreak: number,
  isCramMode: boolean = false
): XpCalculationResult => {
  if (isCramMode) {
    const cramXp = rating === 'again' ? 0 : XP_CONFIG.CRAM_CORRECT;
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
  
  // Calculation now uses the clean 2-decimal multiplier
  const totalXp = Math.round(preMultiplied * multiplier);

  return {
    baseXp,
    bonusXp,
    multiplier,
    totalXp,
    isStreakBonus: false,
  };
};
## hooks/use-mobile.ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

## hooks/useChartColors.ts
import { useMemo } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';

const getCssVarValue = (name: string) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const normalizeColor = (value: string, fallback: string) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;
  if (/^(#|rgb|hsl)/i.test(candidate)) return candidate;
  if (candidate.includes(' ')) return `hsl(${candidate})`;
  return candidate;
};

export const useChartColors = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();

  return useMemo(() => {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    return {
      primary: normalizeColor(getCssVarValue('--primary'), '#3b82f6'),
      background: normalizeColor(getCssVarValue('--background'), '#ffffff'),
      foreground: normalizeColor(getCssVarValue('--foreground'), '#000000'),
      muted: normalizeColor(getCssVarValue('--muted'), '#e5e7eb'),
      mutedForeground: normalizeColor(getCssVarValue('--muted-foreground'), '#6b7280'),
      border: normalizeColor(getCssVarValue('--border'), '#d1d5db'),
      isDark: theme === 'dark' || (theme === 'system' && prefersDark),
    };
  }, [theme, settings.language, settings.languageColors]);
};
## lib/fsrsOptimizer.ts
import { ReviewLog } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';

// FSRS v4/v5 Constants
const DECAY = -0.5;
const FACTOR = 0.9 ** (1 / DECAY) - 1;

/**
 * Calculates Retrievability (Probability of recall)
 */
const getRetrievability = (elapsedDays: number, stability: number): number => {
  if (stability <= 0) return 0;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

/**
 * Calculates next stability based on current W parameters
 * This mimics the FSRS scheduler logic for "Review" state
 */
const nextStability = (s: number, d: number, r: number, rating: number, w: number[]): number => {
  if (rating === 1) {
    // Forget (Again)
    return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
  }
  
  // Success (Hard, Good, Easy)
  // Hard(2) is handled slightly differently in full FSRS, but for optimization 
  // we often treat 2,3,4 as success with different difficulty updates.
  // Here is the standard "Success" stability update formula:
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  
  return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
};

/**
 * Calculates next difficulty
 */
const nextDifficulty = (d: number, rating: number, w: number[]): number => {
  const nextD = d - w[6] * (rating - 3);
  return Math.min(10, Math.max(1, nextD * (1 - w[7]) + w[4] * w[7])); // Mean Reversion
};

/**
 * Replays history for a single card to compute loss given weights W
 */
const computeCardLoss = (logs: ReviewLog[], w: number[]): number => {
  let loss = 0;
  
  // Initial State
  let s = w[0]; // Default to w[0] for first review if needed, though usually determined by first rating
  let d = w[4]; 

  // We iterate through logs. 
  // Note: logs must be sorted by date.
  for (const log of logs) {
    const { grade, elapsed_days, state } = log;
    
    // 0=New, 1=Learning, 2=Review, 3=Relearning
    // We only optimize based on "Review" logs (state 2) or "Relearning" checks
    // Standard FSRS optimization usually filters out short-term learning steps.
    
    if (state === 0 || state === 1) {
      // Update S/D for the first time based on first rating
      // w[0]=Again, w[1]=Hard, w[2]=Good, w[3]=Easy
      s = w[grade - 1];
      d = w[4] - w[5] * (grade - 3);
      d = Math.max(1, Math.min(10, d));
      continue;
    }

    // Calculate Retrievability at the moment of this review
    const r = getRetrievability(elapsed_days, s);

    // Calculate Loss for this specific review
    // y = 1 if grade > 1 (Pass), y = 0 if grade == 1 (Fail)
    const y = grade > 1 ? 1 : 0;
    
    // Clip p to prevent log(0)
    const p = Math.max(0.0001, Math.min(0.9999, r));
    
    // Log Loss
    loss -= (y * Math.log(p) + (1 - y) * Math.log(1 - p));

    // Update State for next iteration
    if (grade === 1) {
       // Failed
       s = nextStability(s, d, r, 1, w);
       d = nextDifficulty(d, 1, w);
    } else {
       // Passed
       s = nextStability(s, d, r, grade, w);
       d = nextDifficulty(d, grade, w);
    }
  }

  return loss;
};

/**
 * Main Optimizer Function
 */
export const optimizeFSRS = async (
  allLogs: ReviewLog[], 
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {
  
  // 1. Group logs by Card ID
  const cardHistory: Record<string, ReviewLog[]> = {};
  allLogs.forEach(log => {
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

  // We optimize specific parameters to ensure stability
  // w0-w3 (Initial Stability), w8-w10 (Stability Increase), w11-w14 (Forgetting)
  const targetIndices = [0, 1, 2, 3, 8, 9, 10, 11, 12]; 

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(19).fill(0);
    let totalLoss = 0;

    // Mini-batch
    const batch = [];
    for(let i=0; i<batchSize; i++) {
        batch.push(cardGroups[Math.floor(Math.random() * cardGroups.length)]);
    }

    // Finite Difference Method for Gradients
    const h = 0.0001;
    
    // Calculate Base Loss
    for (const logs of batch) {
        totalLoss += computeCardLoss(logs, w);
    }

    // Calculate Gradients per parameter
    for (const idx of targetIndices) {
        const wPlus = [...w];
        wPlus[idx] += h;
        
        let lossPlus = 0;
        for (const logs of batch) {
            lossPlus += computeCardLoss(logs, wPlus);
        }
        
        gradients[idx] = (lossPlus - totalLoss) / h;
    }

    // Apply Gradients
    for (const idx of targetIndices) {
        w[idx] -= learningRate * gradients[idx];
        if (w[idx] < 0.01) w[idx] = 0.01; // Clamp
    }

    if (iter % 20 === 0) {
        onProgress((iter / iterations) * 100);
        await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};

## lib/memeUtils.ts
export const uwuify = (text: string) => {
  return text
    .replace(/r/g, 'w')
    .replace(/R/g, 'W')
    .replace(/l/g, 'w')
    .replace(/L/g, 'W')
    .replace(/ma/g, 'mwa')
    .replace(/mo/g, 'mwo')
    .replace(/\./g, ' UwU.')
    .replace(/!/g, ' >w<');
};

export const FAKE_ANSWERS = [
  'A type of small cheese',
  'The capital of Peru',
  "It means 'To Explode'",
  'Mathematical equation',
  'Just a random noise',
  'Something forbidden',
  'Approximately 42',
  "I don't know either",
  'Your mom',
  'Bitcoin',
];
## lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
## lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export interface FuriganaSegment {
  text: string;
  furigana?: string;
}

export function parseFurigana(text: string): FuriganaSegment[] {
  const regex = /([^\s\[]+)\[([^\]]+)\]/g;
  const segments: FuriganaSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    segments.push({ text: match[1], furigana: match[2] });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
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

## main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
## router.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardRoute } from '@/routes/DashboardRoute';
import { StudyRoute } from '@/routes/StudyRoute';
import { CardsRoute } from '@/routes/CardsRoute';
import { Leaderboard } from '@/features/leaderboard/Leaderboard';
import { MultiplayerLobby } from '@/features/multiplayer/MultiplayerLobby';
import { GameArena } from '@/features/multiplayer/GameArena';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/study" element={<StudyRoute />} />
    <Route path="/cards" element={<CardsRoute />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/multiplayer" element={<MultiplayerLobby />} />
    <Route path="/multiplayer/:roomId" element={<GameArena />} />
  </Routes>
);
## routes/CardsRoute.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardHistoryModal } from '@/features/deck/components/CardHistoryModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery } from '@/features/deck/hooks/useCardsQuery';
import { toast } from 'sonner';
import clsx from 'clsx';

export const CardsRoute: React.FC = () => {
  const { settings } = useSettings();
  const { stats } = useDeck();
  const { addCard, addCardsBatch, deleteCard, prioritizeCards } = useCardOperations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const { data, isLoading, isPlaceholderData } = useCardsQuery(page, pageSize, debouncedSearch);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

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
  }, [page, debouncedSearch]);

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setIsAddModalOpen(true);
  };

  const handleViewHistory = (card: Card) => {
    setSelectedCard(card);
    setIsHistoryModalOpen(true);
  };

  const handleToggleSelect = useCallback((id: string, index: number, isShift: boolean) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (isShift && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const idsInRange = cards.slice(start, end + 1).map(c => c.id);
            const shouldSelect = !prev.has(id);
            idsInRange.forEach(rangeId => shouldSelect ? next.add(rangeId) : next.delete(rangeId));
        } else {
            if (next.has(id)) next.delete(id);
            else next.add(id);
            setLastSelectedIndex(index);
        }
        return next;
    });
  }, [cards, lastSelectedIndex]);

  const handleBatchPrioritize = async () => {
    if (selectedIds.size === 0) return;
    await prioritizeCards(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Irreversibly delete ${selectedIds.size} cards?`)) {
        const ids = Array.from(selectedIds);
        for (const id of ids) await deleteCard(id);
        setSelectedIds(new Set());
        toast.success("Deleted selected cards");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-screen w-full bg-background text-foreground animate-in fade-in duration-700">
        
        {/* --- Header: The Command Center --- */}
        <header className="px-6 md:px-12 pt-8 md:pt-12 pb-6 shrink-0 flex flex-col gap-8 bg-background z-20">
            
            {/* Top Row: Title & System Info */}
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                        Index <span className="text-zinc-300 dark:text-zinc-700 font-extralight">/</span> {settings.language}
                    </h1>
                </div>

                {/* Minimalist Data Display */}
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>CNT: <strong className="text-foreground font-medium">{stats.total}</strong></span>
                    <span className="text-zinc-300">|</span>
                    <span>MST: <strong className="text-foreground font-medium">{stats.learned}</strong></span>
                    <span className="text-zinc-300">|</span>
                    <span>ACT: <strong className="text-foreground font-medium">{stats.total - stats.learned}</strong></span>
                </div>
            </div>

            {/* Controls Row: Inputs over Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                {/* Search: Underlined, no box */}
                <div className="relative w-full md:max-w-md group">
                    <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-foreground transition-colors" />
                    <input 
                        type="text"
                        placeholder="FILTER DATABASE..."
                        className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 py-3 pl-6 pr-4 text-sm font-mono outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 placeholder:text-[10px] placeholder:tracking-widest focus:border-foreground transition-colors rounded-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Actions: Text Links */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-end pb-2">
                    <button 
                        onClick={() => setIsGenerateModalOpen(true)} 
                        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Generate
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="text-[10px] font-mono uppercase tracking-widest text-foreground border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
                    >
                        Add Entry
                    </button>
                </div>
            </div>
        </header>

        {/* --- List Header (Sticky) --- */}
        <div className="hidden md:flex items-center px-6 md:px-12 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="w-10"></div> {/* Checkbox spacer */}
            <div className="flex-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400">Content</div>
            <div className="w-32 px-4 text-[9px] font-mono uppercase tracking-widest text-zinc-400">Status</div>
            <div className="w-20 px-4 text-right text-[9px] font-mono uppercase tracking-widest text-zinc-400">Reps</div>
            <div className="w-32 px-4 text-right text-[9px] font-mono uppercase tracking-widest text-zinc-400">Schedule</div>
            <div className="w-12"></div> {/* Action spacer */}
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 min-h-0 flex flex-col relative px-0 md:px-12 bg-background">
             {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 animate-pulse">Loading Index</span>
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
                />
             )}
        </div>

        {/* --- Footer / Pagination --- */}
        <div className="px-6 md:px-12 py-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-background z-10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                {page + 1} <span className="text-zinc-200 dark:text-zinc-700">/</span> {Math.ceil(totalCount / pageSize)}
            </span>
            
            <div className="flex gap-4">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                    Prev
                </button>
                <button
                    onClick={() => {
                        if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                            setPage(p => p + 1);
                        }
                    }}
                    disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>

        {/* --- Floating Action Bar (Batch Operations) --- */}
        <div className={clsx(
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out",
            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}>
            <div className="bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-6 py-3  flex items-center gap-8">
                <span className="text-[10px] font-mono uppercase tracking-widest">
                    {selectedIds.size} Selected
                </span>
                
                <div className="flex items-center gap-6 h-full border-l border-zinc-700 dark:border-zinc-200 pl-6">
                    <button 
                        onClick={handleBatchPrioritize}
                        className="text-[10px] font-mono uppercase tracking-widest hover:text-white dark:hover:text-black transition-colors"
                    >
                        Prioritize
                    </button>
                    <button 
                        onClick={handleBatchDelete}
                        className="text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                    >
                        Delete
                    </button>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </div>

        {/* Global Modals */}
        <AddCardModal 
            isOpen={isAddModalOpen}
            onClose={() => { setIsAddModalOpen(false); setSelectedCard(undefined); }}
            onAdd={(card) => addCard(card)}
            initialCard={selectedCard}
        />
        <GenerateCardsModal 
            isOpen={isGenerateModalOpen}
            onClose={() => setIsGenerateModalOpen(false)}
            onAddCards={(cards) => addCardsBatch(cards)}
        />
        <CardHistoryModal 
            isOpen={isHistoryModalOpen}
            onClose={() => { setIsHistoryModalOpen(false); setSelectedCard(undefined); }}
            card={selectedCard}
        />
    </div>
  );
};
## routes/DashboardRoute.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/services/db/repositories/cardRepository';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  const { data: cards, isLoading: isCardsLoading } = useQuery({
    queryKey: ['dashboardCards', settings.language],
    queryFn: () => getCardsForDashboard(settings.language),
  });

  if (isStatsLoading || isCardsLoading || !dashboardStats || !cards) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Dashboard 
      metrics={dashboardStats.counts}
      forecast={dashboardStats.forecast}
      languageXp={dashboardStats.languageXp}
      stats={stats}
      history={history}
      onStartSession={() => navigate('/study')}
      cards={cards}
    />
  );
};
## routes/StudyRoute.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { isNewCard } from '@/services/studyLimits'; // Import helper
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';
import { useClaimDailyBonusMutation } from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview, canUndo, stats } = useDeck();
  const { updateCard } = useCardOperations();
  const { settings } = useSettings();
  const claimBonus = useClaimDailyBonusMutation();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]); // New State
  const [isLoading, setIsLoading] = useState(true);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await getCramCards(limit, tag, settings.language);
          setSessionCards(cramCards);
          setReserveCards([]);
        } else {
          const due = await getDueCards(new Date(), settings.language);
          const reviewsToday = await getTodayReviewStats(settings.language);
          
          const dailyNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
          const dailyReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;
          

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

              if (hasLimit(dailyReviewLimit) && reviewCount >= dailyReviewLimit) {
                 continue;
              }
              active.push(card);
              if (hasLimit(dailyReviewLimit)) reviewCount++;
            }
          }
          
          setSessionCards(active);
          setReserveCards(reserve);
        }
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === 'known') {
        updateCard(card);
      }
      return;
    }
    updateCard(card);
  };

  const handleRecordReview = (card: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    if (!isCramMode) {
      recordReview(card, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <StudySession 
      dueCards={sessionCards}
      reserveCards={reserveCards} // Pass reserve
      onUpdateCard={handleUpdateCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
    />
  );
};
## services/db/client.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card } from '@/types';

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

const DB_NAME = 'linguaflow-db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<LinguaFlowDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LinguaFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        let cardStore;
        if (!db.objectStoreNames.contains('cards')) {
          cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        } else {
          cardStore = transaction.objectStore('cards');
        }

        if (!cardStore.indexNames.contains('dueDate')) {
          cardStore.createIndex('dueDate', 'dueDate');
        }
        if (!cardStore.indexNames.contains('status')) {
          cardStore.createIndex('status', 'status');
        }
        if (!cardStore.indexNames.contains('last_review')) {
          cardStore.createIndex('last_review', 'last_review');
        }

        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'date' });
        }
      },
    });
  }

  return dbPromise;
};

export const resetDBCache = () => {
  dbPromise = null;
};
## services/db/index.ts
import * as cardRepository from './repositories/cardRepository';
import * as historyRepository from './repositories/historyRepository';
import * as statsRepository from './repositories/statsRepository';

export { getDB, resetDBCache } from './client';

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
## services/db/repositories/cardRepository.ts
import { Card } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { supabase } from '@/lib/supabase';
import { SRS_CONFIG } from '@/constants';

type Language = Card['language'];

const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User not logged in');
  }
  return userId;
};

export const mapToCard = (data: any): Card => ({
  id: data.id,
  targetSentence: data.target_sentence,
  targetWord: data.target_word || undefined,
  nativeTranslation: data.native_translation,
  furigana: data.furigana || undefined,
  notes: data.notes ?? '',
  tags: data.tags ?? undefined,
  language: data.language,
  status: data.status,
  interval: data.interval ?? 0,
  easeFactor: data.ease_factor ?? 2.5,
  dueDate: data.due_date,
  stability: data.stability ?? undefined,
  difficulty: data.difficulty ?? undefined,
  elapsed_days: data.elapsed_days ?? undefined,
  scheduled_days: data.scheduled_days ?? undefined,
  reps: data.reps ?? undefined,
  lapses: data.lapses ?? undefined,
  state: data.state ?? undefined,
  last_review: data.last_review ?? undefined,
  first_review: data.first_review ?? undefined,
  learningStep: data.learning_step ?? undefined,
  leechCount: data.leech_count ?? undefined,
  isLeech: data.is_leech ?? false,
});

const mapToDB = (card: Card, userId: string) => ({
  id: card.id,
  user_id: userId,
  target_sentence: card.targetSentence,
  target_word: card.targetWord ?? null,
  native_translation: card.nativeTranslation,
  furigana: card.furigana ?? null,
  notes: card.notes ?? '',
  language: card.language || 'polish',
  status: card.status,
  interval: card.interval ?? 0,
  ease_factor: card.easeFactor ?? 2.5,
  due_date: card.dueDate,
  stability: card.stability ?? 0,
  difficulty: card.difficulty ?? 0,
  elapsed_days: card.elapsed_days ?? 0,
  scheduled_days: card.scheduled_days ?? 0,
  reps: card.reps ?? 0,
  lapses: card.lapses ?? 0,
  state: card.state ?? null,
  last_review: card.last_review ?? null,
  first_review: card.first_review ?? null,
  learning_step: card.learningStep ?? null,
  leech_count: card.leechCount ?? 0,
  is_leech: card.isLeech ?? false,
  tags: card.tags ?? null,
});

export const getCards = async (): Promise<Card[]> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getAllCardsByLanguage = async (language: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getCardsForRetention = async (language: Language): Promise<Partial<Card>[]> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('id, due_date, status, stability, state')
    .eq('user_id', userId)
    .eq('language', language)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Partial<Card>[];
};


export const getCardsForDashboard = async (language: Language): Promise<Array<{ id: string; due_date: string | null; status: string; stability: number | null; state: number | null }>> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('id, due_date, status, stability, state')
    .eq('user_id', userId)
    .eq('language', language)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; due_date: string | null; status: string; stability: number | null; state: number | null }>;
};

export const saveCard = async (card: Card) => {
  const userId = await ensureUser();
  const payload = mapToDB(card, userId);
  const { error } = await supabase.from('cards').upsert(payload);
  if (error) throw error;
};

export const deleteCard = async (id: string) => {
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) throw error;
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;
  const userId = await ensureUser();
  const payload = cards.map((card) => mapToDB(card, userId));

  const BATCH_SIZE = 100;
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const chunk = payload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('cards').upsert(chunk);
    if (error) throw error;
  }
};

export const clearAllCards = async () => {
  const userId = await ensureUser();
  const { error } = await supabase.from('cards').delete().eq('user_id', userId);
  if (error) throw error;
};

export const getDueCards = async (now: Date, language: Language): Promise<Card[]> => {
  const userId = await ensureUser();
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .neq('status', 'known')
    .lte('due_date', cutoffDate.toISOString())
    .order('due_date', { ascending: true })
    .limit(1000);

  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  const userId = await ensureUser();

  const { data, error } = await supabase.rpc('get_random_cards', {
    p_user_id: userId,
    p_language: language || 'polish',
    p_limit: limit,
    p_tag: tag || null,
  });
  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const deleteCardsByLanguage = async (language: Language) => {
  const userId = await ensureUser();
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('language', language)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getCardSignatures = async (language: Language): Promise<Array<{ target_sentence: string; language: string }>> => {
  const userId = await ensureUser();
  const { data, error } = await supabase
    .from('cards')
    .select('target_sentence, language')
    .eq('user_id', userId)
    .eq('language', language);

  if (error) throw error;
  return data ?? [];
};

export const getTags = async (language?: Language): Promise<string[]> => {
  const userId = await ensureUser();
  let query = supabase.from('cards').select('tags').eq('user_id', userId);
  
  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const uniqueTags = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.tags) {
      row.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};
## services/db/repositories/historyRepository.ts
import { supabase } from '@/lib/supabase';
import { ReviewHistory } from '@/types';

type Language = keyof ReviewHistory | string;

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  let query = supabase
    .from('study_history')
    .select('date, count, language')
    .eq('user_id', user.id);

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to fetch history', error);
    return {};
  }

  return (data || []).reduce<ReviewHistory>((acc, entry) => {
    acc[entry.date] = (acc[entry.date] || 0) + entry.count;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = 'polish'
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.rpc('increment_study_history', { 
    p_user_id: user.id, 
    p_date: date, 
    p_language: language, 
    p_delta: delta 
  });
  
  if (error) console.error('Failed to sync history', error);
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = 'polish') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const entries = Object.entries(history).map(([date, count]) => ({
    user_id: user.id,
    date,
    language,
    count
  }));

  if (entries.length === 0) return;

  const { error } = await supabase
    .from('study_history')
    .upsert(entries, { onConflict: 'user_id, date, language' });

  if (error) {
    console.error('Failed to save full history', error);
    throw error;
  }
};

export const clearHistory = async (language?: Language) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let query = supabase
    .from('study_history')
    .delete()
    .eq('user_id', user.id);

  if (language) {
    query = query.eq('language', language);
  }

  const { error } = await query;

  if (error) {
    console.error('Failed to clear history', error);
    throw error;
  }
};
## services/db/repositories/revlogRepository.ts
import { supabase } from '@/lib/supabase';
import { ReviewLog, Card, Grade } from '@/types';
import { State } from 'ts-fsrs';

const mapGradeToNumber = (grade: Grade): number => {
  switch (grade) {
    case 'Again': return 1;
    case 'Hard': return 2;
    case 'Good': return 3;
    case 'Easy': return 4;
  }
};

export const addReviewLog = async (
  card: Card, 
  grade: Grade, 
  elapsedDays: number,
  scheduledDays: number
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('revlog').insert({
    user_id: user.id,
    card_id: card.id,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New, // State BEFORE review
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  });

  if (error) console.error('Failed to log review:', error);
};

export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // We need to filter by language. 
  // Since revlog doesn't have a language column (normalization), 
  // we join with cards.
  
  let query = supabase
    .from('revlog')
    .select('*, cards!inner(language)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }); // Time-series order is crucial

  if (language) {
    query = query.eq('cards.language', language);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data as unknown as ReviewLog[];
};

## services/db/repositories/settingsRepository.ts
import { supabase } from '@/lib/supabase';

export interface UserSettingsDB {
    id: string;
    user_id: string;
    gemini_api_key: string | null;
    google_tts_api_key: string | null;
    azure_tts_api_key: string | null;
    azure_region: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

/**
 * Fetch user settings (API keys) from the database
 */
export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no settings found, return null (will be created on first save)
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return {
            geminiApiKey: data.gemini_api_key || undefined,
            googleTtsApiKey: data.google_tts_api_key || undefined,
            azureTtsApiKey: data.azure_tts_api_key || undefined,
            azureRegion: data.azure_region || undefined,
        };
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        throw error;
    }
}

/**
 * Update or insert user settings (API keys) in the database
 */
export async function updateUserSettings(userId: string, settings: UserApiKeys): Promise<void> {
    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                gemini_api_key: settings.geminiApiKey || null,
                google_tts_api_key: settings.googleTtsApiKey || null,
                azure_tts_api_key: settings.azureTtsApiKey || null,
                azure_region: settings.azureRegion || null,
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

/**
 * One-time migration: Move API keys from localStorage to database
 */
export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    try {
        // Check if already migrated
        const migrationFlag = localStorage.getItem('api_keys_migrated');
        if (migrationFlag === 'true') {
            return false; // Already migrated
        }

        // Get settings from localStorage
        const localSettingsStr = localStorage.getItem('language_mining_settings');
        if (!localSettingsStr) {
            localStorage.setItem('api_keys_migrated', 'true');
            return false; // Nothing to migrate
        }

        const localSettings = JSON.parse(localSettingsStr);

        // Extract API keys
        const apiKeys: UserApiKeys = {
            geminiApiKey: localSettings.geminiApiKey || undefined,
            googleTtsApiKey: localSettings.tts?.googleApiKey || undefined,
            azureTtsApiKey: localSettings.tts?.azureApiKey || undefined,
            azureRegion: localSettings.tts?.azureRegion || undefined,
        };

        // Only migrate if there are actual API keys to migrate
        const hasKeys = apiKeys.geminiApiKey || apiKeys.googleTtsApiKey || apiKeys.azureTtsApiKey;

        if (hasKeys) {
            await updateUserSettings(userId, apiKeys);
            localStorage.setItem('api_keys_migrated', 'true');
            return true; // Migration performed
        } else {
            localStorage.setItem('api_keys_migrated', 'true');
            return false; // No keys to migrate
        }
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
}

## services/db/repositories/statsRepository.ts
import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { supabase } from '@/lib/supabase';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, isSameDay } from 'date-fns';

const ensureUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User not logged in');
  }
  return userId;
};

export const getDashboardStats = async (language?: string) => {
  const userId = await ensureUser();
  // Added 'interval' to the selection
  let query = supabase
    .from('cards')
    .select('status, due_date, interval')
    .eq('user_id', userId);

  if (language) {
    query = query.eq('language', language);
  }

  const { data: cardsData, error: cardsError } = await query;
  if (cardsError) throw cardsError;

  const cards = cardsData ?? [];

  let languageXp = 0;
  if (language) {
    const { data: xpData, error: xpError } = await supabase.rpc('get_user_language_xp', {
      target_language: language
    });
    if (!xpError && typeof xpData === 'number') {
      languageXp = xpData;
    }
  }

  // New Bucketing Logic
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  
  cards.forEach((c: any) => {
    // 1. Unseen: Not yet reviewed
    if (c.status === 'new') {
      counts.new++;
      return;
    }

    // 2. Explicitly Known (Manually archived)
    if (c.status === 'known') {
      counts.known++;
      return;
    }

    // 3. Bucket by Interval
    const interval = c.interval || 0;

    if (interval < 30) {
      // Learning: < 30 days
      counts.learning++;
    } else if (interval < 180) {
      // Mature: 30 - 180 days
      // We map this to 'graduated' key which corresponds to 'Mature' label in UI
      counts.graduated++;
    } else {
      // Known: > 180 days
      counts.known++;
    }
  });

  const daysToShow = 14;
  const today = new Date();
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  cards.forEach((card: any) => {
    if (card.status === 'known' || card.status === 'new') return;
    const dueDate = parseISO(card.due_date);
    const diff = differenceInCalendarDays(dueDate, today);
    if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
  });

  return { counts, forecast, languageXp };
};

export const getStats = async (language?: string) => {
  const userId = await ensureUser();
  let query = supabase
    .from('cards')
    .select('status, due_date, language')
    .eq('user_id', userId);

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cards = data ?? [];
  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const due = cards.filter(
    (card) => card.status !== 'known' && card.due_date <= cutoffDate.toISOString()
  ).length;
  const learned = cards.filter((card) => card.status === 'graduated' || card.status === 'known').length;

  return { total: cards.length, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const userId = await ensureUser();
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);

  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  let query = supabase
    .from('activity_log')
    .select('activity_type, language')
    .eq('user_id', userId)
    .gte('created_at', rangeStart.toISOString())
    .lt('created_at', rangeEnd.toISOString());

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  let newCards = 0;
  let reviewCards = 0;

  (data ?? []).forEach((entry) => {
    if (entry.activity_type === 'new_card') {
      newCards++;
    } else {
      reviewCards++;
    }
  });

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const userId = await ensureUser();
  const startDate = subDays(new Date(), days).toISOString();

  // Join with cards to filter by language
  const { data: logs, error } = await supabase
    .from('revlog')
    .select('created_at, grade, cards!inner(language)')
    .eq('user_id', userId)
    .eq('cards.language', language)
    .gte('created_at', startDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Process Data for Charts
  const activityMap = new Map<string, { date: string; count: number; pass: number; fail: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };
  
  // Initialize last 30 days with 0
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    activityMap.set(key, { 
      date: key, 
      count: 0, 
      pass: 0, 
      fail: 0 
    });
  }

  logs.forEach((log: any) => {
    const dayKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    const entry = activityMap.get(dayKey);
    
    if (entry) {
      entry.count++;
      // Grade 1 = Fail, 2,3,4 = Pass
      if (log.grade === 1) entry.fail++;
      else entry.pass++;
    }

    if (log.grade === 1) gradeCounts.Again++;
    else if (log.grade === 2) gradeCounts.Hard++;
    else if (log.grade === 3) gradeCounts.Good++;
    else if (log.grade === 4) gradeCounts.Easy++;
  });

  // Sort by date ascending
  const activityData = Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate Retention Rate
  const retentionData = activityData.map(day => ({
    date: format(new Date(day.date), 'MMM d'),
    rate: day.count > 0 ? (day.pass / day.count) * 100 : null
  }));

  return {
    activity: activityData.map(d => ({ ...d, label: format(new Date(d.date), 'dd') })),
    grades: [
      { name: 'Again', value: gradeCounts.Again, color: '#ef4444' }, // red-500
      { name: 'Hard', value: gradeCounts.Hard, color: '#f97316' },  // orange-500
      { name: 'Good', value: gradeCounts.Good, color: '#22c55e' },  // green-500
      { name: 'Easy', value: gradeCounts.Easy, color: '#3b82f6' },  // blue-500
    ],
    retention: retentionData
  };
};
## services/multiplayer.ts
import { supabase } from '@/lib/supabase';
import { aiService } from '@/features/deck/services/ai';
import type { GameQuestion } from '@/types/multiplayer';

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const multiplayerService = {
  async createRoom(hostId: string, username: string, language: string, level: string, timerDuration: number, maxPlayers: number) {
    const code = generateRoomCode();

    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({ 
        code, 
        host_id: hostId, 
        language, 
        level,
        timer_duration: timerDuration,
        max_players: maxPlayers
      })
      .select('*')
      .single();

    if (error || !room) {
      throw error ?? new Error('Failed to create room');
    }

    await this.joinRoom(room.id, hostId, username);
    return room;
  },

  async joinRoom(roomId: string, userId: string, username: string) {
    const { error } = await supabase
      .from('game_players')
      .insert({ room_id: roomId, user_id: userId, username });

    if (error && error.code !== '23505') {
      throw error;
    }
  },

  async generateQuestions(language: string, level: string, count = 10, apiKey?: string): Promise<GameQuestion[]> {
    const prompt = `
      Generate ${count} multiple-choice quiz questions for ${language} learners at ${level} level.
      Return a JSON ARRAY of objects. Each object must have:
      - question: A sentence in ${language} with a missing word (use ____ for blanks) or a word to translate.
      - correctAnswer: The correct answer.
      - options: An array of 4 plausible answers including the correct one.
    `;

    return await aiService.generateQuiz(prompt, apiKey ?? localStorage.getItem('gemini_api_key') ?? '');
  },

  async startGame(roomId: string, questions: GameQuestion[]) {
    await supabase
      .from('game_rooms')
      .update({ status: 'playing', questions, current_question_index: 0 })
      .eq('id', roomId);
  },

  async updateScore(playerId: string, newScore: number) {
    await supabase
      .from('game_players')
      .update({ score: newScore })
      .eq('id', playerId);
  },

  async nextQuestion(roomId: string, nextIndex: number) {
    await supabase
      .from('game_rooms')
      .update({ current_question_index: nextIndex })
      .eq('id', roomId);
  },

  async endGame(roomId: string) {
    await supabase
      .from('game_rooms')
      .update({ status: 'finished' })
      .eq('id', roomId);
  }
};

## services/studyLimits.ts
import { Card, UserSettings } from '../types';
import { State } from 'ts-fsrs';

interface LimitOptions {
  dailyNewLimit?: number;
  dailyReviewLimit?: number;
  reviewsToday?: {
    newCards: number;
    reviewCards: number;
  };
}

export const isNewCard = (card: Card) => {

  if (card.status === 'new') return true;



  if (card.state !== undefined) {
    return card.state === State.New;
  }

  return (card.reps || 0) === 0;
};

const hasLimit = (value?: number) => typeof value === 'number' && value > 0;

export const applyStudyLimits = (cards: Card[], settings: LimitOptions): Card[] => {
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
## services/tts/index.ts
import { Language, TTSSettings, TTSProvider } from "@/types";
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja'],
    spanish: ['es-ES', 'es-MX', 'es']
};

export interface VoiceOption {
    id: string;
    name: string;
    lang: string;
    provider: TTSProvider;
}

class TTSService {
    private browserVoices: SpeechSynthesisVoice[] = [];
    private audioContext: AudioContext | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentOperationId = 0;
    private abortController: AbortController | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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

    async getAvailableVoices(language: Language, settings: TTSSettings): Promise<VoiceOption[]> {
        const validCodes = LANG_CODE_MAP[language];
        
        // NATIVE: Plugin handles voices differently, usually we just let OS pick default for locale
        // but we can query if needed. For now, we return browser voices for UI consistency
        // or empty if strictly native.
        if (Capacitor.isNativePlatform() && settings.provider === 'browser') {
             try {
                const { languages } = await TextToSpeech.getSupportedLanguages();
                // We just return a generic "System Voice" for the native side to avoid UI confusion
                // as mapping native voice IDs to the dropdown is complex across iOS/Android
                return [{
                    id: 'default',
                    name: 'System Default',
                    lang: validCodes[0],
                    provider: 'browser'
                }];
             } catch (e) {
                 return [];
             }
        }

        if (settings.provider === 'browser') {
            return this.browserVoices
                .filter(v => validCodes.some(code => v.lang.toLowerCase().startsWith(code.toLowerCase())))
                .map(v => ({
                    id: v.voiceURI,
                    name: v.name,
                    lang: v.lang,
                    provider: 'browser'
                }));
        }

        // ... Google / Azure logic remains the same ...
        if (settings.provider === 'google' && settings.googleApiKey) {
            try {
                const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${settings.googleApiKey}`);
                const data = await response.json();
                if (data.voices) {
                    return data.voices
                        .filter((v: any) => validCodes.some(code => v.languageCodes.some((lc: string) => lc.toLowerCase().startsWith(code.toLowerCase()))))
                        .map((v: any) => ({
                            id: v.name,
                            name: `${v.name} (${v.ssmlGender})`,
                            lang: v.languageCodes[0],
                            provider: 'google'
                        }));
                }
            } catch (e) {
                console.error("Failed to fetch Google voices", e);
            }
        }

        if (settings.provider === 'azure' && settings.azureApiKey && settings.azureRegion) {
            try {
                const response = await fetch(`https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
                    headers: {
                        'Ocp-Apim-Subscription-Key': settings.azureApiKey
                    }
                });
                const data = await response.json();
                return data
                    .filter((v: any) => validCodes.some(code => v.Locale.toLowerCase().startsWith(code.toLowerCase())))
                    .map((v: any) => ({
                        id: v.ShortName,
                        name: `${v.LocalName} (${v.ShortName})`,
                        lang: v.Locale,
                        provider: 'azure'
                    }));
            } catch (e) {
                console.error("Failed to fetch Azure voices", e);
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

        if (settings.provider === 'browser') {
            await this.speakBrowser(text, language, settings);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings, opId);
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings, opId);
        }
    }

    private async speakBrowser(text: string, language: Language, settings: TTSSettings) {
        // --- NATIVE MOBILE FIX ---
        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.speak({
                    text,
                    lang: LANG_CODE_MAP[language][0], // e.g. 'pl-PL'
                    rate: settings.rate,
                    pitch: settings.pitch,
                    volume: settings.volume,
                    category: 'ambient',
                });
            } catch (e) {
                console.error("Native TTS failed", e);
            }
            return;
        }
        // -------------------------

        // Web Fallback
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_CODE_MAP[language][0];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        if (settings.voiceURI && settings.voiceURI !== 'default') {
            const selectedVoice = this.browserVoices.find(v => v.voiceURI === settings.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        } 

        window.speechSynthesis.speak(utterance);
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings, opId: number) {
        try {
            // Prepare the payload matching what Google expects
            const payload = {
                text,
                apiKey: settings.googleApiKey, // If undefined, backend uses Deno.env.get('GOOGLE_TTS_API_KEY')
                voice: settings.voiceURI 
                    ? { name: settings.voiceURI, languageCode: LANG_CODE_MAP[language][0] } 
                    : { languageCode: LANG_CODE_MAP[language][0] },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: settings.rate,
                    pitch: (settings.pitch - 1) * 20,
                    volumeGainDb: (settings.volume - 1) * 16
                }
            };

            // Call Supabase Edge Function instead of direct fetch
            const { data, error } = await supabase.functions.invoke('text-to-speech', {
                body: payload
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            if (this.currentOperationId !== opId) return;
            
            if (data.audioContent) {
                this.playAudioContent(data.audioContent, opId);
            }
        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Google TTS error", e);
            toast.error(`Google TTS Error: ${e.message}`);
        }
    }

    private async speakAzure(text: string, language: Language, settings: TTSSettings, opId: number) {
        if (!settings.azureApiKey || !settings.azureRegion) return;

        try {
            const voiceName = settings.voiceURI || 'en-US-JennyNeural'; 
            
            const ssml = `
                <speak version='1.0' xml:lang='${LANG_CODE_MAP[language][0]}'>
                    <voice xml:lang='${LANG_CODE_MAP[language][0]}' xml:gender='Female' name='${voiceName}'>
                        <prosody rate='${settings.rate}' pitch='${(settings.pitch - 1) * 50}%' volume='${settings.volume * 100}'>
                            ${text}
                        </prosody>
                    </voice>
                </speak>
            `;

            const response = await fetch(`https://${settings.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': settings.azureApiKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'User-Agent': 'LinguaFlow'
                },
                signal: this.abortController?.signal,
                body: ssml
            });

            if (!response.ok) throw new Error(await response.text());
            if (this.currentOperationId !== opId) return;

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            this.playAudioBuffer(arrayBuffer, opId);

        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Azure TTS error", e);
        }
    }

    private playAudioContent(base64Audio: string, opId: number) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        this.playAudioBuffer(bytes.buffer, opId);
    }

    private async playAudioBuffer(buffer: ArrayBuffer, opId: number) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        try {
            const decodedBuffer = await this.audioContext.decodeAudioData(buffer);
            if (this.currentOperationId !== opId) return;

            if (this.currentSource) {
                this.currentSource.stop();
            }
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(this.audioContext.destination);
            this.currentSource.onended = () => {
                if (this.audioContext && this.audioContext.state === 'running') {
                    this.audioContext.suspend().catch(() => {});
                }
            };

            if (this.audioContext.state === 'suspended') {
                try { await this.audioContext.resume(); } catch {}
            }
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

        // Native Stop
        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.stop();
            } catch (e) {}
        }

        // Web Stop
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(() => {});
        }
    }
}

export const ttsService = new TTSService();
## supabase/functions/generate-card/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    let prompt, userApiKey;
    try {
      const body = await req.json();
      prompt = body.prompt;
      userApiKey = body.apiKey;
    } catch (e) {
      throw new Error("Invalid JSON body");
    }


    const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Gemini API Key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini API Error:', data)
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Gemini API Error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {

    console.error('Function Crash:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
## types/index.ts
import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Omit<Partial<FSRSCard>, 'due' | 'last_review'> {
  id: string;
  targetSentence: string; // "Ten samochód jest szybki"
  targetWord?: string; // Optional: "samochód". If empty, whole sentence is the target.
  nativeTranslation: string; // "This car is fast"
  furigana?: string; // Optional: Furigana for Japanese text (e.g., "私[わたし]は...")
  notes: string; // "Masc. sing. nominative"
  tags?: string[]; // Optional tags for filtering
  language?: Language; // 'polish' | 'norwegian' | 'japanese'
  status: CardStatus;


  interval: number; // Days
  easeFactor: number; // Default 2.5
  dueDate: string; // ISO Date string


  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: FSRSState;
  due?: string; // ISO Date string (overrides FSRSCard's Date type)
  last_review?: string; // ISO Date string (overrides FSRSCard's Date type)
  first_review?: string; // ISO Date string
  learningStep?: number; // 1 = waiting for 10m review
  leechCount?: number; // Number of times answered "Again" consecutively or totally (depending on logic)
  isLeech?: boolean; // Flag for leech status
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

export type ReviewHistory = Record<string, number>; // 'YYYY-MM-DD': count

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

export type Language = 'polish' | 'norwegian' | 'japanese' | 'spanish';

export type TTSProvider = 'browser' | 'google' | 'azure';

export interface TTSSettings {
  provider: TTSProvider;
  voiceURI: string | null;
  volume: number; // 0 to 1
  rate: number; // 0.5 to 2
  pitch: number; // 0 to 2
  googleApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export interface UserSettings {
  language: Language;
  languageColors?: Record<Language, string>; // HSL values e.g. "346 84% 45%"

  dailyNewLimits: Record<Language, number>;
  dailyReviewLimits: Record<Language, number>;
  autoPlayAudio: boolean;
  blindMode: boolean; // New: Play audio before showing text
  showTranslationAfterFlip: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  binaryRatingMode: boolean; // Pass/Fail only (Again vs Good)
  cardOrder: 'newFirst' | 'reviewFirst' | 'mixed'; // Preference for card ordering
  tts: TTSSettings;
  fsrs: {
    request_retention: number; // 0.8 to 0.99
    maximum_interval: number; // Days
    w?: number[]; // Weights
    enable_fuzzing?: boolean;
  }
  geminiApiKey: string; // Gemini API key for client-side AI calls
}

export interface ReviewLog {
  id: string;
  card_id: string;
  grade: number; // 1 | 2 | 3 | 4
  state: number; // 0 | 1 | 2 | 3
  elapsed_days: number;
  scheduled_days: number;
  stability: number;
  difficulty: number;
  created_at: string;
}
## types/multiplayer.ts
export type GameStatus = 'waiting' | 'playing' | 'finished';

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

## vite-env.d.ts


declare const __APP_VERSION__: string;
## vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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

if (typeof window !== 'undefined') {
  const globalWindow = window as SpeechWindow;
  const speechSynthesisMock = {
    getVoices: vi.fn(() => []),
    speak: vi.fn(),
    cancel: vi.fn(),
    onvoiceschanged: null as SpeechSynthesis['onvoiceschanged'],
  };

  Object.defineProperty(globalWindow, 'speechSynthesis', {
    value: speechSynthesisMock,
    writable: true,
  });

  if (!globalWindow.SpeechSynthesisUtterance) {
    globalWindow.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
  }

  Object.defineProperty(globalWindow, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}