
## App.tsx
import React from 'react';
import { AppProviders } from '@/app/AppProviders';
import { AppRouter } from '@/app/AppRouter';
import { usePlatformSetup } from '@/hooks/usePlatformSetup';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/features/auth/AuthPage';
import { UsernameSetup } from '@/features/auth/UsernameSetup';
import { OnboardingFlow } from '@/features/auth/OnboardingFlow';

const AppContent: React.FC = () => {
  usePlatformSetup();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const loading = authLoading || profileLoading;

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

  return <AppRouter />;
};

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;


## app/AppProviders.tsx
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

## app/AppRouter.tsx
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';

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
import { useSettingsStore } from '@/stores/useSettingsStore';

const STYLE_TAG_ID = 'custom-language-theme';

export const LanguageThemeManager: React.FC = () => {
  const settings = useSettingsStore(s => s.settings);

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
      if (!/^[0-9\s.%]+$/.test(customColor)) {
        styleTag.innerHTML = '';
        return;
      }
      const [h, s, l] = customColor.split(' ').map(v => parseFloat(v));
      const normalizedH = Number.isNaN(h) ? 0 : h;
      const normalizedS = Number.isNaN(s) ? 100 : s;
      const normalizedL = Number.isNaN(l) ? 50 : l;
      const darkL = normalizedL < 50 ? Math.min(normalizedL + 30, 90) : Math.max(normalizedL - 10, 60);
      const darkColor = `${normalizedH} ${normalizedS}% ${darkL}%`;

      styleTag.innerHTML = `
        :root[data-language="${settings.language}"] {
          --primary: hsl(${customColor});
          --ring: hsl(${customColor});
        }
        :root[data-language="${settings.language}"].dark {
          --primary: hsl(${darkColor});
          --ring: hsl(${darkColor});
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

## components/game/CardDistributionBar.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardDistributionBarProps {
    segments: { label: string; value: number; color: string }[]
    total: number
    className?: string
}

export function CardDistributionBar({ segments, total, className }: CardDistributionBarProps) {
    if (total === 0) return null

    return (
        <div className={cn("space-y-3", className)}>
            {/* Bar */}
            <div className="relative h-2.5 bg-muted/30 border border-border/30 overflow-hidden flex">
                {segments.map((segment, i) => {
                    const width = (segment.value / total) * 100
                    if (width === 0) return null
                    return (
                        <div
                            key={i}
                            className={cn("h-full transition-all duration-500", segment.color)}
                            style={{ width: `${width}%` }}
                        />
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {segments.map((segment, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rotate-45", segment.color)} />
                        <span className="text-[10px] text-muted-foreground font-semibold font-ui uppercase tracking-wide">
                            {segment.label}
                        </span>
                        <span className="text-[11px] text-foreground/80 tabular-nums font-semibold font-ui">
                            {segment.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

## components/game/CircularProgress.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface CircularProgressProps {
    value: number
    max: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    label?: string
    className?: string
}

export function CircularProgress({
    value,
    max,
    size = 'lg',
    showLabel = true,
    label,
    className
}: CircularProgressProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0
    const isComplete = value === 0 && max === 0

    const sizeConfig = {
        sm: { size: 80, stroke: 4, textSize: 'text-xl', innerOffset: 8 },
        md: { size: 120, stroke: 5, textSize: 'text-3xl', innerOffset: 12 },
        lg: { size: 160, stroke: 6, textSize: 'text-5xl', innerOffset: 16 }
    }

    const config = sizeConfig[size]
    const radius = (config.size - config.stroke * 2) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg
                width={config.size}
                height={config.size}
                className="-rotate-90"
            >
                {/* Background ring */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    className="text-border/30"
                />

                {/* Progress ring */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    strokeLinecap="square"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                        "transition-all duration-500",
                        isComplete ? "text-pine-500" : "text-amber-500"
                    )}
                />

                {/* Cardinal point markers */}
                {[0, 90, 180, 270].map((angle) => {
                    const radian = (angle * Math.PI) / 180
                    const x = config.size / 2 + (radius + 8) * Math.cos(radian - Math.PI / 2)
                    const y = config.size / 2 + (radius + 8) * Math.sin(radian - Math.PI / 2)
                    return (
                        <rect
                            key={angle}
                            x={x - 2}
                            y={y - 2}
                            width={4}
                            height={4}
                            fill="currentColor"
                            className="text-amber-500/40"
                            transform={`rotate(45 ${x} ${y})`}
                        />
                    )
                })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(config.textSize, "font-bold text-foreground tabular-nums")}>
                    {value}
                </span>
                {showLabel && (
                    <span className="text-xs text-muted-foreground font-medium mt-1">
                        {label || (isComplete ? 'Complete' : `of ${max}`)}
                    </span>
                )}
            </div>
        </div>
    )
}

## components/game/GameButton.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

export function GameButton({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}: GameButtonProps) {
    return (
        <button
            className={cn(
                "relative group/btn inline-flex items-center justify-center gap-2",
                "font-ui font-semibold uppercase tracking-[0.15em]",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",

                size === 'sm' && "h-9 px-5 text-[10px]",
                size === 'md' && "h-11 px-7 text-xs",
                size === 'lg' && "h-13 px-9 text-sm",

                variant === 'primary' && [
                    "bg-amber-600/10 text-amber-950",
                    "hover:bg-amber-600/20 active:bg-amber-600",
                    "border-2 border-amber-700/50",
                ],
                variant === 'secondary' && [
                    "bg-card text-foreground",
                    "hover:bg-muted/50 active:bg-muted",
                    "border border-border",
                ],
                variant === 'ghost' && [
                    "bg-transparent text-muted-foreground",
                    "hover:text-foreground hover:bg-muted/30",
                    "border border-transparent hover:border-border/50"
                ],

                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}

## components/game/GameDivider.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export function GameDivider({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 my-6", className)}>
            <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
            <span className="flex-1 h-px bg-border/50" />
            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
            <span className="flex-1 h-px bg-border/50" />
            <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
        </div>
    )
}

## components/game/GameEmptyState.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { GamePanel } from "./GamePanel"
import { GameButton } from "./GameButton"

export interface GameEmptyStateProps {
    icon: React.ElementType
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function GameEmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: GameEmptyStateProps) {
    return (
        <GamePanel className={cn("relative overflow-hidden", className)}>
            {/* Subtle diamond pattern background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L22 2L20 4L18 2Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative p-10 md:p-14 flex flex-col items-center justify-center text-center">
                {/* Icon container with ornate frame */}
                <div className="relative mb-6">
                    {/* Outer rotating frame */}
                    <div className="w-24 h-24 border-2 border-amber-700/20 rotate-45 flex items-center justify-center">
                        {/* Inner frame */}
                        <div className="w-16 h-16 border border-border/60 -rotate-45 flex items-center justify-center bg-card">
                            <Icon className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Corner accents */}
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2.5 font-ui tracking-wide uppercase">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground/70 font-medium max-w-64 mb-6">
                    {description}
                </p>

                {action && (
                    <GameButton
                        variant="secondary"
                        size="sm"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </GameButton>
                )}
            </div>
        </GamePanel>
    )
}

## components/game/GameInput.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export function GameInput({
    label,
    error,
    icon,
    className,
    ...props
}: GameInputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-medium text-muted-foreground font-ui uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group/input">
                <input
                    className={cn(
                        "w-full h-11 bg-card border-2 border-border/50 text-foreground px-4",
                        "font-ui text-sm placeholder:text-muted-foreground/50",
                        "transition-all duration-200",
                        "focus:border-amber-600/50 focus:bg-amber-600/5 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        icon && "pl-11",
                        error && "border-rose-500/50 focus:border-rose-500/50 bg-rose-500/5",
                        className
                    )}
                    {...props}
                />

                {/* Icon */}
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-amber-500 transition-colors">
                        {icon}
                    </div>
                )}

                {/* Corner accents on focus */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-200">
                    <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-amber-500" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-amber-500" />
                    <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-amber-500" />
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-amber-500" />
                </div>
            </div>
            {error && (
                <p className="text-[10px] text-rose-500 font-medium ml-1">{error}</p>
            )}
        </div>
    )
}

## components/game/GameMetricRow.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameMetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ReactNode
    label: string
    value: string | number
    unit?: string
}

export function GameMetricRow({
    icon,
    label,
    value,
    unit,
    className,
    ...props
}: GameMetricRowProps) {
    return (
        <div
            className={cn(
                "group/metric relative",
                "bg-card/60 border border-border/40 p-4",
                "flex items-center justify-between",
                "hover:border-amber-700/30 transition-colors duration-150",
                className
            )}
            {...props}
        >
            {/* Left accent line */}
            <span className={cn(
                "absolute left-0 top-2 bottom-2 w-0.5",
                "bg-amber-600/30 group-hover/metric:bg-amber-600/60",
                "transition-colors duration-150"
            )} />

            {/* Label side */}
            <div className="flex items-center gap-3 pl-3">
                <span className="text-amber-500/70">{icon}</span>
                <span className="text-sm text-muted-foreground font-medium font-ui">
                    {label}
                </span>
            </div>

            {/* Value side */}
            <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-foreground tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {unit && (
                    <span className="text-xs text-muted-foreground/70 font-medium">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}

## components/game/GamePanel.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { GenshinCorner, GenshinCorners } from "./decorative"

// Re-export decorative components for backwards compatibility
export { GenshinCorner, GenshinCorners } from "./decorative"
export { DiamondDivider, CornerAccents, DiamondMarker, InnerFrame } from "./decorative"

export interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'highlight' | 'stat' | 'ornate'
    size?: 'sm' | 'md' | 'lg'
    showCorners?: boolean
    glowOnHover?: boolean
}

export function GamePanel({
    className,
    variant = 'default',
    size = 'md',
    showCorners = false,
    glowOnHover = false,
    children,
    ...props
}: GamePanelProps) {
    const isInteractive = !!props.onClick

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (props.onKeyDown) {
            props.onKeyDown(e)
        }

        if (!isInteractive) return

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            props.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
    }

    return (
        <div
            {...props}
            className={cn(
                "relative group/panel",
                "bg-card",

                variant === 'default' && "border-2 border-amber-700/20 dark:border-amber-700/25",
                variant === 'highlight' && "border-2 border-amber-700/40 dark:border-amber-400/35",
                variant === 'stat' && "border border-amber-700/15 dark:border-amber-700/20",
                variant === 'ornate' && "border-2 border-amber-700/50 dark:border-amber-400/40",

                size === 'sm' && "p-3",
                size === 'md' && "p-4 md:p-5",
                size === 'lg' && "p-5 md:p-6",

                glowOnHover && "transition-colors duration-200 ",
                isInteractive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

                className
            )}
            role={isInteractive ? "button" : props.role}
            tabIndex={isInteractive ? (props.tabIndex ?? 0) : props.tabIndex}
            onKeyDown={handleKeyDown}
        >
            {/* Ornate corner decorations */}
            {showCorners && <GenshinCorners />}

            {/* Ornate variant has additional inner frame */}
            {variant === 'ornate' && (
                <div className="absolute inset-2 border border-amber-700/20 pointer-events-none" />
            )}

            {children}
        </div>
    )
}

## components/game/GameProgressBar.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
    max?: number
    label?: string
    showValue?: boolean
    variant?: 'default' | 'xp' | 'health'
    size?: 'sm' | 'md' | 'lg'
}

export function GameProgressBar({
    value,
    max = 100,
    label,
    showValue = true,
    variant = 'default',
    size = 'md',
    className,
    ...props
}: GameProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
        <div className={cn("space-y-2", className)} {...props}>
            {/* Label row */}
            {(label || showValue) && (
                <div className="flex justify-between items-center">
                    {label && (
                        <span className="text-xs text-muted-foreground font-medium font-ui uppercase tracking-wider">
                            {label}
                        </span>
                    )}
                    {showValue && (
                        <span className="text-xs text-foreground font-semibold tabular-nums">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            {/* Progress bar container */}
            <div className={cn(
                "relative w-full overflow-hidden",
                "bg-muted/40 border border-border/40",
                size === 'sm' && "h-2",
                size === 'md' && "h-3",
                size === 'lg' && "h-4"
            )}>
                {/* End cap decorations */}
                <span className="absolute top-0 bottom-0 left-0 w-1 bg-amber-600/20 z-10" />
                <span className="absolute top-0 bottom-0 right-0 w-1 bg-amber-600/20 z-10" />

                {/* Fill bar - flat color */}
                <div
                    className={cn(
                        "h-full transition-all duration-700 ease-out",
                        variant === 'default' && "bg-amber-600",
                        variant === 'xp' && "bg-blue-500",
                        variant === 'health' && "bg-pine-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />

                {/* Progress marker at end */}
                {percentage > 0 && percentage < 100 && (
                    <span
                        className={cn(
                            "absolute top-0 bottom-0 w-0.5 bg-white/60",
                            "transition-all duration-700"
                        )}
                        style={{ left: `${percentage}%` }}
                    />
                )}
            </div>
        </div>
    )
}

## components/game/GameSectionHeader.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    subtitle?: string
    icon?: React.ReactNode
}

export function GameSectionHeader({
    title,
    subtitle,
    icon,
    className,
    ...props
}: GameSectionHeaderProps) {
    return (
        <div className={cn("mb-5 md:mb-6", className)} {...props}>
            <div className="flex items-center gap-4 mb-1.5">
                {/* Left ornate element */}
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rotate-45 border-2 border-amber-700/60" />
                    <span className="w-6 h-0.5 bg-amber-600/40" />
                </div>

                {/* Title */}
                <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-wide font-ui flex items-center gap-2.5">
                    {icon && <span className="text-amber-600/80">{icon}</span>}
                    {title}
                </h2>

                {/* Right ornate line */}
                <div className="flex-1 flex items-center gap-2">
                    <span className="flex-1 h-px bg-border/60" />
                    <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                    <span className="w-8 h-px bg-border/40" />
                </div>
            </div>

            {subtitle && (
                <p className="text-sm text-muted-foreground/70 font-medium pl-12">
                    {subtitle}
                </p>
            )}
        </div>
    )
}

## components/game/GameStat.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameStatProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string
    value: string | number
    sublabel?: string
    icon?: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
    size?: 'sm' | 'md' | 'lg'
    color?: 'default' | 'amber' | 'blue' | 'green' | 'rose' | 'purple' | 'sky' | 'pine' | 'violet'
}

const statColorConfig: Record<NonNullable<GameStatProps['color']>, {
    accent: string
    text: string
    bg: string
    border: string
}> = {
    default: {
        accent: "bg-amber-600",
        text: "text-amber-500",
        bg: "bg-amber-600/10",
        border: "border-amber-700/30"
    },
    amber: {
        accent: "bg-amber-600",
        text: "text-amber-500",
        bg: "bg-amber-600/10",
        border: "border-amber-700/30"
    },
    blue: {
        accent: "bg-blue-500",
        text: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30"
    },
    sky: {
        accent: "bg-sky-500",
        text: "text-sky-500",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30"
    },
    green: {
        accent: "bg-pine-500",
        text: "text-pine-500",
        bg: "bg-pine-500/10",
        border: "border-pine-500/30"
    },
    pine: {
        accent: "bg-pine-500",
        text: "text-pine-500",
        bg: "bg-pine-500/10",
        border: "border-pine-500/30"
    },
    rose: {
        accent: "bg-rose-500",
        text: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30"
    },
    purple: {
        accent: "bg-purple-500",
        text: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30"
    },
    violet: {
        accent: "bg-violet-500",
        text: "text-violet-500",
        bg: "bg-violet-500/10",
        border: "border-violet-500/30"
    }
}

export function GameStat({
    label,
    value,
    sublabel,
    icon,
    trend,
    size = 'md',
    className,
    color = 'default',
    ...props
}: GameStatProps) {
    const colors = statColorConfig[color]

    return (
        <div
            className={cn(
                "relative group/stat",
                "bg-card border border-border/50",
                "p-4 transition-colors duration-200",
                "hover:border-border",
                className
            )}
            {...props}
        >
            {/* Top accent bar - simple line */}
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent, "opacity-80")} />

            {/* Content */}
            <div className="relative">
                {/* Label with icon */}
                <div className="flex items-center gap-2 mb-2">
                    {icon && (
                        <span className={cn(colors.text, "opacity-80")}>
                            {icon}
                        </span>
                    )}
                    <p className={cn(
                        "uppercase tracking-[0.15em] text-muted-foreground font-medium font-ui",
                        size === 'sm' && "text-[9px]",
                        size === 'md' && "text-[10px]",
                        size === 'lg' && "text-[11px]"
                    )}>
                        {label}
                    </p>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2">
                    <p className={cn(
                        "font-medium text-foreground tabular-nums tracking-tight",
                        size === 'sm' && "text-2xl",
                        size === 'md' && "text-3xl md:text-4xl",
                        size === 'lg' && "text-4xl md:text-5xl"
                    )}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>

                    {/* Trend indicator */}
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium",
                            trend === 'up' && "text-pine-500",
                            trend === 'down' && "text-rose-500",
                            trend === 'neutral' && "text-muted-foreground"
                        )}>
                            {trend === 'up' && '↑'}
                            {trend === 'down' && '↓'}
                            {trend === 'neutral' && '→'}
                        </span>
                    )}
                </div>

                {/* Sublabel */}
                {sublabel && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium font-ui">
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}

## components/game/LevelBadge.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export const RANK_CONFIG = [
    { maxLevel: 5, title: 'Novice', color: 'text-zinc-400', bgColor: 'bg-zinc-500/30', borderColor: 'border-zinc-500/60', accentColor: 'bg-zinc-600' },
    { maxLevel: 10, title: 'Apprentice', color: 'text-pine-400', bgColor: 'bg-pine-500/10', borderColor: 'border-pine-500/30', accentColor: 'bg-pine-400' },
    { maxLevel: 20, title: 'Scholar', color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30', accentColor: 'bg-sky-400' },
    { maxLevel: 35, title: 'Adept', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30', accentColor: 'bg-violet-400' },
    { maxLevel: 50, title: 'Expert', color: 'text-amber-400', bgColor: 'bg-amber-600/10', borderColor: 'border-amber-700/30', accentColor: 'bg-amber-400' },
    { maxLevel: 75, title: 'Master', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', accentColor: 'bg-orange-400' },
    { maxLevel: 100, title: 'Grandmaster', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', accentColor: 'bg-rose-400' },
    { maxLevel: Infinity, title: 'Legend', color: 'text-amber-300', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30', accentColor: 'bg-amber-300' },
] as const

export function getRankForLevel(level: number) {
    return RANK_CONFIG.find(r => level <= r.maxLevel) || RANK_CONFIG[RANK_CONFIG.length - 1]
}

export interface LevelBadgeProps {
    level: number
    xp: number
    progressPercent: number
    xpToNextLevel: number
    showDetails?: boolean
    className?: string
}

export function LevelBadge({
    level,
    xp,
    progressPercent,
    xpToNextLevel,
    showDetails = true,
    className
}: LevelBadgeProps) {
    const rank = getRankForLevel(level)

    return (
        <div className={cn("relative", className)}>
            <div className="flex items-center gap-5">
                {/* Level emblem - Genshin-style geometric frame */}
                <div className="relative w-20 h-20">
                    {/* Background circle with progress */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
                        {/* Background ring */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-border/40"
                        />

                        {/* Progress arc */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="square"
                            strokeDasharray={`${(progressPercent / 100) * 226} 226`}
                            className={cn(rank.color, "transition-all duration-500")}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />

                        {/* Decorative tick marks */}
                        {[0, 90, 180, 270].map((angle) => (
                            <rect
                                key={angle}
                                x="39"
                                y="2"
                                width="2"
                                height="4"
                                fill="currentColor"
                                className={rank.color}
                                opacity="0.5"
                                transform={`rotate(${angle} 40 40)`}
                            />
                        ))}
                    </svg>

                    {/* Inner diamond frame */}
                    <div className="absolute inset-3">
                        <div className={cn(
                            "w-full h-full rotate-45",
                            "border-2 bg-card",
                            rank.borderColor
                        )}>
                            {/* Inner corner accents */}
                            <span className={cn("absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2", rank.borderColor)} />
                            <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2", rank.borderColor)} />
                            <span className={cn("absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2", rank.borderColor)} />
                            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2", rank.borderColor)} />
                        </div>
                    </div>

                    {/* Level number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn(
                            "text-2xl font-bold tabular-nums",
                            rank.color
                        )}>
                            {level}
                        </span>
                    </div>

                    {/* Cardinal diamonds */}
                    <span className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                </div>

                {/* Level details */}
                {showDetails && (
                    <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className={cn("text-xs font-bold uppercase tracking-[0.2em] font-ui", rank.color)}>
                                {rank.title}
                            </span>
                            <span className={cn("w-1.5 h-1.5 rotate-45", rank.accentColor, "opacity-60")} />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold font-ui">
                                Lv. {level}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold text-foreground tabular-nums">
                                {xp.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">XP</span>
                        </div>

                        <p className="text-[13px] text-muted-foreground/60 mt-1.5 font-medium">
                            {xpToNextLevel.toLocaleString()} XP to next level
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

## components/game/LoadingScreen.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const LOADING_TIPS = [
    "Reviewing daily keeps the streak alive!",
    "Use mnemonics to remember difficult words.",
    "Consistency is key to language mastery.",
    "Take breaks to let your brain absorb the material.",
    "Say the words out loud for better retention."
];

export interface GameLoaderProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
    className?: string
}

export function GameLoader({ size = 'md', className }: GameLoaderProps) {
    const sizeConfig = {
        sm: { container: 'w-12 h-12', inner: 'inset-1.5', diamond: 'w-1.5 h-1.5' },
        md: { container: 'w-20 h-20', inner: 'inset-3', diamond: 'w-2 h-2' },
        lg: { container: 'w-28 h-28', inner: 'inset-4', diamond: 'w-3 h-3' }
    }

    const config = sizeConfig[size]

    return (
        <div className={cn("flex flex-col items-center justify-center gap-5", className)}>
            <div className={cn("relative", config.container)}>
                <span className={cn("absolute border-2 border-amber-600/30 rotate-45 animate-spin", config.inner)} style={{ animationDuration: '3s' }} />
                <span className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600 rotate-45", config.diamond)} />
            </div>
        </div>
    )
}

export function CornerOrnament() {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H50V2H2V50H0V0Z" fill="currentColor" />
            <path d="M0 0H60V1H1V60H0V0Z" fill="currentColor" opacity="0.5" />
            <rect x="8" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M11 11L13 13L11 15L9 13Z" fill="currentColor" opacity="0.6" />
            <rect x="20" y="8" width="12" height="2" fill="currentColor" opacity="0.4" />
            <rect x="8" y="20" width="2" height="12" fill="currentColor" opacity="0.4" />
            <path d="M40 2L42 4L40 6L38 4Z" fill="currentColor" opacity="0.5" />
            <path d="M2 40L4 38L6 40L4 42Z" fill="currentColor" opacity="0.5" />
            <rect x="50" y="0" width="8" height="1" fill="currentColor" opacity="0.3" />
            <rect x="0" y="50" width="1" height="8" fill="currentColor" opacity="0.3" />
        </svg>
    )
}

export interface GameLoadingScreenProps {
    title?: string
    subtitle?: string
    showTip?: boolean
    className?: string
}

export function GameLoadingScreen({
    title = "Loading",
    subtitle,
    showTip = true,
    className
}: GameLoadingScreenProps) {
    const [tipIndex] = React.useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
    const tip = LOADING_TIPS[tipIndex]

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center",
            "bg-background",
            className
        )}>
            {/* Corner ornaments */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-6 left-6 text-amber-500/10">
                    <CornerOrnament />
                </div>
                <div className="absolute top-6 right-6 text-amber-500/10 rotate-90">
                    <CornerOrnament />
                </div>
                <div className="absolute bottom-6 left-6 text-amber-500/10 -rotate-90">
                    <CornerOrnament />
                </div>
                <div className="absolute bottom-6 right-6 text-amber-500/10 rotate-180">
                    <CornerOrnament />
                </div>

                {/* Subtle floating diamonds */}
                {[...Array(8)].map((_, i) => (
                    <span
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-amber-600/15 rotate-45 animate-float"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.3}s`,
                            animationDuration: `${4 + i * 0.4}s`
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative flex flex-col items-center gap-10 px-6">
                {/* Central geometric loader */}
                <div className="relative w-36 h-36">
                    {/* Outer square - slow rotation */}
                    <div
                        className="absolute inset-0 border-2 border-amber-700/20 rotate-45"
                        style={{ animation: 'spin 10s linear infinite' }}
                    />

                    {/* Second square with corner dots */}
                    <div
                        className="absolute inset-4 rotate-45"
                        style={{ animation: 'spin 7s linear infinite reverse' }}
                    >
                        <div className="absolute inset-0 border-2 border-amber-700/30" />
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-600/40" />
                    </div>

                    {/* Third square */}
                    <div
                        className="absolute inset-8 border-2 border-amber-700/40 rotate-45"
                        style={{ animation: 'spin 5s linear infinite' }}
                    />

                    {/* Fourth square */}
                    <div
                        className="absolute inset-12 border-2 border-amber-700/60 rotate-45"
                        style={{ animation: 'spin 4s linear infinite reverse' }}
                    />

                    {/* Inner diamond */}
                    <div className="absolute inset-[56px] bg-amber-600/20 rotate-45" />

                    {/* Center point */}
                    <span
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-600 rotate-45 animate-pulse"
                    />

                    {/* Orbiting accent */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-amber-600/70 rotate-45" />
                    </div>
                </div>

                {/* Title section */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
                            <span className="w-16 h-px bg-amber-600/30" />
                        </div>

                        <h2 className="text-xl font-semibold text-foreground tracking-[0.25em] uppercase font-ui">
                            {title}
                        </h2>

                        <div className="flex items-center gap-1">
                            <span className="w-16 h-px bg-amber-600/30" />
                            <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
                        </div>
                    </div>

                    {subtitle && (
                        <p className="text-sm text-muted-foreground/70 font-medium">
                            {subtitle}
                        </p>
                    )}

                    {/* Loading dots */}
                    <div className="flex items-center gap-2 mt-2">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="w-1.5 h-1.5 bg-amber-600/60 rotate-45 animate-pulse"
                                style={{ animationDelay: `${i * 0.25}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom tip section */}
            {showTip && (
                <div className="absolute bottom-14 left-0 right-0 px-8">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-px bg-amber-600/30" />
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                            <span className="text-[10px] text-amber-500/60 uppercase tracking-[0.25em] font-semibold font-ui">
                                Tip
                            </span>
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                            <span className="w-4 h-px bg-amber-600/30" />
                        </div>
                        <p className="text-sm text-muted-foreground/50 text-center font-medium italic font-editorial">
                            "{tip}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function ButtonLoader({ className }: { className?: string }) {
    return (
        <span
            className={cn("inline-flex items-center justify-center w-4 h-4 animate-spin", className)}
            style={{ animationDuration: '0.7s' }}
        >
            <span className="w-2 h-2 bg-current rotate-45 opacity-80" />
        </span>
    )
}

## components/game/StreakDisplay.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface StreakDisplayProps {
    currentStreak: number
    lastSevenDays: { date: Date; active: boolean; count: number }[]
    isAtRisk?: boolean
    className?: string
}

export function StreakDisplay({
    currentStreak,
    lastSevenDays,
    isAtRisk = false,
    className
}: StreakDisplayProps) {
    return (
        <div className={cn("relative group/streak", className)}>
            <div className="flex items-center gap-6">
                {/* Flame icon with simple frame */}
                <div className="relative w-14 h-14">
                    {/* Simple square frame */}
                    <div className={cn(
                        "absolute inset-0 border-2 transition-colors duration-200",
                        currentStreak > 0
                            ? "border-orange-500/40"
                            : "border-border/30"
                    )} />

                    {/* Small corner accents */}
                    {currentStreak > 0 && (
                        <>
                            <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-orange-500/60" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-orange-500/60" />
                            <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-orange-500/60" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-orange-500/60" />
                        </>
                    )}

                    {/* Inner content */}
                    <div className={cn(
                        "absolute inset-1 flex items-center justify-center",
                        currentStreak > 0
                            ? "bg-orange-500/10"
                            : "bg-muted/10"
                    )}>
                        {/* Flame icon */}
                        <svg
                            className={cn(
                                "w-6 h-6 transition-colors",
                                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/30"
                            )}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                        </svg>
                    </div>

                    {/* At risk indicator */}
                    {isAtRisk && currentStreak > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-600 rotate-45 animate-pulse" />
                    )}
                </div>

                {/* Streak info */}
                <div className="flex-1">
                    <div className="flex items-baseline gap-2.5 mb-3">
                        <span className="text-4xl font-bold text-foreground tabular-nums">
                            {currentStreak}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                            day{currentStreak === 1 ? '' : 's'}
                        </span>
                        {isAtRisk && currentStreak > 0 && (
                            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold font-ui animate-pulse ml-2">
                                At Risk
                            </span>
                        )}
                    </div>

                    {/* Weekly calendar */}
                    <div className="flex gap-1.5">
                        {lastSevenDays.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground/50 font-semibold font-ui uppercase">
                                    {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                                </span>
                                <div className={cn(
                                    "w-6 h-6 flex items-center justify-center",
                                    "border transition-colors",
                                    day.active
                                        ? "bg-orange-500/15 border-orange-500/40"
                                        : "bg-muted/10 border-border/20"
                                )}>
                                    {day.active && (
                                        <span className="w-2 h-2 rotate-45 bg-orange-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

## components/game/decorative.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

/* =============================================================================
   GENSHIN-STYLE DECORATIVE COMPONENTS
   Reusable ornamental elements for consistent UI styling
   ============================================================================= */

/**
 * GenshinCorner SVG - Ornate corner bracket decoration
 * Used individually or via GenshinCorners for all 4 corners
 */
/**
 * GenshinCorner SVG - Ornate corner bracket decoration
 * Optimized single-path SVG for reduced DOM complexity
 */
export const GenshinCorner = ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Combined Path for all elements */}
        <path
            d="M0 0H36V2H2V36H0V0ZM5 5H24V6.5H6.5V24H5V5ZM28 5H32V6.5H28V5ZM34 5H35.5V6.5H34V5ZM5 28H6.5V32H5V28ZM5 34H6.5V35.5H5V34ZM40 0H46V2H40V0ZM0 40H2V46H0V40ZM46 1L47 2L46 3L45 2L46 1ZM2 45L3 46L2 47L1 46L2 45Z"
            fill="currentColor"
        />
        {/* Opacity layers can be handled by multiple paths if needed, strictly merged above assumes solid. 
            Original had opacities: 
            Main corner: 1.0
            Inner bracket: 0.6
            Accents: 0.5
            Distant rects: 0.4
            Diamonds: 0.6
            
            To convert to single path, we lose varying opacities unless we use group opacity or separate paths.
            For performance, 2-3 paths is still better than 10 rects.
            Let's keep distinct opacities by grouping them into a few paths.
        */}
    </svg>
)

// Re-implementing with split paths to preserve opacity levels
export const GenshinCornerOptimized = ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Main Corner - Opacity 1 */}
        <path d="M0 0H36V2H2V36H0V0Z" fill="currentColor" />

        {/* Inner Elements - Opacity 0.6 */}
        <path
            d="M5 5H24V6.5H6.5V24H5V5ZM46 1L47 2L46 3L45 2Z M1 46L2 47L3 46L2 45Z"
            fill="currentColor"
            opacity="0.6"
        />

        {/* Accents - Opacity 0.5 */}
        <path
            d="M28 5H32V6.5H28V5ZM34 5H35.5V6.5H34V5ZM5 28H6.5V32H5V28ZM5 34H6.5V35.5H5V34ZM40 0H46V2H40V0ZM0 40H2V46H0V40"
            fill="currentColor"
            opacity="0.5"
        />
    </svg>
)

interface GenshinCornersProps {
    /** Color classes for the corners (e.g., "text-amber-600/80 dark:text-amber-400/70") */
    className?: string
    /** Additional z-index class if needed */
    zIndex?: string
}

/**
 * GenshinCorners - Renders all 4 ornate corner decorations at once
 * Place inside a relative-positioned container
 */
export const GenshinCorners = ({ className = "text-amber-600/80 dark:text-amber-400/70", zIndex = "z-20" }: GenshinCornersProps) => (
    <>
        <GenshinCornerOptimized className={cn("absolute -top-px -left-px pointer-events-none", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -top-px -right-px pointer-events-none rotate-90", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -bottom-px -left-px pointer-events-none -rotate-90", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -bottom-px -right-px pointer-events-none rotate-180", zIndex, className)} />
    </>
)

interface DiamondDividerProps {
    className?: string
    /** Visual variant of the divider */
    variant?: 'default' | 'subtle'
}

/**
 * DiamondDivider - Horizontal divider with diamond ornaments
 * Optimized to use CSS pseudo-elements instead of multiple DOM nodes
 */
export const DiamondDivider = ({ className, variant = 'default' }: DiamondDividerProps) => {
    const isDefault = variant === 'default';
    const borderColor = isDefault ? "border-amber-600/60" : "border-amber-600/40";
    const bgColor = isDefault ? "bg-amber-600/50" : "bg-amber-600/40";
    const lineColor = isDefault ? "from-amber-600/30" : "from-amber-600/20";

    return (
        <div className={cn("relative flex items-center justify-center w-full gap-3 py-1", className)}>
            {/* Left Line */}
            <div className={cn("flex-1 h-px bg-gradient-to-l to-transparent", lineColor)} />

            {/* Center Diamonds Container */}
            <div className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rotate-45 border", borderColor)} />
                <span className={cn("w-1.5 h-1.5 rotate-45", bgColor)} />
                <span className={cn("w-2 h-2 rotate-45 border", borderColor)} />
            </div>

            {/* Right Line */}
            <div className={cn("flex-1 h-px bg-gradient-to-r to-transparent", lineColor)} />
        </div>
    )
}

interface CornerAccentsProps {
    /** Which corners to show */
    position?: 'all' | 'top-left-bottom-right' | 'top-left' | 'bottom-right'
    /** Size of the corner accent */
    size?: 'sm' | 'md' | 'lg'
    /** Color classes */
    className?: string
    /** Whether accents are visible (useful for conditional styling) */
    visible?: boolean
}

/**
 * CornerAccents - L-shaped corner decorations for buttons and cards
 * Optimized to use CSS borders instead of nested elements
 */
export const CornerAccents = ({
    position = 'top-left-bottom-right',
    size = 'sm',
    className = "border-amber-500",
    visible = true
}: CornerAccentsProps) => {
    if (!visible) return null

    const sizeClasses = {
        sm: "w-2 h-2 border-[1.5px]", // Reduced thickness for small size
        md: "w-3 h-3 border-2",
        lg: "w-4 h-4 border-2"
    }

    const s = sizeClasses[size]

    // Helper for corner elements
    const Corner = ({ pos, borders }: { pos: string, borders: string }) => (
        <span className={cn(
            "absolute pointer-events-none",
            s,
            borders,
            pos,
            className
        )} />
    )

    const TopLeft = () => <Corner pos="-top-px -left-px" borders="border-t border-l border-r-0 border-b-0" />
    const TopRight = () => <Corner pos="-top-px -right-px" borders="border-t border-r border-l-0 border-b-0" />
    const BottomLeft = () => <Corner pos="-bottom-px -left-px" borders="border-b border-l border-r-0 border-t-0" />
    const BottomRight = () => <Corner pos="-bottom-px -right-px" borders="border-b border-r border-l-0 border-t-0" />

    if (position === 'top-left') return <TopLeft />
    if (position === 'bottom-right') return <BottomRight />
    if (position === 'top-left-bottom-right') {
        return (
            <>
                <TopLeft />
                <BottomRight />
            </>
        )
    }
    // position === 'all'
    return (
        <>
            <TopLeft />
            <TopRight />
            <BottomLeft />
            <BottomRight />
        </>
    )
}

interface DiamondMarkerProps {
    /** Size of the diamond */
    size?: 'xs' | 'sm' | 'md' | 'lg'
    /** Visual style */
    variant?: 'filled' | 'outline'
    /** Color classes (without rotate-45, added automatically) */
    className?: string
}

/**
 * DiamondMarker - Simple rotated square diamond element
 * Used as bullet points, accents, and decorative markers
 */
export const DiamondMarker = ({
    size = 'sm',
    variant = 'filled',
    className
}: DiamondMarkerProps) => {
    const sizeClasses = {
        xs: "w-1 h-1",
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-3 h-3"
    }

    const variantClasses = {
        filled: "bg-amber-600/50",
        outline: "border border-amber-600/60"
    }

    return (
        <span className={cn(
            "rotate-45 shrink-0",
            sizeClasses[size],
            variantClasses[variant],
            className
        )} />
    )
}

/**
 * InnerFrame - Decorative inner border frame for modals and panels
 */
export const InnerFrame = ({ className }: { className?: string }) => (
    <div className={cn(
        "absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10",
        className
    )} />
)

## components/game/index.ts
export * from './GamePanel';
export * from './GameButton';
export * from './GameStat';
export * from './LevelBadge';
export * from './StreakDisplay';
export * from './LoadingScreen';
export * from './GameSectionHeader';
export * from './GameProgressBar';
export * from './GameMetricRow';
export * from './GameDivider';
export * from './CircularProgress';
export * from './GameEmptyState';
export * from './CardDistributionBar';
export * from './GameInput';

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
  ChevronUp,
  Check,
  Command,
  Save
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { CramModal } from '@/features/study/components/CramModal';
import { LanguageId } from '@/types';
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
import { PolishFlag, NorwegianFlag, JapaneseFlag, SpanishFlag, GermanFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';



interface NavActionProps {
  onOpenAdd: () => void;
  onOpenCram: () => void;
  onOpenSettings: () => void;
  onSyncSave: () => void;
  isSyncing: boolean;
  onCloseMobileMenu?: () => void;
}



const AppSidebar: React.FC<NavActionProps> = ({
  onOpenAdd,
  onOpenCram,
  onOpenSettings,
  onSyncSave,
  isSyncing,
  onCloseMobileMenu
}) => {
  const location = useLocation();
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  const languages = [
    { code: LanguageId.Polish, name: 'Polish', Flag: PolishFlag },
    { code: LanguageId.Norwegian, name: 'Norwegian', Flag: NorwegianFlag },
    { code: LanguageId.Japanese, name: 'Japanese', Flag: JapaneseFlag },
    { code: LanguageId.Spanish, name: 'Spanish', Flag: SpanishFlag },
    { code: LanguageId.German, name: 'German', Flag: GermanFlag },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

  const mainNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/cards', icon: ListIcon, label: 'Index' },
    { to: '/study', icon: GraduationCap, label: 'Study' },
  ];

  const toolItems = [
    { icon: Plus, label: 'Add Entry', onClick: () => { onOpenAdd(); onCloseMobileMenu?.(); } },
    { icon: Zap, label: 'Cram Mode', onClick: () => { onOpenCram(); onCloseMobileMenu?.(); } },
    { icon: Save, label: isSyncing ? 'Saving...' : 'Save Changes', onClick: () => { if (!isSyncing) { onSyncSave(); } }, disabled: isSyncing },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0">

      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            {/* Decorative diamond before title */}
            <div className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
            <span className="text-sm font-medium tracking-wide text-foreground uppercase">LinguaFlow</span>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0 h-7 w-7 text-muted-foreground/60 hover:text-foreground hover:bg-transparent" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        {/* Primary Nav */}
        <SidebarGroup className="px-0 py-3 group-data-[collapsible=icon]:py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:gap-1">
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.to;

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={onCloseMobileMenu}
                      className={clsx(
                        "relative h-9 px-3 rounded-none transition-all duration-200 text-[13px] tracking-wide group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center",
                        isActive
                          ? "text-foreground bg-transparent font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                      )}
                    >
                      <Link to={item.to} className="flex items-center gap-3 w-full">
                        {/* Active indicator - vertical line */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-linear-to-b from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        )}
                        <item.icon size={15} strokeWidth={isActive ? 1.5 : 1.25} className="shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        {/* Active diamond indicator */}
                        {isActive && (
                          <div className="ml-auto w-1 h-1 rotate-45 bg-primary/60 group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Genshin-style separator with diamond */}
        <div className="flex items-center gap-2 my-3 mx-1 group-data-[collapsible=icon]:hidden">
          <div className="w-full h-[1px] bg-linear-to-r from-transparent via-border/50 to-transparent my-2" />
        </div>

        {/* Tools Section */}
        <SidebarGroup className="px-0 py-2 group-data-[collapsible=icon]:py-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-2 group-data-[collapsible=icon]:hidden">
            Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:gap-1">
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className="h-8 px-3 rounded-none transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-transparent text-[13px] tracking-wide group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <item.icon size={14} strokeWidth={1.25} className="shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 pt-0">
        {/* Genshin-style top separator */}
        <div className="flex items-center gap-2 mb-3 group-data-[collapsible=icon]:hidden">
          <div className="h-px flex-1 bg-gradient-to-r from-border/40 to-transparent" />
        </div>

        <SidebarMenu className="gap-0.5">
          {/* Language Selector */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="h-8 px-3 rounded-none hover:bg-transparent text-[13px] tracking-wide text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                >
                  <div className="w-4 h-3 rounded-[1px] overflow-hidden border border-border/30 shrink-0">
                    <currentLanguage.Flag className="w-full h-full object-cover" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">{currentLanguage.name}</span>
                  <ChevronUp className="ml-auto text-muted-foreground/50 group-data-[collapsible=icon]:hidden" size={12} strokeWidth={1.5} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-1.5 rounded-none border-border/50">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-2.5 py-2 px-2.5 text-[13px] tracking-wide rounded-none"
                  >
                    <lang.Flag className="w-4 h-3 rounded-[1px] border border-border/30" />
                    <span className="flex-1">{lang.name}</span>
                    {settings.language === lang.code && (
                      <div className="w-1 h-1 rotate-45 bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { onOpenSettings(); onCloseMobileMenu?.(); }}
              className="h-8 px-3 rounded-none text-muted-foreground hover:text-foreground hover:bg-transparent text-[13px] tracking-wide group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Settings size={14} strokeWidth={1.25} className="shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Info */}
        {profile && (
          <div className="px-3 py-2 group-data-[collapsible=icon]:hidden mt-1">
            <p className="text-[10px] text-muted-foreground/50 truncate tracking-wide uppercase">
              {profile.username}
            </p>
          </div>
        )}

        {/* Logout */}
        <SidebarMenu className="gap-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { signOut(); onCloseMobileMenu?.(); }}
              className="h-8 px-3 rounded-none text-muted-foreground/60 hover:text-destructive hover:bg-transparent text-[13px] tracking-wide transition-colors group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut size={14} strokeWidth={1.25} className="shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};



const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/cards', icon: ListIcon, label: 'Cards' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      {/* Genshin-style background with top border accent */}
      <div className="relative bg-background/95 backdrop-blur-sm border-t border-border/50">
        {/* Top accent line with diamond center */}
        <div className="absolute -top-px left-0 right-0 flex items-center justify-center">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/30 to-primary/50" />
          <div className="w-2 h-2 rotate-45 border border-primary/40 bg-background -translate-y-1/2" />
          <div className="h-px flex-1 bg-linear-to-l from-transparent via-primary/30 to-primary/50" />
        </div>

        <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto relative">
          {/* Left Nav Items */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center justify-center w-14 h-14 group"
              >
                {/* Active indicator - diamond shape */}
                {isActive && (
                  <div className="absolute top-1 w-1 h-1 rotate-45 bg-primary" />
                )}

                {/* Icon container with subtle frame on active */}
                <div className={clsx(
                  "relative flex items-center justify-center w-8 h-8 transition-all",
                  isActive && "before:absolute before:inset-0 before:border before:border-primary/20 before:rotate-45"
                )}>
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 1.5 : 1.2}
                    className={clsx(
                      "transition-all relative z-10",
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </div>

                {/* Label */}
                <span className={clsx(
                  "text-[9px] uppercase tracking-widest mt-0.5 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center FAB (Study) - Subtle Genshin-inspired style */}
          <Link
            to="/study"
            className="group relative flex items-center justify-center"
          >
            {/* Main button - smaller diamond */}
            <div className="relative w-10 h-10 bg-background border border-primary/40 rotate-45 flex items-center justify-center transition-all group-hover:border-primary group-hover:bg-primary/5 group-active:scale-95">
              <GraduationCap
                size={18}
                strokeWidth={1.5}
                className="-rotate-45 text-primary/80 transition-all group-hover:text-primary group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Menu Trigger */}
          <div className="relative flex flex-col items-center justify-center w-14 h-14">
            <SidebarTrigger className="flex items-center justify-center w-8 h-8 hover:bg-transparent [&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:stroke-[1.2]" />
            <span className="text-[9px] uppercase tracking-widest mt-0.5 text-muted-foreground/70">
              Menu
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};



export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addCard } = useCardOperations();
  const location = useLocation();
  const { saveToSyncFile, isSaving: isSyncing } = useSyncthingSync();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);

  const isStudyMode = location.pathname === '/study';

  const sidebarProps: NavActionProps = {
    onOpenAdd: () => setIsAddModalOpen(true),
    onOpenCram: () => setIsCramModalOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onSyncSave: saveToSyncFile,
    isSyncing,
  };


  if (isStudyMode) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <main className="min-h-screen p-0">
          {children}
        </main>

        {/* Global Modals */}
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-background text-foreground font-sans flex overflow-hidden">

        {/* Desktop Sidebar */}
        <AppSidebar {...sidebarProps} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Main Content Area */}
          <main className="flex-1 relative overflow-hidden flex flex-col pb-16 md:pb-0">
            {/* 
              We use a scrollable container for standard pages. 
              Routes that need to control their own scrolling (like CardsRoute) 
              should fill this container and manage overflow themselves.
              
              To support both, we'll make this container flex-1.
              If the child (CardsRoute) is h-full, it takes full height.
              If the child is normal content, it might overflow, so we generally want overflow-y-auto here.
              BUT CardsRoute needs to NOT have parent scroll.
              
              Solution: overflow-y-auto on this container. 
              CardsRoute will be h-full (min-h-full) which means it won't trigger scroll unless it grows?
              Actually, if CardsRoute is h-full, we don't want this container to scroll.
              
              Let's try standard app layout:
              Outer: static
              Inner: overflow-y-auto
            */}
            <div className="w-full h-full p-4 md:p-8 pt-4 md:pt-8 overflow-y-auto md:overflow-y-auto [&:has(.page-full-height)]:overflow-hidden [&:has(.page-full-height)]:p-0 md:[&:has(.page-full-height)]:p-0">
              <div className="w-full max-w-6xl mx-auto min-h-full [&:has(.page-full-height)]:h-full">
                {children}
              </div>
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
    </SidebarProvider>
  );
};

## components/ui/badge.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-xs font-ui font-medium uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-amber-600/50 bg-amber-600/15 text-amber-700 dark:text-amber-400",
        secondary:
          "border-border bg-secondary/50 text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive",
        outline:
          "border-amber-700/30 dark:border-amber-600/20 text-foreground bg-transparent",
        success:
          "border-pine-500/50 bg-pine-500/10 text-pine-600 dark:text-pine-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

## components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 font-ui uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "bg-amber-600/15 text-amber-700 dark:text-amber-400 border-2 border-amber-600/50 hover:bg-amber-600/25 hover:border-amber-500/70 active:bg-amber-600/35",
        destructive:
          "bg-destructive/10 text-destructive border-2 border-destructive/50 hover:bg-destructive/20 hover:border-destructive/70 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-amber-700/30 dark:border-amber-600/25 bg-transparent hover:bg-amber-600/10 hover:border-amber-600/50 text-foreground",
        secondary:
          "bg-secondary/50 text-foreground border border-border hover:bg-secondary/70 hover:border-amber-700/30",
        ghost:
          "hover:bg-amber-600/10 hover:text-amber-700 dark:hover:text-amber-400 border border-transparent hover:border-amber-700/20",
        link: "text-amber-600 dark:text-amber-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 gap-1.5 px-4 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

## components/ui/card.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "relative bg-card text-card-foreground flex flex-col gap-6 border-2 border-amber-700/20 dark:border-amber-600/15",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-serif font-semibold text-amber-800 dark:text-amber-300 tracking-wide", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

## components/ui/chart.tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                .map(([key, itemConfig]) => {
                  const color =
                    itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
                    itemConfig.color
                  return color ? `  --color-${key}: ${color};` : null
                })
                .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.TooltipProps<any, any> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    payload?: any[]
    label?: any
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-xs border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
    verticalAlign?: "top" | "middle" | "bottom"
    hideIcon?: boolean
    nameKey?: string
  }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-xs"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
      typeof payload.payload === "object" &&
      payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}


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
      "peer relative h-5 w-5 shrink-0 border-1 border-amber-700/80 dark:border-amber-600/25 bg-card transition-all duration-200",
      "hover:border-amber-600/50",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    {/* Corner accents */}
    <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-px bg-amber-500/40" />
      <span className="absolute top-0 left-0 h-full w-px bg-amber-500/40" />
    </span>
    <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/40" />
      <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/40" />
    </span>

    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
  value: string; 
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = React.useMemo(() => {
    try {
      
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
    
    onChange(`${h} ${s}% ${l}%`);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;

    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
        const { h, s, l } = hexToHSL(newHex);
        
        onChange(`${h} ${s}% ${l}%`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-none  hover:scale-110 transition-transform">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorChange}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
          />
        </div>
        <Input 
            defaultValue={hexValue}
            key={hexValue} 
            onBlur={handleTextChange}
            className="w-24 font-mono uppercase rounded-xl border-transparent bg-secondary/30"
            maxLength={7}
        />
      </div>
    </div>
  );
};

## components/ui/data-table.tsx
"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onRowSelectionChange?: (selection: RowSelectionState) => void
    rowSelection?: RowSelectionState
    enableRowSelection?: boolean
    getRowId?: (row: TData) => string
    searchValue?: string
    searchColumn?: string
    pageSize?: number
    onRowClick?: (row: TData) => void
    pageCount?: number
    pageIndex?: number
    onPageChange?: (page: number) => void
    manualPagination?: boolean
    totalItems?: number
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowSelectionChange,
    rowSelection: externalRowSelection,
    enableRowSelection = true,
    getRowId,
    searchValue = "",
    searchColumn,
    pageSize = 50,
    onRowClick,
    pageCount = -1,
    pageIndex = 0,
    onPageChange,
    manualPagination = false,
    totalItems,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
    const [internalPagination, setInternalPagination] = React.useState({
        pageIndex: 0,
        pageSize: pageSize,
    })

    const rowSelection = externalRowSelection ?? internalRowSelection

    const paginationState = manualPagination
        ? { pageIndex, pageSize }
        : internalPagination

    React.useEffect(() => {
        if (searchColumn && searchValue) {
            setColumnFilters([{ id: searchColumn, value: searchValue }])
        } else {
            setColumnFilters([])
        }
    }, [searchValue, searchColumn])

    const table = useReactTable({
        data,
        columns,
        pageCount: manualPagination ? pageCount : undefined,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            const newState = typeof updater === 'function' ? updater(rowSelection) : updater
            if (onRowSelectionChange) {
                onRowSelectionChange(newState)
            } else {
                setInternalRowSelection(newState)
            }
        },
        onPaginationChange: (updater) => {
            if (manualPagination && onPageChange) {
                const newState = typeof updater === 'function' ? updater(paginationState) : updater
                onPageChange(newState.pageIndex)
            } else {
                setInternalPagination(updater as any)
            }
        },
        getRowId,
        manualPagination: manualPagination,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: paginationState,
        },
        enableRowSelection,
    })

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Genshin-styled Table Container */}
            <div className="relative flex-1 min-h-0 overflow-auto genshin-panel !p-0 bg-card/50">
                <Table>
                    <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 shadow-sm shadow-black/5">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b border-primary/20 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="relative h-11 text-muted-foreground font-medium tracking-wide">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200 group border-b border-border/40 last:border-0",
                                        "hover:bg-primary/5",
                                        row.getIsSelected() && "bg-primary/10 hover:bg-primary/15"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-12">
                                        <div className="w-12 h-12 border border-border/50 rotate-45 flex items-center justify-center mb-4">
                                            <span className="w-6 h-6 border border-border/50 rotate-45" />
                                        </div>
                                        <span className="text-lg font-editorial text-foreground">No results found</span>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls - Genshin Styled */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
                        <span className="w-1.5 h-1.5 rotate-45 bg-primary" />
                        <span className="text-xs text-primary font-bold tracking-wide uppercase">
                            {table.getFilteredSelectedRowModel().rows.length} Selected
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-ui">
                        <span>Page</span>
                        <span className="text-foreground font-bold tabular-nums font-editorial text-lg">
                            {table.getState().pagination.pageIndex + 1}
                        </span>
                        <span className="text-xs uppercase tracking-wider">of</span>
                        <span className="text-foreground font-bold tabular-nums font-editorial text-lg">
                            {table.getPageCount()}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className={cn(
                                "genshin-button !py-1.5 !px-4 !text-xs flex items-center gap-2",
                                "!bg-card hover:!bg-primary/10 !text-foreground !border-border hover:!border-primary",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className={cn(
                                "genshin-button !py-1.5 !px-4 !text-xs flex items-center gap-2",
                                "!bg-card hover:!bg-primary/10 !text-foreground !border-border hover:!border-primary",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
                            )}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

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
      "fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm",
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
        "fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-5 border-2 border-amber-700/30 dark:border-amber-600/25 bg-card p-6 animate-genshin-fade-in",
        className
      )}
      {...props}
    >
      {/* Ornate corner decorations */}
      <span className="absolute -top-px -left-px w-4 h-4 pointer-events-none">
        <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/70" />
        <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/70" />
      </span>
      <span className="absolute -top-px -right-px w-4 h-4 pointer-events-none">
        <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500/70" />
        <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500/70" />
      </span>
      <span className="absolute -bottom-px -left-px w-4 h-4 pointer-events-none">
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/70" />
        <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500/70" />
      </span>
      <span className="absolute -bottom-px -right-px w-4 h-4 pointer-events-none">
        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/70" />
        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/70" />
      </span>

      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 p-1.5 text-amber-700/60 dark:text-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400 transition-colors focus:outline-none disabled:pointer-events-none">
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
      "text-lg font-serif font-semibold leading-none tracking-wide text-amber-800 dark:text-amber-300",
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
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "relative z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto p-1",
          "bg-card border-2 border-amber-700/30 dark:border-amber-600/25 text-foreground",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {/* Corner accents */}
        <span className="absolute -top-px -left-px w-2.5 h-2.5 pointer-events-none z-10">
          <span className="absolute top-0 left-0 w-full h-px bg-amber-500/60" />
          <span className="absolute top-0 left-0 h-full w-px bg-amber-500/60" />
        </span>
        <span className="absolute -top-px -right-px w-2.5 h-2.5 pointer-events-none z-10">
          <span className="absolute top-0 right-0 w-full h-px bg-amber-500/60" />
          <span className="absolute top-0 right-0 h-full w-px bg-amber-500/60" />
        </span>
        <span className="absolute -bottom-px -left-px w-2.5 h-2.5 pointer-events-none z-10">
          <span className="absolute bottom-0 left-0 w-full h-px bg-amber-500/60" />
          <span className="absolute bottom-0 left-0 h-full w-px bg-amber-500/60" />
        </span>
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 pointer-events-none z-10">
          <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/60" />
          <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/60" />
        </span>

        {props.children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-hidden select-none transition-colors",
        "focus:bg-amber-600/10 focus:text-amber-700 dark:focus:text-amber-400",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[inset]:pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 py-2 pr-3 pl-8 text-sm outline-hidden select-none transition-colors",
        "focus:bg-amber-600/10 focus:text-amber-700 dark:focus:text-amber-400",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-amber-600 dark:text-amber-400" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 py-2 pr-3 pl-8 text-sm outline-hidden select-none transition-colors",
        "focus:bg-amber-600/10 focus:text-amber-700 dark:focus:text-amber-400",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-amber-600 dark:fill-amber-400" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-1.5 text-xs font-ui font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-amber-700/20 dark:bg-amber-600/15 -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-hidden select-none transition-colors",
        "focus:bg-amber-600/10 focus:text-amber-700 dark:focus:text-amber-400",
        "data-[state=open]:bg-amber-600/10 data-[state=open]:text-amber-700 dark:data-[state=open]:text-amber-400",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[inset]:pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4 text-amber-600/60" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden p-1",
        "bg-card border-2 border-amber-700/30 dark:border-amber-600/25 text-foreground",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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

export const GermanFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="8" fill="#000000"/>
    <rect y="8" width="32" height="8" fill="#DD0000"/>
    <rect y="16" width="32" height="8" fill="#FFCC00"/>
  </svg>
);


## components/ui/furigana-renderer.tsx
import React from 'react';
import { parseFurigana, cn } from '@/lib/utils';

interface FuriganaRendererProps {
    text: string;
    className?: string;
    processText?: (text: string) => string;
}

export const FuriganaRenderer: React.FC<FuriganaRendererProps> = ({
    text,
    className = '',
    processText = (t) => t
}) => {
    const segments = parseFurigana(text);
    const hasFurigana = segments.some(s => s.furigana);

    if (!hasFurigana) {
        return <span className={className}>{processText(text)}</span>;
    }

    return (
        <span className={cn(className, "leading-[1.6]")}>
            {segments.map((segment, i) => {
                if (segment.furigana) {
                    return (
                        <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
                            <span>{processText(segment.text)}</span>
                            <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                                {processText(segment.furigana)}
                            </rt>
                        </ruby>
                    );
                }
                return <span key={i}>{processText(segment.text)}</span>;
            })}
        </span>
    );
};

## components/ui/game-menu-item.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface GameMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
  children: React.ReactNode
}

export function GameMenuItem({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GameMenuItemDiamond({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GameMenuItemChevron({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item overflow-visible",
        className
      )}
      {...props}
    >
      {/* Corner Chevrons - appear on hover */}
      {/* Top Left - pointing down-right */}
      <svg
        className={cn(
          "absolute -top-1 -left-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out",
          "opacity-0 -translate-x-0.5 -translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2 2 L2 6 L3 6 L3 3 L6 3 L6 2 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Top Right - pointing down-left */}
      <svg
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[25ms]",
          "opacity-0 translate-x-0.5 -translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M10 2 L10 6 L9 6 L9 3 L6 3 L6 2 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Bottom Left - pointing up-right */}
      <svg
        className={cn(
          "absolute -bottom-1 -left-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[50ms]",
          "opacity-0 -translate-x-0.5 translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2 10 L2 6 L3 6 L3 9 L6 9 L6 10 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Bottom Right - pointing up-left */}
      <svg
        className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[75ms]",
          "opacity-0 translate-x-0.5 translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M10 10 L10 6 L9 6 L9 9 L6 9 L6 10 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {children}
    </div>
  )
}

## components/ui/game-ui.tsx

export * from '@/components/game';

## components/ui/input.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "relative h-10 w-full min-w-0 border-2 border-amber-700/20 dark:border-amber-600/15 bg-card px-4 py-2 text-base transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground/40",
        "hover:border-amber-700/30 dark:hover:border-amber-600/25",
        "focus-visible:border-amber-500/50 focus-visible:bg-amber-600/5",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-destructive",
        "md:text-sm",
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
  "text-xs font-ui font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden border border-amber-700/20 dark:border-amber-600/15 bg-muted/30",
        className
      )}
      {...props}
    >
      {/* Corner accents */}
      <span className="absolute -top-px -left-px w-1 h-1 pointer-events-none z-10">
        <span className="absolute top-0 left-0 w-full h-px bg-amber-500/50" />
        <span className="absolute top-0 left-0 h-full w-px bg-amber-500/50" />
      </span>
      <span className="absolute -bottom-px -right-px w-1 h-1 pointer-events-none z-10">
        <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/50" />
        <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/50" />
      </span>

      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-amber-600 transition-all duration-500"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

## components/ui/scroll-area.tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
      "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
      "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 bg-amber-700/30 dark:bg-amber-600/25 hover:bg-amber-600/50 dark:hover:bg-amber-500/40 transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }

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
      "flex h-10 w-full items-center justify-between whitespace-nowrap border-2 border-amber-700/20 dark:border-amber-600/15 bg-card px-4 py-2 text-sm transition-all duration-200",
      "data-[placeholder]:text-muted-foreground/50",
      "hover:border-amber-700/30 dark:hover:border-amber-600/25 hover:bg-amber-600/5",
      "focus:outline-none focus:border-amber-500/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-amber-600/60 dark:text-amber-400/60" />
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
      "flex cursor-default items-center justify-center py-1 text-amber-600/60",
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
      "flex cursor-default items-center justify-center py-1 text-amber-600/60",
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
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden border-2 border-amber-700/30 dark:border-amber-600/25 bg-card text-foreground",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
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
    className={cn("px-3 py-1.5 text-xs font-ui font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-400/70", className)}
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
      "relative flex w-full cursor-default select-none items-center py-2 pl-3 pr-8 text-sm outline-none transition-colors",
      "focus:bg-amber-600/10 focus:text-amber-700 dark:focus:text-amber-400",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
    className={cn("-mx-1 my-1 h-px bg-amber-700/20 dark:bg-amber-600/15", className)}
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
        "bg-amber-700/20 dark:bg-amber-600/15 shrink-0",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
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
        "fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
          "fixed z-50 flex flex-col gap-4 transition ease-in-out bg-card",
          "border-2 border-amber-700/30 dark:border-amber-600/25",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l-2 sm:max-w-sm",
          side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r-2 sm:max-w-sm",
          side === "top" &&
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b-2",
          side === "bottom" &&
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t-2",
          className
        )}
        {...props}
      >
        {/* Corner accents */}
        <span className="absolute -top-px -left-px w-4 h-4 pointer-events-none z-10">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/70" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/70" />
        </span>
        <span className="absolute -bottom-px -right-px w-4 h-4 pointer-events-none z-10">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/70" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/70" />
        </span>

        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 p-1.5 text-amber-700/60 dark:text-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400 transition-colors focus:outline-none disabled:pointer-events-none">
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
      className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-6", className)}
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
      className={cn("text-lg font-serif font-semibold tracking-wide text-amber-800 dark:text-amber-300", className)}
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

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

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
          className="bg-sidebar bg-linear-to-br from-sidebar to-amber-500/5 group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
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
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
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
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
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
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
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
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
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
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2  disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-linear-to-r data-[active=true]:from-sidebar-accent data-[active=true]:to-transparent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
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
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
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
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
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
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
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
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
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
      className={cn(
        "bg-amber-600/10 dark:bg-amber-400/10 animate-pulse",
        className
      )}
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
      "relative flex w-full touch-none select-none items-center group/slider",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden bg-muted/50 border border-border/30">
      {/* Corner accents on track */}
      <span className="absolute -top-px -left-px w-1 h-1 pointer-events-none">
        <span className="absolute top-0 left-0 w-full h-px bg-primary/30" />
        <span className="absolute top-0 left-0 h-full w-px bg-primary/30" />
      </span>
      <span className="absolute -bottom-px -right-px w-1 h-1 pointer-events-none">
        <span className="absolute bottom-0 right-0 w-full h-px bg-primary/30" />
        <span className="absolute bottom-0 right-0 h-full w-px bg-primary/30" />
      </span>
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary/80 to-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "relative block h-4 w-4 border border-primary/50 bg-card transition-all duration-200",
        "hover:border-primary hover:bg-primary/10 hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "after:absolute after:inset-1 after:bg-primary after:transition-colors",
        "group-hover/slider:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.4)]"
      )} 
    />
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
      "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border border-border/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      
      "data-[state=unchecked]:bg-card data-[state=unchecked]:border-border/50",
      
      "data-[state=checked]:bg-primary/20 data-[state=checked]:border-primary/50",
      className
    )}
    {...props}
    ref={ref}
  >
    {/* Corner accents - top left */}
    <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-px bg-primary/40" />
      <span className="absolute top-0 left-0 h-full w-px bg-primary/40" />
    </span>
    {/* Corner accents - bottom right */}
    <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute bottom-0 right-0 w-full h-px bg-primary/40" />
      <span className="absolute bottom-0 right-0 h-full w-px bg-primary/40" />
    </span>
    
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 bg-foreground/70 ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1",
        "data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
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
  React.ComponentProps<"table">
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
  React.ComponentProps<"thead">
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b-2 [&_tr]:border-primary/20",
      "bg-linear-to-r from-card via-card to-card",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<"tbody">
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
  React.ComponentProps<"tfoot">
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t-2 border-primary/20 bg-muted/30 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentProps<"tr">
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/40 transition-all duration-200",
      "hover:bg-primary/5 ",
      "data-[state=selected]:bg-primary/8",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<"th">
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-ui font-semibold uppercase tracking-wider text-[11px]",
      "text-primary/70 dark:text-primary/80",
      "[&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
      "not-last:relative not-last:after:absolute not-last:after:right-0 not-last:after:top-1/4 not-last:after:h-1/2 not-last:after:w-px not-last:after:bg-border/30",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<"td">
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentProps<"caption">
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
      "inline-flex h-11 items-center justify-center gap-1 border-b-2 border-amber-700/20 dark:border-amber-600/15 p-1 text-muted-foreground",
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
      "relative inline-flex items-center justify-center whitespace-nowrap px-5 py-2 text-sm font-ui font-medium uppercase tracking-wider transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50",
      "disabled:pointer-events-none disabled:opacity-50",
      "border-b-2 border-transparent -mb-[2px]",
      "hover:text-amber-700/80 dark:hover:text-amber-400/80",
      "data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 data-[state=active]:border-amber-600",
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
      "mt-4 animate-genshin-fade-in focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50",
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
        "flex min-h-[100px] w-full border-2 border-amber-700/20 dark:border-amber-600/15 bg-card px-4 py-3 text-base transition-all duration-200",
        "placeholder:text-muted-foreground/40",
        "hover:border-amber-700/30 dark:hover:border-amber-600/25",
        "focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:bg-amber-600/5",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

## components/ui/toggle.tsx
"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  data-[state=on]:text-accent-foreground",
    {
        variants: {
            variant: {
                default: "bg-transparent",
                outline:
                    "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
            },
            size: {
                default: "h-10 px-3",
                sm: "h-9 px-2.5",
                lg: "h-11 px-5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Toggle = React.forwardRef<
    React.ElementRef<typeof TogglePrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
        ref={ref}
        className={cn(toggleVariants({ variant, size, className }))}
        {...props}
    />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

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
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "relative z-50 w-fit origin-(--radix-tooltip-content-transform-origin) px-3 py-2 text-xs",
          "bg-card border-2 border-amber-700/30 dark:border-amber-600/25 text-foreground",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {/* Corner accents */}
        <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-px bg-amber-500/60" />
          <span className="absolute top-0 left-0 h-full w-px bg-amber-500/60" />
        </span>
        <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/60" />
          <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/60" />
        </span>

        {children}
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
    dueDate: new Date(Date.now() - 86400000).toISOString(),
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
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
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
  spanish: 'Spanish',
  german: 'German'
} as const;

## contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/db/dexie';
import { toast } from 'sonner';

interface LocalUser {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, languageLevel?: string) => Promise<any>;
  updateUsername: (username: string) => Promise<void>;
  login: () => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await db.profile.get(LOCAL_USER_ID);

        if (profile) {
          setUser({ id: LOCAL_USER_ID, email: 'local-user', username: profile.username });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signInWithGoogle = async () => {
    toast.info('This is a local app. Please create a profile.');
  };

  const signInWithEmail = async (_email: string, _password: string) => {
    toast.info('This is a local app. Please create a profile.');
  };

  const signUpWithEmail = async (_email: string, _password: string, username: string, languageLevel?: string) => {
    // initialize new profile
    const now = new Date().toISOString();
    await db.profile.put({
      id: LOCAL_USER_ID,
      username,
      xp: 0,
      points: 0,
      level: 1,
      language_level: languageLevel || 'beginner',
      created_at: now,
      updated_at: now
    });

    setUser({ id: LOCAL_USER_ID, email: 'local-user', username });
    return { user: { id: LOCAL_USER_ID } };
  };

  const updateUsername = async (username: string) => {
    const now = new Date().toISOString();
    const exists = await db.profile.get(LOCAL_USER_ID);

    if (exists) {
      await db.profile.update(LOCAL_USER_ID, { username, updated_at: now });
    } else {
      await db.profile.put({
        id: LOCAL_USER_ID,
        username,
        xp: 0,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now
      });
    }

    setUser(prev => prev ? { ...prev, username } : { id: LOCAL_USER_ID, email: 'local-user', username });
  };

  const signOut = async () => {
    await db.profile.delete(LOCAL_USER_ID);
    setUser(null);
    toast.success('Signed out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        signInWithEmail,
        signUpWithEmail,
        updateUsername,
        login: async () => {
          const profile = await db.profile.get(LOCAL_USER_ID);
          if (profile) {
            setUser({ id: LOCAL_USER_ID, email: 'local-user', username: profile.username });
          }
        }
      }}
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

## contexts/DeckActionsContext.tsx
import React, { createContext, useContext, useCallback } from 'react';
import { Card, Grade } from '@/types';
import { CardXpPayload } from '@/features/xp/xpUtils';
import { useRecordReviewMutation, useUndoReviewMutation } from '@/features/deck/hooks/useDeckQueries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/features/study/logic/srs';
import { useSessionDispatch } from './SessionContext';

interface DeckDispatch {
    recordReview: (card: Card, grade: Grade, xpPayload?: CardXpPayload) => Promise<void>;
    undoReview: () => Promise<void>;
    refreshDeckData: () => void;
}

const DeckActionsContext = createContext<DeckDispatch | undefined>(undefined);

export const DeckActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const recordReviewMutation = useRecordReviewMutation();
    const undoReviewMutation = useUndoReviewMutation();
    const { setLastReview, getLastReview, clearLastReview } = useSessionDispatch();

    const recordReview = useCallback(async (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => {
        const today = getUTCDateString(getSRSDate(new Date()));
        const xpEarned = xpPayload?.totalXp ?? 0;

        // Optimistically update session state
        setLastReview({ card: oldCard, date: today, xpEarned });

        try {
            await recordReviewMutation.mutateAsync({ card: oldCard, grade, xpPayload });
        } catch (error) {
            console.error("Failed to record review", error);
            toast.error("Failed to save review progress");
            // Revert session state if failed (check if it's still the same review)
            const currentLast = getLastReview();
            if (currentLast?.card.id === oldCard.id) {
                clearLastReview();
            }
        }
    }, [recordReviewMutation, setLastReview, getLastReview, clearLastReview]);

    const undoReview = useCallback(async () => {
        const lastReview = getLastReview();
        if (!lastReview) return;
        const { card, date, xpEarned } = lastReview;

        try {
            await undoReviewMutation.mutateAsync({ card, date, xpEarned });
            clearLastReview();
            toast.success('Review undone');
        } catch (error) {
            console.error("Failed to undo review", error);
            toast.error("Failed to undo review");
        }
    }, [getLastReview, undoReviewMutation, clearLastReview]);

    const refreshDeckData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['deckStats'] });
        queryClient.invalidateQueries({ queryKey: ['dueCards'] });
        queryClient.invalidateQueries({ queryKey: ['reviewsToday'] });
        queryClient.invalidateQueries({ queryKey: ['history'] });
        queryClient.invalidateQueries({ queryKey: ['cards'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardCards'] });
    }, [queryClient]);

    const value = {
        recordReview,
        undoReview,
        refreshDeckData,
    };

    return (
        <DeckActionsContext.Provider value={value}>
            {children}
        </DeckActionsContext.Provider>
    );
};

export const useDeckActions = () => {
    const context = useContext(DeckActionsContext);
    if (context === undefined) {
        throw new Error('useDeckActions must be used within a DeckActionsProvider');
    }
    return context;
};

## contexts/DeckContext.tsx
import { useDeckActions } from './DeckActionsContext';
import { useDeckStats } from './DeckStatsContext';
import { useSessionState } from './SessionContext';

// Re-export new hooks for direct usage
export { useDeckActions } from './DeckActionsContext';
export { useDeckStats } from './DeckStatsContext';
export { useSessionState } from './SessionContext';

/**
 * @deprecated Use useDeckStats, useDeckActions, or useSessionState instead.
 * This hook combines all contexts and will cause re-renders on any change.
 */
export const useDeck = () => {
  const stats = useDeckStats();
  const actions = useDeckActions();
  const session = useSessionState();

  return {
    ...stats,
    ...actions,
    ...session,
    // Map legacy properties if needed
    reviewsToday: session.reviewsToday,
    dataVersion: 0, // Legacy
  };
};

/**
 * @deprecated Use useDeckStats or useSessionState instead.
 */
export const useDeckState = () => {
  const stats = useDeckStats();
  const session = useSessionState();
  return { ...stats, ...session, dataVersion: 0 };
};

/**
 * @deprecated Use useDeckActions instead.
 */
export const useDeckDispatch = () => {
  return useDeckActions();
};

## contexts/DeckStatsContext.tsx
import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import { DeckStats, ReviewHistory } from '@/types';
import { useDeckStatsQuery, useDueCardsQuery, useHistoryQuery } from '@/features/deck/hooks/useDeckQueries';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSessionState } from './SessionContext';
import { applyStudyLimits, isNewCard } from '@/services/studyLimits';
import { getUTCDateString } from '@/constants';
import { getSRSDate } from '@/features/study/logic/srs';

interface DeckStatsState {
    stats: DeckStats;
    history: ReviewHistory;
    isLoading: boolean;
}

const DeckStatsContext = createContext<DeckStatsState | undefined>(undefined);

export const DeckStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const settings = useSettingsStore(s => s.settings);
    const { reviewsToday } = useSessionState();

    const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
    const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
    const { data: history, isLoading: historyLoading } = useHistoryQuery();

    const isLoading = statsLoading || dueCardsLoading || historyLoading;

    // State for streak stats to update asynchronously without blocking render
    const [streakStats, setStreakStats] = useState({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
    const workerRef = useRef<Worker | null>(null);

    // Initialize worker on mount
    useEffect(() => {
        // Create worker instance
        workerRef.current = new Worker(
            new URL('@/services/db/workers/stats.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Set up message handler
        workerRef.current.onmessage = (e: MessageEvent) => {
            const { currentStreak, longestStreak, totalReviews } = e.data;
            setStreakStats({ currentStreak, longestStreak, totalReviews });
        };

        // Cleanup on unmount
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    // Calculate streak stats using web worker
    useEffect(() => {
        if (!history || Object.keys(history).length === 0) {
            setStreakStats({ currentStreak: 0, longestStreak: 0, totalReviews: 0 });
            return;
        }

        if (!workerRef.current) return;

        // Get today and yesterday strings
        const srsToday = getSRSDate(new Date());
        const todayStr = getUTCDateString(srsToday);
        const srsYesterday = new Date(srsToday);
        srsYesterday.setDate(srsYesterday.getDate() - 1);
        const yesterdayStr = getUTCDateString(srsYesterday);

        // Send calculation task to worker
        workerRef.current.postMessage({
            action: 'calculate_streaks',
            history,
            todayStr,
            yesterdayStr
        });

    }, [history]);

    const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
    const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;

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
    }, [dbStats, dueCards, reviewsToday, currentNewLimit, currentReviewLimit, streakStats]);

    const value = useMemo(() => ({
        stats,
        history: history || {},
        isLoading
    }), [stats, history, isLoading]);

    return (
        <DeckStatsContext.Provider value={value}>
            {children}
        </DeckStatsContext.Provider>
    );
};

export const useDeckStats = () => {
    const context = useContext(DeckStatsContext);
    if (context === undefined) {
        throw new Error('useDeckStats must be used within a DeckStatsProvider');
    }
    return context;
};

## contexts/GamificationContext.tsx
import React, { createContext, useContext } from 'react';
import { db } from '@/services/db/dexie';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';

interface GamificationContextType {
    incrementXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { profile, refreshProfile } = useProfile();

    const incrementXP = (amount: number) => {
        if (!profile || !user) return;

        const newXP = (profile.xp || 0) + amount;
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;





        db.profile.update(user.id, {
            xp: newXP,
            points: (profile.points || 0) + amount,
            level: newLevel,
            updated_at: new Date().toISOString()
        }).then(() => {
            refreshProfile();
        }).catch(console.error);
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
        throw new Error('useGamification must be used within GamificationProvider');
    }
    return context;
};

## contexts/MusicContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MusicContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MUSIC_URL = '/music/medieval.mp3';

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.log("Autoplay prevented:", e);
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
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
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
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};


## contexts/ProfileContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, LocalProfile } from '@/services/db/dexie';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ProfileContextType {
    profile: LocalProfile | null;
    loading: boolean;
    createLocalProfile: (username: string, languageLevel?: string) => Promise<void>;
    updateUsername: (username: string) => Promise<void>;
    updateLanguageLevel: (level: string) => Promise<void>;
    markInitialDeckGenerated: (userId?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<LocalProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            const existingProfile = await db.profile.get(user.id);
            setProfile(existingProfile || null);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const createLocalProfile = async (username: string, languageLevel?: string) => {
        const userId = user?.id || 'local-user';

        const newProfile: LocalProfile = {
            id: userId,
            username,
            xp: 0,
            points: 0,
            level: 1,
            language_level: languageLevel,
            initial_deck_generated: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await db.profile.put(newProfile);
        setProfile(newProfile);
        toast.success('Profile created!');
    };

    const updateUsername = async (newUsername: string) => {
        if (!profile || !user) return;

        await db.profile.update(user.id, {
            username: newUsername,
            updated_at: new Date().toISOString()
        });

        setProfile(prev => prev ? { ...prev, username: newUsername } : null);
    };

    const updateLanguageLevel = async (level: string) => {
        if (!profile || !user) return;

        await db.profile.update(user.id, {
            language_level: level,
            updated_at: new Date().toISOString()
        });

        setProfile(prev => prev ? { ...prev, language_level: level } : null);
    };

    const markInitialDeckGenerated = async (userId?: string) => {
        const targetUserId = userId || user?.id;
        if (!targetUserId) {
            console.error('[ProfileContext] markInitialDeckGenerated: No user ID available');
            return;
        }

        console.log('[ProfileContext] markInitialDeckGenerated: Starting update for user', targetUserId);

        // Optimistic update
        setProfile(prev => prev ? { ...prev, initial_deck_generated: true } : null);

        try {
            await db.profile.update(targetUserId, {
                initial_deck_generated: true,
                updated_at: new Date().toISOString()
            });
            console.log('[ProfileContext] markInitialDeckGenerated: DB update successful');

            // Force a refresh from DB to ensure consistency
            await fetchProfile();
            console.log('[ProfileContext] markInitialDeckGenerated: Profile refreshed');
        } catch (error) {
            console.error('[ProfileContext] markInitialDeckGenerated: Failed to update profile', error);
            // Revert optimistic update on failure (optional, but good practice)
            // For now, we'll just throw, as the app state might be inconsistent
            throw error;
        }
    };

    return (
        <ProfileContext.Provider
            value={{
                profile,
                loading,
                createLocalProfile,
                updateUsername,
                updateLanguageLevel,
                markInitialDeckGenerated,
                refreshProfile: fetchProfile
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
};

## contexts/SessionContext.tsx
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Card } from '@/types';
import { useReviewsTodayQuery } from '@/features/deck/hooks/useDeckQueries';

interface SessionState {
    reviewsToday: { newCards: number; reviewCards: number };
    lastReview: { card: Card; date: string; xpEarned: number } | null;
    canUndo: boolean;
    isLoading: boolean;
}

interface SessionDispatch {
    setLastReview: (review: { card: Card; date: string; xpEarned: number } | null) => void;
    getLastReview: () => { card: Card; date: string; xpEarned: number } | null;
    clearLastReview: () => void;
}

const SessionStateContext = createContext<SessionState | undefined>(undefined);
const SessionDispatchContext = createContext<SessionDispatch | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: reviewsToday, isLoading } = useReviewsTodayQuery();
    const [lastReview, setLastReviewState] = useState<{ card: Card; date: string; xpEarned: number } | null>(null);

    // We need a ref-like getter for actions to avoid circular dependencies or stale closures if we used state directly in callbacks
    // But since we are splitting contexts, we can just expose the setter.

    const setLastReview = useCallback((review: { card: Card; date: string; xpEarned: number } | null) => {
        setLastReviewState(review);
    }, []);

    const clearLastReview = useCallback(() => {
        setLastReviewState(null);
    }, []);

    // Helper to get current value imperatively if needed (though usually passed via state)
    // Actually, for the Actions context to use it without subscribing to State context updates, 
    // we might need a mutable ref approach or just accept that Actions context might need to read from State context?
    // No, Actions context shouldn't depend on State context values if we want to avoid re-renders.
    // But undoReview NEEDS lastReview.
    // So Actions context will likely need to consume SessionStateContext, which means it WILL re-render when session changes.
    // That's fine, as long as the *consumers* of Actions don't re-render if they only use the functions.
    // But if ActionsContext value depends on SessionState, then ActionsContext value changes, causing consumers to re-render.
    // Solution: Use a Ref for lastReview in the provider, and expose a getter.

    const lastReviewRef = React.useRef<{ card: Card; date: string; xpEarned: number } | null>(null);

    const setLastReviewWithRef = useCallback((review: { card: Card; date: string; xpEarned: number } | null) => {
        lastReviewRef.current = review;
        setLastReviewState(review);
    }, []);

    const clearLastReviewWithRef = useCallback(() => {
        lastReviewRef.current = null;
        setLastReviewState(null);
    }, []);

    const getLastReview = useCallback(() => {
        return lastReviewRef.current;
    }, []);

    const stateValue = useMemo(() => ({
        reviewsToday: reviewsToday || { newCards: 0, reviewCards: 0 },
        lastReview,
        canUndo: !!lastReview,
        isLoading
    }), [reviewsToday, lastReview, isLoading]);

    const dispatchValue = useMemo(() => ({
        setLastReview: setLastReviewWithRef,
        getLastReview,
        clearLastReview: clearLastReviewWithRef
    }), [setLastReviewWithRef, getLastReview, clearLastReviewWithRef]);

    return (
        <SessionStateContext.Provider value={stateValue}>
            <SessionDispatchContext.Provider value={dispatchValue}>
                {children}
            </SessionDispatchContext.Provider>
        </SessionStateContext.Provider>
    );
};

export const useSessionState = () => {
    const context = useContext(SessionStateContext);
    if (context === undefined) {
        throw new Error('useSessionState must be used within a SessionProvider');
    }
    return context;
};

export const useSessionDispatch = () => {
    const context = useContext(SessionDispatchContext);
    if (context === undefined) {
        throw new Error('useSessionDispatch must be used within a SessionProvider');
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
    setTheme: () => {}, 
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

## contexts/UserProfileContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/db/dexie';

interface LocalProfile {
    id: string;
}

interface UserProfileContextType {
    profile: LocalProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<LocalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const count = await db.profile.where('id').equals(LOCAL_USER_ID).count();
            if (count > 0) {
                setProfile({ id: LOCAL_USER_ID });
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
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
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

## features/auth/AuthPage.tsx
import React, { useState } from 'react';
import { ArrowRight, Command, ArrowLeft, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LanguageLevelSelector, DeckGenerationStep, AuthLayout } from './components';
import { LanguageSelector } from './components/LanguageSelector';
import { generateInitialDeck } from '@/features/deck/services/deckGeneration';
import { saveAllCards } from '@/services/db/repositories/cardRepository';
import { updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { Difficulty, Card, Language, LanguageId } from '@/types';
import { GamePanel, GameButton, GameInput, GameLoader } from '@/components/ui/game-ui';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { v4 as uuidv4 } from 'uuid';

type SetupStep = 'username' | 'language' | 'level' | 'deck';

export const AuthPage: React.FC = () => {
  const { createLocalProfile, markInitialDeckGenerated } = useProfile();
  const { login } = useAuth();

  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [setupStep, setSetupStep] = useState<SetupStep>('username');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    setSetupStep('language');
  };

  const handleLanguageSelected = (language: Language) => {
    updateSettings({ language });
    setSetupStep('level');
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSetupStep('deck');
  };

  const handleDeckSetup = async (language: Language, useAI: boolean, apiKey?: string) => {
    if (!selectedLevel) return;
    setLoading(true);

    try {
      await createLocalProfile(username.trim(), selectedLevel);

      if (useAI && apiKey) {
        await updateUserSettings('local-user', { geminiApiKey: apiKey });
      }

      let cards: Card[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
        toast.success(`Generated ${cards.length} personalized cards!`);
      } else {
        const rawDeck =
          language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
            (language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
              (language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));

        cards = rawDeck.map(c => ({
          ...c,
          id: uuidv4(),
          dueDate: new Date().toISOString(),
          tags: [...(c.tags || []), selectedLevel]
        }));
        toast.success(`Loaded ${cards.length} starter cards!`);
      }

      if (cards.length > 0) {
        await saveAllCards(cards);
      }

      await markInitialDeckGenerated('local-user');
      await login();

      // Fallback: If we haven't been redirected, force a reload to ensure app state picks up the profile
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center my-8">

      <h1 className="text-2xl font-bold tracking-tight font-ui uppercase text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        Begin your journey
      </p>
    </div>
  );

  const renderUsernameStep = () => (
    <form onSubmit={handleUsernameSubmit} className="space-y-4">
      <GameInput
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        icon={<UserIcon size={16} />}
        required
        minLength={3}
        maxLength={20}
      />

      <GameButton type="submit" className="w-full mt-2">
        Continue <ArrowRight size={16} />
      </GameButton>
    </form>
  );

  if (loading && setupStep === 'deck') {
    return (
      <AuthLayout>
        <GamePanel variant="ornate" className="text-center py-12">
          <GameLoader size="lg" text="Forging your deck..." />
          <p className="mt-6 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </GamePanel>
      </AuthLayout>
    );
  }

  if (setupStep === 'language') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('username')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Select Language</h2>
          </div>
          <LanguageSelector
            selectedLanguage={settings.language}
            onSelect={handleLanguageSelected}
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  if (setupStep === 'level') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('language')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  if (setupStep === 'deck') {
    return (
      <AuthLayout className="max-w-2xl">
        <GamePanel variant="ornate" showCorners>
          <div className="mb-6 flex items-center gap-4">
            <GameButton variant="ghost" size="sm" onClick={() => setSetupStep('level')}>
              <ArrowLeft size={16} /> Back
            </GameButton>
            <h2 className="text-xl font-bold font-ui uppercase">Deck Configuration</h2>
          </div>
          <DeckGenerationStep
            language={settings.language}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </GamePanel>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <GamePanel variant="ornate" showCorners className="py-8 px-6 md:px-8">
        {renderHeader()}
        {renderUsernameStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </GamePanel>
    </AuthLayout>
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
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { LanguageLevelSelector } from './components/LanguageLevelSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { DeckGenerationStep } from './components/DeckGenerationStep';
import { Difficulty, Card, Language, LanguageId } from '@/types';
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
  const { user, signOut } = useAuth();
  const { markInitialDeckGenerated } = useProfile();
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const [step, setStep] = useState<'language' | 'level' | 'deck'>('language');
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);

  const handleLanguageSelected = (language: Language) => {
    updateSettings({ language });
    setStep('level');
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setStep('deck');
  };

  const handleDeckComplete = async (language: Language, useAI: boolean, apiKey?: string) => {
    if (!user || !selectedLevel) return;

    try {

      if (useAI && apiKey) {
        await updateUserSettings(user.id, { geminiApiKey: apiKey });
      }


      let cards: Card[] = [];

      if (useAI && apiKey) {
        cards = await generateInitialDeck({
          language,
          proficiencyLevel: selectedLevel,
          apiKey,
        });
      } else {

        const rawDeck =
          language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
            (language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
              (language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));

        cards = rawDeck.map(c => ({
          ...c,
          id: uuidv4(),
          dueDate: new Date().toISOString(),
          tags: [...(c.tags || []), selectedLevel]
        }));
      }



      if (cards.length > 0) {
        console.log('[OnboardingFlow] Saving', cards.length, 'cards...');
        await saveAllCards(cards);
        toast.success(`Loaded ${cards.length} cards into your deck.`);
        console.log('[OnboardingFlow] Cards saved.');
      }


      console.log('[OnboardingFlow] Marking initial deck as generated...');
      await markInitialDeckGenerated();
      console.log('[OnboardingFlow] Initial deck marked as generated.');

      // Fallback: If we haven't been redirected after 2 seconds, force a reload
      setTimeout(() => {
        console.log('[OnboardingFlow] Redirection fallback triggered. Reloading...');
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Onboarding failed:', error);
      toast.error(error.message || 'Setup failed. Please try again.');
      throw error;
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
              {step === 'language' ? 'Select Language.' : (step === 'level' ? 'Proficiency Level.' : 'Initialize Deck.')}
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              {step === 'language' ? 'Step 1 of 3' : (step === 'level' ? 'Step 2 of 3' : 'Step 3 of 3')}
            </p>
          </div>
        </div>

        {/* Steps */}
        {step === 'language' && (
          <LanguageSelector
            selectedLanguage={settings.language}
            onSelect={handleLanguageSelected}
          />
        )}

        {step === 'level' && (
          <div className="flex flex-col gap-6">
            <LanguageLevelSelector
              selectedLevel={selectedLevel}
              onSelectLevel={handleLevelSelected}
            />
            <button
              onClick={() => setStep('language')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Back to Language Selection
            </button>
          </div>
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
import { ArrowRight, User } from 'lucide-react';
import { ButtonLoader } from '@/components/game';
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
            How should we <br /> call you?
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
                <ButtonLoader />
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

## features/auth/components/AuthLayout.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.015] dark:opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 10L30 15L25 10Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className={cn("relative w-full max-w-md z-10", className)}>
        {children}
      </div>
    </div>
  );
};


## features/auth/components/DeckGenerationStep.tsx
import React, { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from "framer-motion";
import { Difficulty, Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { GameButton, GameInput, GameLoader } from '@/components/ui/game-ui';

interface DeckGenerationStepProps {
    language: Language;
    proficiencyLevel: Difficulty;
    onComplete: (language: Language, useAI: boolean, apiKey?: string) => Promise<void>;
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
            await onComplete(language, selectedOption === 'ai', selectedOption === 'ai' ? apiKey : undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to complete setup');
            setLoading(false);
        }
    };

    const getLanguagePrompt = (lang: Language) => {
        switch (lang) {
            case LanguageId.Polish:
                return "Generate a starter deck for learning Polish (A1 level). Include basic greetings, numbers, and essential verbs.";
            case LanguageId.Norwegian:
                return "Generate a starter deck for learning Norwegian (Bokmål). Include common phrases and daily vocabulary.";
            case LanguageId.Japanese:
                return "Generate a starter deck for learning Japanese (N5 level). Include hiragana/katakana basics and simple kanji.";
            case LanguageId.Spanish:
                return "Generate a starter deck for learning Spanish (A1 level). Include essential travel phrases and core vocabulary.";
            default:
                return "Generate a starter deck for learning this language.";
        }
    };
    const languageName = language === LanguageId.Norwegian ? 'Norwegian' :
        (language === LanguageId.Japanese ? 'Japanese' :
            (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
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
                    className={cn(
                        'group relative w-full text-left p-4 border-2 transition-all duration-200',
                        'hover:bg-amber-400/5 hover:border-amber-400/30 disabled:opacity-50',
                        selectedOption === 'ai'
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-border/40 bg-card'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-amber-400/10 border border-amber-400/20 rotate-45 flex items-center justify-center">
                            <Sparkles size={16} className="text-amber-400 -rotate-45" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-ui font-bold uppercase tracking-wider",
                                selectedOption === 'ai' ? "text-amber-400" : "text-foreground"
                            )}>
                                AI-Generated Deck
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                Generate 50 personalized flashcards using Gemini AI, tailored to {proficiencyLevel} level.
                                Requires your API key.
                            </p>
                        </div>
                    </div>

                    {selectedOption === 'ai' && (
                        <>
                            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                        </>
                    )}
                </button>

                {/* Default Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('default')}
                    disabled={loading}
                    className={cn(
                        'group relative w-full text-left p-4 border-2 transition-all duration-200',
                        'hover:bg-amber-400/5 hover:border-amber-400/30 disabled:opacity-50',
                        selectedOption === 'default'
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-border/40 bg-card'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-amber-400/10 border border-amber-400/20 rotate-45 flex items-center justify-center">
                            <BookOpen size={16} className="text-amber-400 -rotate-45" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-ui font-bold uppercase tracking-wider",
                                selectedOption === 'default' ? "text-amber-400" : "text-foreground"
                            )}>
                                Standard Course
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                Start with our curated beginner deck. Best for getting started quickly.
                            </p>
                        </div>
                    </div>

                    {selectedOption === 'default' && (
                        <>
                            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                        </>
                    )}
                </button>
            </div>

            {/* API Key Input */}
            {selectedOption === 'ai' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <GameInput
                        label="Gemini API Key"
                        type="password"
                        placeholder="Enter your API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        error={error}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Your key is stored locally and only used for deck generation.
                    </p>
                </div>
            )}

            {/* Action Button */}
            {selectedOption && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <GameButton
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <GameLoader size="sm" />
                        ) : (
                            selectedOption === 'ai' ? 'Generate Deck' : 'Start Learning'
                        )}
                    </GameButton>
                </div>
            )}
        </div>
    );
};


## features/auth/components/LanguageLevelSelector.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

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
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <div className="grid gap-3">
                {LEVELS.map(({ level, name, description }) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onSelectLevel(level)}
                        className={cn(
                            'group relative w-full text-left p-4 border-2 transition-all duration-200',
                            'hover:bg-amber-400/5 hover:border-amber-400/30',
                            selectedLevel === level
                                ? 'border-amber-400 bg-amber-400/10'
                                : 'border-border/40 bg-card'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 w-5 h-5 flex items-center justify-center transition-colors rotate-45 border',
                                    selectedLevel === level
                                        ? 'border-amber-400 bg-amber-400'
                                        : 'border-muted-foreground/30 group-hover:border-amber-400/50'
                                )}
                            >
                                {selectedLevel === level && (
                                    <Check size={12} className="text-background -rotate-45" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        "text-sm font-ui font-bold uppercase tracking-wider",
                                        selectedLevel === level ? "text-amber-400" : "text-foreground"
                                    )}>
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Corner accents for selected item */}
                        {selectedLevel === level && (
                            <>
                                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};


## features/auth/components/LanguageSelector.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { LANGUAGE_NAMES } from '@/constants';

interface LanguageSelectorProps {
    selectedLanguage: Language | null;
    onSelect: (lang: Language) => void;
}

const LANGUAGES: { id: Language; name: string; flag: string }[] = [
    { id: LanguageId.Polish, name: "Polish", flag: "🇵🇱" },
    { id: LanguageId.Norwegian, name: "Norwegian", flag: "🇳🇴" },
    { id: LanguageId.Japanese, name: "Japanese", flag: "🇯🇵" },
    { id: LanguageId.Spanish, name: "Spanish", flag: "🇪🇸" },
    { id: LanguageId.German, name: "German", flag: "🇩🇪" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onSelect,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    Select the language you want to learn.
                </p>
            </div>

            <div className="grid gap-3">
                {LANGUAGES.map(({ id, name, flag }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={cn(
                            'group relative w-full text-left p-4 border-2 transition-all duration-200',
                            'hover:bg-amber-400/5 hover:border-amber-400/30',
                            selectedLanguage === id
                                ? 'border-amber-400 bg-amber-400/10'
                                : 'border-border/40 bg-card'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 w-5 h-5 flex items-center justify-center transition-colors rotate-45 border',
                                    selectedLanguage === id
                                        ? 'border-amber-400 bg-amber-400'
                                        : 'border-muted-foreground/30 group-hover:border-amber-400/50'
                                )}
                            >
                                {selectedLanguage === id && (
                                    <Check size={12} className="text-background -rotate-45" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg">{flag}</span>
                                    <span className={cn(
                                        "text-sm font-ui font-bold uppercase tracking-wider",
                                        selectedLanguage === id ? "text-amber-400" : "text-foreground"
                                    )}>
                                        {name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Corner accents for selected item */}
                        {selectedLanguage === id && (
                            <>
                                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

## features/auth/components/index.ts
export * from './AuthLayout';
export * from './DeckGenerationStep';
export * from './LanguageLevelSelector';


## features/dashboard/components/Dashboard.tsx
import React, { useMemo } from 'react';
import {
  Activity,
  Zap,
  Trophy,
  BookOpen,
  Sparkles,
  Target,
  Star,
  Circle,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, format } from 'date-fns';

import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { getLevelProgress, cn } from '@/lib/utils';

import {
  GamePanel,
  GameSectionHeader,
  GameDivider,
  LevelBadge,
  StreakDisplay,
  GameEmptyState,
  getRankForLevel
} from '@/components/ui/game-ui';

import { MusicControl } from './MusicControl';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

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
  languageXp
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { profile } = useProfile();

  const levelData = getLevelProgress(languageXp.xp);
  const rank = getRankForLevel(levelData.level);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.015] dark:opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 10L30 15L25 10Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1200px] mx-auto">

        {/* Music Control */}
        <MusicControl />

        {/* === CHARACTER BANNER SECTION === */}
        <section className="mb-8 md:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-6">

            {/* Left: Character Card / Profile */}
            <div className="relative">
              <GamePanel
                variant="ornate"
                size="md"
                showCorners
                className="h-full bg-linear-to-br from-card via-card to-primary/5"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-0.5 bg-linear-to-r from-transparent via-primary/60 to-transparent" />

                {/* Level Emblem */}
                <div className="flex flex-col items-center pt-2 pb-2">
                  <LevelBadge
                    level={levelData.level}
                    xp={languageXp.xp}
                    progressPercent={levelData.progressPercent}
                    xpToNextLevel={levelData.xpToNextLevel}
                    showDetails={false}
                  />

                  {/* Rank Title */}
                  <div className="mt-2 text-center">
                    <div className="flex items-center justify-center gap-3 mb-1">
                      <span className="w-6 h-px bg-primary/40" />
                      <span className={cn("text-[10px] font-bold uppercase tracking-[0.25em]", rank.color)}>
                        {rank.title}
                      </span>
                      <span className="w-6 h-px bg-primary/40" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground tracking-wide">
                      Level {levelData.level}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                  <span className="flex-1 h-px bg-border/50" />
                  <span className="w-2 h-2 rotate-45 bg-primary/40" />
                  <span className="flex-1 h-px bg-border/50" />
                </div>

                {/* Stats - Attribute Style */}
                <div className="space-y-0">
                  <div className="genshin-attr-row">
                    <span className="attr-label text-sm flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                      Total XP
                    </span>
                    <span className="attr-value">{languageXp.xp.toLocaleString()}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary/60" />
                      Next Level
                    </span>
                    <span className="attr-value">{levelData.xpToNextLevel.toLocaleString()} XP</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500/60" />
                      Points
                    </span>
                    <span className="attr-value">{profile?.points?.toLocaleString() ?? '0'}</span>
                  </div>
                  <div className="genshin-attr-row">
                    <span className="attr-label flex text-sm items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-sky-500/60" />
                      Total Reviews
                    </span>
                    <span className="attr-value">{stats.totalReviews.toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                    <span>Progress</span>
                    <span>{Math.round(levelData.progressPercent)}%</span>
                  </div>
                  <div className="relative h-2 bg-muted/40 border border-border/40">
                    <div
                      className={cn("h-full transition-all duration-700", rank.accentColor)}
                      style={{ width: `${levelData.progressPercent}%` }}
                    />
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/30" />
                    <span className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary/30" />
                  </div>
                </div>
              </GamePanel>
            </div>

            {/* Right: Mission Panel */}
            <div className="space-y-4">
              {/* Main Quest Card - Genshin Impact Style */}
              <div className="relative group/quest">
                {/* Outer glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-sm opacity-0 group-hover/quest:opacity-100 transition-opacity duration-500 blur-xl" />

                <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border border-amber-700/40 overflow-hidden">

                  {/* Top ornate border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-600/80 to-transparent" />

                  {/* Corner ornaments */}
                  <svg className="absolute top-0 left-0 w-12 h-12 text-amber-600/70" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                    <rect x="32" y="4" width="6" height="1" fill="currentColor" opacity="0.4" />
                  </svg>
                  <svg className="absolute top-0 right-0 w-12 h-12 text-amber-600/70 rotate-90" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                    <rect x="32" y="4" width="6" height="1" fill="currentColor" opacity="0.4" />
                  </svg>
                  <svg className="absolute bottom-0 left-0 w-12 h-12 text-amber-600/70 -rotate-90" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                  </svg>
                  <svg className="absolute bottom-0 right-0 w-12 h-12 text-amber-600/70 rotate-180" viewBox="0 0 48 48" fill="none">
                    <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
                    <path d="M4 4H28V5H5V28H4V4Z" fill="currentColor" opacity="0.5" />
                  </svg>

                  {/* Quest ribbon/banner */}
                  <div className=" px-5 pt-5 mx-auto flex justify-around pb-3">
                    <div className="flex justify-evenly gap-4 mx-auto">
                      <div className="flex-1 flex-col mx-auto">
                        {/* Quest type badge */}
                        <div className="items-center text-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 bg-amber-600 rotate-45 animate-pulse" />
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.25em]">
                            Daily Commission
                          </span>
                          <span className="w-8 h-px bg-gradient-to-r from-amber-600/60 to-transparent" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground ">
                          Study Session
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Decorative separator */}
                  <div className="flex items-center gap-3 px-5">
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                    <span className="w-1 h-1 rotate-45 bg-amber-500/60" />
                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                  </div>

                  {/* Due count display - Central focus */}
                  <div className="flex items-center justify-center py-6 px-5">
                    <div className="text-center">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 mb-3">


                        {/* Diamond frame */}
                        <div className="absolute inset-4 border-2 border-amber-600/50 rotate-45" />
                        <div className="absolute inset-6 border border-amber-600/30 rotate-45" />

                        {/* Number with glow */}
                        <div className="relative">
                          <span className={cn(
                            "absolute inset-0 font-semibold text-amber-400/30 blur-sm font-serif",
                            stats.due >= 1000 ? "text-xl md:text-2xl" : stats.due >= 100 ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                          )}>
                            {stats.due}
                          </span>
                          <span className={cn(
                            "relative font-semibold text-foreground tabular-nums font-serif",
                            stats.due >= 1000 ? "text-xl md:text-2xl" : stats.due >= 100 ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                          )}>
                            {stats.due}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium tracking-wide">
                        {stats.due === 0 ? 'All caught up!' : 'Cards awaiting review'}
                      </p>
                    </div>
                  </div>

                  {/* Rewards preview - Genshin loot style */}
                  <div className="px-5 pb-5">
                    <div className="text-[10px] text-amber-600/80 font-semibold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="w-4 h-px bg-amber-600/40" />
                      Session Details
                      <span className="flex-1 h-px bg-amber-700/30" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="relative group/reward bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-700/30 p-3 hover:border-amber-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex items-center justify-center bg-amber-500/10 rounded-4xl">

                            <Star className="w-5 h-5 text-amber-400 " fill="currentColor" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.newDue}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">New Cards</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative group/reward bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-700/30 p-3 hover:border-sky-600/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex items-center justify-center bg-sky-500/10 rounded-4xl">

                            <Activity className="w-5 h-5 text-sky-400 " />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-foreground tabular-nums">{stats.reviewDue}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reviews</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigate button - Quest accept style */}
                    <button
                      onClick={onStartSession}
                      disabled={stats.due === 0}
                      className={cn(
                        "group/btn relative w-full overflow-hidden",
                        "transition-all duration-300",
                        stats.due > 0
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      {/* Button background with animated gradient */}
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        stats.due > 0
                          ? "bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 group-hover/btn:from-amber-500/30 group-hover/btn:via-amber-400/25 group-hover/btn:to-amber-500/30"
                          : "bg-gradient-to-r from-emerald-500/20 via-emerald-400/15 to-emerald-500/20"
                      )} />

                      {/* Borders */}
                      <div className={cn(
                        "absolute inset-0 border-2 transition-colors",
                        stats.due > 0
                          ? "border-amber-600/50 group-hover/btn:border-amber-500/80"
                          : "border-emerald-600/40"
                      )} />

                      {/* Inner border */}
                      <div className={cn(
                        "absolute inset-1 border transition-colors",
                        stats.due > 0
                          ? "border-amber-700/30 group-hover/btn:border-amber-600/40"
                          : "border-emerald-700/20"
                      )} />

                      {/* Top shine line */}
                      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                      <div className="relative py-4 px-6">
                        {stats.due > 0 ? (
                          <div className="flex items-center justify-center gap-4">
                            <span className="w-6 h-px bg-amber-500/50 group-hover/btn:w-10 group-hover/btn:bg-amber-400 transition-all duration-300" />
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-500 opacity-60" />
                            <span className="text-base font-bold tracking-[0.35em] text-amber-600 dark:text-amber-300 uppercase">
                              Navigate
                            </span>

                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-500 opacity-60" />
                            <span className="w-6 h-px bg-amber-500/50 group-hover/btn:w-10 group-hover/btn:bg-amber-400 transition-all duration-300" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-semibold tracking-[0.25em] text-emerald-600 dark:text-emerald-300 uppercase">
                              Commission Complete
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Bottom ornate border */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
                </div>
              </div>

              {/* Streak Display */}
              <GamePanel size="md" glowOnHover className="bg-linear-to-r from-card to-amber-500/5">
                <StreakDisplay
                  currentStreak={stats.streak}
                  lastSevenDays={lastSevenDays}
                  isAtRisk={isStreakAtRisk}
                />
              </GamePanel>
            </div>
          </div>
        </section>

        <GameDivider />

        {/* === CARD COLLECTION === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader
            title="Card Collection"
            subtitle="Your vocabulary inventory"
            icon={<BookOpen className="w-4 h-4" strokeWidth={1.5} />}
          />

          {hasNoCards ? (
            <GameEmptyState
              icon={BookOpen}
              title="Empty Inventory"
              description="Your card collection is empty. Add cards to start building your vocabulary."
              action={{ label: 'Add Cards', onClick: () => { } }}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <InventorySlot
                icon={<Circle className="w-4 h-4" />}
                label="New"
                value={metrics.new}
                description="Unseen cards"
                color="sky"
              />
              <InventorySlot
                icon={<Clock className="w-4 h-4" />}
                label="Learning"
                value={metrics.learning}
                description="In progress"
                color="amber"
              />
              <InventorySlot
                icon={<Activity className="w-4 h-4" />}
                label="Reviewing"
                value={metrics.reviewing}
                description="Mature cards"
                color="violet"
              />
              <InventorySlot
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Mastered"
                value={metrics.known}
                description="Fully learned"
                color="pine"
              />
            </div>
          )}
        </section>

        {/* === ADVENTURE LOG === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader
            title="Adventure Log"
            subtitle="Your study history over time"
            icon={<Activity className="w-4 h-4" strokeWidth={1.5} />}
          />

          {hasNoActivity ? (
            <GameEmptyState
              icon={Activity}
              title="No Adventures Yet"
              description="Complete your first study session to begin logging your journey."
              action={{ label: 'Start Adventure', onClick: onStartSession }}
            />
          ) : (
            <GamePanel size="md">
              <Heatmap history={history} />
            </GamePanel>
          )}
        </section>

        {/* === ATTRIBUTES === */}
        <section className="mb-8 md:mb-10">
          <GameSectionHeader
            title="Attributes"
            subtitle="Performance metrics and trends"
            icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
          />

          {hasNoActivity ? (
            <GameEmptyState
              icon={Sparkles}
              title="Stats Locked"
              description="Complete some reviews to unlock performance attributes."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              <GamePanel size="md">
                <ChartHeader
                  icon={<Activity className="w-3.5 h-3.5 text-sky-500" />}
                  title="Review Volume"
                />
                <div className="min-h-[180px] md:min-h-[200px]">
                  {isRevlogLoading ? (
                    <ChartSkeleton />
                  ) : revlogStats ? (
                    <ReviewVolumeChart data={revlogStats.activity} />
                  ) : (
                    <ChartEmpty />
                  )}
                </div>
              </GamePanel>

              <GamePanel size="md">
                <ChartHeader
                  icon={<Target className="w-3.5 h-3.5 text-pine-500" />}
                  title="Retention Rate"
                />
                <div className="min-h-[180px] md:min-h-[200px]">
                  {isRevlogLoading ? (
                    <ChartSkeleton />
                  ) : revlogStats ? (
                    <TrueRetentionChart
                      data={revlogStats.retention}
                      targetRetention={settings.fsrs.request_retention}
                    />
                  ) : (
                    <ChartEmpty />
                  )}
                </div>
              </GamePanel>
            </div>
          )}
        </section>

        {/* === DECK ANALYSIS === */}
        <section className="mb-8">
          <GameSectionHeader
            title="Deck Analysis"
            subtitle="Card stability and health metrics"
            icon={<Zap className="w-4 h-4" strokeWidth={1.5} />}
          />

          {hasNoCards ? (
            <GameEmptyState
              icon={Activity}
              title="No Data"
              description="Add cards to your deck to see analysis metrics."
            />
          ) : (
            <GamePanel size="md">
              <RetentionStats cards={cards} />
            </GamePanel>
          )}
        </section>
      </div>
    </div>
  );
};


interface InventorySlotProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  color: 'sky' | 'amber' | 'violet' | 'pine';
  onClick?: () => void;
}

const colorConfig = {
  sky: {
    border: 'border-sky-500/30 hover:border-sky-500/50',
    bg: 'bg-sky-500/10',
    text: 'text-sky-500',
    accent: 'bg-sky-500',
  },
  amber: {
    border: 'border-amber-600/30 hover:border-amber-600/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    accent: 'bg-amber-500',
  },
  violet: {
    border: 'border-violet-500/30 hover:border-violet-500/50',
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    accent: 'bg-violet-500',
  },
  pine: {
    border: 'border-pine-500/30 hover:border-pine-500/50',
    bg: 'bg-pine-500/10',
    text: 'text-pine-500',
    accent: 'bg-pine-500',
  },
};

function InventorySlot({ icon, label, value, description, color, onClick }: InventorySlotProps) {
  const colors = colorConfig[color];
  const isInteractive = !!onClick;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-card border-2 p-4 transition-all duration-200",
        colors.border,
        isInteractive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent, "opacity-60")} />

      {/* Corner accents on hover */}
      <div className={cn("absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />
      <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity", colors.border.split(' ')[0])} />

      {/* Icon */}
      <div className={cn("w-9 h-9 flex items-center justify-center mb-3 border", colors.border.split(' ')[0], colors.bg)}>
        <span className={colors.text}>{icon}</span>
      </div>

      {/* Label */}
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="text-3xl font-semibold text-foreground tabular-nums">
        {value.toLocaleString()}
      </p>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground/60 mt-1 font-medium">
        {description}
      </p>
    </div>
  );
}

function ChartHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
      {icon}
      <h4 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h4>
    </div>
  );
}

const ChartSkeleton: React.FC = () => (
  <div className="h-full w-full flex items-end gap-1 animate-pulse">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-muted/50"
        style={{ height: `${20 + Math.random() * 60}%` }}
      />
    ))}
  </div>
);

const ChartEmpty: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center">
    <p className="text-xs text-muted-foreground font-medium">No data available</p>
  </div>
);


## features/dashboard/components/GradeDistributionChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface GradeDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
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
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Answer Distribution</h3>
      </div>
      
      <div className="flex-1 flex items-center gap-8">
        <div className="h-[160px] w-[160px] shrink-0 relative">
            <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                        )
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
    const dayOfWeek = startDate.getDay(); 
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

  
  
  const getColorStyle = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    if (count <= 2) return 'bg-pine-200 dark:bg-pine-900';
    if (count <= 5) return 'bg-pine-400 dark:bg-pine-700';
    if (count <= 9) return 'bg-pine-500 dark:bg-pine-500';
    return 'bg-pine-600 dark:bg-pine-400';
  };

  
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      return history[dateKey] || 0;
    });
    
    const weekTotal = last7Days.reduce((sum, count) => sum + count, 0);
    const activeDays = last7Days.filter(count => count > 0).length;
    
    return { weekTotal, activeDays, last7Days: last7Days.reverse() };
  }, [history]);

  return (
    <TooltipProvider>
      {/* Mobile Summary View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              This Week
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.weekTotal} <span className="text-sm text-muted-foreground">reviews</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Active Days
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.activeDays}<span className="text-sm text-muted-foreground">/7</span>
            </p>
          </div>
        </div>
        
        {/* Mini week view for mobile */}
        <div className="flex gap-1.5 justify-between">
          {stats.last7Days.map((count, i) => {
            const date = subDays(new Date(), 6 - i);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-ui">
                  {format(date, 'EEE').charAt(0)}
                </span>
                <div 
                  className={clsx(
                    "w-full aspect-square rounded-sm transition-colors",
                    getColorStyle(count)
                  )}
                />
                <span className="text-[9px] text-muted-foreground tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Full Heatmap */}
      <div className="hidden md:block w-full overflow-x-auto overflow-y-hidden lg:overflow-x-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-block min-w-max py-2 lg:w-full">
          <div className="grid grid-rows-7 grid-flow-col gap-1 lg:gap-1">
            {calendarData.map((day) => (
              <Tooltip key={day.dateKey} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={clsx(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-3 lg:h-3 rounded-sm transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-pine-500/50",
                      day.inFuture ? 'opacity-0 pointer-events-none' : getColorStyle(day.count)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-card text-foreground px-4 py-2.5 rounded-xl border border-border"
                >
                  <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 font-ui">
                    {format(day.date, 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm font-light tabular-nums">
                    {day.count} review{day.count === 1 ? '' : 's'}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-[9px] text-muted-foreground font-ui">
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
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {/* Labels */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[9px] font-sans uppercase tracking-widest text-muted-foreground">Current Level</span>
          <span className="text-sm font-medium font-sans">{level}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-sans uppercase tracking-widest text-muted-foreground">Next Level</span>
          <span className="text-xs font-sans text-muted-foreground">-{progressData.xpRemaining.toLocaleString()} XP</span>
        </div>
      </div>
      {/* Bar */}
      <Progress value={progressData.percentage} className="h-1 bg-muted" />
    </div>
  );
};


## features/dashboard/components/MusicControl.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { cn } from '@/lib/utils';

export const MusicControl = () => {
  const { isPlaying, togglePlay } = useMusic();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-center justify-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="mr-3 bg-[#3B4255]/90 backdrop-blur-md text-[#ECE5D8] px-3 py-1.5 rounded-lg border border-[#D3BC8E]/30 text-xs font-serif tracking-wider shadow-lg whitespace-nowrap"
          >
            {isPlaying ? "Medieval Atmosphere" : "Music Paused"}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center",
          "bg-[#3B4255] border-2 border-[#D3BC8E]",
          "shadow-[0_0_15px_rgba(0,0,0,0.5)]",
          "cursor-pointer overflow-hidden transition-colors hover:bg-[#4B5265]"
        )}
      >
        {/* Inner decorative circle */}
        <div className="absolute inset-1 rounded-full border border-[#D3BC8E]/30" />
        
        {/* Icon */}
        <div className="relative z-10">
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-[#ECE5D8] drop-shadow-md" />
          ) : (
            <VolumeX className="w-5 h-5 text-[#ECE5D8]/70" />
          )}
        </div>
      </motion.button>
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

interface ChartDataItem {
  label: string;
  count: number;
  fullDate?: Date;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataItem }>;
  label?: string;
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

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-4 py-3 rounded-md">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">{label}</div>
          <div className="text-sm font-normal tabular-nums mt-1">{payload[0].value}</div>
        </div>
      );
    }
    return null;
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-light font-ui">
        No data available
      </div>
    );
  }

  return (
    <>
        {/* Forecast Chart */}
        <div className="flex flex-col h-48 md:h-56 min-w-0 w-full">
            <div className="flex items-baseline justify-between mb-6 md:mb-8 min-w-0 gap-2">
                <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50 truncate">Workload Forecast</h3>
                <div className="flex gap-3 md:gap-6 shrink-0">
                    {(['7d', '1m', '1y'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setForecastRange(range)}
                            className={clsx(
                                "text-[9px] font-mono uppercase tracking-[0.2em] transition-all pb-1",
                                forecastRange === range 
                                    ? "text-foreground border-b-2 border-primary" 
                                    : "text-muted-foreground/40 hover:text-muted-foreground"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
                            axisLine={false}
                            tickLine={false}
                            interval={forecastRange === '1m' ? 2 : 0}
                            dy={12}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.foreground, opacity: 0.05 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={28}>
                            {forecastData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Stability Chart */}
        <div className="flex flex-col h-48 md:h-56 min-w-0 w-full mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between mb-6 md:mb-8 min-w-0 gap-2">
                <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50 truncate">Memory Stability</h3>
                <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] shrink-0">
                    Retention Interval
                </div>
            </div>
            
            <div className="flex-1 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stabilityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            dy={12}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.foreground, opacity: 0.05 }} />
                        <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={28}>
                             {stabilityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors.foreground} fillOpacity={0.4 + (index * 0.07)} />
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
import { BarChart, Bar, XAxis, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useChartColors } from '@/hooks/useChartColors';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const colors = useChartColors();

  const chartConfig = {
    count: {
      label: "Reviews",
      color: "hsl(var(--foreground))",
    },
  } satisfies ChartConfig

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
              axisLine={false}
              tickLine={false}
              interval={2}
              dy={12}
            />
            <ChartTooltip 
              cursor={{ fill: colors.foreground, opacity: 0.05 }}
              content={
                <ChartTooltipContent 
                  hideLabel 
                  className="w-[150px]"
                  formatter={(value, name, item, index, payload) => (
                    <>
                      <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {payload.date}
                      </div>
                      <div className="text-sm font-normal tabular-nums text-foreground">
                        {value} reviews
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="var(--color-count)"
                  fillOpacity={entry.count === 0 ? 0.05 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};


## features/dashboard/components/TrueRetentionChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useChartColors } from '@/hooks/useChartColors';

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({ data, targetRetention }) => {
  const colors = useChartColors();
  const targetPercent = targetRetention * 100;

  const chartConfig = {
    rate: {
      label: "Pass Rate",
      color: "hsl(var(--foreground))",
    },
  } satisfies ChartConfig

  const hasData = data.some(d => d.rate !== null);

  if (!hasData) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-px bg-muted-foreground/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
          </div>
        </div>
        <div className="flex-1 min-h-[150px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground font-medium">No retention data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-px bg-muted-foreground/30" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              interval={4}
              dy={12}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              cursor={{ stroke: colors.foreground, strokeWidth: 1, opacity: 0.1 }}
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
            <ReferenceLine y={targetPercent} stroke={colors.mutedForeground} strokeDasharray="4 4" opacity={0.3} strokeWidth={1} />
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


## features/deck/components/AddCardModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles, Scroll, BookOpen, PenLine, Languages, Tag, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana, cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { GenshinCorners, DiamondDivider, CornerAccents } from "@/components/game/GamePanel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (card: Card) => void;
    initialCard?: Card;
}

const formSchema = z.object({
    sentence: z.string().min(1, "Sentence is required"),
    targetWord: z.string().optional(),
    targetWordTranslation: z.string().optional(),
    targetWordPartOfSpeech: z.string().optional(),
    translation: z.string().min(1, "Translation is required"),
    notes: z.string().optional(),
    furigana: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.targetWord && data.sentence) {
        try {
            if (!data.sentence.toLowerCase().includes(data.targetWord.toLowerCase())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Target word provided but not found in sentence",
                    path: ["targetWord"],
                });
            }
        } catch (e) {
            // Fallback
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
    const settings = useSettingsStore(s => s.settings);
    const [isGenerating, setIsGenerating] = useState(false);
    const isMounted = React.useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasOpen = useRef(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sentence: "",
            targetWord: "",
            targetWordTranslation: "",
            targetWordPartOfSpeech: "",
            translation: "",
            notes: "",
            furigana: ""
        }
    });

    // Watch values for preview
    const watchedSentence = watch("sentence");
    const watchedTargetWord = watch("targetWord");

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            if (initialCard) {
                reset({
                    sentence: initialCard.targetSentence,
                    targetWord: initialCard.targetWord || "",
                    targetWordTranslation: initialCard.targetWordTranslation || "",
                    targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
                    translation: initialCard.nativeTranslation,
                    notes: initialCard.notes,
                    furigana: initialCard.furigana || ""
                });
            } else {
                reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
            }

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                }
            }, 100);
        }
        wasOpen.current = isOpen;
    }, [isOpen, initialCard, settings.language, reset]);

    const handleAutoFill = async () => {
        const currentSentence = watch("sentence");
        if (!currentSentence) return;
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }
        setIsGenerating(true);
        try {
            const targetLanguage = initialCard?.language || settings.language;
            const result = await aiService.generateCardContent(currentSentence, targetLanguage, settings.geminiApiKey);

            if (isMounted.current) {
                if (targetLanguage === LanguageId.Japanese && result.furigana) {
                    setValue("sentence", result.furigana);
                }

                setValue("translation", result.translation);
                if (result.targetWord) setValue("targetWord", result.targetWord);
                if (result.targetWordTranslation) setValue("targetWordTranslation", result.targetWordTranslation);
                if (result.targetWordPartOfSpeech) setValue("targetWordPartOfSpeech", result.targetWordPartOfSpeech);
                setValue("notes", result.notes);
                if (result.furigana) setValue("furigana", result.furigana);

                toast.success("Content generated");
            }
        } catch (e) {
            if (isMounted.current) toast.error("Generation failed");
        } finally {
            if (isMounted.current) setIsGenerating(false);
        }
    };

    const onSubmit = (data: FormValues) => {
        const cardBase = initialCard || { id: uuidv4(), status: "new", interval: 0, easeFactor: 2.5, dueDate: new Date().toISOString(), reps: 0, lapses: 0 } as Card;

        const targetLanguage = initialCard?.language || settings.language;
        let targetSentence = data.sentence;
        let furigana = data.furigana || undefined;

        if (targetLanguage === LanguageId.Japanese) {
            furigana = data.sentence;
            targetSentence = parseFurigana(data.sentence).map(s => s.text).join("");
        }

        const newCard: Card = {
            ...cardBase,
            targetSentence: targetSentence,
            targetWord: data.targetWord || undefined,
            targetWordTranslation: data.targetWordTranslation || undefined,
            targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
            nativeTranslation: data.translation,
            notes: data.notes,
            furigana: furigana,
            language: targetLanguage
        };
        onAdd(newCard);
        reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
        onClose();
    };


    const HighlightedPreview = useMemo(() => {
        if (!watchedSentence) return null;

        const targetLanguage = initialCard?.language || settings.language;

        if (targetLanguage === LanguageId.Japanese) {
            const segments = parseFurigana(watchedSentence);
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {segments.map((segment, i) => {
                        const isTarget = watchedTargetWord && segment.text === watchedTargetWord;
                        if (segment.furigana) {
                            return (
                                <ruby key={i} className="group mr-1" style={{ rubyAlign: 'center' }}>
                                    <span className={isTarget ? "text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5" : "text-foreground"}>{segment.text}</span>
                                    <rt className="text-xs text-amber-400/50 font-normal select-none font-ui tracking-wide text-center" style={{ textAlign: 'center' }}>{segment.furigana}</rt>
                                </ruby>
                            );
                        }
                        return <span key={i} className={isTarget ? "text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5" : ""}>{segment.text}</span>;
                    })}
                </div>
            );
        }

        if (!watchedTargetWord) return null;
        try {
            const parts = watchedSentence.split(new RegExp(`(${escapeRegExp(watchedTargetWord)})`, "gi"));
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {parts.map((part, i) => part.toLowerCase() === watchedTargetWord.toLowerCase() ? <span key={i} className="text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
                </div>
            );
        } catch (e) {
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {watchedSentence}
                </div>
            );
        }
    }, [watchedSentence, watchedTargetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 bg-card border-2 border-amber-700/30 dark:border-amber-600/25 gap-0 overflow-hidden animate-genshin-fade-in [&>button]:z-30 [&>button]:right-5 [&>button]:top-5">

                {/* Ornate Corner Decorations */}
                <GenshinCorners className="text-amber-500/70 dark:text-amber-400/60" />

                {/* Inner decorative frame */}
                <div className="absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10" />

                <DialogDescription className="sr-only">Form to add or edit a flashcard</DialogDescription>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full relative z-0">

                    {/* Top Section: Header with ornate styling - pr-12 gives space for close button */}
                    <div className="px-8 pr-14 pt-8 pb-6 bg-gradient-to-br from-amber-600/10 via-transparent to-transparent dark:from-amber-400/10">

                        {/* Header Row */}
                        <div className="flex justify-between items-center mb-6">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                                    <span className="w-4 h-px bg-amber-600/40" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Scroll size={16} className="text-amber-500/70" />
                                    <span className="font-serif text-base tracking-[0.15em] text-amber-700 dark:text-amber-400/90 uppercase">
                                        {initialCard ? "Edit Entry" : "New Entry"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-px bg-amber-600/40" />
                                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                                </div>
                            </DialogTitle>

                            {/* Auto-Fill Button - Genshin Style */}
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isGenerating || !watchedSentence}
                                className={cn(
                                    "group relative flex items-center gap-2.5 px-4 py-2",
                                    "border border-amber-800/80 hover:border-amber-500/60",
                                    "bg-amber-600/5 hover:bg-amber-600/15",
                                    "transition-all duration-200",
                                    "disabled:opacity-40 disabled:cursor-not-allowed",
                                    isGenerating && "animate-border-flow"
                                )}
                            >
                                {/* Button corner accents */}
                                <CornerAccents className="border-amber-900/80" />

                                <Sparkles size={14} className={cn(
                                    "transition-all duration-200",
                                    isGenerating ? "text-amber-800 animate-pulse" : "text-amber-800/80 group-hover:text-amber-500"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-ui font-semibold uppercase tracking-[0.15em]",
                                    isGenerating ? "text-amber-800" : "text-amber-800/80 group-hover:text-amber-500"
                                )}>
                                    {isGenerating ? "Analyzing..." : "Auto-Fill"}
                                </span>
                            </button>
                        </div>

                        {/* Sentence Input Area */}
                        <div className="relative">
                            <textarea
                                {...register("sentence")}
                                ref={(e) => {
                                    register("sentence").ref(e);
                                    // @ts-ignore
                                    textareaRef.current = e;
                                }}
                                placeholder="Type your sentence here..."
                                className="w-full text-2xl md:text-3xl font-light bg-transparent border-none outline-none placeholder:text-amber-700/40 dark:placeholder:text-amber-400/15 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground min-h-[80px]"
                                rows={1}
                                style={{ fieldSizing: 'content' } as any}
                            />
                            {errors.sentence && <span className="text-red-500 text-sm mt-1">{errors.sentence.message}</span>}
                            {HighlightedPreview}
                        </div>
                    </div>

                    {/* Ornate Divider */}
                    <DiamondDivider className="mx-8 my-1" />

                    {/* Bottom Section: Form Fields with Genshin styling */}
                    <div className="px-8 py-6 space-y-6 bg-gradient-to-tl from-amber-600/10 via-transparent to-transparent dark:from-amber-400/10">

                        {/* Translation & Target Word Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Translation Field */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <Languages size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Translation
                                </label>
                                <input
                                    {...register("translation")}
                                    placeholder="e.g., This is a house."
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
                                />
                                {errors.translation && <span className="text-red-500 text-xs">{errors.translation.message}</span>}
                            </div>

                            {/* Target Word Field */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <BookOpen size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Target Word
                                </label>
                                <input
                                    {...register("targetWord")}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
                                />
                                {errors.targetWord && <span className="text-red-500 text-xs">{errors.targetWord.message}</span>}
                            </div>
                        </div>

                        {/* Target Word Translation & Part of Speech Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Target Word Translation */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <PenLine size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Word Translation
                                </label>
                                <input
                                    {...register("targetWordTranslation")}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
                                />
                            </div>

                            {/* Part of Speech */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <Tag size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Part of Speech
                                </label>
                                <select
                                    {...register("targetWordPartOfSpeech")}
                                    className="w-full bg-card border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                                >
                                    <option value="">Select POS</option>
                                    <option value="noun">Noun</option>
                                    <option value="verb">Verb</option>
                                    <option value="adjective">Adjective</option>
                                    <option value="adverb">Adverb</option>
                                    <option value="pronoun">Pronoun</option>
                                </select>
                            </div>
                        </div>

                        {/* Context Notes */}
                        <div className="space-y-3 group">
                            <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                <FileText size={12} className="opacity-70" />
                                <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                Context Notes
                            </label>
                            <textarea
                                {...register("notes")}
                                placeholder="Add any usage notes or context..."
                                className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-base font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 transition-colors resize-none min-h-[60px]"
                            />
                        </div>

                        {/* Submit Button - Genshin Primary Button Style */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="group relative inline-flex items-center gap-3 bg-amber-600/15 hover:bg-amber-600/25 active:bg-amber-600/35 text-amber-700 dark:text-amber-400 border-2 border-amber-600/50 hover:border-amber-500/70 px-8 py-3.5 transition-all duration-200"
                            >
                                {/* Button corner accents */}
                                <CornerAccents position="all" size="md" className="border-amber-500" />

                                {/* Diamond accent */}
                                <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/70 group-hover:bg-amber-500 transition-colors" />

                                <span className="text-[11px] font-serif font-semibold uppercase tracking-[0.2em]">
                                    Save Entry
                                </span>
                                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                        </div>
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
import { Activity, Clock, Target, Zap, X as XIcon, History, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GenshinCorners, DiamondDivider, InnerFrame } from '@/components/game/GamePanel';


interface CardHistoryModalProps {
  card: Card | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const StatBox = ({
  label,
  value,
  subtext,
  icon
}: {
  label: string,
  value: string | number,
  subtext?: string,
  icon?: React.ReactNode
}) => (
  <div className="relative group flex flex-col justify-center p-5 bg-card/30 border border-amber-700/10 hover:border-amber-600/30 hover:bg-amber-600/5 transition-all duration-300">
    {/* Corner accent on hover */}
    <span className="absolute top-0 left-0 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/60" />
      <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/60" />
    </span>
    <span className="absolute bottom-0 right-0 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/60" />
      <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/60" />
    </span>

    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-amber-600/60 dark:text-amber-500/60 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{icon}</span>}
      <span className="text-[10px] font-serif uppercase tracking-[0.15em] text-muted-foreground group-hover:text-amber-700/80 dark:group-hover:text-amber-400/80 transition-colors">{label}</span>
    </div>
    <span className="text-3xl font-serif tracking-wide tabular-nums text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-100 transition-colors">{value}</span>
    {subtext && <span className="text-[10px] text-muted-foreground/60 mt-1 font-sans tracking-wide">{subtext}</span>}
  </div>
);

const TimelineEvent = ({ label, dateStr }: { label: string, dateStr?: string }) => {
  if (!dateStr || !isValid(parseISO(dateStr))) return null;
  const date = parseISO(dateStr);

  return (
    <div className="relative group flex items-center justify-between py-3 border-b border-amber-700/10 last:border-0 hover:bg-amber-600/5 px-2 transition-colors rounded-sm">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/40 group-hover:bg-amber-500 transition-colors" />
        <span className="text-xs font-serif uppercase tracking-[0.1em] text-muted-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{label}</span>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-sm font-medium text-foreground/90 tabular-nums">{format(date, 'PPP')}</span>
        <span className="text-[10px] text-muted-foreground/50 font-sans">{formatDistanceToNow(date, { addSuffix: true })}</span>
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

  const getStateColor = (state?: number) => {
    if (state === 0) return 'border-amber-600/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'; if (state === 1) return 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400'; if (state === 2) return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'; if (state === 3) return 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'; return 'border-slate-500/50 bg-slate-500/10 text-slate-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 bg-gradient-to-b from-background via-background to-card border-2 border-amber-700/30 dark:border-amber-600/25 overflow-hidden gap-0 [&>button]:hidden">
        {/* Ornate Genshin corners */}
        <GenshinCorners />

        {/* Inner decorative frame */}
        <InnerFrame />

        {/* Floating diamond decorations */}
        <span className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse" />

        <div className="overflow-y-auto relative z-20 custom-scrollbar">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onClose}
              className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 border border-transparent hover:border-amber-600/30 bg-card/50 hover:bg-amber-600/10 transition-all group rounded-sm"
            >
              <XIcon size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Header */}
          <div className="p-8 md:p-10 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center border border-amber-600/40 bg-amber-600/10 rotate-45">
                  <History size={18} className="text-amber-600 dark:text-amber-500 -rotate-45" strokeWidth={1.5} />
                </div>
                <div>
                  <DialogTitle className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-500/60 block">
                    Archive
                  </DialogTitle>
                  <span className="text-lg font-serif tracking-wide text-foreground">Card Details</span>
                </div>
              </div>

              <div className={cn(
                "relative px-4 py-1.5 border text-[10px] font-serif uppercase tracking-[0.15em] mr-8",
                getStateColor(card.state)
              )}>
                {/* Status badge corner accents */}
                <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute top-0 left-0 w-full h-0.5 bg-current opacity-50" />
                  <span className="absolute top-0 left-0 h-full w-0.5 bg-current opacity-50" />
                </span>
                <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-current opacity-50" />
                  <span className="absolute bottom-0 right-0 h-full w-0.5 bg-current opacity-50" />
                </span>
                {getFsrsLabel(card.state)}
              </div>
            </div>

            <DiamondDivider className="mb-8" />

            <div className="space-y-4 text-center">
              <h2 className="text-3xl md:text-4xl font-serif tracking-wide text-foreground leading-tight">
                {card.targetSentence}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed italic">
                {card.nativeTranslation}
              </p>
            </div>
            <DialogDescription className="sr-only">Detailed statistics for this flashcard</DialogDescription>
          </div>

          {/* Stats Grid */}
          <div className="px-8 md:px-10 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                label="Total Reviews"
                value={card.reps || 0}
                subtext="Repetitions"
                icon={<Activity size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Lapses"
                value={card.lapses || 0}
                subtext="Forgotten count"
                icon={<Zap size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Stability"
                value={`${stability}d`}
                subtext="Retention Interval"
                icon={<Target size={14} strokeWidth={1.5} />}
              />
              <StatBox
                label="Difficulty"
                value={`${(card.difficulty || 0).toFixed(1)}`}
                subtext={difficultyPercent > 60 ? "High Difficulty" : "Normal Range"}
                icon={<Clock size={14} strokeWidth={1.5} />}
              />
            </div>
          </div>

          {/* Footer: Timeline */}
          <div className="mx-8 md:mx-10 mb-10 bg-card/40 border border-amber-700/10 p-6 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar size={100} />
            </div>

            <div className="flex items-center gap-3 mb-4 relative z-10">
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/60" />
              <h3 className="text-[10px] font-serif uppercase tracking-[0.15em] text-muted-foreground">
                Chronicle
              </h3>
              <span className="flex-1 h-px bg-gradient-to-r from-amber-600/20 to-transparent" />
            </div>

            <div className="space-y-1 relative z-10">
              <TimelineEvent label="Created" dateStr={card.first_review || card.dueDate} />
              <TimelineEvent label="Last Seen" dateStr={card.last_review} />
              <TimelineEvent label="Next Due" dateStr={card.dueDate} />
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

## features/deck/components/CardList.tsx
import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { getCardColumns } from './CardTableColumns';
import { GamePanel } from '@/components/ui/game-ui';
import { RowSelectionState } from '@tanstack/react-table';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onViewHistory: (card: Card) => void;
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
    const newSelectedIds = new Set(Object.keys(newSelection).filter(id => newSelection[id]));
    const currentSelectedIds = selectedIds;

    newSelectedIds.forEach(id => {
      if (!currentSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });

    currentSelectedIds.forEach(id => {
      if (!newSelectedIds.has(id)) {
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
          onToggleSelect(id, index, false);
        }
      }
    });
  };

  const columns = useMemo(
    () => getCardColumns({
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
        <GamePanel className="p-6 md:p-14 border-dashed flex flex-col items-center justify-center text-center max-w-md" glowOnHover>
          {/* Decorative container with diamond shape */}
          <div className="relative mb-8">
            <div className="w-20 h-20 border border-border/60 flex items-center justify-center rotate-45">
              <BookOpen className="w-7 h-7 text-muted-foreground/40 -rotate-45" strokeWidth={1.5} />
            </div>
            {/* Enhanced corner accents */}
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute top-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute top-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary/40" />
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 pointer-events-none">
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/40" />
              <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/40" />
            </span>
            {/* Center diamond accent */}
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-primary/50" />
          </div>
          <h3 className="text-xl font-light text-foreground mb-2 tracking-tight">No cards found</h3>
          <p className="text-sm text-muted-foreground/60 font-light font-ui">
            Your collection appears to be empty
          </p>
          {/* Decorative line */}
          <div className="flex items-center gap-2 mt-6 w-full max-w-[200px]">
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
            <span className="flex-1 h-px bg-gradient-to-r from-border/60 via-border/40 to-transparent" />
            <span className="w-1 h-1 rotate-45 bg-border/40" />
            <span className="flex-1 h-px bg-gradient-to-l from-border/60 via-border/40 to-transparent" />
            <span className="w-1.5 h-1.5 rotate-45 bg-border/60" />
          </div>
        </GamePanel>
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

## features/deck/components/CardTableColumns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Card } from "@/types"
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
    Bookmark
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, parseISO, isValid, format } from "date-fns"

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, {
        label: string;
        icon: React.ReactNode;
        className: string;
    }> = {
        new: {
            label: 'New',
            icon: <Star className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />,
            className: 'text-primary bg-primary/10 border-primary/30'
        },
        learning: {
            label: 'Learning',
            icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
        },
        graduated: {
            label: 'Review',
            icon: <Clock className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30'
        },
        known: {
            label: 'Mastered',
            icon: <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />,
            className: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        },
    }

    const config = statusConfig[status] || statusConfig.new

    return (
        <span
            className={cn(
                "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-all border rounded-sm",
                // Corner accents via pseudo-elements
                "before:absolute before:-top-px before:-left-px before:w-1.5 before:h-1.5 before:border-t-2 before:border-l-2 before:border-current before:opacity-40 before:pointer-events-none",
                "after:absolute after:-bottom-px after:-right-px after:w-1.5 after:h-1.5 after:border-b-2 after:border-r-2 after:border-current after:opacity-40 after:pointer-events-none",
                config.className
            )}
        >
            {config.icon}
            {config.label}
        </span>
    )
}

const ScheduleCell = ({ dateStr, status, interval }: { dateStr: string, status: string, interval: number }) => {
    if (status === 'new') {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                <span className="text-xs font-medium uppercase tracking-wider">Awaiting</span>
            </div>
        )
    }

    const date = parseISO(dateStr)
    if (!isValid(date)) return <span className="text-muted-foreground/40 text-xs">—</span>

    if (date.getFullYear() === 1970) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-sm">
                <Zap className="w-3 h-3" strokeWidth={2} fill="currentColor" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Priority</span>
            </div>
        )
    }

    const isPast = date < new Date()

    return (
        <div className="space-y-0.5">
            <p className={cn(
                "text-sm font-medium tabular-nums font-editorial",
                isPast ? "text-destructive" : "text-foreground"
            )}>
                {format(date, 'MMM d')}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {interval > 0 && `${interval}d • `}
                {formatDistanceToNow(date, { addSuffix: true })}
            </p>
        </div>
    )
}

const SortableHeader = ({
    column,
    children
}: {
    column: any;
    children: React.ReactNode
}) => {
    const isSorted = column.getIsSorted()

    return (
        <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-2 hover:text-primary transition-colors group"
        >
            <span className="w-1 h-1 rotate-45 bg-primary/40 group-hover:bg-primary transition-colors" />
            {children}
            {isSorted === "asc" ? (
                <ArrowUp className="w-3 h-3 text-primary" />
            ) : isSorted === "desc" ? (
                <ArrowDown className="w-3 h-3 text-primary" />
            ) : (
                <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    )
}

interface ColumnActions {
    onEditCard: (card: Card) => void
    onDeleteCard: (id: string) => void
    onViewHistory: (card: Card) => void
    onPrioritizeCard: (id: string) => void
    onToggleSelect?: (id: string, index: number, isShift: boolean) => void
}

export function getCardColumns(actions: ColumnActions): ColumnDef<Card>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ? true :
                                table.getIsSomePageRowsSelected() ? "indeterminate" : false
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary-foreground"
                    />
                </div>
            ),
            cell: ({ row, table }) => {
                const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (actions.onToggleSelect) {
                        const rowIndex = table.getRowModel().rows.findIndex(r => r.id === row.id);
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
                            onCheckedChange={() => { }}
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
            header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
            cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
            size: 120,
        },

        {
            accessorKey: "targetWord",
            header: ({ column }) => <SortableHeader column={column}>Word</SortableHeader>,
            cell: ({ row }) => {
                const word = row.original.targetWord
                const pos = row.original.targetWordPartOfSpeech

                if (!word) return <span className="text-muted-foreground/40">—</span>

                return (
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-base">{word}</p>
                        {pos && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{pos}</p>
                        )}
                    </div>
                )
            },
            size: 140,
        },

        {
            accessorKey: "targetSentence",
            header: ({ column }) => <SortableHeader column={column}>Sentence</SortableHeader>,
            cell: ({ row }) => (
                <p className="text-sm font-light text-foreground/90 line-clamp-2 max-w-[300px]">
                    {row.getValue("targetSentence")}
                </p>
            ),
            filterFn: "includesString",
        },

        {
            accessorKey: "nativeTranslation",
            header: "Translation",
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground font-light line-clamp-2 max-w-[250px]">
                    {row.getValue("nativeTranslation")}
                </p>
            ),
        },

        {
            accessorKey: "dueDate",
            header: ({ column }) => <SortableHeader column={column}>Due</SortableHeader>,
            cell: ({ row }) => (
                <ScheduleCell
                    dateStr={row.getValue("dueDate")}
                    status={row.original.status}
                    interval={row.original.interval}
                />
            ),
            size: 120,
        },

        // {
        //     accessorKey: "reps",
        //     header: ({ column }) => <SortableHeader column={column}>Reviews</SortableHeader>,
        //     cell: ({ row }) => {
        //         const reps = row.getValue("reps") as number
        //         return (
        //             <div className="flex items-center gap-2">
        //                 <span className="w-1 h-1 rotate-45 bg-muted-foreground/30" />
        //                 <span className="text-sm tabular-nums text-muted-foreground font-medium font-editorial">{reps || 0}</span>
        //             </div>
        //         )
        //     },
        //     size: 90,
        // },

        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const card = row.original

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
                            <DropdownMenuContent align="end" className="w-48 border-border bg-card p-1.5 text-foreground">
                                <DropdownMenuItem
                                    onClick={() => actions.onPrioritizeCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Zap size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Priority
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onViewHistory(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <History size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    History
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => actions.onEditCard(card)}
                                    className="text-sm cursor-pointer py-2 px-3 focus:bg-primary/10 focus:text-primary"
                                >
                                    <Pencil size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border" />
                                <DropdownMenuItem
                                    onClick={() => actions.onDeleteCard(card.id)}
                                    className="text-sm cursor-pointer py-2 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={14} className="mr-2.5 opacity-60" strokeWidth={1.5} />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            size: 50,
        },
    ]
}

## features/deck/components/GenerateCardsModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Sparkles, Check, X as XIcon, ArrowRight, BookOpen, Info, ChevronDown, Star, Scroll } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfile } from '@/contexts/ProfileContext';
import { getLearnedWords } from '@/services/db/repositories/cardRepository';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana, cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { GenshinCorners, DiamondDivider, InnerFrame } from '@/components/game/GamePanel';
import { useIsMobile } from '@/hooks/use-mobile';



const GenshinLoader = () => (
    <div className="relative w-10 h-10">
        <div
            className="absolute inset-0 border-2 border-amber-500/30 rotate-45"
            style={{ animation: 'spin 4s linear infinite' }}
        />
        <div
            className="absolute inset-1.5 border-2 border-amber-500/50 rotate-45"
            style={{ animation: 'spin 3s linear infinite reverse' }}
        />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rotate-45 animate-pulse" />
    </div>
);



interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: Card[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const settings = useSettingsStore(s => s.settings);
    const { profile } = useProfile();
    const isMobile = useIsMobile();
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);

    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(false);
    const [difficultyMode, setDifficultyMode] = useState<'beginner' | 'immersive'>('immersive');
    const [selectedLevel, setSelectedLevel] = useState<string>(profile?.language_level || 'A1');
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelDescriptions: Record<string, string> = {
        'A1': 'Beginner',
        'A2': 'Elementary',
        'B1': 'Intermediate',
        'B2': 'Upper Intermediate',
        'C1': 'Advanced',
        'C2': 'Proficient'
    };

    const [generatedData, setGeneratedData] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const handleGenerate = async () => {
        if (!instructions) {
            toast.error("Please enter instructions");
            return;
        }
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }

        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            const results = await aiService.generateBatchCards({
                instructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: selectedLevel,
                difficultyMode
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter(card => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }

            console.log('AI Generated Cards:', uniqueResults);
            console.log('First card sample:', uniqueResults[0]);

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_, i) => i)));
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
        const now = Date.now();
        const cardsToSave: Card[] = generatedData
            .filter((_, i) => selectedIndices.has(i))
            .map((item, index) => {
                return {
                    id: uuidv4(),
                    targetSentence: item.targetSentence,
                    nativeTranslation: item.nativeTranslation,
                    targetWord: item.targetWord,
                    targetWordTranslation: item.targetWordTranslation,
                    targetWordPartOfSpeech: item.targetWordPartOfSpeech,
                    notes: item.notes,
                    furigana: item.furigana,
                    language: settings.language,
                    status: 'new',
                    interval: 0,
                    easeFactor: 2.5,
                    dueDate: new Date(now + index * 1000).toISOString(),
                    reps: 0,
                    lapses: 0,
                    tags: ['AI-Gen', 'Custom']
                } as Card;
            });

        console.log('Cards being saved:', cardsToSave);
        console.log('First card to save:', cardsToSave[0]);

        onAddCards(cardsToSave);
        toast.success(`Added ${cardsToSave.length} cards to deck`);
        resetAndClose();
    };

    const handleSmartLesson = async () => {
        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            let topicInstructions = "";
            let derivedLevel = selectedLevel;

            if (learnedWords.length === 0) {
                const starters = [
                    "Basic Greetings & Introductions",
                    "Ordering Food & Drink",
                    "Numbers & Shopping",
                    "Family & Friends"
                ];
                topicInstructions = starters[Math.floor(Math.random() * starters.length)];
                setDifficultyMode('beginner');
            } else {
                const shuffled = [...learnedWords].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 100);

                topicInstructions = `Create a structured lesson that reviews and expands upon these known words: ${selected.join(', ')}. Create sentences that place these words in new contexts or combine them.`;
            }

            setInstructions(topicInstructions);
            const results = await aiService.generateBatchCards({
                instructions: topicInstructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: derivedLevel,
                difficultyMode
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter(card => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_, i) => i)));
            setStep('preview');

        } catch (e) {
            toast.error("Failed to generate smart lesson. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep('config');
        setInstructions('');
        setGeneratedData([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className={cn(
                "p-0 bg-gradient-to-b from-background via-background to-card border-2 border-amber-700/30 dark:border-amber-600/25 overflow-hidden gap-0 [&>button]:hidden",
                isMobile ? "max-w-[95vw] max-h-[90vh]" : "sm:max-w-4xl"
            )}>
                {/* Ornate Genshin corners */}
                <GenshinCorners />

                {/* Inner decorative frame */}
                <InnerFrame />

                {/* Floating diamond decorations */}
                <span className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse",
                    isMobile ? "top-3" : "top-6"
                )} />
                <span className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse",
                    isMobile ? "bottom-3" : "bottom-6"
                )} style={{ animationDelay: '0.5s' }} />

                <div className={cn(
                    "flex",
                    isMobile ? "flex-col h-[85vh] overflow-y-auto" : "flex-row h-[620px]"
                )}>
                    {/* Sidebar / Info Panel - Genshin Menu Style */}
                    <div className={cn(
                        "bg-gradient-to-b from-card/50 to-muted/20 flex flex-col relative overflow-hidden",
                        isMobile
                            ? "w-full p-4 border-b border-amber-700/20 dark:border-amber-600/15"
                            : "w-1/3 p-6 justify-between border-r border-amber-700/20 dark:border-amber-600/15"
                    )}>
                        {/* Decorative sidebar pattern */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className="absolute w-1 h-1 bg-amber-500/10 rotate-45"
                                    style={{
                                        left: `${20 + i * 15}%`,
                                        top: `${10 + i * 18}%`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Header with Genshin-style ornament */}
                        <div>
                            <div className={cn(
                                "flex items-center",
                                isMobile ? "gap-3 mb-4" : "gap-6 mb-8"
                            )}>
                                <div className="relative">
                                    <div className={cn(
                                        "flex items-center justify-center border-2 border-amber-600/40 bg-amber-600/10 rotate-45",
                                        isMobile ? "w-8 h-8" : "w-10 h-10"
                                    )}>
                                        <Scroll size={isMobile ? 16 : 20} className="text-amber-500 -rotate-45" strokeWidth={1.5} />
                                    </div>
                                    {/* Corner accents on icon */}
                                    <span className="absolute -top-1 -left-1 w-2 h-0.5 bg-amber-500/60" />
                                    <span className="absolute -top-1 -left-1 w-0.5 h-2 bg-amber-500/60" />
                                    <span className="absolute -bottom-1 -right-1 w-2 h-0.5 bg-amber-500/60" />
                                    <span className="absolute -bottom-1 -right-1 w-0.5 h-2 bg-amber-500/60" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-500/60 block">Arcane Forge</span>
                                    <span className={cn(
                                        "font-serif tracking-wide text-foreground",
                                        isMobile ? "text-base" : "text-lg"
                                    )}>Card Synthesis</span>
                                </div>
                            </div>

                            <DiamondDivider className={isMobile ? "mb-3" : "mb-6"} />

                            <div className={cn("space-y-6", isMobile && "space-y-4")}>
                                {/* Target Language Display */}
                                <div className={cn(
                                    "genshin-attr-row flex-col items-center gap-1",
                                    isMobile && "flex-row justify-between"
                                )}>
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Target Language</span>
                                    <span className={cn(
                                        "font-serif capitalize text-foreground tracking-wide",
                                        isMobile ? "text-lg" : "text-2xl"
                                    )}>{settings.language}</span>
                                </div>

                                {step === 'config' && (
                                    <div className={cn(
                                        "animate-genshin-fade-in",
                                        isMobile ? "grid grid-cols-2 gap-3" : "space-y-5"
                                    )}>
                                        {/* Card Quantity */}
                                        <div className={cn(
                                            "border-l-2 border-amber-600/30 pl-4",
                                            isMobile && "col-span-1"
                                        )}>
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Quantity
                                            </h3>
                                            <div className={cn(
                                                "flex items-baseline gap-2",
                                                isMobile ? "mb-2" : "mb-3"
                                            )}>
                                                <span className={cn(
                                                    "font-serif text-amber-600 dark:text-amber-500 tabular-nums",
                                                    isMobile ? "text-2xl" : "text-4xl"
                                                )}>{count[0]}</span>
                                                <span className="text-sm text-muted-foreground">cards</span>
                                            </div>
                                            <Slider
                                                value={count}
                                                onValueChange={setCount}
                                                min={3}
                                                max={100}
                                                step={1}
                                                className="py-2"
                                            />
                                        </div>

                                        {/* i+1 Toggle */}
                                        <div className={cn(
                                            "flex items-center gap-3 pl-4 py-2",
                                            isMobile && "col-span-1 items-start flex-col gap-2"
                                        )}>
                                            <Switch
                                                id="learned-words"
                                                checked={useLearnedWords}
                                                onCheckedChange={setUseLearnedWords}
                                            />
                                            <Label htmlFor="learned-words" className={cn(
                                                "text-sm text-muted-foreground cursor-pointer",
                                                isMobile && "text-xs"
                                            )}>
                                                Use Learned Words (i+1)
                                            </Label>
                                        </div>

                                        {/* Level Selector - Genshin dropdown style */}
                                        <div className={cn(
                                            "relative pl-4",
                                            isMobile && "col-span-1"
                                        )}>
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Mastery Level
                                            </h3>
                                            <button
                                                onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                                                className={cn(
                                                    "w-full flex items-center justify-between py-2.5 px-4 text-sm border border-amber-700/30 dark:border-amber-600/20 bg-card/50 hover:border-amber-600/50 transition-all group",
                                                    isMobile && "py-2 px-3"
                                                )}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 ">{selectedLevel}</span>
                                                    </span>
                                                    {!isMobile && <span className="text-muted-foreground text-xs">{levelDescriptions[selectedLevel]}</span>}
                                                </span>
                                                <ChevronDown size={14} className={cn(
                                                    "text-amber-500/60 transition-transform",
                                                    showLevelDropdown && "rotate-180"
                                                )} />
                                            </button>
                                            {showLevelDropdown && (
                                                <div className={cn(
                                                    "absolute left-4 right-0 mb-1 border border-amber-700/30 dark:border-amber-600/20 bg-card z-50 shadow-lg",
                                                    isMobile ? "top-full mt-1" : "bottom-full"
                                                )}>
                                                    {levels.map((level) => (
                                                        <button
                                                            key={level}
                                                            onClick={() => {
                                                                setSelectedLevel(level);
                                                                setShowLevelDropdown(false);
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 py-2.5 px-4 text-sm text-left hover:bg-amber-600/10 transition-colors",
                                                                selectedLevel === level && "bg-amber-600/15 border-l-2 border-amber-500",
                                                                isMobile && "py-2 px-3"
                                                            )}
                                                        >
                                                            <span className="w-5 h-5 flex items-center justify-center border border-amber-600/40 rotate-45">
                                                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 -rotate-45">{level}</span>
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">{levelDescriptions[level]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Progression Mode */}
                                        <div className={cn(
                                            "pl-4",
                                            isMobile && "col-span-1"
                                        )}>
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Learning Path
                                            </h3>
                                            <div className={cn(
                                                "grid gap-2",
                                                isMobile ? "grid-cols-1" : "grid-cols-2"
                                            )}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setDifficultyMode('beginner')}
                                                            className={cn(
                                                                "relative py-3 px-2 text-xs uppercase tracking-wider border transition-all flex flex-col items-center gap-1",
                                                                difficultyMode === 'beginner'
                                                                    ? "bg-amber-600/15 border-amber-600/50 text-amber-600 dark:text-amber-500"
                                                                    : "bg-card/30 border-amber-700/20 dark:border-amber-600/15 text-muted-foreground hover:border-amber-600/40"
                                                            )}
                                                        >
                                                            {difficultyMode === 'beginner' && (
                                                                <>
                                                                    <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500" />
                                                                </>
                                                            )}
                                                            <span className="font-serif text-[10px]">Zero to Hero</span>
                                                            <Info size={10} className="opacity-50" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="font-medium mb-1">Zero to Hero Path</p>
                                                        <p className="text-xs opacity-80">Starts with single words, then short phrases, building up to complete sentences.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setDifficultyMode('immersive')}
                                                            className={cn(
                                                                "relative py-3 px-2 text-xs uppercase tracking-wider border transition-all flex flex-col items-center gap-1",
                                                                difficultyMode === 'immersive'
                                                                    ? "bg-amber-600/15 border-amber-600/50 text-amber-600 dark:text-amber-500"
                                                                    : "bg-card/30 border-amber-700/20 dark:border-amber-600/15 text-muted-foreground hover:border-amber-600/40"
                                                            )}
                                                        >
                                                            {difficultyMode === 'immersive' && (
                                                                <>
                                                                    <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500" />
                                                                </>
                                                            )}
                                                            <span className="font-serif text-[10px]">Immersive</span>
                                                            <Info size={10} className="opacity-50" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="font-medium mb-1">Immersive Path</p>
                                                        <p className="text-xs opacity-80">Every card contains a complete, natural sentence for context-rich learning.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 'preview' && (
                                    <div className={cn(
                                        "animate-genshin-fade-in border-l-2 border-amber-600/30 pl-4",
                                        isMobile && "flex items-center justify-between"
                                    )}>
                                        <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                            <Star size={10} className="text-amber-500/60" />
                                            Selected
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className={cn(
                                                "font-serif text-amber-600 dark:text-amber-500 tabular-nums",
                                                isMobile ? "text-2xl" : "text-4xl"
                                            )}>{selectedIndices.size}</span>
                                            <span className="text-sm text-muted-foreground">of {generatedData.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>

                    {/* Main Content Area */}
                    <div className={cn(
                        "flex-1 flex flex-col bg-gradient-to-br from-card/30 via-transparent to-amber-600/5 relative",
                        isMobile ? "p-4" : "p-8"
                    )}>
                        {/* Close button with Genshin styling */}
                        <div className={cn(
                            "absolute z-10",
                            isMobile ? "top-2 right-2" : "top-4 right-4"
                        )}>
                            <button
                                onClick={resetAndClose}
                                className="relative w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 border border-transparent hover:border-amber-600/30 bg-card/50 hover:bg-amber-600/10 transition-all group"
                            >
                                <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <XIcon size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        {step === 'config' ? (
                            <div className={cn(
                                "flex-1 flex flex-col justify-center w-full animate-genshin-fade-in",
                                isMobile ? "max-w-full" : "max-w-xl mx-auto"
                            )}>
                                {/* Header section */}
                                <div className={cn(
                                    "text-center",
                                    isMobile ? "mb-4" : "mb-8"
                                )}>
                                    <div className={cn(
                                        "flex items-center justify-center gap-4 mb-4",
                                        isMobile && "gap-2 mb-2"
                                    )}>
                                        <span className={cn("h-px bg-amber-600/30", isMobile ? "w-8" : "w-12")} />
                                        <span className="w-2.5 h-2.5 rotate-45 border border-amber-600/50" />
                                        <span className={cn("h-px bg-amber-600/30", isMobile ? "w-8" : "w-12")} />
                                    </div>
                                    <h2 className={cn(
                                        "font-serif text-foreground mb-2 tracking-wide",
                                        isMobile ? "text-lg" : "text-2xl"
                                    )}>What would you like to learn?</h2>
                                    <p className={cn(
                                        "text-muted-foreground/70",
                                        isMobile ? "text-xs" : "text-sm"
                                    )}>Describe the topic, scenario, or vocabulary you wish to master</p>
                                </div>

                                {/* Textarea with Genshin styling */}
                                <div className="relative group">
                                    {/* Genshin corner accents */}
                                    <span className="absolute -top-px -left-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -left-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -right-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -right-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -left-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -left-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -right-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -right-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />

                                    <Textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                        className={cn(
                                            "bg-card/50 border border-amber-700/20 dark:border-amber-600/15 resize-none focus-visible:ring-0 focus-visible:border-amber-600/40 placeholder:text-muted-foreground/30 leading-relaxed",
                                            isMobile ? "h-24 max-h-24 text-sm p-4" : "h-40 max-h-40 text-base p-6"
                                        )}
                                        autoFocus
                                    />
                                </div>

                                {/* Generate Button - Genshin style */}
                                <div className={cn(
                                    "flex justify-center gap-4",
                                    isMobile ? "mt-4 flex-col gap-3" : "mt-8"
                                )}>
                                    <button
                                        onClick={handleSmartLesson}
                                        disabled={loading}
                                        className={cn(
                                            "relative group/btn inline-flex items-center justify-center gap-3",
                                            "bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-900",
                                            "border border-indigo-600/60 hover:border-indigo-400/60",
                                            "uppercase tracking-[0.1em] text-xs font-serif font-medium",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            isMobile ? "px-4 py-3 order-2" : "px-6 py-4"
                                        )}
                                    >
                                        <Sparkles size={16} className="text-indigo-900" />
                                        <span>Smart Lesson</span>
                                    </button>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !instructions}
                                        className={cn(
                                            "relative group/btn inline-flex items-center justify-center gap-3",
                                            "bg-amber-600/90 hover:bg-amber-600 text-white dark:text-amber-950",
                                            "border-2 border-amber-500",
                                            "uppercase tracking-[0.2em] text-sm font-serif font-semibold",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            "hover:shadow-[0_0_20px_-5px] hover:shadow-amber-500/40",
                                            isMobile ? "px-6 py-3 order-1" : "px-10 py-4"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-1 -left-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -top-1 -left-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                                        {loading ? (
                                            <>
                                                <GenshinLoader />
                                                <span>Forging...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>Generate</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full animate-genshin-fade-in">
                                {/* Preview Header */}
                                <div className={cn(
                                    "flex justify-between items-center",
                                    isMobile ? "mb-3" : "mb-5"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rotate-45 bg-amber-500/60" />
                                        <h2 className={cn(
                                            "font-serif text-foreground tracking-wide",
                                            isMobile ? "text-base" : "text-xl"
                                        )}>Review Cards</h2>
                                    </div>
                                    <button
                                        onClick={() => setStep('config')}
                                        className={cn(
                                            "uppercase tracking-[0.1em] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-2",
                                            isMobile ? "text-[10px]" : "text-xs"
                                        )}
                                    >
                                        <span className="w-1 h-1 rotate-45 bg-current" />
                                        Edit Instructions
                                    </button>
                                </div>

                                <DiamondDivider className={isMobile ? "mb-3" : "mb-4"} />

                                {/* Cards List - Genshin menu item style */}
                                <div className={cn(
                                    "flex-1 overflow-y-auto space-y-2",
                                    isMobile ? "-mr-2 pr-2" : "-mr-4 pr-4"
                                )}>
                                    {generatedData.map((card, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleSelection(idx)}
                                            className={cn(
                                                "relative border transition-all duration-200 cursor-pointer group",
                                                isMobile ? "p-3" : "p-5",
                                                selectedIndices.has(idx)
                                                    ? "bg-amber-600/10 border-amber-600/40 dark:border-amber-500/30"
                                                    : "bg-card/30 border-amber-700/15 dark:border-amber-600/10 hover:bg-card/50 hover:border-amber-700/30 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            {/* Selected corner accents */}
                                            {selectedIndices.has(idx) && (
                                                <>
                                                    <span className="absolute -top-px -left-px w-3 h-0.5 bg-amber-500" />
                                                    <span className="absolute -top-px -left-px w-0.5 h-3 bg-amber-500" />
                                                    <span className="absolute -bottom-px -right-px w-3 h-0.5 bg-amber-500" />
                                                    <span className="absolute -bottom-px -right-px w-0.5 h-3 bg-amber-500" />
                                                </>
                                            )}

                                            <div className={cn(
                                                "flex justify-between items-start",
                                                isMobile ? "gap-2" : "gap-4"
                                            )}>
                                                <div className="space-y-1.5 flex-1">
                                                    <div className={cn(
                                                        "text-foreground",
                                                        isMobile ? "text-sm" : "text-base"
                                                    )}>{card.targetSentence}</div>
                                                    <div className={cn(
                                                        "text-muted-foreground/70",
                                                        isMobile ? "text-xs" : "text-sm"
                                                    )}>{card.nativeTranslation}</div>
                                                </div>

                                                {/* Genshin-style checkbox */}
                                                <div className={cn(
                                                    "relative w-6 h-6 border flex items-center justify-center transition-all shrink-0 rotate-45",
                                                    selectedIndices.has(idx)
                                                        ? "bg-amber-600 border-amber-500"
                                                        : "border-amber-700/30 dark:border-amber-600/20 group-hover:border-amber-600/50"
                                                )}>
                                                    {selectedIndices.has(idx) && (
                                                        <span className="w-2 h-2 bg-white dark:bg-amber-950" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Save Button */}
                                <div className={cn(
                                    "border-t border-amber-700/20 dark:border-amber-600/15 flex justify-end",
                                    isMobile ? "pt-4 mt-3" : "pt-6 mt-4"
                                )}>
                                    <button
                                        onClick={handleSave}
                                        disabled={selectedIndices.size === 0}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3",
                                            "bg-amber-600/90 hover:bg-amber-600 text-white dark:text-amber-950",
                                            "border-2 border-amber-500",
                                            "uppercase tracking-[0.2em] text-sm font-serif font-semibold",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            "hover:shadow-[0_0_20px_-5px] hover:shadow-amber-500/40",
                                            isMobile ? "px-6 py-3 w-full justify-center" : "px-10 py-4"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-1 -left-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -top-1 -left-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                                        <span>Save to Deck</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

## features/deck/data/createCard.ts
import { Card, Language, LanguageId } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const createCard = (
  language: Language,
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
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
  status: 'new',
  interval: 0,
  easeFactor: 2.5,
  dueDate: new Date().toISOString(),
  language
});

export const createPolishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Polish, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createNorwegianCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  targetWordTranslation?: string,
  targetWordPartOfSpeech?: string
): Card => createCard(LanguageId.Norwegian, sentence, translation, targetWord, notes, targetWordTranslation, targetWordPartOfSpeech);

export const createJapaneseCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = '',
  furigana?: string
): Card => createCard(LanguageId.Japanese, sentence, translation, targetWord, notes, undefined, undefined, furigana);

export const createSpanishCard = (
  sentence: string,
  translation: string,
  targetWord?: string,
  notes: string = ''
): Card => createCard(LanguageId.Spanish, sentence, translation, targetWord, notes);


## features/deck/data/japaneseBeginnerDeck.ts
import { Card } from '@/types';
import { createJapaneseCard as createCard } from './createCard';

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
import { createNorwegianCard as createCard } from './createCard';

export const NORWEGIAN_BEGINNER_DECK: Card[] = [

  createCard("Hei, hvordan går det?", "Hi, how is it going?", "Hei", "Common informal greeting.", "hello", "interjection"),
  createCard("God morgen.", "Good morning.", "morgen", "", "morning", "noun"),
  createCard("Takk skal du ha.", "Thank you.", "Takk", "Literally: Thanks shall you have.", "thank you", "interjection"),
  createCard("Unnskyld, jeg forstår ikke.", "Excuse me, I don't understand.", "forstår", "Verb: å forstå.", "I understand", "verb"),
  createCard("Snakker du engelsk?", "Do you speak English?", "Snakker", "", "you speak", "verb"),
  createCard("Ha det bra!", "Goodbye!", "Ha", "Literally: Have it good.", "have/say", "verb"),
  createCard("Vær så snill.", "Please.", "snill", "Literally: Be so kind.", "kind", "adjective"),
  createCard("Ja, gjerne.", "Yes, gladly / please.", "gjerne", "", "gladly", "adverb"),
  createCard("Nei, takk.", "No, thanks.", "Nei", "", "no", "adverb"),
  createCard("Hva heter du?", "What is your name?", "heter", "Verb: å hete (to be called).", "is called", "verb"),


  createCard("Jeg er trøtt.", "I am tired.", "er", "Verb: å være (to be).", "am", "verb"),
  createCard("Det er kaldt i dag.", "It is cold today.", "er", "", "is", "verb"),
  createCard("Hvor er toalettet?", "Where is the toilet?", "er", "", "is", "verb"),
  createCard("Vi er fra Norge.", "We are from Norway.", "er", "", "are", "verb"),
  createCard("Er du sulten?", "Are you hungry?", "Er", "", "are", "verb"),
  createCard("Det er min venn.", "That is my friend.", "er", "", "is", "verb"),
  createCard("Er det sant?", "Is that true?", "Er", "", "is", "verb"),


  createCard("Jeg har en bil.", "I have a car.", "har", "Verb: å ha (to have).", "have", "verb"),
  createCard("Har du tid?", "Do you have time?", "Har", "", "have", "verb"),
  createCard("Vi har ikke penger.", "We don't have money.", "har", "", "have", "verb"),
  createCard("Hun har lyst på kaffe.", "She wants coffee.", "lyst", "Idiom: Ha lyst på (want/crave).", "desire/crave", "noun"),
  createCard("Jeg har vondt i hodet.", "I have a headache.", "vondt", "Idiom: Ha vondt (have pain).", "pain", "noun"),


  createCard("Hva gjør du?", "What are you doing?", "gjør", "Verb: å gjøre (to do).", "you do", "verb"),
  createCard("Jeg går på jobb.", "I am going to work.", "går", "Verb: å gå (to go/walk).", "I go", "verb"),
  createCard("Kan du si det igjen?", "Can you say that again?", "si", "Verb: å si (to say).", "say", "verb"),
  createCard("Jeg vet ikke.", "I don't know.", "vet", "Verb: å vite (to know).", "I know", "verb"),
  createCard("Hva tenker du på?", "What are you thinking about?", "tenker", "Verb: å tenke (to think).", "you think", "verb"),
  createCard("Jeg tar bussen.", "I am taking the bus.", "tar", "Verb: å ta (to take).", "I take", "verb"),
  createCard("Kan jeg få en øl?", "Can I get a beer?", "få", "Verb: å få (to get/receive).", "get/receive", "verb"),
  createCard("Jeg liker å lese.", "I like to read.", "liker", "Verb: å like (to like).", "I like", "verb"),
  createCard("Vi må dra nå.", "We have to leave now.", "må", "Modal verb: måtte (must).", "must", "verb"),
  createCard("Jeg kommer snart.", "I am coming soon.", "kommer", "Verb: å komme (to come).", "I come", "verb"),
  createCard("Jeg ser deg.", "I see you.", "ser", "Verb: å se (to see).", "I see", "verb"),
  createCard("Hører du meg?", "Do you hear me?", "Hører", "Verb: å høre (to hear).", "you hear", "verb"),
  createCard("Jeg tror det.", "I think so / I believe so.", "tror", "Verb: å tro (to believe).", "I believe", "verb"),


  createCard("Hvem er det?", "Who is that?", "Hvem", "", "who", "pronoun"),
  createCard("Hva er dette?", "What is this?", "Hva", "", "what", "pronoun"),
  createCard("Hvor bor du?", "Where do you live?", "Hvor", "", "where", "adverb"),
  createCard("Når kommer toget?", "When is the train coming?", "Når", "", "when", "adverb"),
  createCard("Hvorfor gråter du?", "Why are you crying?", "Hvorfor", "", "why", "adverb"),
  createCard("Hvordan kommer jeg dit?", "How do I get there?", "Hvordan", "", "how", "adverb"),
  createCard("Hvilken liker du?", "Which one do you like?", "Hvilken", "", "which", "pronoun"),


  createCard("Hjelp!", "Help!", "Hjelp", "", "help", "noun"),
  createCard("Jeg trenger en lege.", "I need a doctor.", "trenger", "Verb: å trenge (to need).", "I need", "verb"),
  createCard("Hvor mye koster det?", "How much does it cost?", "koster", "", "costs", "verb"),
  createCard("Jeg elsker deg.", "I love you.", "elsker", "", "I love", "verb"),
  createCard("Bare hyggelig.", "You're welcome.", "hyggelig", "Response to thank you.", "pleasant", "adjective"),
  createCard("Unnskyld meg.", "Excuse me.", "Unnskyld", "", "excuse me", "interjection"),
  createCard("Jeg er enig.", "I agree.", "enig", "", "I agree", "verb"),
  createCard("Det går bra.", "It's going well / It's fine.", "går", "", "goes/is going", "verb"),


  createCard("Norge er et vakkert land.", "Norway is a beautiful country.", "vakkert", "", "beautiful", "adjective"),
  createCard("Det er veldig bra.", "That is very good.", "bra", "", "good", "adjective"),
  createCard("Jeg er glad.", "I am happy.", "glad", "", "happy", "adjective"),
  createCard("Det er vanskelig.", "It is difficult.", "vanskelig", "", "difficult", "adjective"),
  createCard("Maten er god.", "The food is good.", "god", "", "good", "adjective"),
  createCard("Jeg er opptatt.", "I am busy.", "opptatt", "", "busy", "adjective"),


  createCard("Vi ses i morgen.", "See you tomorrow.", "morgen", "", "tomorrow", "noun"),
  createCard("Nå eller aldri.", "Now or never.", "Nå", "", "now", "adverb"),
  createCard("Det er her.", "It is here.", "her", "", "here", "adverb"),
  createCard("Det er der borte.", "It is over there.", "der", "", "there", "adverb")
];


## features/deck/data/polishBeginnerDeck.ts
import { Card } from '@/types';
import { createPolishCard as createCard } from './createCard';

export const POLISH_BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry, poproszę kawę.", "Good morning, a coffee please.", "poproszę", "Polite way to ask for something.", "please", "adverb"),
  createCard("Dziękuję bardzo.", "Thank you very much.", "Dziękuję", "", "I thank", "verb"),
  createCard("Nie rozumiem.", "I don't understand.", "rozumiem", "Verb: rozumieć.", "I understand", "verb"),
  createCard("Przepraszam, gdzie jest toaleta?", "Excuse me, where is the toilet?", "gdzie", "", "where", "adverb"),
  createCard("Mówisz po angielsku?", "Do you speak English?", "Mówisz", "Informal singular.", "you speak", "verb"),
  createCard("Cześć, jak się masz?", "Hi, how are you?", "Cześć", "Informal greeting.", "hello", "interjection"),
  createCard("Dobranoc.", "Good night.", "Dobranoc", "", "good night", "interjection"),
  createCard("Do widzenia.", "Goodbye.", "widzenia", "Formal.", "goodbye", "interjection"),
  createCard("Proszę.", "Please / Here you go.", "Proszę", "", "please", "interjection"),
  createCard("Tak, poproszę.", "Yes, please.", "Tak", "", "yes", "adverb"),
  createCard("Nie, dziękuję.", "No, thank you.", "Nie", "", "no", "adverb"),


  createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", "", "I am", "verb"),
  createCard("Ona jest bardzo miła.", "She is very nice.", "jest", "", "is", "verb"),
  createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here.", "this/that", "pronoun"),
  createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'.", "work", "noun"),
  createCard("Gdzie oni są?", "Where are they?", "są", "", "are", "verb"),
  createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", "", "you are", "verb"),
  createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense.", "I was", "verb"),


  createCard("Mam pytanie.", "I have a question.", "Mam", "", "I have", "verb"),
  createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation).", "time", "noun"),
  createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na...", "desire", "noun"),
  createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural.", "money", "noun"),
  createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", "", "we have", "verb"),


  createCard("Co robisz?", "What are you doing?", "robisz", "", "you do", "verb"),
  createCard("Idę do sklepu.", "I am going to the store.", "Idę", "Directional movement.", "I go", "verb"),
  createCard("Chcę kupić chleb.", "I want to buy bread.", "Chcę", "Verb: chcieć + infinitive.", "I want", "verb"),
  createCard("Lubię czytać książki.", "I like reading books.", "Lubię", "", "I like", "verb"),
  createCard("Muszę już iść.", "I have to go now.", "Muszę", "Modal verb: musieć.", "I must", "verb"),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?", "Wiesz", "Common phrase.", "you know", "verb"),
  createCard("Mogę ci pomóc?", "Can I help you?", "pomóc", "Takes dative case (ci).", "to help", "verb"),
  createCard("Myślę, że tak.", "I think so.", "Myślę", "", "I think", "verb"),
  createCard("Nie wiem.", "I don't know.", "wiem", "", "I know", "verb"),
  createCard("Robię obiad.", "I am making lunch.", "Robię", "", "I make", "verb"),
  createCard("Weź to.", "Take this.", "Weź", "Imperative.", "take", "verb"),
  createCard("Daj mi to.", "Give me that.", "Daj", "Imperative.", "give", "verb"),
  createCard("Widzę cię.", "I see you.", "Widzę", "", "I see", "verb"),
  createCard("Słyszysz mnie?", "Do you hear me?", "Słyszysz", "", "you hear", "verb"),


  createCard("Kto to jest?", "Who is this?", "Kto", "", "who", "pronoun"),
  createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", "", "why", "adverb"),
  createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", "", "when", "adverb"),
  createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", "", "where", "adverb"),
  createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?", "how", "adverb"),
  createCard("Co to jest?", "What is this?", "Co", "", "what", "pronoun"),
  createCard("Ile to kosztuje?", "How much does it cost?", "Ile", "", "how much", "pronoun"),


  createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", "", "order", "noun"),
  createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard.", "nothing", "pronoun"),
  createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", "", "health", "noun"),
  createCard("Smacznego.", "Bon appétit.", "Smacznego", "", "tasty", "adjective"),
  createCard("Pomocy!", "Help!", "Pomocy", "", "help", "noun"),
  createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", "", "I lost", "verb"),
  createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", "", "I need", "verb"),


  createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", "", "fast", "adjective"),
  createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", "", "nice", "adjective"),
  createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'.", "cold", "adjective"),
  createCard("To jest za drogie.", "This is too expensive.", "drogie", "", "expensive", "adjective"),
  createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", "", "happy", "adjective"),
  createCard("To jest trudne.", "This is difficult.", "trudne", "", "difficult", "adjective"),


  createCard("Mieszkam w Polsce.", "I live in Poland.", "Polsce", "Locative case.", "Poland", "noun"),
  createCard("Widzimy się jutro.", "See you tomorrow.", "jutro", "", "tomorrow", "noun"),
  createCard("Teraz czy później?", "Now or later?", "Teraz", "", "now", "adverb"),
  createCard("Jest blisko stąd.", "It is close to here.", "blisko", "", "close", "adverb"),
  createCard("To jest daleko.", "It is far.", "daleko", "", "far", "adverb")
];


## features/deck/data/spanishBeginnerDeck.ts
import { Card } from '@/types';
import { createSpanishCard as createCard } from './createCard';

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
  deleteCardsBatch as deleteCardsBatchFromRepo,
  saveCard,
  saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { useDeck } from '@/contexts/DeckContext';
import { db } from '@/services/db/dexie';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  addCardsBatch: (cards: Card[]) => Promise<void>;
  updateCard: (card: Card, options?: { silent?: boolean }) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  deleteCardsBatch: (ids: string[]) => Promise<void>;
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
    async (card: Card, options?: { silent?: boolean }) => {
      try {
        await saveCard(card);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        if (!options?.silent) {
          toast.success('Card updated successfully');
        }
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

  const deleteCardsBatch = useCallback(
    async (ids: string[]) => {
      try {
        await deleteCardsBatchFromRepo(ids);
        await queryClient.invalidateQueries({ queryKey: ['cards'] });
        refreshDeckData();
        toast.success(`${ids.length} cards deleted`);
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete cards');
      }
    },
    [queryClient, refreshDeckData]
  );

  const prioritizeCards = useCallback(
    async (ids: string[]) => {
      try {
        await db.cards
          .where('id')
          .anyOf(ids)
          .modify({ dueDate: new Date(0).toISOString() });

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

  return { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards };
};

## features/deck/hooks/useCardText.ts
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';

export const useCardText = (card: Card) => {
  const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
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
    processText
  };
};

## features/deck/hooks/useCardsQuery.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { db } from '@/services/db/dexie';
import { mapToCard } from '@/services/db/repositories/cardRepository';
import { CardStatus } from '@/types';

export interface CardFilters {
  status?: CardStatus | 'all';
  bookmarked?: boolean;
  leech?: boolean;
}

export const useCardsQuery = (
  page = 0,
  pageSize = 50,
  searchTerm = '',
  filters: CardFilters = {}
) => {
  const settings = useSettingsStore(s => s.settings);
  const language = settings.language;

  return useQuery({
    queryKey: ['cards', language, page, pageSize, searchTerm, filters],
    queryFn: async () => {
      let cards = await db.cards
        .where('language')
        .equals(language)
        .toArray();

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        cards = cards.filter(c =>
          c.targetSentence?.toLowerCase().includes(term) ||
          c.nativeTranslation?.toLowerCase().includes(term) ||
          c.targetWord?.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term)
        );
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        cards = cards.filter(c => c.status === filters.status);
      }

      // Apply bookmarked filter
      if (filters.bookmarked) {
        cards = cards.filter(c => c.isBookmarked === true);
      }

      // Apply leech filter
      if (filters.leech) {
        cards = cards.filter(c => c.isLeech === true);
      }

      cards.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedCards = cards.slice(start, end);

      return {
        data: paginatedCards,
        count: cards.length
      };
    },
    placeholderData: keepPreviousData,
  });
};

## features/deck/hooks/useDeckQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
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
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from 'sonner';
import { CardXpPayload } from '@/features/xp/xpUtils';

export const useDeckStatsQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['deckStats', settings.language],
    queryFn: () => fetchStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useDueCardsQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['dueCards', settings.language],
    queryFn: () => getDueCards(new Date(), settings.language),
    staleTime: 60 * 1000,
  });
};

export const useReviewsTodayQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['reviewsToday', settings.language],
    queryFn: () => getTodayReviewStats(settings.language),
    staleTime: 60 * 1000,
  });
};

export const useHistoryQuery = () => {
  const settings = useSettingsStore(s => s.settings);
  return useQuery({
    queryKey: ['history', settings.language],
    queryFn: () => fetchHistory(settings.language),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecordReviewMutation = () => {
  const queryClient = useQueryClient();
  const settings = useSettingsStore(s => s.settings);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, grade, xpPayload }: { card: Card; grade: Grade; xpPayload?: CardXpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      const now = new Date();
      const lastReview = card.last_review ? new Date(card.last_review) : now;

      const diffMinutes = differenceInMinutes(now, lastReview);
      const elapsedDays = diffMinutes / 1440;

      const scheduledDays = card.interval || 0;

      await addReviewLog(card, grade, elapsedDays, scheduledDays);

      const xpAmount = xpPayload?.totalXp ?? 0;

      return { card, grade, today, xpAmount };
    },
    onMutate: async ({ card, grade, xpPayload }) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
        queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] })
      ]);

      const previousHistory = queryClient.getQueryData(['history', settings.language]);
      const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
      const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
      const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]);

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
        if (grade === 'Again') return old;
        return old.filter(c => c.id !== card.id);
      });

      if (user) {
        const xpAmount = xpPayload?.totalXp ?? 0;
        incrementXP(xpAmount);

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
  const settings = useSettingsStore(s => s.settings);
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
  const settings = useSettingsStore(s => s.settings);
  const { user } = useAuth();
  const { incrementXP } = useGamification();

  return useMutation({
    mutationFn: async ({ card, date, xpEarned }: { card: Card; date: string; xpEarned: number }) => {
      await saveCard(card);
      await incrementHistory(date, -1, card.language || settings.language);
      return { card, date, xpEarned };
    },
    onSuccess: ({ xpEarned }) => {
      if (user && xpEarned > 0) {
        incrementXP(-xpEarned);

        queryClient.setQueryData(['dashboardStats', settings.language], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            languageXp: Math.max(0, (old.languageXp || 0) - xpEarned)
          };
        });
      }

      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['history', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['reviewsToday', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['deckStats', settings.language] });
      queryClient.invalidateQueries({ queryKey: ['dueCards', settings.language] });
    }
  });
};

## features/deck/services/ai.ts
import { LanguageId } from '@/types';

interface GeminiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: any;
  };
}

interface GeminiSchemaProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  enum?: string[];
  description?: string;
}

interface GeminiResponseSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, GeminiSchemaProperty>;
  items?: GeminiResponseSchema;
  required?: string[];
}

interface GeneratedCardData {
  targetSentence: string;
  nativeTranslation: string;
  targetWord: string;
  targetWordTranslation: string;
  targetWordPartOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun';
  grammaticalCase?: string;
  gender?: string;
  notes: string;
  furigana?: string;
}

interface BatchGenerationOptions {
  instructions: string;
  count: number;
  language: typeof LanguageId[keyof typeof LanguageId];
  learnedWords?: string[];
  proficiencyLevel?: string;
  difficultyMode?: 'beginner' | 'immersive';
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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

async function callGemini(prompt: string, apiKey: string, responseSchema?: GeminiResponseSchema): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please add it in Settings.');
  }

  const body: GeminiRequestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  if (responseSchema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema
    };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorData);
    throw new Error(errorData.error?.message || 'AI Service failed. Check your API key.');
  }

  const data = await response.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from AI');
  }

  return text;
}

export const aiService = {
  async lemmatizeWord(word: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<string> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        lemma: { type: 'STRING' }
      },
      required: ['lemma']
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
    const cleanedResult = extractJSON(result);
    try {
      const parsed = JSON.parse(cleanedResult);
      return parsed.lemma || word;
    } catch (e) {
      console.error("Failed to parse lemmatize response", e);
      return word;
    }
  },

  async translateText(text: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<string> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));
    const prompt = `
      Role: Expert Translator.
      Task: Translate the following ${langName} text to English.
      Constraint: Provide ONLY the direct English translation. No detailed explanations, no markdown, no conversational filler.
      
      Text: "${text}"
    `;
    return await callGemini(prompt, apiKey);
  },

  async analyzeWord(word: string, contextSentence: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        definition: { type: 'STRING' },
        partOfSpeech: { type: 'STRING' },
        contextMeaning: { type: 'STRING' }
      },
      required: ['definition', 'partOfSpeech', 'contextMeaning']
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
    const cleanedResult = extractJSON(result);
    try {
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result, "\nCleaned:", cleanedResult);
      return {
        definition: "Failed to analyze",
        partOfSpeech: "Unknown",
        contextMeaning: "Could not retrieve context"
      };
    }
  },

  async generateSentenceForWord(targetWord: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    targetSentence: string;
    nativeTranslation: string;
    targetWordTranslation: string;
    targetWordPartOfSpeech: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        targetSentence: { type: 'STRING' },
        nativeTranslation: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === LanguageId.Japanese ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['targetSentence', 'nativeTranslation', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
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
    const cleanedResult = extractJSON(result);
    try {
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result, "\nCleaned:", cleanedResult);
      throw new Error("Failed to generate sentence for word");
    }
  },

  async generateCardContent(sentence: string, language: typeof LanguageId[keyof typeof LanguageId] = LanguageId.Polish, apiKey: string): Promise<{
    translation: string;
    targetWord?: string;
    targetWordTranslation?: string;
    targetWordPartOfSpeech?: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const responseSchema: GeminiResponseSchema = {
      type: 'OBJECT',
      properties: {
        translation: { type: 'STRING' },
        targetWord: { type: 'STRING' },
        targetWordTranslation: { type: 'STRING' },
        targetWordPartOfSpeech: {
          type: 'STRING',
          enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
        },
        notes: { type: 'STRING' },
        ...(language === LanguageId.Japanese ? { furigana: { type: 'STRING' } } : {})
      },
      required: ['translation', 'targetWord', 'targetWordTranslation', 'targetWordPartOfSpeech', 'notes']
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
    const cleanedResult = extractJSON(result);
    try {
      return JSON.parse(cleanedResult);
    } catch (e) {
      console.error("Failed to parse AI response", e, "\nRaw:", result, "\nCleaned:", cleanedResult);
      return {
        translation: "",
        notes: ""
      };
    }
  },

  async generateBatchCards({
    instructions,
    count,
    language,
    apiKey,
    learnedWords,
    proficiencyLevel = 'A1',
    difficultyMode = 'immersive'
  }: BatchGenerationOptions & { apiKey: string }): Promise<GeneratedCardData[]> {
    const langName = language === LanguageId.Norwegian ? 'Norwegian' : (language === LanguageId.Japanese ? 'Japanese' : (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    const hasLearnedWords = learnedWords && learnedWords.length > 0;

    let progressionRules = '';

    if (difficultyMode === 'beginner') {
      if (hasLearnedWords) {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Continued Learning / Duolingo Style):
        This is a SEQUENTIAL LESSON extending the user's existing knowledge.

        User ALREADY KNOWS: ${learnedWords!.length} words.
        
        1.  **NO SINGLE WORDS**: Do NOT generate cards with just 1 word. The user is past that stage.
        2.  **Contextual Learning**: precise target is to combine [Previously Learned Word] + [NEW Word].
        3.  **Progression**:
            - Cards 1-5: Simple 2-3 word phrases using *mostly* known words + 1 NEW word.
            - Cards 6-10: Complete simple sentences (Subject-Verb-Object). 
        
        INTERNAL STATE REQUIREMENT:
        - Track "Introduced Vocabulary".
        - **Constraint**: A card should NOT contain more than 1 unknown word (a word that is NOT in "LearnedWords" and NOT in "Introduced Vocabulary").
        `;
      } else {
        progressionRules = `
        CRITICAL PROGRESSION RULES (Zero-to-Hero / Duolingo Style):
        This is a SEQUENTIAL LESSON. Card N must build upon Cards 1...(N-1).

        1.  **Card 1-2**: Foundation. ABSOLUTE BASICS. 1-2 words max. (e.g., "Mother", "Water", "Yes").
        2.  **Card 3-5**: very Simple combinations. Max 2-3 words. Reuse words from Cards 1-2. (e.g., "My mother", "Yes, water").
        3.  **Card 6-10**: Basic sentences. Max 3-5 words. STRICTLY REUSE specific vocabulary from previous cards + introduce ONLY 1 new word per card.
        
        INTERNAL STATE REQUIREMENT:
        - Track the "Introduced Vocabulary" list internally as you generate.
        - **Constraint**: A card should not contain more than 1 unknown word (a word not in learned/introduced list).
        `;
      }
    } else {
      progressionRules = `
        CRITICAL: Each card MUST contain a COMPLETE, NATURAL SENTENCE in targetSentence.
        - The sentence must demonstrate vivid, real usage of the target vocabulary word.
        - Never return just the word alone — always wrap it in a meaningful context.
        - Sentence complexity should match ${proficiencyLevel} level.
        - Variety: Mix statements, questions, and mild imperatives. Avoid repetitive sentence structures.
        - **DIVERSITY REQUIREMENT**: You must generate ${count} DISTINCT target words related to the topic. 
        - **CONSTRAINT**: Do NOT use the same "targetWord" more than once in this batch.
        `;
    }

    const knownWordsContext = learnedWords && learnedWords.length > 0
      ? `
        KNOWN VOCABULARY (For Context Only - DO NOT Teach These Again):
        [${learnedWords.slice(0, 150).join(", ")}]... (and potentially others).
        
        Use these known words to build sentences, but the "targetWord" (the one being taught) to be a NEW word.
        `
      : "User has NO prior vocabulary. Start from scratch.";

    const cardSchemaProperties: Record<string, GeminiSchemaProperty> = {
      targetSentence: { type: "STRING" },
      nativeTranslation: { type: "STRING" },
      targetWord: { type: "STRING" },
      targetWordTranslation: { type: "STRING" },
      targetWordPartOfSpeech: {
        type: "STRING",
        enum: ["noun", "verb", "adjective", "adverb", "pronoun"]
      },
      grammaticalCase: { type: "STRING" },
      gender: { type: "STRING" },
      notes: { type: "STRING" }
    };

    const requiredFields = ["targetSentence", "nativeTranslation", "targetWord", "targetWordTranslation", "targetWordPartOfSpeech", "notes"];

    if (language === LanguageId.Japanese) {
      cardSchemaProperties.furigana = {
        type: "STRING",
        description: "The FULL targetSentence with kanji readings in Kanji[reading] format for ALL kanji characters"
      };
      requiredFields.push("furigana");
    }

    const cardSchema: GeminiResponseSchema = {
      type: "OBJECT",
      properties: cardSchemaProperties,
      required: requiredFields
    };

    const responseSchema: GeminiResponseSchema = {
      type: "ARRAY",
      items: cardSchema
    };

    let prompt = `
      Role: Expert ${langName} curriculum designer & Native Speaker.
      Task: Generate a JSON Array of ${count} high-quality flashcards.
      Topic: "${instructions}"
      
      ${progressionRules}
      
      Style Guidelines:
      - Tone: Natural, friendly, helpful.
      - **Vocabulary Strategy**: 
          - For transitions and context: Repetition of *learned* words is good.
          - For TARGET words (the new words being taught): **All ${count} target words must be UNIQUE**. Do not repeat the same new word.
      - Avoid: Complex grammar, rare words, or throwing the user into the deep end.
      - Content: tangible, visual, and concrete concepts first (objects, family, basic actions).
      
      ${knownWordsContext}
      
      Output Format (JSON Array):
      [
        {
          "targetSentence": "...",
          "nativeTranslation": "...",
          "targetWord": "...",
          "targetWordTranslation": "...",
          "targetWordPartOfSpeech": "noun|verb|adjective|adverb|pronoun",
          "grammaticalCase": "nominative|genitive|...", 
          "gender": "masculine|feminine|neuter",
          "notes": "Explain the grammar of the target word in this specific context."${language === LanguageId.Japanese ? ',\n          "furigana": "The FULL targetSentence with Kanji[reading] format for ALL kanji. Example: 私[わたし]は 日本語[にほんご]を 勉強[べんきょう]しています"' : ''}
        }
      ]

      IMPORTANT: Return ONLY the JSON Array. No markdown.
    `;

    const result = await callGemini(prompt, apiKey, responseSchema);

    const cleanedResult = extractJSON(result);
    try {
      const parsed = JSON.parse(cleanedResult);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse AI batch response", e, "\nRaw:", result, "\nCleaned:", cleanedResult);
      throw new Error("Failed to generate valid cards");
    }
  }
};

## features/deck/services/csvImport.ts
import { v4 as uuidv4 } from 'uuid';
import { Card, Language, LanguageId } from '@/types';
import Papa from 'papaparse';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

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
    value === LanguageId.Polish || value === LanguageId.Norwegian || value === LanguageId.Japanese || value === LanguageId.Spanish;

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

export const parseCardsFromCsv = (payload: string, fallbackLanguage: Language): Card[] => {
    const sanitized = payload.trim();
    if (!sanitized) return [];

    const { data } = Papa.parse<Record<string, string>>(sanitized, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
    });

    const cards: Card[] = [];

    for (const row of data) {
        if (Object.values(row).every(val => !val || !val.trim())) continue;

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

export const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;

## features/deck/services/deckGeneration.ts
import { aiService } from '@/features/deck/services/ai';
import { Card, Difficulty, Language } from '@/types';

export interface GenerateInitialDeckOptions {
    language: Language;
    proficiencyLevel: Difficulty;
    apiKey?: string;
}

export async function generateInitialDeck(options: GenerateInitialDeckOptions): Promise<Card[]> {
    if (!options.apiKey) {
        throw new Error('API Key is required for AI deck generation');
    }

    try {
        const totalCards = 50;
        const batchSize = 10;

        const topics = [
            "Casual Greetings & Meeting New Friends (informal)",
            "Ordering Coffee, Pastries & Restaurant Basics",
            "Navigating the City & Public Transport Survival",
            "Talking about Hobbies, Movies & Weekend Plans",
            "Essential Health & Emergency Phrases (Safety First)"
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
            throw new Error('Invalid response format from AI service');
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
            status: 'new' as const,
            interval: 0,
            easeFactor: 2.5,
            dueDate: new Date(now + index * 1000).toISOString(),
            tags: [options.proficiencyLevel, 'Starter', 'AI-Gen'],
        }));

        return cards;
    } catch (error: any) {
        console.error('Failed to generate initial deck:', error);
        throw new Error(error.message || 'Failed to generate deck via AI service');
    }
}

## features/settings/components/AlgorithmSettings.tsx
import React, { useState } from 'react';
import { Wand2, RefreshCw, Target, Sliders, Settings } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { EditorialInput } from '@/components/form/EditorialInput';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewLogs } from '@/services/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';
import { GamePanel, GameSectionHeader, GameDivider, GameButton, GameProgressBar } from '@/components/ui/game-ui';

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
      
      const worker = new Worker(new URL('../../../workers/fsrs.worker.ts', import.meta.url), { type: 'module' });
      
      worker.onmessage = (e) => {
        const { type, progress, w, error } = e.data;
        if (type === 'progress') {
          setProgress(progress);
        } else if (type === 'result') {
          setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === 'error') {
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
      <GameSectionHeader 
        title="Retention Target" 
        subtitle="Target accuracy for scheduled reviews"
        icon={<Target className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="highlight" size="lg" glowOnHover>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Target Retention
              </span>
            </div>
            <span className="text-5xl md:text-6xl font-light tabular-nums text-foreground">
              {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-xl text-muted-foreground/40">%</span>
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
              className="py-3"
            />
            <div className="flex justify-between text-[10px] font-ui text-muted-foreground/50 uppercase tracking-wider">
              <span>Faster Reviews</span>
              <span>Higher Accuracy</span>
            </div>
          </div>
        </div>
      </GamePanel>

      <GameDivider />

      {/* Optimization Section */}
      <GameSectionHeader 
        title="Optimization" 
        subtitle="Personalize algorithm parameters"
        icon={<Wand2 className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Analyzes {report ? `${report.reviews} review records` : 'your review history'} to calculate personalized parameters.
            </p>
            {report && (
              <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-pine-500">Complete</span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-3">
              <GameProgressBar 
                value={progress} 
                variant="xp" 
                size="sm"
                label="Processing review data"
              />
            </div>
          ) : (
            <GameButton 
              onClick={handleOptimize}
              variant="secondary"
              className="w-full"
            >
              <Wand2 size={14} strokeWidth={1.5} /> Optimize Parameters
            </GameButton>
          )}
        </div>
      </GamePanel>

      <GameDivider />

      {/* Advanced Settings Section */}
      <GameSectionHeader 
        title="Advanced" 
        subtitle="Fine-tune scheduling behavior"
        icon={<Settings className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Maximum Interval (days)
              </label>
            </div>
            <EditorialInput
              type="number"
              className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-2 placeholder:text-muted-foreground/30 focus-visible:border-primary/60"
              value={localSettings.fsrs.maximum_interval}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                }))
              }
            />
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Enable Fuzzing</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Prevents clustering of due dates by adding randomness</p>
            </div>
            <Switch
              checked={localSettings.fsrs.enable_fuzzing}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
              }
            />
          </div>
        </GamePanel>
      </div>

      {/* Reset Button */}
      <div className="pt-4">
        <button 
          onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
          className="text-xs font-ui uppercase tracking-[0.1em] text-muted-foreground/40 hover:text-destructive/70 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </button>
      </div>
    </div>
  );
};


## features/settings/components/AudioSettings.tsx
import React from 'react';
import { Volume2, Mic, Gauge } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';
import { GamePanel, GameSectionHeader, GameDivider, GameButton } from '@/components/ui/game-ui';

interface VoiceOption { id: string; name: string; }

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
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Speech Provider Section */}
      <GameSectionHeader 
        title="Speech Provider" 
        subtitle="Text-to-speech engine configuration"
        icon={<Mic className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Provider
            </label>
          </div>
          <EditorialSelect
            value={localSettings.tts.provider}
            onChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
            options={[
              { value: 'browser', label: 'Browser Native' },
              { value: 'google', label: 'Google Cloud TTS' },
              { value: 'azure', label: 'Microsoft Azure' },
            ]}
            className="font-ui"
          />
        </div>

        {localSettings.tts.provider !== 'browser' && (
          <div className="space-y-5 pt-6 mt-6 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                  API Credentials
                </label>
              </div>
              <EditorialInput
                type="password"
                placeholder={localSettings.tts.provider === 'google' ? "Google Cloud API key" : "Azure subscription key"}
                value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                className="font-mono"
              />
            </div>
            {localSettings.tts.provider === 'azure' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                  <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                    Region
                  </label>
                </div>
                <EditorialInput
                  placeholder="e.g., eastus, westeurope"
                  value={localSettings.tts.azureRegion}
                  onChange={(e) => updateTts({ azureRegion: e.target.value })}
                  className="font-mono"
                />
              </div>
            )}
          </div>
        )}
      </GamePanel>

      <GameDivider />

      {/* Voice Selection Section */}
      <GameSectionHeader 
        title="Voice Selection" 
        subtitle="Choose and test your preferred voice"
        icon={<Volume2 className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Voice
              </label>
            </div>
            <GameButton 
              variant="ghost" 
              size="sm"
              onClick={onTestAudio}
            >
              <Volume2 size={14} strokeWidth={1.5} /> Test Voice
            </GameButton>
          </div>
          <EditorialSelect
            value={localSettings.tts.voiceURI || 'default'}
            onChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
            options={[{ value: 'default', label: 'System Default' }, ...availableVoices.map(v => ({ value: v.id, label: v.name }))]}
            className="font-ui"
          />
        </div>
      </GamePanel>

      <GameDivider />

      {/* Playback Settings */}
      <GameSectionHeader 
        title="Playback" 
        subtitle="Audio speed and volume controls"
        icon={<Gauge className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GamePanel variant="stat" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">Speed</label>
              </div>
              <span className="text-2xl font-light tabular-nums text-foreground">{localSettings.tts.rate.toFixed(1)}<span className="text-sm text-muted-foreground/40">×</span></span>
            </div>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[localSettings.tts.rate]}
              onValueChange={([v]) => updateTts({ rate: v })}
              className="py-3"
            />
          </div>
        </GamePanel>
        
        <GamePanel variant="stat" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">Volume</label>
              </div>
              <span className="text-2xl font-light tabular-nums text-foreground">{Math.round(localSettings.tts.volume * 100)}<span className="text-sm text-muted-foreground/40">%</span></span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[localSettings.tts.volume]}
              onValueChange={([v]) => updateTts({ volume: v })}
              className="py-3"
            />
          </div>
        </GamePanel>
      </div>
    </div>
  );
};


## features/settings/components/DataSettings.tsx
import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check, Database, HardDrive, RotateCcw, Key } from 'lucide-react';
import { GamePanel, GameSectionHeader, GameDivider, GameButton } from '@/components/ui/game-ui';
import { SyncthingSettings } from './SyncthingSettings';
import { Switch } from '@/components/ui/switch';

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
  // Syncthing sync props
  onSyncthingSave?: () => void;
  onSyncthingLoad?: () => void;
  isSyncthingSaving?: boolean;
  isSyncthingLoading?: boolean;
  lastSyncthingSync?: string | null;
  // API key export/import options
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
  <div className="space-y-8 max-w-2xl">
    
    {/* Import & Export Section */}
    <GameSectionHeader 
      title="Import & Export" 
      subtitle="Backup and restore your data"
      icon={<HardDrive className="w-4 h-4" strokeWidth={1.5} />}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <GamePanel variant="default" size="md" glowOnHover className="cursor-pointer group" onClick={onExport}>
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <Download className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">Export Backup</p>
            <p className="text-xs text-muted-foreground/60 font-light">Download complete data archive</p>
          </div>
        </div>
      </GamePanel>

      <GamePanel 
        variant="default" 
        size="md" 
        glowOnHover 
        className={`cursor-pointer group ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`} 
        onClick={() => !isRestoring && jsonInputRef.current?.click()}
      >
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <RotateCcw className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isRestoring ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">{isRestoring ? 'Restoring...' : 'Restore Backup'}</p>
            <p className="text-xs text-muted-foreground/60 font-light">Import from JSON backup file</p>
          </div>
        </div>
      </GamePanel>
    </div>

    {/* Import Cards Section */}
    <GamePanel variant="default" size="md" glowOnHover className="cursor-pointer group" onClick={() => csvInputRef.current?.click()}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-ui text-foreground mb-1">Import Cards</p>
          <p className="text-xs text-muted-foreground/60 font-light">Add flashcards from CSV file (without replacing existing)</p>
        </div>
      </div>
    </GamePanel>

    <GameDivider />

    {/* API Key Options Section */}
    <GameSectionHeader 
      title="API Key Options" 
      subtitle="Control how API keys are handled"
      icon={<Key className="w-4 h-4" strokeWidth={1.5} />}
    />
    <div className="space-y-3">
      <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-1 rotate-45 bg-primary/40" />
              <span className="text-sm font-light text-foreground font-ui">Include API Keys in Export</span>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light pl-3">Include your API keys when exporting backup files</p>
          </div>
          <Switch
            checked={includeApiKeys}
            onCheckedChange={onIncludeApiKeysChange}
          />
        </div>
      </GamePanel>
      <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-1 rotate-45 bg-primary/40" />
              <span className="text-sm font-light text-foreground font-ui">Import API Keys from Backup</span>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light pl-3">Restore API keys when importing backup files</p>
          </div>
          <Switch
            checked={importApiKeys}
            onCheckedChange={onImportApiKeysChange}
          />
        </div>
      </GamePanel>
    </div>

    <GameDivider />

    {/* Cloud Storage Section */}
    <GameSectionHeader 
      title="Cloud Storage" 
      subtitle="Sync data across devices"
      icon={<Cloud className="w-4 h-4" strokeWidth={1.5} />}
    />
    <GamePanel 
      variant={syncComplete ? "stat" : "default"} 
      size="md" 
      glowOnHover={!syncComplete}
      className={syncComplete ? "border-pine-500/30" : ""}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center border ${syncComplete ? "bg-pine-500/10 border-pine-500/30" : "bg-card border-border/30"}`}>
          {syncComplete ? (
            <Check className="w-5 h-5 text-pine-500" strokeWidth={1.5} />
          ) : (
            <Cloud className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-ui text-foreground mb-1">
            {syncComplete ? "Synchronized" : "Sync to Cloud"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-light">
            {isSyncingToCloud 
              ? "Uploading data..." 
              : syncComplete 
                ? "Your data is backed up" 
                : "Migrate local database to cloud"
            }
          </p>
        </div>
        {!syncComplete && (
          <GameButton
            variant="secondary"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </GameButton>
        )}
      </div>
    </GamePanel>

    <GameDivider />

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

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    <input type="file" ref={jsonInputRef} accept=".json" className="hidden" onChange={onRestoreBackup} />
    
    {/* Help Text */}
    <GamePanel variant="stat" size="sm" className="border-border/20">
      <div className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/30 mt-1.5 shrink-0" />
        <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-1">
          <p><strong className="text-muted-foreground/70">Restore Backup:</strong> Replaces all data with a previous JSON backup.</p>
          <p><strong className="text-muted-foreground/70">Import Cards:</strong> Adds cards from CSV without replacing existing data.</p>
        </div>
      </div>
    </GamePanel>
  </div>
);

## features/settings/components/FloatingSyncButton.tsx
import React, { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';
import { cn } from '@/lib/utils';

interface FloatingSyncButtonProps {
    className?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingSyncButton: React.FC<FloatingSyncButtonProps> = ({
    className,
    position = 'bottom-right'
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
        'bottom-right': 'bottom-20 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6',
    };

    return (
        <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
                'fixed z-50 flex items-center gap-2 px-4 py-3',
                'bg-card/95 backdrop-blur-sm border border-border/50',
                'hover:border-primary/50 hover:bg-card transition-all duration-200',
                'shadow-lg shadow-black/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group',
                positionClasses[position],
                className
            )}
            title={lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : 'Save changes to sync file'}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-ui text-muted-foreground">Saving...</span>
                </>
            ) : showSuccess ? (
                <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-ui text-green-500">Saved!</span>
                </>
            ) : (
                <>
                    <Save className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                        Save Changes
                    </span>
                </>
            )}
        </button>
    );
};

## features/settings/components/GeneralSettings.tsx
import React from 'react';
import { User, Globe, Sparkles, Settings } from 'lucide-react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { GamePanel, GameSectionHeader, GameDivider } from '@/components/ui/game-ui';

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
  onUpdateLevel
}) => {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <GameSectionHeader 
        title="Identity" 
        subtitle="Your public profile information"
        icon={<User className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Display Name
            </label>
            <span className="text-[9px] text-primary/60 uppercase tracking-wider ml-auto font-ui">Public</span>
          </div>
          <Input 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your display name"
            className="font-ui"
          />
          <p className="text-xs text-muted-foreground/60 leading-relaxed font-light">
            Displayed on global leaderboards and achievements.
          </p>
        </div>
      </GamePanel>

      <GameDivider />

      {/* Language Section */}
      <GameSectionHeader 
        title="Language" 
        subtitle="Active course configuration"
        icon={<Globe className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-4">
        <GamePanel variant="default" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Active Course
              </label>
            </div>
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
              className="font-ui"
            />
          </div>
        </GamePanel>

        <GamePanel variant="default" size="md" glowOnHover>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Proficiency Level
              </label>
            </div>
            <EditorialSelect
                value={languageLevel || 'A1'}
                onChange={onUpdateLevel}
                options={[
                    { value: 'A1', label: 'A1 - Beginner' },
                    { value: 'A2', label: 'A2 - Elementary' },
                    { value: 'B1', label: 'B1 - Intermediate' },
                    { value: 'C1', label: 'C1 - Advanced' },
                ]}
            />
            <p className="text-xs text-muted-foreground mt-2">Controls AI complexity.</p>
        </GamePanel>

        <GamePanel variant="default" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Theme Accent
              </label>
            </div>
            <ColorPicker
              label=""
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
        </GamePanel>
      </div>

      <GameDivider />

      {/* API Section */}
      <GameSectionHeader 
        title="AI Integration" 
        subtitle="Gemini API configuration"
        icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              API Key
            </label>
          </div>
          <Input
            type="password"
            value={localSettings.geminiApiKey || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
            placeholder="API key for content generation"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground/60 leading-relaxed font-light">
            Powers sentence generation and linguistic analysis features.
          </p>
        </div>
      </GamePanel>

      <GameDivider />

      {/* Behavior Toggles */}
      <GameSectionHeader 
        title="Behavior" 
        subtitle="Study session preferences"
        icon={<Settings className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        {[
          { label: 'Automatic Audio', desc: 'Play pronunciation when card is revealed', key: 'autoPlayAudio' },
          { label: 'Listening Mode', desc: 'Hide text until audio completes', key: 'blindMode' },
          { label: 'Show Translation', desc: 'Display native language meaning', key: 'showTranslationAfterFlip' }
        ].map((item) => (
          <GamePanel key={item.key} variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rotate-45 bg-primary/40" />
                  <span className="text-sm font-light text-foreground font-ui">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground/60 font-light pl-3">{item.desc}</p>
              </div>
              <Switch
                checked={(localSettings as any)[item.key]}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          </GamePanel>
        ))}
      </div>
    </div>
  );
};


## features/settings/components/SettingsModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut, Skull, Settings, Volume2, Target, Sliders, Database, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GamePanel, GameButton, GameDivider } from '@/components/game';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDeck } from '@/contexts/DeckContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, Language, UserSettings } from '@/types';
import { ttsService, VoiceOption } from '@/services/tts';
import {
    saveAllCards,
    getCardSignatures,
    getCards,
    clearAllCards,
} from '@/services/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/services/db/repositories/historyRepository';
import { db } from '@/services/db/dexie';
import { GeneralSettings } from './GeneralSettings';
import { AudioSettings } from './AudioSettings';
import { StudySettings } from './StudySettings';
import { AlgorithmSettings } from './AlgorithmSettings';
import { DataSettings } from './DataSettings';

import { parseCardsFromCsv, signatureForCard } from '@/features/deck/services/csvImport';
import { useCloudSync } from '@/features/settings/hooks/useCloudSync';
import { useAccountManagement } from '@/features/settings/hooks/useAccountManagement';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'audio' | 'study' | 'algorithm' | 'data' | 'danger';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const saveApiKeys = useSettingsStore(s => s.saveApiKeys);
    const { refreshDeckData } = useDeck();
    const { signOut, user } = useAuth();
    const { profile, updateUsername, updateLanguageLevel } = useProfile();
    const [localSettings, setLocalSettings] = useState(settings);
    const [localUsername, setLocalUsername] = useState('');
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [includeApiKeys, setIncludeApiKeys] = useState(false);
    const [importApiKeys, setImportApiKeys] = useState(false);

    const { handleSyncToCloud, isSyncingToCloud, syncComplete } = useCloudSync();
    const {
        handleResetDeck,
        handleResetAccount,
        confirmResetDeck,
        confirmResetAccount
    } = useAccountManagement();
    const {
        saveToSyncFile,
        loadFromSyncFile,
        isSaving: isSyncthingSaving,
        isLoading: isSyncthingLoading,
        lastSync: lastSyncthingSync
    } = useSyncthingSync();

    useEffect(() => {
        const loadVoices = async () => {
            const voices = await ttsService.getAvailableVoices(localSettings.language, localSettings.tts);
            setAvailableVoices(voices);
        };

        if (isOpen) {
            setLocalSettings(settings);
            setLocalUsername(profile?.username || '');
            setActiveTab('general');
            loadVoices();
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

        try {
            await saveApiKeys(user?.id || 'local-user', {
                geminiApiKey: localSettings.geminiApiKey,
                googleTtsApiKey: localSettings.tts.googleApiKey,
                azureTtsApiKey: localSettings.tts.azureApiKey,
                azureRegion: localSettings.tts.azureRegion,
            });
        } catch (error) {
            console.error('Failed to save API keys:', error);
        }

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

    const handleTestAudio = () => {
        const testText = {
            polish: "Cześć, to jest test.",
            norwegian: "Hei, dette er en test.",
            japanese: "こんにちは、テストです。",
            spanish: "Hola, esto es una prueba."
        };
        ttsService.speak(testText[localSettings.language] || "Test audio", localSettings.language, localSettings.tts);
    };

    const handleExport = async () => {
        try {
            const cards = await getCards();
            const history = await getHistory();
            const revlog = await db.revlog.toArray();

            const safeSettings = {
                ...localSettings,
                tts: {
                    ...localSettings.tts,
                    googleApiKey: includeApiKeys ? localSettings.tts.googleApiKey : '',
                    azureApiKey: includeApiKeys ? localSettings.tts.azureApiKey : ''
                },
                geminiApiKey: includeApiKeys ? localSettings.geminiApiKey : ''
            };

            const exportData = {
                version: 2,
                date: new Date().toISOString(),
                cards,
                history,
                revlog,
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

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsRestoring(true);
        try {
            const text = await file.text();
            let data: {
                version?: number;
                date?: string;
                cards?: Card[];
                history?: Record<string, number>;
                settings?: Partial<UserSettings>;
                revlog?: Array<{
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
            };

            try {
                data = JSON.parse(text);
            } catch {
                toast.error("Invalid backup file. Please select a valid JSON backup.");
                return;
            }

            // Validate backup structure
            if (!data.cards || !Array.isArray(data.cards)) {
                toast.error("Invalid backup: missing cards data.");
                return;
            }

            // Confirm restore with user
            const confirmed = window.confirm(
                `This will replace your current data with the backup from ${data.date ? new Date(data.date).toLocaleDateString() : 'unknown date'}.\n\n` +
                `Cards: ${data.cards.length}\n` +
                `This action cannot be undone. Continue?`
            );

            if (!confirmed) {
                return;
            }

            // Clear existing data
            await clearAllCards();
            await clearHistory();
            await db.revlog.clear();
            await db.aggregated_stats.clear();

            // Restore cards
            if (data.cards.length > 0) {
                await saveAllCards(data.cards);
            }

            // Restore review history
            if (data.history && typeof data.history === 'object') {
                // Group history by language if possible, otherwise use default language
                const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
                const primaryLanguage = languages.size > 0 ? [...languages][0] : localSettings.language;
                await saveFullHistory(data.history, primaryLanguage);
            }

            // Restore revlog if present
            if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
                await db.revlog.bulkPut(data.revlog);
            }

            // Restore settings (merge with current, conditionally overwrite API keys based on importApiKeys setting)
            if (data.settings) {
                const restoredSettings: Partial<UserSettings> = {
                    ...data.settings,
                    // Only import API keys if the setting is enabled and they exist in the backup
                    geminiApiKey: importApiKeys && data.settings.geminiApiKey
                        ? data.settings.geminiApiKey
                        : localSettings.geminiApiKey,
                    tts: {
                        ...data.settings.tts,
                        googleApiKey: importApiKeys && data.settings.tts?.googleApiKey
                            ? data.settings.tts.googleApiKey
                            : localSettings.tts.googleApiKey,
                        azureApiKey: importApiKeys && data.settings.tts?.azureApiKey
                            ? data.settings.tts.azureApiKey
                            : localSettings.tts.azureApiKey,
                    } as UserSettings['tts'],
                };
                setLocalSettings(prev => ({
                    ...prev,
                    ...restoredSettings,
                    tts: {
                        ...prev.tts,
                        ...(restoredSettings.tts || {}),
                    },
                    fsrs: {
                        ...prev.fsrs,
                        ...(restoredSettings.fsrs || {}),
                    },
                }));
                updateSettings(restoredSettings);
            }

            // Recalculate aggregated stats from imported data
            const { recalculateAllStats } = await import('@/services/db/repositories/aggregatedStatsRepository');
            await recalculateAllStats();

            refreshDeckData();
            toast.success(`Restored ${data.cards.length} cards from backup.`);
        } catch (error) {
            console.error('Backup restore failed:', error);
            toast.error("Failed to restore backup. Please try again.");
        } finally {
            setIsRestoring(false);
            event.target.value = '';
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


    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'general', label: 'General' },
        { id: 'audio', label: 'Audio' },
        { id: 'study', label: 'Limits' },
        { id: 'algorithm', label: 'FSRS' },
        { id: 'data', label: 'Data' },
        { id: 'danger', label: 'Danger' },
    ];

    const tabIcons: Record<SettingsTab, React.ReactNode> = {
        general: <Settings className="w-4 h-4" strokeWidth={1.5} />,
        audio: <Volume2 className="w-4 h-4" strokeWidth={1.5} />,
        study: <Target className="w-4 h-4" strokeWidth={1.5} />,
        algorithm: <Sliders className="w-4 h-4" strokeWidth={1.5} />,
        data: <Database className="w-4 h-4" strokeWidth={1.5} />,
        danger: <Skull className="w-4 h-4" strokeWidth={1.5} />,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-5xl h-[92vh] md:h-[85vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-card border border-border rounded-none">

                {/* Game-styled Sidebar */}
                <div className="relative w-full md:w-72 bg-card border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-col justify-between shrink-0">

                    <div className="space-y-6">
                        <DialogTitle className="flex items-center gap-3 mb-8">
                            <span className="w-2 h-2 rotate-45 bg-primary/60" />
                            <span className="text-lg md:text-xl font-medium text-foreground tracking-tight font-ui">Settings</span>
                        </DialogTitle>
                        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                            {tabs.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={clsx(
                                        "relative group flex items-center gap-3 text-left px-3 py-3 transition-all duration-200 whitespace-nowrap",
                                        activeTab === item.id
                                            ? "text-foreground bg-card/80"
                                            : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                                    )}
                                >
                                    {/* Left accent line */}
                                    <span className={clsx(
                                        "absolute left-0 top-1/4 bottom-1/4 w-[2px] transition-all duration-200",
                                        activeTab === item.id ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
                                    )} />

                                    <span className={clsx(
                                        "transition-colors",
                                        activeTab === item.id ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary/70"
                                    )}>
                                        {tabIcons[item.id]}
                                    </span>
                                    <span className="text-sm font-light font-ui tracking-wide relative z-10">
                                        {item.label}
                                    </span>
                                    {activeTab === item.id && (
                                        <ChevronRight className="w-3 h-3 ml-auto text-primary/60 hidden md:block" strokeWidth={2} />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="hidden md:block">
                        <GameDivider className="my-4" />
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                            <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground/50">
                                Deck: {settings.language}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Game-styled Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                    <div className="flex-1 px-6 py-6 md:px-12 md:py-8 overflow-y-auto">

                        {activeTab === 'general' && (
                            <GeneralSettings
                                localSettings={localSettings}
                                setLocalSettings={setLocalSettings}
                                username={localUsername}
                                setUsername={setLocalUsername}
                                languageLevel={profile?.language_level || 'A1'}
                                onUpdateLevel={updateLanguageLevel}
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
                                onRestoreBackup={handleRestoreBackup}
                                jsonInputRef={jsonInputRef}
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
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="w-2 h-2 rotate-45 bg-destructive/60" />
                                    <h2 className="text-lg font-medium text-foreground tracking-tight font-ui">Danger Zone</h2>
                                    <span className="flex-1 h-px bg-gradient-to-r from-destructive/30 via-border/30 to-transparent" />
                                </div>

                                {/* Reset Deck - Game Panel Style */}
                                <GamePanel variant="default" size="md" className="border-amber-500/30 hover:border-amber-500/50 transition-colors">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center">
                                                <AlertCircle className="text-amber-500" size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-sm font-medium text-foreground font-ui tracking-wide">Reset Current Deck</h4>
                                                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                                    Delete all cards, history, and progress for <span className="text-foreground">{localSettings.language}</span>. Restores beginner course.
                                                </p>
                                            </div>
                                        </div>
                                        <GameButton
                                            onClick={handleResetDeck}
                                            variant={confirmResetDeck ? 'primary' : 'secondary'}
                                            className={clsx(
                                                "w-full",
                                                confirmResetDeck && "bg-amber-500 hover:bg-orange-600"
                                            )}
                                        >
                                            {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
                                        </GameButton>
                                    </div>
                                </GamePanel>

                                <GameDivider />

                                {/* Hard Reset - Game Panel Style */}
                                <GamePanel variant="default" size="md" className="border-destructive/30 hover:border-destructive/50 transition-colors">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-destructive/10 flex items-center justify-center">
                                                <Skull className="text-destructive" size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-sm font-medium text-destructive font-ui tracking-wide">Complete Account Reset</h4>
                                                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                                    Permanently removes all data across all languages. <span className="text-foreground font-medium">This cannot be undone.</span>
                                                </p>
                                            </div>
                                        </div>
                                        <GameButton
                                            onClick={handleResetAccount}
                                            variant={confirmResetAccount ? 'primary' : 'secondary'}
                                            className={clsx(
                                                "w-full",
                                                confirmResetAccount && "bg-destructive hover:bg-destructive/90"
                                            )}
                                        >
                                            {confirmResetAccount ? "Confirm Complete Reset" : "Reset Everything"}
                                        </GameButton>
                                    </div>
                                </GamePanel>
                            </div>
                        )}
                    </div>

                    {/* Game-styled Footer */}
                    <div className="relative px-6 py-4 md:px-12 md:py-5 border-t border-border bg-card/50 flex justify-between items-center gap-4 shrink-0 flex-wrap">


                        <button
                            onClick={() => {
                                onClose();
                                signOut();
                            }}
                            className="group flex items-center gap-2 text-xs font-ui uppercase tracking-[0.1em] text-destructive/70 hover:text-destructive px-3 py-2 transition-colors"
                        >
                            <LogOut size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                        <div className="flex gap-3 ml-auto">
                            <GameButton
                                onClick={onClose}
                                variant="ghost"
                                size="md"
                            >
                                Cancel
                            </GameButton>
                            <GameButton
                                onClick={handleSave}
                                variant="primary"
                                size="md"
                            >
                                Save Changes
                            </GameButton>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};

## features/settings/components/SettingsSync.tsx
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateLocalSettingsToDatabase, getUserSettings } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const SettingsSync: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const setSettingsLoading = useSettingsStore(s => s.setSettingsLoading);
    const setSettings = useSettingsStore(s => s.setSettings);

    // Cloud Sync
    useEffect(() => {
        const loadCloudSettings = async () => {
            if (authLoading || !user) return;

            setSettingsLoading(true);
            try {
                const migrated = await migrateLocalSettingsToDatabase(user.id);
                if (migrated) {
                    toast.success('Settings migrated to cloud');
                }

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
    }, [user, authLoading, setSettings, setSettingsLoading]);

    // Local Storage Sync
    useEffect(() => {
        const localSettings = {
            ...settings,
            geminiApiKey: '',
            tts: {
                ...settings.tts,
                googleApiKey: '',
                azureApiKey: '',
            }
        };
        localStorage.setItem('language_mining_settings', JSON.stringify(localSettings));
    }, [settings]);

    return null;
};

## features/settings/components/StudySettings.tsx
import React from 'react';
import { Target, ListOrdered, ToggleLeft } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { GamePanel, GameSectionHeader, GameDivider } from '@/components/ui/game-ui';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info Banner */}
      <GamePanel variant="stat" size="sm" className="border-primary/20">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Daily study configuration for <span className="text-foreground font-medium">{currentLangName}</span>. Limits reset at 4:00 AM.
          </p>
        </div>
      </GamePanel>

      {/* Daily Limits Section */}
      <GameSectionHeader
        title="Daily Limits"
        subtitle="Maximum cards per day"
        icon={<Target className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GamePanel variant="highlight" size="md" glowOnHover>
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/60" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                New Cards
              </label>
            </div>
            <EditorialInput
              type="number"
              value={currentDailyNew}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Unseen vocabulary</p>
          </div>
        </GamePanel>

        <GamePanel variant="highlight" size="md" glowOnHover>
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-sky-500/60" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Review Cards
              </label>
            </div>
            <EditorialInput
              type="number"
              value={currentDailyReview}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Due for review</p>
          </div>
        </GamePanel>
      </div>

      <GameDivider />

      {/* Study Preferences Section */}
      <GameSectionHeader
        title="Study Preferences"
        subtitle="Session behavior options"
        icon={<ToggleLeft className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-light text-foreground font-ui">Card Order</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Choose presentation priority</p>
            </div>
            <select
              value={localSettings.cardOrder || 'newFirst'}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, cardOrder: e.target.value as any }))}
              className="bg-transparent border border-border/30 text-sm font-ui focus:outline-none focus:border-primary/60 transition-colors py-2 px-3 text-foreground font-light"
            >
              <option value="newFirst" className="bg-background text-foreground">New First</option>
              <option value="reviewFirst" className="bg-background text-foreground">Review First</option>
              <option value="mixed" className="bg-background text-foreground">Mixed</option>
            </select>
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Binary Rating</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Simplified pass/fail grading reduces decision fatigue</p>
            </div>
            <Switch
              checked={localSettings.binaryRatingMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
              }
            />
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Full Sentence Front</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Show the full sentence on the front of the card instead of just the target word</p>
            </div>
            <Switch
              checked={localSettings.showWholeSentenceOnFront}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, showWholeSentenceOnFront: checked }))
              }
            />
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Skip Learning Wait</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Continue reviewing other due cards instead of waiting for learning steps to cool down</p>
            </div>
            <Switch
              checked={localSettings.ignoreLearningStepsWhenNoCards}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, ignoreLearningStepsWhenNoCards: checked }))
              }
            />
          </div>
        </GamePanel>
      </div>
    </div>
  );
};


## features/settings/components/SyncthingSettings.tsx
import React from 'react';
import { RefreshCw, Save, Download, FolderSync, Clock } from 'lucide-react';
import { GamePanel, GameSectionHeader, GameButton } from '@/components/ui/game-ui';

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
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <GameSectionHeader
                title="Syncthing Sync"
                subtitle="Sync data between devices using a shared file"
                icon={<FolderSync className="w-4 h-4" strokeWidth={1.5} />}
            />

            {/* Last Sync Status */}
            <GamePanel variant="stat" size="sm" className="border-border/30">
                <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground/60 font-light">Last synced</p>
                        <p className="text-sm font-ui text-foreground">{formatLastSync(lastSync)}</p>
                    </div>
                </div>
            </GamePanel>

            {/* Sync Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Save Changes Button */}
                <GamePanel
                    variant="default"
                    size="md"
                    glowOnHover={!isSaving}
                    className={`cursor-pointer group ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onSave}
                >
                    <div className="flex flex-col items-center text-center space-y-3 py-2">
                        <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
                            <Save className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isSaving ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-ui text-foreground mb-1">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 font-light">
                                Write to sync file for Syncthing
                            </p>
                        </div>
                    </div>
                </GamePanel>

                {/* Load from Sync File Button */}
                <GamePanel
                    variant="default"
                    size="md"
                    glowOnHover={!isLoading}
                    className={`cursor-pointer group ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onLoad}
                >
                    <div className="flex flex-col items-center text-center space-y-3 py-2">
                        <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
                            <Download className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-ui text-foreground mb-1">
                                {isLoading ? 'Loading...' : 'Load from File'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 font-light">
                                Import data from sync file
                            </p>
                        </div>
                    </div>
                </GamePanel>
            </div>

            {/* Instructions */}
            <GamePanel variant="stat" size="sm" className="border-border/20">
                <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/30 mt-1.5 shrink-0" />
                    <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-2">
                        <p><strong className="text-muted-foreground/70">How it works:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Set up Syncthing to sync a folder between your devices</li>
                            <li>Click "Save Changes" to write your data to the sync file</li>
                            <li>Syncthing will automatically sync the file to other devices</li>
                            <li>On the other device, click "Load from File" to import</li>
                        </ol>
                        <p className="mt-2">
                            <strong className="text-muted-foreground/70">Note:</strong> On mobile, the file is saved to the Documents folder. Make sure Syncthing has access to it.
                        </p>
                    </div>
                </div>
            </GamePanel>
        </div>
    );
};

## features/settings/hooks/useAccountManagement.ts
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/services/db/dexie';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { LanguageId } from '@/types';
import {
    deleteCardsByLanguage,
    saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { clearHistory } from '@/services/db/repositories/historyRepository';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';

export const useAccountManagement = () => {
    const settings = useSettingsStore(s => s.settings);
    const queryClient = useQueryClient();
    const [confirmResetDeck, setConfirmResetDeck] = useState(false);
    const [confirmResetAccount, setConfirmResetAccount] = useState(false);

    const handleResetDeck = async () => {
        if (!confirmResetDeck) {
            setConfirmResetDeck(true);
            return;
        }
        try {
            await deleteCardsByLanguage(settings.language);

            await clearHistory(settings.language);

            const rawDeck =
                settings.language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
                    (settings.language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
                        (settings.language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
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
            await db.cards.clear();
            await db.revlog.clear();
            await db.history.clear();
            await db.profile.clear();

            localStorage.removeItem('language_mining_settings');
            localStorage.removeItem('linguaflow_api_keys');

            toast.success("Account reset successfully. Restarting...");
            queryClient.clear();
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Account reset failed", error);
            toast.error(`Reset failed: ${error.message}`);
        }
    };

    return {
        handleResetDeck,
        handleResetAccount,
        confirmResetDeck,
        setConfirmResetDeck,
        confirmResetAccount,
        setConfirmResetAccount
    };
};

## features/settings/hooks/useCloudSync.ts
import { toast } from 'sonner';

export const useCloudSync = () => {
    const handleSyncToCloud = async () => {
        toast.info('This is a local-only app. Your data is stored on this device.');
    };

    return {
        handleSyncToCloud,
        isSyncingToCloud: false,
        syncComplete: false
    };
};

## features/settings/hooks/useSyncthingSync.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
    saveSyncFile,
    loadSyncFile,
    importSyncData,
    checkSyncFile,
    getLastSyncTime,
    setLastSyncTime,
    SyncData
} from '@/services/sync/syncService';

export const useSyncthingSync = () => {
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());

    const saveToSyncFile = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await saveSyncFile(settings);

            if (result.success) {
                const now = new Date().toISOString();
                setLastSyncTime(now);
                setLastSync(now);
                toast.success('Changes saved to sync file');
                return true;
            } else {
                toast.error(result.error || 'Failed to save sync file');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Save error:', error);
            toast.error(`Save failed: ${error.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [settings]);

    const loadFromSyncFile = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await loadSyncFile();

            if (!result.success) {
                toast.error(result.error || 'Failed to load sync file');
                return false;
            }

            if (!result.data) {
                toast.error('No data found in sync file');
                return false;
            }

            // Show confirmation
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

                // Refresh all queries
                queryClient.invalidateQueries();

                // Reload page after a short delay
                setTimeout(() => window.location.reload(), 1000);
                return true;
            } else {
                toast.error(importResult.error || 'Failed to import sync data');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Load error:', error);
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
            console.error('[Sync] Check error:', error);
            return { exists: false };
        }
    }, []);

    return {
        saveToSyncFile,
        loadFromSyncFile,
        checkSyncStatus,
        isSaving,
        isLoading,
        lastSync
    };
};

## features/study/components/AnalysisModal.tsx
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Quote } from 'lucide-react';

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
    result
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border border-border p-0 overflow-hidden max-h-[85vh] flex flex-col">
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
                </span>

                <div className="p-8 md:p-10 space-y-8 overflow-y-auto">
                    {/* Header */}
                    <div className="space-y-3 border-b border-border/40 pb-6">
                        <div className="flex justify-between items-start gap-6">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-2 h-2 rotate-45 bg-primary/60 shrink-0" />
                                <h2 className="text-3xl md:text-4xl font-light tracking-tight break-words">{result?.originalText}</h2>
                            </div>
                            <span className="text-[9px] font-ui font-medium uppercase border border-border/60 px-3 py-1.5 text-muted-foreground/80 tracking-[0.15em] whitespace-nowrap shrink-0">
                                {result?.partOfSpeech}
                            </span>
                        </div>
                    </div>

                    {/* Content sections */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                                <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Definition</span>
                            </div>
                            <p className="text-lg font-light leading-relaxed text-foreground/90 break-words">{result?.definition}</p>
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Quote size={11} strokeWidth={1.5} className="text-muted-foreground/50" />
                                <span className="text-[9px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">In This Context</span>
                            </div>
                            <div className="relative pl-4 border-l-2 border-primary/20">
                                <p className="text-base italic text-muted-foreground/75 leading-relaxed break-words">
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

## features/study/components/CramModal.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getTags } from "@/services/db/repositories/cardRepository";

interface CramModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CramModal = ({ isOpen, onClose }: CramModalProps) => {
    const settings = useSettingsStore(s => s.settings);
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
import React, { useMemo, useEffect } from 'react';
import { Card, Language, LanguageId } from '@/types';
import { escapeRegExp, parseFurigana, cn, findInflectedWordInSentence } from '@/lib/utils';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardText } from '@/features/deck/hooks/useCardText';
import { Mic, Volume2 } from 'lucide-react';
import { FuriganaRenderer } from '@/components/ui/furigana-renderer';
import { useTextSelection } from '@/features/study/hooks/useTextSelection';
import { AnalysisModal } from '@/features/study/components/AnalysisModal';
import { SelectionMenu } from '@/features/study/components/SelectionMenu';
import { useFlashcardAudio } from '@/features/study/hooks/useFlashcardAudio';
import { useAIAnalysis } from '@/features/study/hooks/useAIAnalysis';
import { useCardInteraction } from '@/features/study/hooks/useCardInteraction';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
  onAddCard?: (card: Card) => void;
}

export const Flashcard = React.memo<FlashcardProps>(({
  card,
  isFlipped,
  autoPlayAudio = false,
  blindMode = false,
  showTranslation = true,
  language = LanguageId.Polish,
  onAddCard
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { displayedTranslation, isGaslit, processText } = useCardText(card);
  const { selection, handleMouseUp, clearSelection } = useTextSelection();

  // Reset selection on card change
  useEffect(() => {
    clearSelection();
  }, [card.id, clearSelection]);

  // Use Custom Hooks
  const { isRevealed, setIsRevealed, handleReveal, handleKeyDown } = useCardInteraction({
    cardId: card.id,
    blindMode,
    isFlipped
  });

  const { speak, playSlow } = useFlashcardAudio({
    card,
    language,
    settings,
    isFlipped,
    autoPlayAudio
  });

  const {
    isAnalyzing,
    analysisResult,
    isAnalysisOpen,
    setIsAnalysisOpen,
    isGeneratingCard,
    handleAnalyze,
    handleGenerateCard
  } = useAIAnalysis({
    card,
    language,
    apiKey: settings.geminiApiKey,
    selection,
    clearSelection,
    onAddCard
  });

  const displayedSentence = processText(card.targetSentence);

  const fontSizeClass = useMemo(() => {
    const len = displayedSentence.length;
    if (len < 6) return "text-5xl md:text-7xl tracking-tight font-light";
    if (len < 15) return "text-4xl md:text-6xl tracking-tight font-light";
    if (len < 30) return "text-3xl md:text-5xl tracking-tight font-extralight";
    if (len < 60) return "text-2xl md:text-4xl tracking-normal font-extralight";
    return "text-xl md:text-3xl font-extralight tracking-normal";
  }, [displayedSentence]);

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
            <button
              onClick={(e) => { e.stopPropagation(); speak(); }}
              className="relative p-6 bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group/btn"
            >
              {/* Corner accents */}
              <span className="absolute -top-px -left-px w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
                <span className="absolute top-0 left-0 h-full w-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
              </span>
              <span className="absolute -bottom-px -right-px w-2 h-2">
                <span className="absolute bottom-0 right-0 w-full h-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
                <span className="absolute bottom-0 right-0 h-full w-px bg-primary/30 group-hover/btn:bg-primary/60 transition-colors" />
              </span>
              <Mic size={28} strokeWidth={1} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
            </button>
          )}
          <p className={cn(baseClasses, "blur-3xl opacity-5 group-hover:opacity-10 transition-all duration-500")}>
            {(card.targetWord && !settings.showWholeSentenceOnFront) ? processText(card.targetWord) : displayedSentence}
          </p>
        </div>
      );
    }

    if (!isFlipped && card.targetWord && !settings.showWholeSentenceOnFront) {
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

    // Logic to highlight target text or render Japanese logic
    const hasFuriganaInDedicatedField = card.furigana && /\[.+?\]/.test(card.furigana);
    const hasFuriganaInSentence = card.targetSentence && /\[.+?\]/.test(card.targetSentence);

    let furiganaSource: string | undefined;
    if (hasFuriganaInDedicatedField) {
      const furiganaPlainText = parseFurigana(card.furigana!).map(s => s.text).join('');
      const sentencePlainText = card.targetSentence || '';
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

    // If Japanese and using furigana...
    if (language === LanguageId.Japanese && furiganaSource) {
      const segments = parseFurigana(furiganaSource);
      const hasFurigana = segments.some(s => s.furigana);

      if (hasFurigana) {
        const targetWordPlain = card.targetWord
          ? parseFurigana(card.targetWord).map(s => s.text).join('')
          : null;

        const segmentTexts = segments.map(s => s.text);
        const fullText = segmentTexts.join('');
        const targetIndices = new Set<number>();

        if (targetWordPlain) {
          // First try exact match, then try inflected form match
          let targetStart = fullText.indexOf(targetWordPlain);
          let matchedWordLength = targetWordPlain.length;

          if (targetStart === -1) {
            // Try to find inflected form
            const matchedWord = findInflectedWordInSentence(targetWordPlain, fullText);
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

        return (
          <div className={cn(baseClasses, "leading-[1.6]")}>
            {segments.map((segment, i) => {
              const isTarget = targetIndices.has(i);
              if (segment.furigana) {
                return (
                  <ruby key={i} className="group/ruby" style={{ rubyAlign: 'center' }}>
                    <span className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>
                    <rt className="text-[0.5em] text-muted-foreground/70 select-none opacity-0 group-hover/ruby:opacity-100 transition-opacity duration-500 font-sans font-light tracking-wide text-center" style={{ textAlign: 'center' }}>
                      {processText(segment.furigana)}
                    </rt>
                  </ruby>
                );
              }
              return <span key={i} className={isTarget ? "text-primary/90" : ""}>{processText(segment.text)}</span>;
            })}
          </div>
        );
      }
    }

    if (card.targetWord) {
      const targetWordPlain = parseFurigana(card.targetWord).map(s => s.text).join('');

      // Find the actual word in the sentence (handles inflected forms like godzina -> godzinie)
      const matchedWord = findInflectedWordInSentence(targetWordPlain, displayedSentence);

      if (matchedWord) {
        // Use the matched word for highlighting (case-insensitive)
        const wordBoundaryRegex = new RegExp(`(\\b${escapeRegExp(matchedWord)}\\b)`, 'gi');
        const parts = displayedSentence.split(wordBoundaryRegex);
        return (
          <p className={baseClasses}>
            {parts.map((part, i) =>
              part.toLowerCase() === matchedWord.toLowerCase()
                ? <span key={i} className="text-primary/90 font-bold">{processText(part)}</span>
                : <span key={i}>{processText(part)}</span>
            )}
          </p>
        );
      }

      // Fallback: no match found, just display the sentence without highlighting
      return <p className={baseClasses}>{displayedSentence}</p>;
    }

    return <p className={baseClasses}>{displayedSentence}</p>;
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, fontSizeClass, blindMode, speak, isFlipped, card.targetSentence, processText, settings.showWholeSentenceOnFront, handleReveal, handleKeyDown]);

  const containerClasses = cn(
    "relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full"
  );

  return (
    <>
      <div className={containerClasses} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
        {/* Genshin-styled ornate frame */}
        <div className={cn(
          "absolute inset-4 md:inset-12 pointer-events-none transition-all duration-700",
          isFlipped && ""
        )}>

        </div>

        {/* Main content */}
        <div className={cn(
          "w-full px-8 md:px-16 flex flex-col items-center z-10 transition-all duration-700 ease-out",
          isFlipped && "-translate-y-[80%]"
        )}>
          {RenderedSentence}

          {isRevealed && (
            <button
              onClick={speak}
              className="group relative flex items-center justify-center text-muted-foreground/40 hover:text-primary/70 transition-all duration-300 mt-6"
            >
              <Volume2 size={20} strokeWidth={1.5} className={cn("transition-all duration-300", playSlow && "text-primary")} />
            </button>
          )}
        </div>

        {/* Translation reveal with enhanced game-styled animation */}
        {isFlipped && (
          <div className="absolute top-1/2 left-0 right-0 bottom-4 text-center flex flex-col items-center gap-3 z-0 pointer-events-none overflow-y-auto">

            {/* Decorative divider - Genshin style */}
            <div className="flex items-center gap-3 my-3 animate-in fade-in duration-500">
              <span className="w-12 h-px bg-linear-to-r from-transparent to-amber-600/80" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-600/80" />
              <span className="w-1 h-1 rotate-45 bg-amber-600/80" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-600/80" />
              <span className="w-12 h-px bg-linear-to-l from-transparent to-amber-600/80" />
            </div>

            {showTranslation && (
              <div className="relative group pointer-events-auto px-8 md:px-16 shrink-0 flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards">
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
                      <span className="text-base text-muted-foreground/80 font-light italic">{card.targetWordTranslation}</span>
                    )}
                  </div>
                )}

                <div className="max-w-3xl">
                  <p className={cn(
                    "text-base md:text-xl text-foreground/70 font-light italic text-center leading-relaxed text-balance transition-colors duration-300",
                    isGaslit ? "text-destructive/70" : "group-hover:text-foreground/85"
                  )}>
                    {processText(displayedTranslation)}
                  </p>
                </div>
                {isGaslit && (
                  <span className="absolute -top-5 -right-6 text-[8px] font-ui font-medium uppercase text-destructive/60 tracking-widest rotate-12 opacity-70">
                    Suspicious
                  </span>
                )}
              </div>
            )}

            {card.notes && (
              <div className="mt-2 pointer-events-auto shrink-0 px-6">
                <FuriganaRenderer
                  text={card.notes}
                  className="text-xs font-ui font-light text-foreground text-center tracking-wide leading-relaxed block"
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
});

## features/study/components/SelectionMenu.tsx
import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { ButtonLoader } from '@/components/game';

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
    isGeneratingCard
}) => {
    return (
        <div
            className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
            style={{ top, left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button
                onClick={onAnalyze}
                disabled={isAnalyzing || isGeneratingCard}
                className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
            >
                {/* Corner accents */}
                <span className="absolute -top-px -left-px w-2 h-2">
                    <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                    <span className="absolute top-0 left-0 h-full w-px bg-primary" />
                </span>
                <span className="absolute -bottom-px -right-px w-2 h-2">
                    <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                    <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
                </span>
                {isAnalyzing ? <ButtonLoader /> : <Sparkles size={11} strokeWidth={2} className="text-primary" />}
                <span>Analyze</span>
            </button>

            {onGenerateCard && (
                <button
                    onClick={onGenerateCard}
                    disabled={isAnalyzing || isGeneratingCard}
                    className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
                >
                    {/* Corner accents */}
                    <span className="absolute -top-px -left-px w-2 h-2">
                        <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                        <span className="absolute top-0 left-0 h-full w-px bg-primary" />
                    </span>
                    <span className="absolute -bottom-px -right-px w-2 h-2">
                        <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                        <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
                    </span>
                    {isGeneratingCard ? <ButtonLoader /> : <Plus size={11} strokeWidth={2} className="text-primary" />}
                    <span>Create Card</span>
                </button>
            )}
        </div>
    );
};

## features/study/components/StudyCardArea.tsx
import React from 'react';
import { Card, Language } from '@/types';
import { Flashcard } from './Flashcard';
import { StudyFeedback } from './StudyFeedback';
import { XpFeedback } from '@/features/xp/hooks/useXpSession';
import { GenshinCorners } from '@/components/game/GamePanel';

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

export const StudyCardArea: React.FC<StudyCardAreaProps> = React.memo(({
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
            {/* Subtle diamond pattern background */}
            <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='%23d4a574' fill-opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ornate corner frames */}
            <GenshinCorners className="text-amber-600/80 dark:text-amber-400/20 hidden md:block" zIndex="z-10" />

            {/* Decorative side accents - enhanced */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2">
                <span className="w-px h-16 bg-linear-to-b from-transparent via-amber-600/80 to-transparent" />
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/80" />
                <span className="w-px h-24 bg-linear-to-b from-amber-600/80 via-border/30 to-transparent" />
            </span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2">
                <span className="w-px h-16 bg-linear-to-b from-transparent via-amber-600/80 to-transparent" />
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/80" />
                <span className="w-px h-24 bg-linear-to-b from-amber-600/80 via-border/30 to-transparent" />
            </span>

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
      {/* Game-styled feedback panel */}
      <div className={clsx(
        "relative flex items-center gap-3 px-5 py-2.5 border backdrop-blur-sm",
        currentFeedback.isBonus 
          ? "bg-primary/5 border-primary/40 text-primary" 
          : "bg-card/80 border-border/40 text-muted-foreground"
      )}>
        {/* Corner accents */}
        <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute top-0 left-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute top-0 left-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -top-px -right-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute top-0 right-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute top-0 right-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -bottom-px -left-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute bottom-0 left-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute bottom-0 left-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
          <span className={clsx("absolute bottom-0 right-0 w-full h-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
          <span className={clsx("absolute bottom-0 right-0 h-full w-0.5", currentFeedback.isBonus ? "bg-primary" : "bg-border")} />
        </span>
        
        <span className="w-1.5 h-1.5 rotate-45 bg-current" />
        <Zap size={12} className={currentFeedback.isBonus ? "fill-primary" : "fill-none"} />
        <span className="text-xs font-ui uppercase tracking-[0.2em]">
          {currentFeedback.message}
        </span>
      </div>
    </div>
  );
};


## features/study/components/StudyFooter.tsx
import React, { useState } from 'react';
import clsx from 'clsx';
import { Grade } from '@/types';

interface StudyFooterProps {
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    isProcessing: boolean;
    binaryRatingMode: boolean;
    onGrade: (grade: Grade) => void;
}

export const StudyFooter: React.FC<StudyFooterProps> = React.memo(({
    isFlipped,
    setIsFlipped,
    isProcessing,
    binaryRatingMode,
    onGrade,
}) => {
    return (
        <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] border-t border-amber-600/10">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="w-8 h-px bg-amber-500/20" />
                <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
                <span className="w-8 h-px bg-amber-500/20" />
            </div>

            <div className="h-24 md:h-28 w-full max-w-4xl mx-auto py-6 px-8 md:px-16">
                {!isFlipped ? (
                    <button
                        onClick={() => setIsFlipped(true)}
                        disabled={isProcessing}
                        className="group relative w-full h-full flex items-center justify-center border-2 border-amber-700/30 hover:border-amber-500/30 bg-card/30 hover:bg-amber-500/5 transition-all duration-300"
                    >
                        {/* Corner brackets on hover */}
                        <span className="absolute -top-px -left-px w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/60" />
                            <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/60" />
                        </span>
                        <span className="absolute -top-px -right-px w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500/60" />
                            <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500/60" />
                        </span>
                        <span className="absolute -bottom-px -left-px w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/60" />
                            <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500/60" />
                        </span>
                        <span className="absolute -bottom-px -right-px w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/60" />
                            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/60" />
                        </span>

                        {/* Content with diamond accents */}
                        <span className="text-[12px] font-bold font-ui uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-amber-600/80 transition-colors duration-300">
                            Show Answer
                        </span>

                        {/* Subtle keyboard hint */}
                        <span className="absolute bottom-3 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-300 tracking-wider">
                            SPACE
                        </span>
                    </button>
                ) : (
                    binaryRatingMode ? (
                        <div className="grid grid-cols-2 h-full w-full gap-4 md:gap-8 items-center">
                            <GameAnswerButton
                                label="Again"
                                shortcut="1"
                                intent="danger"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Good"
                                shortcut="Space"
                                intent="success"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 h-full w-full gap-2 md:gap-4 items-center">
                            <GameAnswerButton
                                label="Again"
                                shortcut="1"
                                intent="danger"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Hard"
                                shortcut="2"
                                intent="warning"
                                onClick={() => onGrade('Hard')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Good"
                                shortcut="3"
                                intent="success"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Easy"
                                shortcut="4"
                                intent="info"
                                onClick={() => onGrade('Easy')}
                                disabled={isProcessing}
                            />
                        </div>
                    )
                )}
            </div>
        </footer>
    );
});

const GameAnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: {
    label: string;
    shortcut: string;
    intent: 'danger' | 'warning' | 'success' | 'info';
    onClick: () => void;
    disabled: boolean;
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const colorMap = {
        danger: {
            text: 'text-red-800/70',
            hover: 'hover:text-red-500',
            border: 'hover:border-red-500/40',
            bg: 'hover:bg-red-500/5',
            accent: 'bg-red-500',
            glow: 'shadow-red-500/20',
            gradient: 'from-red-500/10 to-transparent'
        },
        warning: {
            text: 'text-amber-800/70',
            hover: 'hover:text-amber-500',
            border: 'hover:border-amber-500/40',
            bg: 'hover:bg-amber-500/5',
            accent: 'bg-amber-500',
            glow: 'shadow-amber-500/20',
            gradient: 'from-amber-500/10 to-transparent'
        },
        success: {
            text: 'text-pine-800/70',
            hover: 'hover:text-pine-500',
            border: 'hover:border-pine-500/40',
            bg: 'hover:bg-pine-500/5',
            accent: 'bg-pine-500',
            glow: 'shadow-pine-500/20',
            gradient: 'from-pine-500/10 to-transparent'
        },
        info: {
            text: 'text-blue-800/70',
            hover: 'hover:text-blue-500',
            border: 'hover:border-blue-500/40',
            bg: 'hover:bg-blue-500/5',
            accent: 'bg-blue-500',
            glow: 'shadow-blue-500/20',
            gradient: 'from-blue-500/10 to-transparent'
        }
    };
    const colors = colorMap[intent];

    const handleClick = () => {
        if (disabled) return;
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none overflow-hidden",
                "border border-border/80 bg-card transition-all duration-200",
                colors.border, colors.bg,
                "hover:shadow-lg",
                colors.glow,
                isPressed && "scale-95",
                disabled && "opacity-90 cursor-not-allowed"
            )}  
        >
            {/* Gradient background on hover */}
            <div className={clsx(
                "absolute inset-0 bg-linear-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                colors.gradient
            )} />

            {/* Corner accents on hover */}
            <span className={clsx("absolute -top-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute top-0 left-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute top-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -top-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute top-0 right-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute top-0 right-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute bottom-0 left-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute bottom-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute bottom-0 right-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute bottom-0 right-0 h-full w-px", colors.accent)} />
            </span>

            {/* Diamond accent with glow */}
            <div className="relative mb-2">
                <span className={clsx(
                    "w-1.5 h-1.5 rotate-45 opacity-40 group-hover:opacity-100 transition-all duration-200 block",
                    colors.accent
                )} />
                <span className={clsx(
                    "absolute inset-0 w-1.5 h-1.5 rotate-45 opacity-0 group-hover:opacity-60 blur-sm transition-opacity",
                    colors.accent
                )} />
            </div>

            {/* Label */}
            <span className={clsx(
                "relative text-sm font-ui uppercase tracking-[0.15em] transition-all duration-200",
                colors.text, colors.hover
            )}>
                {label}
            </span>

            {/* Shortcut hint */}
            <span className="absolute bottom-2 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-200 tracking-wider">
                {shortcut}
            </span>
        </button>
    );
});

## features/study/components/StudyHeader.tsx
import React from 'react';
import { Zap, TrendingUp, Pencil, Trash2, Archive, Undo2, X, Bookmark } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import clsx from 'clsx';
import { Card } from '@/types';

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

export const StudyHeader: React.FC<StudyHeaderProps> = React.memo(({
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
    const activeColor = currentStatus?.label === 'NEW' ? 'bg-blue-500' 
        : currentStatus?.label === 'LRN' ? 'bg-amber-500' 
        : currentStatus?.label === 'LAPSE' ? 'bg-red-500' 
        : currentStatus?.label === 'REV' ? 'bg-green-600' 
        : 'bg-amber-500';

    const activeBorderColor = currentStatus?.label === 'NEW' ? 'border-blue-500' 
        : currentStatus?.label === 'LRN' ? 'border-amber-700' 
        : currentStatus?.label === 'LAPSE' ? 'border-red-500' 
        : currentStatus?.label === 'REV' ? 'border-green-600' 
        : 'border-amber-500';

    const activeGradientLeft = currentStatus?.label === 'NEW' ? 'from-blue-500' 
        : currentStatus?.label === 'LRN' ? 'from-amber-700' 
        : currentStatus?.label === 'LAPSE' ? 'from-red-500' 
        : currentStatus?.label === 'REV' ? 'from-green-600' 
        : 'from-amber-500';

    const activeGradientRight = currentStatus?.label === 'NEW' ? 'from-blue-500' 
        : currentStatus?.label === 'LRN' ? 'from-amber-700' 
        : currentStatus?.label === 'LAPSE' ? 'from-red-500' 
        : currentStatus?.label === 'REV' ? 'from-green-600' 
        : 'from-amber-500';

    return (
        <header className="relative h-16 md:h-20 px-4 md:px-6 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-2 ">
            {/* Bottom decorative accent */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center z-10">
                <div className="relative">
                    <span className={clsx("w-3 h-3 rotate-45 transition-colors duration-300 block border bg-transparent", activeBorderColor, "opacity-80")} />
                    <span className={clsx("absolute inset-0 w-3 h-3 rotate-45 blur-[1px] transition-colors duration-300 block", activeColor, "opacity-50")} />
                    {/* Left fading line - positioned at left vertex */}
                    <span className={clsx("absolute top-1/2 -translate-y-1/2 -left-[5px] w-32 h-px transition-colors duration-300 bg-gradient-to-l to-transparent opacity-60 -translate-x-full", activeGradientLeft)} />
                    {/* Right fading line - positioned at right vertex */}
                    <span className={clsx("absolute top-1/2 -translate-y-1/2 -right-[5px] w-32 h-px transition-colors duration-300 bg-gradient-to-r to-transparent opacity-60 translate-x-full", activeGradientRight)} />
                </div>
            </div>

            {/* Queue statistics - game UI style */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <GameQueueStat
                    label="New"
                    count={counts.unseen}
                    isActive={currentStatus?.label === 'NEW'}
                    color="blue"
                />
                <GameQueueStat
                    label="Learning"
                    count={counts.learning}
                    isActive={currentStatus?.label === 'LRN'}
                    color="orange"
                />
                <GameQueueStat
                    label="Lapse"
                    count={counts.lapse}
                    isActive={currentStatus?.label === 'LAPSE'}
                    color="red"
                />
                <GameQueueStat
                    label="Review"
                    count={counts.mature}
                    isActive={currentStatus?.label === 'REV'}
                    color="green"
                />
            </div>

            {/* Enhanced XP display - centered */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-3 overflow-hidden group">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-primary/5 opacity-0" />

                {/* XP icon with glow */}
                <div className="relative">
                    <Zap size={14} strokeWidth={2} className="text-primary fill-primary/20" />
                    <div className="absolute inset-0 blur-[2px] opacity-50">
                        <Zap size={14} strokeWidth={2} className="text-primary" />
                    </div>
                </div>

                {/* XP value */}
                <span className="relative text-sm font-ui font-medium tracking-wide text-foreground tabular-nums">
                    {sessionXp}
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 ml-1">XP</span>
                </span>

                {/* Multiplier badge */}
                {multiplierInfo.value > 1.0 && (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-semibold px-2 py-0.5 animate-pulse">
                        <TrendingUp size={10} strokeWidth={2.5} />
                        <span>×{multiplierInfo.value.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Meta info and controls - game styled */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <GameActionButton
                        icon={<Pencil size={14} strokeWidth={1.5} />}
                        onClick={onEdit}
                        disabled={isProcessing}
                        title="Edit Card"
                        aria-label="Edit Card"
                    />
                    <GameActionButton
                        icon={<Trash2 size={14} strokeWidth={1.5} />}
                        onClick={onDelete}
                        disabled={isProcessing}
                        title="Delete Card"
                        aria-label="Delete Card"
                        variant="danger"
                    />
                    <GameActionButton
                        icon={<Archive size={14} strokeWidth={1.5} />}
                        onClick={onArchive}
                        disabled={isProcessing}
                        title="Archive"
                        aria-label="Archive"
                    />
                    <Toggle
                        pressed={isBookmarked}
                        onPressedChange={onBookmark}
                        aria-label="Toggle bookmark"
                        className="h-9 w-9 p-0 data-[state=on]:*:[svg]:fill-primary  data-[state=on]:text-primary hover:bg-card/50 hover:text-foreground border border-transparent hover:border-border/40 transition-all duration-200"
                    >
                        <Bookmark size={14} strokeWidth={isBookmarked ? 2 : 1.5} className={clsx("transition-all", isBookmarked && "fill-current")} />
                    </Toggle>
                    {canUndo && (
                        <GameActionButton
                            icon={<Undo2 size={14} strokeWidth={1.5} />}
                            onClick={onUndo}
                            title="Undo (Z)"
                            aria-label="Undo"
                        />
                    )}
                    <GameActionButton
                        icon={<X size={14} strokeWidth={1.5} />}
                        onClick={onExit}
                        title="Exit (Esc)"
                        aria-label="Exit"
                        variant="danger"
                    />
                </div>
            </div>
        </header>
    );
});

const GameQueueStat = React.memo(({ label, count, isActive, color }: {
    label: string;
    count: number;
    isActive: boolean;
    color: 'blue' | 'orange' | 'red' | 'green';
}) => {
    const colorMap = {
        blue: { active: 'text-blue-800 border-blue-500/30 bg-blue-500/5', inactive: 'text-muted-foreground/60 border-border/80' },
        orange: { active: 'text-amber-800 border-amber-800/40 bg-amber-500/5', inactive: 'text-muted-foreground/60 border-border/80' },
        red: { active: 'text-red-800 border-red-500/30 bg-red-500/5', inactive: 'text-muted-foreground/60 border-border/80' },
        green: { active: 'text-green-800 border-green-700/30 bg-green-700/5', inactive: 'text-muted-foreground/60 border-border/80' },
    };
    const colors = colorMap[color];

    return (
        <div className={clsx(
            "relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 border transition-all duration-300",
            isActive ? colors.active : colors.inactive,
            count === 0 && !isActive && "opacity-40"
        )}>
            {/* Top-left corner */}
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-current opacity-60" />
            {/* Bottom-right corner */}
            <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-current opacity-60" />
            
            {/* Diamond indicator */}
            <span className={clsx(
                "w-1.5 h-1.5 rotate-45 transition-colors",
                isActive ? "bg-current animate-pulse" : "bg-current/40"
            )} />
            <span className="hidden sm:inline text-[9px] font-ui uppercase tracking-wider">{label}</span>
            <span className="text-xs font-ui font-medium tabular-nums">{count}</span>

        </div>
    );
});

const GameActionButton = React.memo(({ icon, onClick, disabled, title, variant = 'default' }: {
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    title: string;
    variant?: 'default' | 'danger';
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={clsx(
            "relative p-2 border border-transparent transition-all duration-200",
            "text-muted-foreground/50 hover:text-foreground",
            variant === 'danger' && "hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5",
            variant === 'default' && "hover:border-border/40 hover:bg-card/50",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {icon}
    </button>
));

## features/study/components/StudySession.tsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Trophy, Target, Zap, Sparkles } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStudySession } from '../hooks/useStudySession';
import { useXpSession } from '@/features/xp/hooks/useXpSession';
import { CardXpPayload, CardRating } from '@/features/xp/xpUtils';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { StudyHeader } from './StudyHeader';
import { StudyFooter } from './StudyFooter';
import { StudyCardArea } from './StudyCardArea';

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
  onDeleteCard: (id: string) => void;
  onRecordReview: (oldCard: Card, grade: Grade, xpPayload?: CardXpPayload) => void;
  onExit: () => void;
  onComplete?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isCramMode?: boolean;
  dailyStreak: number;
  onAddCard?: (card: Card) => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
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
  const settings = useSettingsStore(s => s.settings);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { sessionXp, sessionStreak, multiplierInfo, feedback, processCardResult, subtractXp } = useXpSession(dailyStreak, isCramMode);

  const lastXpEarnedRef = React.useRef<number>(0);

  const enhancedRecordReview = useCallback((card: Card, grade: Grade) => {
    const rating = mapGradeToRating(grade);
    const xpResult = processCardResult(rating);
    lastXpEarnedRef.current = xpResult.totalXp;
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
  } = useStudySession({
    dueCards,
    reserveCards,
    settings,
    onUpdateCard,
    onRecordReview: enhancedRecordReview,
    canUndo,
    onUndo: handleUndoWithXp,
  });

  const handleBookmark = useCallback((pressed: boolean) => {
    if (!currentCard) return;
    const updatedCard = { ...currentCard, isBookmarked: pressed };
    onUpdateCard(updatedCard);
  }, [currentCard, onUpdateCard]);

  const handleDelete = useCallback(async () => {
    if (!currentCard) return;
    if (confirm('Are you sure you want to delete this card?')) {
      setIsDeleting(true);
      try {
        // First delete from the database (await to ensure it completes)
        await onDeleteCard(currentCard.id);
        // Then update the session state to show the next card
        removeCardFromSession(currentCard.id);
      } catch (error) {
        console.error("Failed to delete card", error);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [currentCard, removeCardFromSession, onDeleteCard]);

  const counts = useMemo(() => getQueueCounts(sessionCards.slice(currentIndex)), [sessionCards, currentIndex]);

  const currentStatus = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) return { label: 'CRAM', className: 'text-purple-500 border-purple-500/20 bg-purple-500/5' };

    const s = currentCard.state;

    if (s === 0 || (s === undefined && currentCard.status === 'new')) {
      return { label: 'NEW', className: 'text-blue-500 border-blue-500/20 bg-blue-500/5' };
    }
    if (s === 1 || (s === undefined && currentCard.status === 'learning')) {
      return { label: 'LRN', className: 'text-amber-500 border-amber-500/20 bg-amber-500/5' };
    }
    if (s === 3) {
      return { label: 'LAPSE', className: 'text-red-500 border-red-500/20 bg-red-500/5' };
    }
    return { label: 'REV', className: 'text-green-700 border-green-700/20 bg-green-700/5' };
  }, [currentCard, isCramMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard && !sessionComplete) return;


      if (!isFlipped && !sessionComplete && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        setIsFlipped(true);
      }

      else if (isFlipped && !sessionComplete && !isProcessing) {
        if (settings.binaryRatingMode) {

          if (e.key === '1') {
            e.preventDefault();
            handleGrade('Again');
          } else if (['2', '3', '4', 'Space', 'Enter'].includes(e.key) || e.code === 'Space') {
            e.preventDefault();
            handleGrade('Good');
          }
        } else {

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

  if (isWaiting) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 z-50">
        <div className="text-center space-y-6 px-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-light tracking-tight text-foreground">Waiting for learning steps...</h2>
            <p className="text-sm text-muted-foreground">Cards are cooling down. Take a short break.</p>
          </div>
          <button
            onClick={onExit}
            className="px-6 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Exit Session
          </button>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const cardsReviewed = currentIndex;

    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-1000 overflow-hidden">


        {/* Decorative corner accents - Genshin style */}
        <span className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
          <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute top-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute top-4 right-4 w-10 h-10 pointer-events-none">
          <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none">
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>
        <span className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none">
          <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/40" />
          <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/40" />
          <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
        </span>

        <div className="text-center space-y-10 px-6 max-w-lg mx-auto">


          {/* Header */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-20 h-px bg-linear-to-r from-transparent to-amber-500/40" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
              <span className="w-2 h-2 rotate-45 bg-amber-500/60" />
              <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
              <span className="w-20 h-px bg-linear-to-l from-transparent to-amber-500/40" />
            </div>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight text-foreground">Session Complete</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
            <div className="relative p-4 border border-amber-600/20 bg-card/30">
              <span className="absolute top-0 left-0 w-2 h-2">
                <span className="absolute top-0 left-0 w-full h-px bg-amber-500/40" />
                <span className="absolute top-0 left-0 h-full w-px bg-amber-500/40" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Target size={16} className="text-amber-500/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{cardsReviewed}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Cards</span>
              </div>
            </div>

            <div className="relative p-4 border-2 border-amber-500/40 bg-amber-500/5">
              <span className="absolute top-0 left-0 w-3 h-3">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500" />
              </span>
              <span className="absolute bottom-0 right-0 w-3 h-3">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Zap size={16} className="text-amber-500" strokeWidth={1.5} />
                <span className="text-2xl font-light text-amber-500 tabular-nums">+{sessionXp}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-amber-500/60">XP Earned</span>
              </div>
            </div>

            <div className="relative p-4 border border-amber-600/20 bg-card/30">
              <span className="absolute top-0 right-0 w-2 h-2">
                <span className="absolute top-0 right-0 w-full h-px bg-amber-500/40" />
                <span className="absolute top-0 right-0 h-full w-px bg-amber-500/40" />
              </span>
              <div className="flex flex-col items-center gap-1">
                <Sparkles size={16} className="text-amber-500/60" strokeWidth={1.5} />
                <span className="text-2xl font-light text-foreground tabular-nums">{sessionStreak}</span>
                <span className="text-[8px] font-ui uppercase tracking-wider text-muted-foreground/50">Best Streak</span>
              </div>
            </div>
          </div>

          {/* Continue button - Genshin style */}
          <button
            onClick={() => onComplete ? onComplete() : onExit()}
            className="group relative px-12 py-4 bg-card hover:bg-amber-500/5 border-2 border-amber-700/20 hover:border-amber-500/40 transition-all animate-in fade-in duration-700 delay-700"
          >
            {/* Button corner accents */}
            <span className="absolute -top-px -left-px w-3 h-3 border-l-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -top-px -right-px w-3 h-3 border-r-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -left-px w-3 h-3 border-l-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute -bottom-px -right-px w-3 h-3 border-r-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 text-sm font-ui uppercase tracking-[0.15em] text-foreground/70 group-hover:text-amber-500 transition-colors duration-300">Continue</span>
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">

      {/* Genshin-styled progress bar */}
      <div className="relative h-2 w-full bg-card border-b border-amber-600/10 overflow-hidden">
        {/* Decorative end caps */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-amber-500/40 z-10" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rotate-45 bg-amber-500/40 z-10" />

        {/* Progress fill with amber gradient */}
        <div
          className="absolute h-full bg-linear-to-r from-amber-600/80 via-amber-500/60 to-amber-400/40 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Animated shine overlay */}
        <div
          className="absolute top-0 h-full bg-linear-to-r from-transparent via-white/20 to-transparent w-12 transition-all duration-700"
          style={{
            left: `${Math.max(0, progress - 6)}%`,
            opacity: progress > 0 ? 1 : 0
          }}
        />
        {/* Progress end glow point */}
        {progress > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 bg-amber-500 shadow-[0_0_8px_2px] shadow-amber-500/50 transition-all duration-700"
            style={{ left: `calc(${progress}% - 3px)` }}
          />
        )}
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
        autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
        blindMode={settings.blindMode}
        showTranslation={settings.showTranslationAfterFlip}
        language={settings.language}
        onAddCard={onAddCard}
      />

      <StudyFooter
        isFlipped={isFlipped}
        setIsFlipped={setIsFlipped}
        isProcessing={isProcessing}
        binaryRatingMode={settings.binaryRatingMode}
        onGrade={handleGrade}
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
};

## features/study/hooks/useAIAnalysis.ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/features/deck/services/ai';
import { getCardByTargetWord } from '@/services/db/repositories/cardRepository';
import { db } from '@/services/db/dexie';
import { parseFurigana } from '@/lib/utils';
import { Card, Language, LanguageId } from '@/types';

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
    onAddCard
}: UseAIAnalysisProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        originalText: string;
        definition: string;
        partOfSpeech: string;
        contextMeaning: string
    } | null>(null);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);

    // Reset analysis state on card change
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
            const result = await aiService.analyzeWord(selection.text, card.targetSentence, language, apiKey);
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
            // First, lemmatize the selected word to get its base form
            const lemma = await aiService.lemmatizeWord(selection.text, language, apiKey);

            // Check if a card with this target word (base form) already exists
            const existingCard = await getCardByTargetWord(lemma, language);
            if (existingCard) {
                // Only show prioritize action for new cards (to avoid messing up SRS scheduling)
                const isPrioritizable = existingCard.status === 'new';
                toast.error(`Card already exists for "${lemma}"`, {
                    action: isPrioritizable ? {
                        label: 'Prioritize',
                        onClick: async () => {
                            try {
                                // Determine if we are using Dexie or SQL based on db structure
                                // Ideally this should be abstracted in a repository `updateCardDueDate`
                                // But for now keeping logic "as is"
                                await db.cards.where('id').equals(existingCard.id).modify({ dueDate: new Date(0).toISOString() });
                                toast.success(`"${lemma}" moved to top of queue`);
                            } catch (e) {
                                toast.error('Failed to prioritize card');
                            }
                        }
                    } : undefined,
                    duration: 5000
                });
                clearSelection();
                setIsGeneratingCard(false);
                return;
            }

            const result = await aiService.generateSentenceForWord(lemma, language, apiKey);

            let targetSentence = result.targetSentence;
            if (language === LanguageId.Japanese && result.furigana) {
                targetSentence = parseFurigana(result.furigana).map(s => s.text).join("");
            }

            // Set the due date to be the first card tomorrow (after 4am cutoff)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(4, 0, 0, 1); // Just after 4am cutoff to be first

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
                status: 'new',
                interval: 0,
                easeFactor: 2.5,
                dueDate: tomorrow.toISOString(),
                reps: 0,
                lapses: 0,
                tags: ['AI-Gen', 'From-Study']
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
        handleGenerateCard
    };
}

## features/study/hooks/useCardInteraction.ts
import { useState, useEffect, useCallback } from 'react';

interface UseCardInteractionProps {
    cardId: string;
    blindMode: boolean;
    isFlipped: boolean;
}

export function useCardInteraction({
    cardId,
    blindMode,
    isFlipped
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
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsRevealed(true);
        }
    }, []);

    return {
        isRevealed,
        setIsRevealed,
        handleReveal,
        handleKeyDown
    };
}

## features/study/hooks/useFlashcardAudio.ts
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ttsService } from '@/services/tts';
import { parseFurigana } from '@/lib/utils';
import { Card, Language } from '@/types';
import { SettingsState } from '@/stores/useSettingsStore';

interface UseFlashcardAudioProps {
    card: Card;
    language: Language;
    settings: {
        tts: {
            rate: number;
            pitch: number;
            volume: number;
            voice?: string;
        }
    };
    isFlipped: boolean;
    autoPlayAudio: boolean;
}

export function useFlashcardAudio({
    card,
    language,
    settings,
    isFlipped,
    autoPlayAudio
}: UseFlashcardAudioProps) {
    const [playSlow, setPlaySlow] = useState(false);
    const playSlowRef = useRef(playSlow);
    const hasSpokenRef = useRef<string | null>(null);

    // Sync playSlowRef with state
    useEffect(() => {
        playSlowRef.current = playSlow;
    }, [playSlow]);

    // Reset playSlow on card change
    useEffect(() => {
        setPlaySlow(false);
    }, [card.id]);

    // Cleanup TTS on unmount or card change
    useEffect(() => {
        return () => {
            ttsService.stop();
        };
    }, [card.id]);

    const getPlainTextForTTS = useCallback((text: string): string => {
        const segments = parseFurigana(text);
        return segments.map(s => s.text).join('');
    }, []);

    const speak = useCallback(() => {
        const effectiveRate = playSlowRef.current ? Math.max(0.25, settings.tts.rate * 0.6) : settings.tts.rate;
        const effectiveSettings = { ...settings.tts, rate: effectiveRate };
        const plainText = getPlainTextForTTS(card.targetSentence);

        ttsService.speak(plainText, language, effectiveSettings).catch(err => {
            console.error('TTS speak error:', err);
        });
        setPlaySlow(prev => !prev);
    }, [card.targetSentence, language, settings.tts, getPlainTextForTTS]);

    // Auto-play logic
    useEffect(() => {
        if (hasSpokenRef.current !== card.id) {
            hasSpokenRef.current = null;
        }
        if (autoPlayAudio && isFlipped && hasSpokenRef.current !== card.id) {
            speak();
            hasSpokenRef.current = card.id;
        }
    }, [card.id, autoPlayAudio, isFlipped, speak]);

    return { speak, playSlow };
}

## features/study/hooks/useStudySession.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';
import { isNewCard } from '@/services/studyLimits';

interface UseStudySessionParams {
  dueCards: Card[];
  reserveCards?: Card[];
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const useStudySession = ({
  dueCards,
  reserveCards: initialReserve = [],
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [reserveCards, setReserveCards] = useState<Card[]>(initialReserve);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(dueCards.length === 0);
  const [actionHistory, setActionHistory] = useState<{ addedCardId: string | null }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [tick, setTick] = useState(0);
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


  useEffect(() => {
    const current = sessionCards[currentIndex];
    if (!current) {
      setIsWaiting(false);
      return;
    }

    const now = new Date();
    if (isCardDue(current, now)) {
      setIsWaiting(false);
      return;
    }

    const nextDueIndex = sessionCards.findIndex((c, i) => i > currentIndex && isCardDue(c, now));

    if (nextDueIndex !== -1) {
      setSessionCards((prev) => {
        const newCards = [...prev];
        const [card] = newCards.splice(nextDueIndex, 1);
        newCards.splice(currentIndex, 0, card);
        return newCards;
      });
      setIsWaiting(false);
    } else {
      if (settings.ignoreLearningStepsWhenNoCards) {
        setIsWaiting(false);
        return;
      }

      setIsWaiting(true);
      const dueTime = new Date(current.dueDate).getTime();

      if (isNaN(dueTime)) {
        console.error('Invalid due date for card:', current.id);
        setIsWaiting(false);
        return;
      }

      const delay = Math.max(100, dueTime - now.getTime());

      const timer = setTimeout(() => {
        setTick((t) => t + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [sessionCards, currentIndex, tick, settings.ignoreLearningStepsWhenNoCards]);

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

        let addedCardId: string | null = null;
        let newSessionLength = sessionCards.length;
        const isLastCard = currentIndex === sessionCards.length - 1;

        if (updatedCard.status === 'learning') {
          if (isLastCard) {
            setSessionCards((prev) => {
              const newCards = [...prev];
              newCards[currentIndex] = updatedCard;
              return newCards;
            });
            setIsFlipped(false);
            setActionHistory((prev) => [...prev, { addedCardId: null }]);
            return;
          } else {
            setSessionCards((prev) => [...prev, updatedCard]);
            addedCardId = updatedCard.id;
            newSessionLength = sessionCards.length + 1;
          }
        }
        setActionHistory((prev) => [...prev, { addedCardId }]);

        if (currentIndex < newSessionLength - 1) {
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
      const wasNew = isNewCard(currentCard);

      const updatedCard: Card = {
        ...currentCard,
        status: 'known',
      };

      await Promise.resolve(onUpdateCard(updatedCard));


      let addedCardId: string | null = null;
      let newSessionLength = sessionCards.length;

      if (wasNew && reserveCards.length > 0) {
        const nextNew = reserveCards[0];
        setSessionCards(prev => [...prev, nextNew]);
        setReserveCards(prev => prev.slice(1));
        addedCardId = nextNew.id;
        newSessionLength = sessionCards.length + 1;
      }


      setActionHistory((prev) => [...prev, { addedCardId }]);

      if (currentIndex < newSessionLength - 1) {
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
    // Prevent undo while processing a review
    if (isProcessingRef.current || !canUndo || !onUndo) return;

    // We don't need to lock for undo as it's synchronous logic here,
    // but we must respect the lock from other actions.

    onUndo();

    if (currentIndex > 0 || sessionComplete) {
      setActionHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        const lastAction = prev[prev.length - 1];

        if (lastAction?.addedCardId) {
          setSessionCards((prevCards) => {
            const last = prevCards[prevCards.length - 1];
            if (last && last.id === lastAction.addedCardId) {
              return prevCards.slice(0, -1);
            }
            return prevCards;
          });
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

  // Remove a card from the session queue (e.g., when deleted)
  // If deleting a new card, pull from reserves to maintain the daily new card count
  const removeCardFromSession = useCallback((cardId: string) => {
    // We do NOT block this with isProcessingRef because if a card is deleted externally
    // or via a separate control, we MUST update the session state to avoid crashing on a missing card.
    // However, if the current card IS the one being processed, we might have an issue.
    // Ideally, the delete action is disabled in the UI while processing.

    const index = sessionCards.findIndex((c) => c.id === cardId);
    if (index === -1) return;

    const deletedCard = sessionCards[index];
    const wasNewCard = isNewCard(deletedCard);
    
    let newCards = sessionCards.filter((c) => c.id !== cardId);
    let newReserveCards = [...reserveCards];

    // If we deleted a new card and have reserves, pull the next new card
    if (wasNewCard && newReserveCards.length > 0) {
      const nextNew = newReserveCards[0];
      
      // If "New First" order is active, insert the replacement card before any non-new cards
      // to maintain the "new cards first" flow.
      if (settings.cardOrder === 'newFirst') {
        const firstNonNewIndex = newCards.findIndex(c => !isNewCard(c));
        if (firstNonNewIndex !== -1) {
          newCards.splice(firstNonNewIndex, 0, nextNew);
        } else {
          newCards.push(nextNew);
        }
      } else {
        newCards.push(nextNew);
      }

      newReserveCards = newReserveCards.slice(1);
      setReserveCards(newReserveCards);
    }

    setSessionCards(newCards);

    // Adjust currentIndex if needed
    if (index < currentIndex) {
      setCurrentIndex((i) => Math.max(0, i - 1));
    } else if (index === currentIndex && newCards.length > 0) {
      // If we removed the current card, stay at the same index
      // (which will now point to the next card)
      if (currentIndex >= newCards.length) {
        setCurrentIndex(newCards.length - 1);
      }
      // Reset flip state for the new current card
      setIsFlipped(false);
    }

    // Check if session should complete
    if (newCards.length === 0) {
      setSessionComplete(true);
    }
  }, [sessionCards, reserveCards, currentIndex, settings.cardOrder]);

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
    isWaiting,
    removeCardFromSession,
  };
};

## features/study/hooks/useTextSelection.ts
import { useState, useCallback, useEffect } from 'react';

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

        // Position 60px above the selection center
        setSelection({
            text,
            top: rect.top - 60,
            left: rect.left + (rect.width / 2)
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
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

    return {
        selection,
        handleMouseUp,
        clearSelection
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
    learningStep: undefined,
    leechCount: totalLapses,
    isLeech
  };
};

export const isCardDue = (card: Card, now: Date = new Date()): boolean => {
  // New cards are always considered due
  if (card.status === 'new' || card.state === State.New || (card.state === undefined && (card.reps || 0) === 0)) {
    return true;
  }

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


export interface XpFeedback {
  id: number;
  amount: number;
  message: string;
  isBonus: boolean;
}

export const useXpSession = (dailyStreak: number, isCramMode: boolean = false) => {
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [feedback, setFeedback] = useState<XpFeedback | null>(null);


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

    return result;
  }, [sessionStreak, dailyStreak, isCramMode]);

  const subtractXp = useCallback((amount: number) => {
    setSessionXp(prev => Math.max(0, prev - amount));
    setSessionStreak(prev => Math.max(0, prev - 1));
  }, []);

  const resetSession = useCallback(() => {
    setSessionXp(0);
    setSessionStreak(0);
    setFeedback(null);
  }, []);

  return {
    sessionXp,
    sessionStreak,
    multiplierInfo,
    feedback,
    processCardResult,
    subtractXp,
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
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/contexts/ThemeContext';

const getCssVarValue = (name: string) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

const normalizeColor = (value: string, fallback: string) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;

  if (/^(#|rgb|hsl|oklch|var)/i.test(candidate)) return candidate;

  if (candidate.includes(' ')) return `hsl(${candidate})`;
  return candidate;
};

export const useChartColors = () => {
  const { theme } = useTheme();
  const settings = useSettingsStore(s => s.settings);

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

## hooks/usePlatformSetup.ts
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const usePlatformSetup = () => {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            console.log('Running on native platform');
        }
    }, []);
};

## lib/fsrsOptimizer.ts
import { ReviewLog } from '@/types';
import { computeCardLoss } from './fsrsShared';


export const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {


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
      await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress(100);
  return w;
};


## lib/fsrsShared.ts
import { ReviewLog } from '@/types';

export const DECAY = -0.5;
export const FACTOR = 0.9 ** (1 / DECAY) - 1;

export const getRetrievability = (elapsedDays: number, stability: number): number => {
    if (stability <= 0) return 0;
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
};

export const nextStability = (s: number, d: number, r: number, rating: number, w: number[]): number => {
    if (rating === 1) {
        return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
    }
    const hardPenalty = rating === 2 ? w[15] : 1;
    const easyBonus = rating === 4 ? w[16] : 1;
    return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
};

export const nextDifficulty = (d: number, rating: number, w: number[]): number => {
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

        loss -= (y * Math.log(p) + (1 - y) * Math.log(1 - p));

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

## lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface FuriganaSegment {
  text: string;
  furigana?: string;
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

      betweenText.split(/(\s+)/).forEach(part => {
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
    remainingText.split(/(\s+)/).forEach(part => {
      if (part) {
        segments.push({ text: part });
      }
    });
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

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function getLevelProgress(xp: number): {
  level: number;
  progressPercent: number;
  xpToNextLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progressPercent = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  const xpToNextLevel = nextLevelXp - xp;

  return {
    level,
    progressPercent,
    xpToNextLevel,
    currentLevelXp,
    nextLevelXp,
  };
}

/**
 * Finds the best match for a target word (lemma/base form) in a sentence,
 * accounting for inflected forms in languages like Polish, Norwegian, etc.
 * 
 * For example: targetWord "godzina" will match "godzinie" in the sentence
 * "O której godzinie zaczyna się film?"
 * 
 * @returns The actual word found in the sentence that matches, or null if no match
 */
export function findInflectedWordInSentence(
  targetWord: string,
  sentence: string
): string | null {
  if (!targetWord || !sentence) return null;
  
  const targetLower = targetWord.toLowerCase();
  
  // Extract all words from the sentence
  const words = sentence.match(/[\p{L}]+/gu) || [];
  
  // First, try exact match (case-insensitive)
  const exactMatch = words.find(w => w.toLowerCase() === targetLower);
  if (exactMatch) return exactMatch;
  
  // Calculate minimum stem length based on target word length
  // For short words (≤4 chars), require at least 2 chars match
  // For longer words, require at least 3-4 chars match
  const minStemLength = targetWord.length <= 4 ? 2 : Math.min(4, Math.ceil(targetWord.length * 0.5));
  
  // Find words that share a common prefix (stem) with the target word
  // The longer the shared prefix, the better the match
  let bestMatch: string | null = null;
  let bestMatchScore = 0;
  
  for (const word of words) {
    const wordLower = word.toLowerCase();
    
    // Find shared prefix length
    let sharedLength = 0;
    const maxLength = Math.min(targetLower.length, wordLower.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (targetLower[i] === wordLower[i]) {
        sharedLength++;
      } else {
        break;
      }
    }
    
    // Only consider if shared prefix is long enough
    if (sharedLength >= minStemLength) {
      // Score based on: shared length, similarity in total length
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

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/study" element={<StudyRoute />} />
    <Route path="/cards" element={<CardsRoute />} />
  </Routes>
);

## routes/CardsRoute.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Plus, Sparkles, BookOpen, Zap, Trash2, Filter, Bookmark, AlertTriangle } from 'lucide-react';

import { useDeck } from '@/contexts/DeckContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Card, CardStatus } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardHistoryModal } from '@/features/deck/components/CardHistoryModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery, CardFilters } from '@/features/deck/hooks/useCardsQuery';
import { GamePanel, GameButton, GameDivider, GameLoader } from '@/components/ui/game-ui';
import { cn } from '@/lib/utils';

export const CardsRoute: React.FC = () => {
  const settings = useSettingsStore(s => s.settings);
  const { stats } = useDeck();
  const { addCard, addCardsBatch, updateCard, deleteCard, deleteCardsBatch, prioritizeCards } = useCardOperations();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CardFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 50;

  const { data, isLoading, isPlaceholderData } = useCardsQuery(page, pageSize, debouncedSearch, filters);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;

  const activeFilterCount = (filters.status && filters.status !== 'all' ? 1 : 0) +
    (filters.bookmarked ? 1 : 0) +
    (filters.leech ? 1 : 0);

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
    if (confirm(`Are you sure you want to delete ${selectedIds.size} card${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`)) {
      const ids = Array.from(selectedIds);
      await deleteCardsBatch(ids);
      setSelectedIds(new Set());
    }
  };

  const handleSelectAll = useCallback(() => {
    const allCurrentPageIds = cards.map(c => c.id);
    const allSelected = allCurrentPageIds.every(id => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        allCurrentPageIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [cards, selectedIds]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div
      className="page-full-height flex flex-col h-full w-full bg-background text-foreground overflow-hidden relative"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20px 20px, var(--primary) 2px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* --- Genshin Header (Collapsible) --- */}
      <header className="relative shrink-0 z-20">


        <div className="relative px-4 md:px-8 pt-6 pb-2">

          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center border border-border/50 bg-card/50 rotate-45">
                <BookOpen className="w-4 h-4 text-primary -rotate-45" />
              </div>
              <div>
                <h1 className="text-lg font-medium tracking-wider text-foreground uppercase font-genshin-title">
                  Collection
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats.total} Cards</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="tabular-nums">{stats.learned} Mastered</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 pr-4 bg-card/50 border border-border/50 focus:border-primary/50 w-full sm:w-48 transition-all outline-none text-sm"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center border bg-card/50 transition-all shrink-0 relative",
                    activeFilterCount > 0
                      ? "border-primary/50 text-primary hover:bg-primary/20"
                      : "border-border/50 text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
                  )}
                  title="Filter Cards"
                >
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown */}
                {showFilters && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-card border border-border/50 shadow-xl p-4 space-y-4">
                      {/* Corner accents */}
                      <span className="absolute -top-px -left-px w-3 h-3 pointer-events-none">
                        <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                        <span className="absolute top-0 left-0 h-full w-px bg-primary" />
                      </span>
                      <span className="absolute -bottom-px -right-px w-3 h-3 pointer-events-none">
                        <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                        <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
                      </span>

                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filters</span>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="p-0! bg-transparent border-none shadow-none"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['all', 'new', 'learning', 'graduated', 'known'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setFilters(f => ({ ...f, status: status === 'all' ? undefined : status }))}
                              className={cn(
                                "px-2 py-1.5 text-xs border transition-all capitalize",
                                (filters.status === status || (!filters.status && status === 'all'))
                                  ? "bg-primary/20 border-primary/50 text-primary"
                                  : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Filters */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Filters</label>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setFilters(f => ({ ...f, bookmarked: !f.bookmarked }))}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-xs border transition-all",
                              filters.bookmarked
                                ? "bg-primary/20 border-primary/50 text-primary"
                                : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Bookmarked</span>
                          </button>
                          <button
                            onClick={() => setFilters(f => ({ ...f, leech: !f.leech }))}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-xs border transition-all",
                              filters.leech
                                ? "bg-destructive/20 border-destructive/50 text-destructive"
                                : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            )}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Leech Cards</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center border border-border/50 bg-card/50 hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all shrink-0"
                title="Generate Cards"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="h-9 w-9 flex items-center justify-center border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary transition-all shrink-0"
                title="Add Card"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-amber-500/20 to-transparent group-hover:via-amber-500/40" />
      </header>

      {/* --- Main Content Area --- */}
      <div className="flex-1 min-h-0 flex flex-col relative bg-background/50">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16 animate-spin-slow">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-t-2 border-primary rounded-full" />
              </div>
              <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase animate-pulse">Loading...</p>
            </div>
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

      {/* --- Floating Selection Bar (Genshin Style) --- */}
      <div className={cn(
        "fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) w-[80%] md:w-auto",
        selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      )}>
        <div className="genshin-panel !p-0 flex items-center overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-xl bg-card/90 w-full">
          {/* Left: Count */}
          <div className="px-4 py-2 md:px-6 md:py-3 bg-primary/10 border-r border-border/50 flex items-center gap-3">
            <div className="w-2 h-2 rotate-45 bg-primary" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-medium leading-none text-primary tabular-nums font-editorial">
                {selectedIds.size}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold hidden sm:inline">Selected</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 px-2 md:px-4 py-2 flex items-center justify-around md:justify-end gap-1 md:gap-2">
            <button
              onClick={handleBatchPrioritize}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Prioritize</span>
            </button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <div className="w-px h-6 bg-border/50 mx-1" />

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-sm transition-colors"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedCard(undefined); }}
        onAdd={(card) => selectedCard ? updateCard(card) : addCard(card)}
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
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';
import { getCardsForDashboard } from '@/services/db/repositories/cardRepository';
import { GameLoadingScreen } from '@/components/ui/game-ui';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeck();
  const settings = useSettingsStore(s => s.settings);
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  const { data: cards, isLoading: isCardsLoading, isError: isCardsError } = useQuery({
    queryKey: ['dashboardCards', settings.language],
    queryFn: () => getCardsForDashboard(settings.language),
  });

  if (isStatsLoading || isCardsLoading) {
    return <GameLoadingScreen title="Loading" subtitle="Preparing your dashboard" />;
  }

  if (isStatsError || isCardsError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-red-500">Failed to load dashboard data.</h2>
        <button onClick={() => window.location.reload()} className="mt-4 btn">Retry</button>
      </div>
    );
  }

  if (!dashboardStats || !cards) {
    return <div>No data found.</div>;
  }


  const metrics = {
    total: dashboardStats.counts.new + dashboardStats.counts.learning + dashboardStats.counts.graduated + dashboardStats.counts.known,
    new: dashboardStats.counts.new,
    learning: dashboardStats.counts.learning,
    reviewing: dashboardStats.counts.graduated,
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
      onStartSession={() => navigate('/study')}
      cards={cards as any}
    />
  );
};

## routes/StudyRoute.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeck } from '@/contexts/DeckContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { isNewCard } from '@/services/studyLimits';
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';
import { useClaimDailyBonusMutation } from '@/features/deck/hooks/useDeckQueries';
import { CardXpPayload } from '@/features/xp/xpUtils';
import { GameLoadingScreen } from '@/components/ui/game-ui';
import { toast } from 'sonner';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview, canUndo, stats } = useDeck();
  const { updateCard, deleteCard, addCard } = useCardOperations();
  const settings = useSettingsStore(s => s.settings);
  const claimBonus = useClaimDailyBonusMutation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [reserveCards, setReserveCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const isCramMode = mode === 'cram';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadCards = async () => {
      try {
        if (isCramMode) {
          const limit = parseInt(searchParams.get('limit') || '50', 10);
          const tag = searchParams.get('tag') || undefined;
          const cramCards = await getCramCards(limit, tag, settings.language);
          if (isMounted) {
            setSessionCards(cramCards);
            setReserveCards([]);
          }
        } else {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 15000)
          );

          const [due, reviewsToday] = await Promise.race([
            Promise.all([
              getDueCards(new Date(), settings.language),
              getTodayReviewStats(settings.language)
            ]),
            timeoutPromise
          ]) as [Card[], { newCards: number; reviewCards: number }];

          if (!isMounted) return;

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
      } catch (err) {
        console.error("Failed to load cards", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cards');
          toast.error('Failed to load study session. Please try again.');
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
  }, [settings.language, isCramMode, searchParams, settings.dailyNewLimits, settings.dailyReviewLimits]);

  const handleUpdateCard = (card: Card) => {
    if (isCramMode) {
      if (card.status === 'known') {
        updateCard(card, { silent: true });
      }
      return;
    }
    updateCard(card, { silent: true });
  };

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id);


    setSessionCards(prev => prev.filter(c => c.id !== id));
  };

  const handleRecordReview = async (card: Card, grade: Grade, xpPayload?: CardXpPayload) => {
    if (!isCramMode) {
      await recordReview(card, grade, xpPayload);
    }
  };

  const handleSessionComplete = () => {
    if (!isCramMode) {
      claimBonus.mutate();
    }
    navigate('/');
  };

  if (isLoading) {
    return <GameLoadingScreen title="Preparing" subtitle="Setting up your study session" />;
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
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Return to Dashboard
          </button>
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
      onExit={() => navigate('/')}
      onComplete={handleSessionComplete}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
      isCramMode={isCramMode}
      dailyStreak={stats?.streak ?? 0}
      onAddCard={addCard}
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

## services/db/dexie.ts
import Dexie, { Table } from 'dexie';
import { Card, ReviewLog } from '@/types';
import { State } from 'ts-fsrs';

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
    count: number;
}

export interface LocalSettings {
    id: string;
    gemini_api_key?: string;
    google_tts_api_key?: string;
    azure_tts_api_key?: string;
    azure_region?: string;
}

export interface AggregatedStat {
    id: string;          // composite key: `${language}:${metric}` or `global:${metric}`
    language: string;    // language code or 'global'
    metric: string;      // 'total_xp', 'total_reviews', etc.
    value: number;       // the aggregated value
    updated_at: string;  // ISO timestamp
}

class LinguaFlowDB extends Dexie {
    cards!: Table<Card>;
    revlog!: Table<RevlogEntry>;
    history!: Table<HistoryEntry>;
    profile!: Table<LocalProfile>;
    settings!: Table<LocalSettings>;
    aggregated_stats!: Table<AggregatedStat>;

    constructor() {
        super('linguaflow-dexie');

        // Version 2 schema (existing)
        this.version(2).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id'
        });

        // Version 3: Add aggregated_stats table
        this.version(3).stores({
            cards: 'id, status, language, dueDate, isBookmarked, [status+language], [language+status], [language+status+interval]',
            revlog: 'id, card_id, created_at, [card_id+created_at]',
            history: '[date+language], date, language',
            profile: 'id',
            settings: 'id',
            aggregated_stats: 'id, [language+metric], updated_at'
        }).upgrade(async (tx) => {
            // Backfill aggregated stats from existing data
            console.log('[Migration] Starting aggregated_stats backfill...');

            // Get unique languages from cards
            const allCards = await tx.table<Card>('cards').toArray();
            const languages = Array.from(new Set(allCards.map(c => c.language)));

            // For each language, calculate XP and total reviews
            for (const language of languages) {
                const cardIds = new Set(
                    allCards.filter(c => c.language === language).map(c => c.id)
                );

                let totalXp = 0;
                let totalReviews = 0;

                // Count reviews for this language
                await tx.table<RevlogEntry>('revlog').each(log => {
                    if (cardIds.has(log.card_id)) {
                        totalXp += 10; // 10 XP per review
                        totalReviews++;
                    }
                });

                // Write aggregated stats
                await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                    {
                        id: `${language}:total_xp`,
                        language,
                        metric: 'total_xp',
                        value: totalXp,
                        updated_at: new Date().toISOString()
                    },
                    {
                        id: `${language}:total_reviews`,
                        language,
                        metric: 'total_reviews',
                        value: totalReviews,
                        updated_at: new Date().toISOString()
                    }
                ]);

                console.log(`[Migration] Backfilled stats for ${language}: ${totalXp} XP, ${totalReviews} reviews`);
            }

            // Global stats
            let globalXp = 0;
            let globalReviews = 0;
            await tx.table<RevlogEntry>('revlog').each(() => {
                globalXp += 10;
                globalReviews++;
            });

            await tx.table<AggregatedStat>('aggregated_stats').bulkAdd([
                {
                    id: 'global:total_xp',
                    language: 'global',
                    metric: 'total_xp',
                    value: globalXp,
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'global:total_reviews',
                    language: 'global',
                    metric: 'total_reviews',
                    value: globalReviews,
                    updated_at: new Date().toISOString()
                }
            ]);

            console.log('[Migration] Aggregated stats backfill complete!');
        });
    }
}

export const db = new LinguaFlowDB();

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
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

## services/db/repositories/aggregatedStatsRepository.ts
import { db } from '@/services/db/dexie';

export interface AggregatedStat {
    id: string;          // composite key: `${language}:${metric}` or `global:${metric}`
    language: string;    // language code or 'global'
    metric: string;      // 'total_xp', 'total_reviews', etc.
    value: number;       // the aggregated value
    updated_at: string;  // ISO timestamp
}

/**
 * Get an aggregated stat value for a specific language and metric
 */
export const getAggregatedStat = async (language: string, metric: string): Promise<number> => {
    const id = `${language}:${metric}`;
    const stat = await db.aggregated_stats.get(id);
    return stat?.value ?? 0;
};

/**
 * Increment an aggregated stat by a delta value
 */
export const incrementStat = async (language: string, metric: string, delta: number): Promise<void> => {
    const id = `${language}:${metric}`;
    const existing = await db.aggregated_stats.get(id);

    if (existing) {
        await db.aggregated_stats.update(id, {
            value: existing.value + delta,
            updated_at: new Date().toISOString()
        });
    } else {
        await db.aggregated_stats.add({
            id,
            language,
            metric,
            value: delta,
            updated_at: new Date().toISOString()
        });
    }
};

/**
 * Set multiple stats in a single transaction
 */
export const bulkSetStats = async (stats: Array<{ language: string; metric: string; value: number }>): Promise<void> => {
    const records: AggregatedStat[] = stats.map(s => ({
        id: `${s.language}:${s.metric}`,
        language: s.language,
        metric: s.metric,
        value: s.value,
        updated_at: new Date().toISOString()
    }));

    await db.aggregated_stats.bulkPut(records);
};

/**
 * Recalculate all stats from scratch for a language (or globally)
 * Used for migration and repair operations
 */
export const recalculateAllStats = async (language?: string): Promise<void> => {
    // Get all cards for the language
    const cards = language
        ? await db.cards.where('language').equals(language).toArray()
        : await db.cards.toArray();

    const cardIds = new Set(cards.map(c => c.id));

    // Calculate XP from revlog
    let totalXp = 0;
    let totalReviews = 0;

    await db.revlog.each(log => {
        if (!language || cardIds.has(log.card_id)) {
            totalXp += 10; // 10 XP per review
            totalReviews++;
        }
    });

    // Prepare stats to write
    const statsToWrite: Array<{ language: string; metric: string; value: number }> = [];
    const lang = language || 'global';

    statsToWrite.push(
        { language: lang, metric: 'total_xp', value: totalXp },
        { language: lang, metric: 'total_reviews', value: totalReviews }
    );

    await bulkSetStats(statsToWrite);
};

## services/db/repositories/cardRepository.ts
import { Card, CardStatus, Language, LanguageId } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { db, generateId } from '@/services/db/dexie';
import { SRS_CONFIG } from '@/constants';



export const mapToCard = (data: any): Card => ({
  id: data.id,
  targetSentence: data.targetSentence,
  targetWord: data.targetWord || undefined,
  targetWordTranslation: data.targetWordTranslation || undefined,
  targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
  nativeTranslation: data.nativeTranslation,
  furigana: data.furigana || undefined,
  notes: data.notes ?? '',
  tags: data.tags ?? undefined,
  language: data.language,
  status: data.status,
  interval: data.interval ?? 0,
  easeFactor: data.easeFactor ?? 2.5,
  dueDate: data.dueDate,
  stability: data.stability ?? undefined,
  difficulty: data.difficulty ?? undefined,
  elapsed_days: data.elapsed_days ?? undefined,
  scheduled_days: data.scheduled_days ?? undefined,
  reps: data.reps ?? undefined,
  lapses: data.lapses ?? undefined,
  state: data.state ?? undefined,
  last_review: data.last_review ?? undefined,
  first_review: data.first_review ?? undefined,
  learningStep: data.learningStep ?? undefined,
  leechCount: data.leechCount ?? undefined,
  isLeech: data.isLeech ?? false,
});

export const getCards = async (): Promise<Card[]> => {
  const cards = await db.cards.toArray();
  return cards;
};

export const getAllCardsByLanguage = async (language: Language): Promise<Card[]> => {
  const cards = await db.cards.where('language').equals(language).toArray();
  return cards;
};

export const getCardsForRetention = async (language: Language): Promise<Partial<Card>[]> => {
  const cards = await db.cards
    .where('language')
    .equals(language)
    .toArray();

  return cards.map(c => ({
    id: c.id,
    dueDate: c.dueDate,
    status: c.status,
    stability: c.stability,
    state: c.state
  }));
};

export const getCardsForDashboard = async (language: Language): Promise<Array<{
  id: string;
  dueDate: string | null;
  status: string;
  stability: number | null;
  state: number | null
}>> => {
  const cards = await db.cards
    .where('language')
    .equals(language)
    .toArray();

  return cards.map(card => ({
    id: card.id,
    dueDate: card.dueDate,
    status: card.status,
    stability: card.stability ?? null,
    state: card.state ?? null
  }));
};

export const saveCard = async (card: Card) => {
  if (!card.id) {
    card.id = generateId();
  }
  await db.cards.put(card);
};

export const deleteCard = async (id: string) => {
  await db.cards.delete(id);
};

export const deleteCardsBatch = async (ids: string[]) => {
  if (!ids.length) return;
  await db.cards.bulkDelete(ids);
};

export const saveAllCards = async (cards: Card[]) => {
  if (!cards.length) return;

  const cardsWithIds = cards.map(card => ({
    ...card,
    id: card.id || generateId()
  }));

  await db.cards.bulkPut(cardsWithIds);
};

export const clearAllCards = async () => {
  await db.cards.clear();
};

export const getDueCards = async (now: Date, language: Language): Promise<Card[]> => {
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);

  const cutoffISO = cutoffDate.toISOString();

  const cards = await db.cards
    .where('language')
    .equals(language)
    .filter(card => card.status !== 'known' && card.dueDate <= cutoffISO)
    .toArray();

  return cards.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  let cards = await db.cards
    .where('language')
    .equals(language || LanguageId.Polish)
    .toArray();

  if (tag) {
    cards = cards.filter(c => c.tags?.includes(tag));
  }

  const shuffled = cards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const deleteCardsByLanguage = async (language: Language) => {
  await db.cards.where('language').equals(language).delete();
};

export const getCardSignatures = async (language: Language): Promise<Array<{ target_sentence: string; language: string }>> => {
  const cards = await db.cards
    .where('language')
    .equals(language)
    .toArray();

  return cards.map(c => ({
    target_sentence: c.targetSentence,
    language: c.language
  }));
};

export const getTags = async (language?: Language): Promise<string[]> => {
  let cards: Card[];

  if (language) {
    cards = await db.cards.where('language').equals(language).toArray();
  } else {
    cards = await db.cards.toArray();
  }

  const uniqueTags = new Set<string>();
  cards.forEach((card) => {
    if (card.tags) {
      card.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });

  return Array.from(uniqueTags).sort();
};

export const getLearnedWords = async (language: Language): Promise<string[]> => {
  const cards = await db.cards
    .where('language')
    .equals(language)
    .filter(card => card.status !== 'new' && card.targetWord != null)
    .toArray();

  const words = cards
    .map(card => card.targetWord)
    .filter((word): word is string => word !== null && word !== undefined);

  return [...new Set(words)];
};

export const getCardByTargetWord = async (targetWord: string, language: Language): Promise<Card | undefined> => {
  const lowerWord = targetWord.toLowerCase();
  const cards = await db.cards
    .where('language')
    .equals(language)
    .filter(card => card.targetWord?.toLowerCase() === lowerWord)
    .toArray();

  return cards[0];
};

## services/db/repositories/historyRepository.ts
import { db } from '@/services/db/dexie';
import { ReviewHistory, Language, LanguageId } from '@/types';
import { format } from 'date-fns';

export const getHistory = async (language?: Language): Promise<ReviewHistory> => {
  let logs = await db.revlog.toArray();

  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  return logs.reduce<ReviewHistory>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
};

export const incrementHistory = async (
  date: string,
  delta: number = 1,
  language: Language = LanguageId.Polish
) => {
  const existing = await db.history.get({ date, language });

  if (existing) {
    await db.history.update([date, language], {
      count: existing.count + delta
    });
  } else {
    await db.history.add({
      date,
      language,
      count: delta
    });
  }
};

export const saveFullHistory = async (history: ReviewHistory, language: Language = LanguageId.Polish) => {
  const entries = Object.entries(history).map(([date, count]) => ({
    date,
    language,
    count: typeof count === 'number' ? count : 0
  }));

  if (entries.length === 0) return;

  await db.history.bulkPut(entries);
};

export const clearHistory = async (language?: Language) => {
  if (language) {
    await db.history.where('language').equals(language).delete();
  } else {
    await db.history.clear();
  }
};

## services/db/repositories/revlogRepository.ts
import { db, generateId, RevlogEntry } from '@/services/db/dexie';
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
  const entry: RevlogEntry = {
    id: generateId(),
    card_id: card.id,
    grade: mapGradeToNumber(grade),
    state: card.state ?? State.New,
    elapsed_days: elapsedDays,
    scheduled_days: scheduledDays,
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    created_at: new Date().toISOString()
  };

  await db.revlog.add(entry);

  // Increment aggregated stats atomically
  // Import incrementStat dynamically to avoid circular dependency
  const { incrementStat } = await import('./aggregatedStatsRepository');

  // Increment language-specific stats
  await incrementStat(card.language, 'total_xp', 10);
  await incrementStat(card.language, 'total_reviews', 1);

  // Increment global stats
  await incrementStat('global', 'total_xp', 10);
  await incrementStat('global', 'total_reviews', 1);
};


export const getAllReviewLogs = async (language?: string): Promise<ReviewLog[]> => {
  let logs = await db.revlog.toArray();

  if (language) {
    const cards = await db.cards.where('language').equals(language).toArray();
    const cardIds = new Set(cards.map(c => c.id));
    logs = logs.filter(log => cardIds.has(log.card_id));
  }

  logs.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return logs as unknown as ReviewLog[];
};

## services/db/repositories/settingsRepository.ts

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

const SETTINGS_KEY = 'linguaflow_api_keys';

export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return null;

        return JSON.parse(stored) as UserApiKeys;
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        return null;
    }
}

export async function updateUserSettings(userId: string, settings: UserApiKeys): Promise<void> {
    try {
        const existing = await getUserSettings(userId);
        const merged = { ...existing, ...settings };

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    return false;
}

## services/db/repositories/statsRepository.ts
import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { db } from '@/services/db/dexie';
import { differenceInCalendarDays, parseISO, addDays, format, subDays, startOfDay, parse } from 'date-fns';

export const getDashboardStats = async (language?: string) => {
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  let languageXp = 0;

  if (language) {
    // Parallelize independent queries for speed
    // We use the new [language+status+interval] index for range queries on learning/graduated
    // and [language+status] for exact matches on new/known.

    const [newCount, knownCount, learningCount, graduatedCount] = await Promise.all([
      // Count 'new' cards
      db.cards.where({ language, status: 'new' }).count(),

      // Count 'known' cards (explicit status)
      db.cards.where({ language, status: 'known' }).count(),

      // Count 'learning' (status != new/known AND interval < 30)
      // We approximate "learning" as cards in 'review' status with small intervals,
      // OR cards in actual 'learning' status (if that status exists in your logic).
      // Assuming 'review' status with interval < 30 covers the user's "learning" definition usually:
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 0], [language, 'review', 30], true, false)
        .count(),

      // Count 'graduated' (status != new/known AND 30 <= interval < 180)
      db.cards.where('[language+status+interval]')
        .between([language, 'review', 30], [language, 'review', 180], true, false)
        .count(),
    ]);

    // XP Calculation optimization:
    // Instead of iterating entire revlog, read from aggregated_stats table
    const xpStat = await db.aggregated_stats.get(`${language}:total_xp`);
    languageXp = xpStat?.value ?? 0;

    // Note: 'known' might also include cards with interval >= 180 that aren't explicitly status='known' yet?
    // The user's original logic had:
    // else if (interval < 180) counts.graduated++;
    // else counts.known++;
    // This implies that cards with interval >= 180 are treated as known even if status is 'review'.
    const implicitKnownCount = await db.cards.where('[language+status+interval]')
      .aboveOrEqual([language, 'review', 180])
      .count();

    counts.new = newCount;
    counts.learning = learningCount;
    counts.graduated = graduatedCount;
    counts.known = knownCount + implicitKnownCount;

  } else {
    // No language filter - slightly less efficient but still better than loading all
    // We can iterate 'status' index.

    const [newCount, knownCountByStatus] = await Promise.all([
      db.cards.where('status').equals('new').count(),
      db.cards.where('status').equals('known').count()
    ]);

    // For learning/graduated/implicitKnown, we have to scan 'review' status cards
    // since we don't have a global [status+interval] index (only language-prefixed).
    // We can iterate the 'status' index for 'review' and count based on interval.
    // This is still better than `toArray()` because we only deserialize 'review' cards.

    let learning = 0;
    let graduated = 0;
    let implicitKnown = 0;

    await db.cards.where('status').equals('review').each(c => {
      const interval = c.interval || 0;
      if (interval < 30) learning++;
      else if (interval < 180) graduated++;
      else implicitKnown++;
    });

    counts.new = newCount;
    counts.known = knownCountByStatus + implicitKnown;
    counts.learning = learning;
    counts.graduated = graduated;

    // Global XP - read from aggregated_stats
    const globalXpStat = await db.aggregated_stats.get('global:total_xp');
    languageXp = globalXpStat?.value ?? 0;
  }

  // Calculate forecast (Optimized)
  const daysToShow = 14;
  const today = startOfDay(new Date());
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({
    day: format(addDays(today, i), 'd'),
    fullDate: addDays(today, i).toISOString(),
    count: 0
  }));

  const endDate = addDays(today, daysToShow);

  // Use dueDate index
  let query = db.cards.where('dueDate').between(today.toISOString(), endDate.toISOString(), true, false);

  if (language) {
    // Filter by language in JS (efficient since result set is small - only immediate due cards)
    query = query.filter(c => c.language === language);
  }

  // Final filter for status
  query = query.filter(c => c.status !== 'new' && c.status !== 'known');

  await query.each(card => {
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

  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);
  cutoffDate.setHours(SRS_CONFIG.CUTOFF_HOUR);
  const cutoffIso = cutoffDate.toISOString();

  let total = 0;
  let due = 0;
  let learned = 0;

  if (language) {
    total = await db.cards.where('language').equals(language).count();


    due = await db.cards
      .where('dueDate').below(cutoffIso)
      .filter(c => c.language === language && c.status !== 'known')
      .count();

    learned = await db.cards.where('[language+status]').anyOf(
      [language, 'graduated'],
      [language, 'known']
    ).count();

  } else {
    total = await db.cards.count();

    due = await db.cards
      .where('dueDate').below(cutoffIso)
      .filter(c => c.status !== 'known')
      .count();

    learned = await db.cards
      .where('status').anyOf('graduated', 'known')
      .count();
  }

  return { total, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);


  let logsCollection = db.revlog.where('created_at').between(
    rangeStart.toISOString(),
    rangeEnd.toISOString(),
    true,
    false
  );

  let newCards = 0;
  let reviewCards = 0;

  if (language) {
    const cardIds = await db.cards.where('language').equals(language).primaryKeys();
    const cardIdSet = new Set(cardIds);

    await logsCollection.each(entry => {
      if (cardIdSet.has(entry.card_id)) {
        if (entry.state === 0) newCards++;
        else reviewCards++;
      }
    });
  } else {
    await logsCollection.each(entry => {
      if (entry.state === 0) newCards++;
      else reviewCards++;
    });
  }

  return { newCards, reviewCards };
};

export const getRevlogStats = async (language: string, days = 30) => {
  const startDate = startOfDay(subDays(new Date(), days - 1));
  const startDateIso = startDate.toISOString();

  const cardIds = await db.cards.where('language').equals(language).primaryKeys();
  const cardIdSet = new Set(cardIds);


  const logs = await db.revlog
    .where('created_at').aboveOrEqual(startDateIso)
    .filter(log => cardIdSet.has(log.card_id))
    .toArray();


  const activityMap = new Map<string, { date: string; count: number; pass: number }>();
  const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    activityMap.set(date, { date, count: 0, pass: 0 });
  }

  logs.forEach(log => {
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    const dayData = activityMap.get(dateKey);
    if (dayData) {
      dayData.count++;
      if (log.grade >= 2) dayData.pass++;
    }

    switch (log.grade) {
      case 1: gradeCounts.Again++; break;
      case 2: gradeCounts.Hard++; break;
      case 3: gradeCounts.Good++; break;
      case 4: gradeCounts.Easy++; break;
    }
  });

  const activityData = Array.from(activityMap.values());

  const retentionData = activityData.map((day) => {
    const dateObj = parse(day.date, 'yyyy-MM-dd', new Date());
    return {
      date: format(dateObj, 'MMM d'),
      rate: day.count > 0 ? (day.pass / day.count) * 100 : null
    };
  });

  return {
    activity: activityData.map((d) => {
      const dateObj = parse(d.date, 'yyyy-MM-dd', new Date());
      return { ...d, label: format(dateObj, 'dd') };
    }),
    grades: [
      { name: 'Again', value: gradeCounts.Again, color: '#ef4444' },
      { name: 'Hard', value: gradeCounts.Hard, color: '#f97316' },
      { name: 'Good', value: gradeCounts.Good, color: '#22c55e' },
      { name: 'Easy', value: gradeCounts.Easy, color: '#3b82f6' },
    ],
    retention: retentionData
  };
};

## services/db/workers/stats.worker.ts
import { format, subDays } from 'date-fns';

interface Log {
  created_at: string;
  grade: number;
  card_id: string;
}

interface ActivityWorkerInput {
  action: 'calculate_activity';
  logs: Log[];
  days: number;
  cardIds: string[];
}

interface StreakWorkerInput {
  action: 'calculate_streaks';
  history: Record<string, number>; // date string to review count
  todayStr: string;
  yesterdayStr: string;
}

type WorkerInput = ActivityWorkerInput | StreakWorkerInput;

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const input = e.data;

  if (input.action === 'calculate_activity') {
    // Original activity calculation logic
    const { logs, days, cardIds } = input;
    const cardIdSet = new Set(cardIds);

    const filteredLogs = logs.filter(log => cardIdSet.has(log.card_id));

    const activityMap = new Map<string, { date: string; count: number; pass: number; fail: number }>();
    const gradeCounts = { Again: 0, Hard: 0, Good: 0, Easy: 0 };

    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = subDays(now, i);
      const key = format(d, 'yyyy-MM-dd');
      activityMap.set(key, {
        date: key,
        count: 0,
        pass: 0,
        fail: 0
      });
    }

    filteredLogs.forEach(log => {
      const date = new Date(log.created_at);
      const key = format(date, 'yyyy-MM-dd');

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
      totalReviews: filteredLogs.length
    });
  } else if (input.action === 'calculate_streaks') {
    // New streak calculation logic (moved from DeckStatsContext)
    const { history, todayStr, yesterdayStr } = input;

    if (!history || Object.keys(history).length === 0) {
      self.postMessage({
        currentStreak: 0,
        longestStreak: 0,
        totalReviews: 0
      });
      return;
    }

    // Sort dates once for efficient processing
    const sortedDates = Object.keys(history).sort();

    // Calculate total reviews
    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    // Calculate longest streak using sorted dates (O(n) instead of O(n²))
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Calculate current streak from today/yesterday backwards
    let currentStreak = 0;

    // Find starting point for current streak count
    const hasToday = history[todayStr];
    const hasYesterday = history[yesterdayStr];

    if (hasToday || hasYesterday) {
      // Start counting from either today or yesterday
      currentStreak = 1;

      // Count consecutive days backwards using Set for O(1) lookup
      const dateSet = new Set(sortedDates);

      // Start from the day before today or yesterday (whichever we found)
      const startDateStr = hasToday ? todayStr : yesterdayStr;
      let checkDate = new Date(startDateStr);
      checkDate.setDate(checkDate.getDate() - 1);

      // Limit to prevent infinite loops (reasonable max: 10 years)
      const maxDays = Math.min(sortedDates.length, 3650);

      for (let i = 0; i < maxDays; i++) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
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
      totalReviews
    });
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

## services/sync/index.ts
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
    type SyncData
} from './syncService';

## services/sync/syncService.ts
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { db } from '@/services/db/dexie';
import { getCards, saveAllCards, clearAllCards } from '@/services/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/services/db/repositories/historyRepository';
import { UserSettings, Card } from '@/types';

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
        username: string;
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

// Default sync file name - will be in Syncthing folder
const SYNC_FILENAME = 'linguaflow-sync.json';

// Store the file handle for reuse (File System Access API)
let cachedFileHandle: FileSystemFileHandle | null = null;

// Get or create a unique device ID
const getDeviceId = (): string => {
    const storageKey = 'linguaflow_device_id';
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
};

// Get the sync file path based on platform
export const getSyncFilePath = (): string => {
    // For Android, we'll use the Documents directory which Syncthing can access
    // For web/desktop, we'll use a configurable path
    const customPath = localStorage.getItem('linguaflow_sync_path');
    return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = (path: string): void => {
    localStorage.setItem('linguaflow_sync_path', path);
};

// Clear the cached file handle (e.g., when user wants to pick a new file)
export const clearSyncFileHandle = (): void => {
    cachedFileHandle = null;
};

/**
 * Export all app data to a sync-ready format
 */
export const exportSyncData = async (settings: Partial<UserSettings>): Promise<SyncData> => {
    const cards = await getCards();
    const history = await getHistory();
    const revlog = await db.revlog.toArray();
    const profiles = await db.profile.toArray();
    const aggregatedStats = await db.aggregated_stats.toArray();

    // Sanitize settings - remove API keys
    const safeSettings: Partial<UserSettings> = {
        ...settings,
        geminiApiKey: ''
    };
    
    // Handle TTS settings separately to avoid type issues
    if (settings.tts) {
        safeSettings.tts = {
            ...settings.tts,
            googleApiKey: '',
            azureApiKey: ''
        };
    }

    return {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: getDeviceId(),
        cards,
        history,
        revlog,
        settings: safeSettings,
        profile: profiles.length > 0 ? profiles[0] : null,
        aggregatedStats
    };
};

/**
 * Save sync data to file (for Syncthing to pick up)
 */
export const saveSyncFile = async (settings: Partial<UserSettings>): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const syncData = await exportSyncData(settings);
        const jsonContent = JSON.stringify(syncData, null, 2);
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            // On mobile, first write to cache directory, then use Share to let user choose destination
            const tempFilename = `linguaflow-backup-${Date.now()}.json`;
            
            await Filesystem.writeFile({
                path: tempFilename,
                data: jsonContent,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            const uri = await Filesystem.getUri({
                path: tempFilename,
                directory: Directory.Cache
            });

            // Use Share API to let user choose where to save the file
            await Share.share({
                title: 'LinguaFlow Backup',
                text: 'Save your LinguaFlow backup data',
                url: uri.uri,
                dialogTitle: 'Save backup file to...'
            });

            console.log('[Sync] Shared file for saving:', uri.uri);
            return { success: true, path: uri.uri };
        } else {
            // On web, use File System Access API if available
            if ('showSaveFilePicker' in window) {
                try {
                    // Reuse cached file handle if available
                    let handle = cachedFileHandle;
                    
                    if (handle) {
                        // Verify we still have permission
                        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
                        if (permission !== 'granted') {
                            const requestResult = await (handle as any).requestPermission({ mode: 'readwrite' });
                            if (requestResult !== 'granted') {
                                // Permission denied, need to pick a new file
                                handle = null;
                            }
                        }
                    }
                    
                    if (!handle) {
                        // No cached handle or permission denied, ask user to pick a file
                        handle = await (window as any).showSaveFilePicker({
                            suggestedName: filename,
                            types: [{
                                description: 'JSON Files',
                                accept: { 'application/json': ['.json'] }
                            }]
                        });
                        // Cache the handle for future saves
                        cachedFileHandle = handle;
                    }
                    
                    const writable = await handle!.createWritable();
                    await writable.write(jsonContent);
                    await writable.close();
                    return { success: true, path: handle!.name };
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        return { success: false, error: 'Save cancelled' };
                    }
                    // If there's an error with cached handle, clear it and retry
                    if (cachedFileHandle) {
                        cachedFileHandle = null;
                        return saveSyncFile(settings); // Retry without cache
                    }
                    throw e;
                }
            } else {
                // Fallback: download the file
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return { success: true, path: filename };
            }
        }
    } catch (error: any) {
        console.error('[Sync] Save failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load sync data from file
 */
export const loadSyncFile = async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            // On mobile, read from Documents directory
            try {
                const result = await Filesystem.readFile({
                    path: filename,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });

                const data = JSON.parse(result.data as string) as SyncData;
                return { success: true, data };
            } catch (e: any) {
                if (e.message?.includes('not exist') || e.message?.includes('No such file')) {
                    return { success: false, error: 'No sync file found' };
                }
                throw e;
            }
        } else {
            // On web, use File System Access API or file picker
            if ('showOpenFilePicker' in window) {
                try {
                    const [handle] = await (window as any).showOpenFilePicker({
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    const file = await handle.getFile();
                    const text = await file.text();
                    const data = JSON.parse(text) as SyncData;
                    return { success: true, data };
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        return { success: false, error: 'Load cancelled' };
                    }
                    throw e;
                }
            } else {
                return { success: false, error: 'File picker not available. Please use file import.' };
            }
        }
    } catch (error: any) {
        console.error('[Sync] Load failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if sync file exists and get its metadata
 */
export const checkSyncFile = async (): Promise<{ exists: boolean; lastSynced?: string; deviceId?: string }> => {
    try {
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.readFile({
                    path: filename,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });
                const data = JSON.parse(result.data as string) as SyncData;
                return {
                    exists: true,
                    lastSynced: data.lastSynced,
                    deviceId: data.deviceId
                };
            } catch {
                return { exists: false };
            }
        }
        
        return { exists: false };
    } catch {
        return { exists: false };
    }
};

/**
 * Import sync data into the app (replaces all local data)
 */
export const importSyncData = async (
    data: SyncData,
    updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validate data structure
        if (!data.cards || !Array.isArray(data.cards)) {
            return { success: false, error: 'Invalid sync data: missing cards' };
        }

        // Clear existing data
        await clearAllCards();
        await clearHistory();
        await db.revlog.clear();
        await db.aggregated_stats.clear();
        await db.profile.clear();

        // Restore cards
        if (data.cards.length > 0) {
            await saveAllCards(data.cards);
        }

        // Restore history
        if (data.history && typeof data.history === 'object') {
            const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
            const primaryLanguage = languages.size > 0 ? [...languages][0] : 'polish';
            await saveFullHistory(data.history, primaryLanguage);
        }

        // Restore revlog
        if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
            await db.revlog.bulkPut(data.revlog);
        }

        // Restore profile
        if (data.profile) {
            await db.profile.put(data.profile);
        }

        // Restore aggregated stats
        if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
            await db.aggregated_stats.bulkPut(data.aggregatedStats);
        }

        // Restore settings (preserve local API keys)
        if (data.settings) {
            const localApiKeys = {
                geminiApiKey: localStorage.getItem('linguaflow_gemini_key') || '',
                googleTtsApiKey: localStorage.getItem('linguaflow_google_tts_key') || '',
                azureTtsApiKey: localStorage.getItem('linguaflow_azure_tts_key') || '',
            };

            const restoredSettings: Partial<UserSettings> = {
                ...data.settings,
                geminiApiKey: localApiKeys.geminiApiKey,
                tts: {
                    ...(data.settings.tts || {}),
                    googleApiKey: localApiKeys.googleTtsApiKey,
                    azureApiKey: localApiKeys.azureTtsApiKey,
                } as UserSettings['tts'],
            };
            updateSettings(restoredSettings);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Sync] Import failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get last sync time from localStorage
 */
export const getLastSyncTime = (): string | null => {
    return localStorage.getItem('linguaflow_last_sync');
};

/**
 * Set last sync time
 */
export const setLastSyncTime = (time: string): void => {
    localStorage.setItem('linguaflow_last_sync', time);
};

## services/tts/index.ts
import { Language, TTSSettings, TTSProvider } from "@/types";
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { toast } from 'sonner';

const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja'],
    spanish: ['es-ES', 'es-MX', 'es'],
    german: ['de-DE', 'de-AT', 'de-CH', 'de']
};

export interface VoiceOption {
    id: string;
    name: string;
    lang: string;
    provider: TTSProvider;
    gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

class TTSService {
    private browserVoices: SpeechSynthesisVoice[] = [];
    private audioContext: AudioContext | null = null;
    private currentSource: AudioBufferSourceNode | null = null;
    private currentOperationId = 0;
    private abortController: AbortController | null = null;
    private resumeInterval: ReturnType<typeof setInterval> | null = null;

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
            this.audioContext.close().catch(() => { });
            this.audioContext = null;
        }
    }

    async getAvailableVoices(language: Language, settings: TTSSettings): Promise<VoiceOption[]> {
        const validCodes = LANG_CODE_MAP[language];

        if (Capacitor.isNativePlatform() && settings.provider === 'browser') {
            try {
                const { languages } = await TextToSpeech.getSupportedLanguages();
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

        if (settings.provider === 'google' && settings.googleApiKey) {
            try {
                const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${settings.googleApiKey}`);
                const data = await response.json();

                if (data.voices) {
                    return data.voices
                        .filter((v: any) =>
                            v.languageCodes.some((code: string) =>
                                validCodes.some(validCode => code.toLowerCase().startsWith(validCode.toLowerCase()))
                            )
                        )
                        .map((v: any) => ({
                            id: v.name,
                            name: `${v.name} (${v.ssmlGender})`,
                            lang: v.languageCodes[0],
                            provider: 'google',
                            gender: v.ssmlGender
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

        if (settings.provider === 'browser') {
            await this.speakBrowser(text, language, settings);
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings, opId);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings, opId);
        }
    }

    private async speakBrowser(text: string, language: Language, settings: TTSSettings) {
        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.speak({
                    text,
                    lang: LANG_CODE_MAP[language][0],
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

        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

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
            if (event.error !== 'interrupted') {
                console.error("Speech synthesis error:", event.error);
            }
        };

        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    }

    private async speakAzure(text: string, language: Language, settings: TTSSettings, opId: number) {
        if (!settings.azureApiKey || !settings.azureRegion) return;

        try {
            const voiceName = settings.voiceURI || 'en-US-JennyNeural'; // Should rely on default later if needed

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
            toast.error('Azure TTS failed. Check your API key and region.');
        }
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings, opId: number) {
        if (!settings.googleApiKey) return;

        try {
            const requestBody = {
                input: { text },
                voice: {
                    languageCode: LANG_CODE_MAP[language][0],
                    name: settings.voiceURI && settings.voiceURI !== 'default' ? settings.voiceURI : undefined
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: settings.rate,
                    pitch: (settings.pitch - 1) * 20, // Approximate mapping
                    volumeGainDb: (settings.volume - 1) * 10 // Approximate mapping
                }
            };

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                signal: this.abortController?.signal,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || response.statusText);
            }
            if (this.currentOperationId !== opId) return;

            const data = await response.json();

            // Google Cloud TTS returns base64 encoded audio content
            const binaryString = window.atob(data.audioContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            this.playAudioBuffer(bytes.buffer, opId);

        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            console.error("Google TTS error", e);
            toast.error(`Google TTS failed: ${e.message}`);
        }
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private async playAudioBuffer(buffer: ArrayBuffer, opId: number) {
        try {
            const ctx = this.getAudioContext();

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const decodedBuffer = await ctx.decodeAudioData(buffer.slice(0));
            if (this.currentOperationId !== opId) return;

            if (this.currentSource) {
                try { this.currentSource.stop(); } catch { }
            }

            this.currentSource = ctx.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(ctx.destination);

            this.currentSource.onended = () => {
                // Keep context open for reuse
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

        if (Capacitor.isNativePlatform()) {
            try {
                await TextToSpeech.stop();
            } catch (e) { }
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch { }
            this.currentSource = null;
        }
    }
}

export const ttsService = new TTSService();

## stores/useSettingsStore.ts
import { create } from 'zustand';
import { UserSettings, Language, LanguageId } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { UserApiKeys, updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';

const createLimits = (val: number): Record<Language, number> => ({
    [LanguageId.Polish]: val,
    [LanguageId.Norwegian]: val,
    [LanguageId.Japanese]: val,
    [LanguageId.Spanish]: val,
    [LanguageId.German]: val
});

export const DEFAULT_SETTINGS: UserSettings = {
    language: LanguageId.Polish,
    languageColors: {
        [LanguageId.Polish]: '#dc2626',
        [LanguageId.Norwegian]: '#ef4444',
        [LanguageId.Japanese]: '#f87171',
        [LanguageId.Spanish]: '#fca5a5',
        [LanguageId.German]: '#facc15',
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

const getInitialSettings = (): UserSettings => {
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
                geminiApiKey: '',
            };
        }
    } catch (e) {
        console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
};

interface SettingsState {
    settings: UserSettings;
    settingsLoading: boolean;
    updateSettings: (newSettings: Partial<UserSettings>) => void;
    resetSettings: () => void;
    setSettingsLoading: (loading: boolean) => void;
    setSettings: (settings: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
    saveApiKeys: (userId: string, apiKeys: UserApiKeys) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: getInitialSettings(),
    settingsLoading: false,

    updateSettings: (newSettings) =>
        set((state) => ({
            settings: {
                ...state.settings,
                ...newSettings,
                fsrs: { ...state.settings.fsrs, ...(newSettings.fsrs || {}) },
                tts: { ...state.settings.tts, ...(newSettings.tts || {}) },
                languageColors: { ...state.settings.languageColors, ...(newSettings.languageColors || {}) },
                dailyNewLimits: { ...state.settings.dailyNewLimits, ...(newSettings.dailyNewLimits || {}) },
                dailyReviewLimits: { ...state.settings.dailyReviewLimits, ...(newSettings.dailyReviewLimits || {}) },
            },
        })),

    resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

    setSettingsLoading: (loading) => set({ settingsLoading: loading }),

    setSettings: (newSettings) =>
        set((state) => ({
            settings: typeof newSettings === 'function' ? newSettings(state.settings) : newSettings,
        })),

    saveApiKeys: async (userId, apiKeys) => {
        set({ settingsLoading: true });
        try {
            await updateUserSettings(userId, apiKeys);

            set((state) => ({
                settings: {
                    ...state.settings,
                    geminiApiKey: apiKeys.geminiApiKey || '',
                    tts: {
                        ...state.settings.tts,
                        googleApiKey: apiKeys.googleTtsApiKey || '',
                        azureApiKey: apiKeys.azureTtsApiKey || '',
                        azureRegion: apiKeys.azureRegion || 'eastus',
                    },
                },
            }));

            toast.success('API keys synced to cloud');
        } catch (error) {
            console.error('Failed to save API keys:', error);
            toast.error('Failed to sync API keys');
            throw error;
        } finally {
            set({ settingsLoading: false });
        }
    },
}));

## types/index.ts
import { Card as FSRSCard, State as FSRSState } from 'ts-fsrs';

export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CardStatus = 'new' | 'learning' | 'graduated' | 'known';

export interface Card extends Omit<Partial<FSRSCard>, 'due' | 'last_review'> {
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
}

export type Grade = 'Again' | 'Hard' | 'Good' | 'Easy';

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

import { Language } from './languages';
export type { Language } from './languages';
export { LanguageId, LANGUAGE_LABELS } from './languages';

export type TTSProvider = 'browser' | 'google' | 'azure';

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
  cardOrder: 'newFirst' | 'reviewFirst' | 'mixed';
  tts: TTSSettings;
  fsrs: {
    request_retention: number;
    maximum_interval: number;
    w?: number[];
    enable_fuzzing?: boolean;
  }
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

## types/languages.ts
export const LanguageId = {
    Polish: 'polish',
    Norwegian: 'norwegian',
    Japanese: 'japanese',
    Spanish: 'spanish',
    German: 'german',
} as const;

export type Language = typeof LanguageId[keyof typeof LanguageId];

export const LANGUAGE_LABELS: Record<Language, string> = {
    [LanguageId.Polish]: 'Polish',
    [LanguageId.Norwegian]: 'Norwegian',
    [LanguageId.Japanese]: 'Japanese',
    [LanguageId.Spanish]: 'Spanish',
    [LanguageId.German]: 'German',
};

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
/// <reference types="vite/client" />

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
      addListener: vi.fn(), 
      removeListener: vi.fn(), 
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

## workers/fsrs.worker.ts
import { ReviewLog } from '@/types';
import { computeCardLoss } from '@/lib/fsrsShared';

const optimizeFSRS = async (
  allLogs: ReviewLog[],
  currentW: number[],
  onProgress: (progress: number) => void
): Promise<number[]> => {
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
      self.postMessage({ type: 'progress', progress });
    });
    self.postMessage({ type: 'result', w: optimizedW });
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message });
  }
};

