
## src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeckProvider } from '@/contexts/DeckContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LanguageThemeManager } from '@/components/common/LanguageThemeManager';
import { AppRoutes } from '@/router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/features/auth/AuthPage';

const queryClient = new QueryClient();

const PolskiMineApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
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
      <ThemeProvider defaultTheme="system" storageKey="languagemine-theme">
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              <DeckProvider>
                <PolskiMineApp />
                <Toaster position="bottom-right" />
              </DeckProvider>
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
## src/components/common/ErrorBoundary.tsx
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

## src/components/common/LanguageThemeManager.tsx
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

    if (customColor) {
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
        .dark:root[data-language="${settings.language}"] {
          --primary: ${darkColor};
          --ring: ${darkColor};
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }
  }, [settings.language, settings.languageColors]);

  return null;
};

## src/components/form/EditorialInput.tsx
import React from 'react';

interface EditorialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const EditorialInput: React.FC<EditorialInputProps> = (props) => (
  <input
    className="w-full bg-transparent border-b border-border py-3 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
    {...props}
  />
);

## src/components/form/EditorialSelect.tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface EditorialSelectOption {
  value: string;
  label: string;
}

interface EditorialSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: EditorialSelectOption[];
  containerClassName?: string;
}

export const EditorialSelect: React.FC<EditorialSelectProps> = ({ options, containerClassName, ...props }) => (
  <div className={clsx('relative w-full', containerClassName)}>
    <select
      className="w-full appearance-none bg-transparent border-b border-border py-2 pr-8 text-sm text-foreground outline-none focus:border-foreground transition-colors cursor-pointer font-medium"
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-background text-foreground">
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
  </div>
);

## src/components/form/EditorialTextarea.tsx
import React from 'react';

interface EditorialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const EditorialTextarea: React.FC<EditorialTextareaProps> = (props) => (
  <textarea
    className="w-full bg-transparent border-b border-border py-3 text-sm outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50 min-h-20 resize-none"
    {...props}
  />
);

## src/components/form/MetaLabel.tsx
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

## src/components/layout/Layout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Plus,
  Zap,
  List as ListIcon,
  Settings,
  ChevronUp,
  Check,
  Command,
  Trophy,
  Skull,
  LogOut,
} from 'lucide-react';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { CramModal } from '@/features/study/components/CramModal';
import { SabotageStore } from '@/features/sabotage/SabotageStore';
import { getCards } from '@/services/db/repositories/cardRepository';
import { Card } from '@/types';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PolishFlag, NorwegianFlag, JapaneseFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
import clsx from 'clsx';

declare const __APP_VERSION__: string;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addCard } = useCardOperations();
  const { settings, updateSettings } = useSettings();
  const { signOut } = useAuth();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCramModalOpen, setIsCramModalOpen] = useState(false);
  const [isSabotageOpen, setIsSabotageOpen] = useState(false);

  const languages = [
    { code: 'polish', name: 'Polish', Flag: PolishFlag },
    { code: 'norwegian', name: 'Norwegian', Flag: NorwegianFlag },
    { code: 'japanese', name: 'Japanese', Flag: JapaneseFlag },
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', action: undefined },
    { icon: GraduationCap, label: 'Study', path: '/study', action: undefined },
    { icon: ListIcon, label: 'Cards', path: '/cards', action: undefined },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', action: undefined },
    { type: 'separator' },
    { icon: Plus, label: 'Add', path: '#', action: () => setIsAddModalOpen(true) },
    { icon: Zap, label: 'Cram', path: '#', action: () => setIsCramModalOpen(true) },
    { icon: Skull, label: 'Sabotage', path: '#', action: () => setIsSabotageOpen(true) },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex selection:bg-gray-200 dark:selection:bg-gray-800">
      
      {/* --- Desktop Sidebar (Hidden on Mobile) --- */}
      <aside className="hidden md:flex w-64 flex-col fixed h-full z-40 border-r border-border bg-background transition-colors duration-300">
        {/* Header */}
        <div className="p-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-background flex items-center justify-center rounded-full">
                <Command size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-none">PolskiMine</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mt-1">v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'Dev'}</span>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 py-4">
            {navItems.map((item, idx) => {
                if (item.type === 'separator') {
                    return <div key={idx} className="my-4 border-t border-border/50 mx-2" />;
                }

                const isActive = location.pathname === item.path && !item.action;
                
                const content = (
                    <>
                        <span className={clsx("transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                            {item.icon && <item.icon size={18} strokeWidth={2} />}
                        </span>
                        <span className={clsx("font-medium tracking-tight", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                            {item.label}
                        </span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground" />}
                    </>
                );

                const className = clsx(
                    "group w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all duration-200",
                    isActive ? "bg-secondary" : "hover:bg-secondary/50"
                );

                if (item.action) {
                    return <button key={item.label} onClick={item.action} className={className}>{content}</button>;
                }

                return <Link key={item.label} to={item.path} className={className}>{content}</Link>;
            })}
        </nav>

        {/* Footer / Settings */}
        <div className="p-4 space-y-2 border-t border-border">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full font-medium"
            >
                <Settings size={18} />
                Settings
            </button>
          <button 
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all w-full font-medium rounded-md"
          >
            <LogOut size={18} />
            Log Out
          </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm border border-border hover:border-foreground/20 transition-colors w-full rounded-md bg-background outline-none group">
                  <div className="flex items-center gap-3 font-medium">
                    <currentLanguage.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{currentLanguage.name}</span>
                  </div>
                  <ChevronUp size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5 bg-popover border-border shadow-xl rounded-lg">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                    }}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer rounded-md focus:bg-secondary focus:text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <lang.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm" />
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    {settings.language === lang.code && (
                      <Check size={14} className="text-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </aside>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe">
         <div className="flex items-center justify-around p-2">
            {navItems.filter(i => i.type !== 'separator').map((item) => {
                const isActive = location.pathname === item.path && !item.action;
                const Icon = item.icon;

                if (item.action) {
                   return (
                     <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-1 p-2 text-muted-foreground active:text-foreground">
                        {Icon && <Icon size={20} />}
                        <span className="text-[9px] font-medium">{item.label}</span>
                     </button>
                   );
                }
                
                return (
                  <Link 
                    key={item.label} 
                    to={item.path} 
                    className={clsx(
                      "flex flex-col items-center gap-1 p-2 transition-colors", 
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                      {Icon && <Icon size={20} />}
                      <span className="text-[9px] font-medium">{item.label}</span>
                  </Link>
                );
            })}
            <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center gap-1 p-2 text-muted-foreground active:text-foreground">
               <Settings size={20} />
               <span className="text-[9px] font-medium">Setup</span>
            </button>
         </div>
      </nav>
      
      {/* --- Mobile Header --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-background flex items-center justify-center rounded-full">
                <Command size={12} strokeWidth={3} />
            </div>
            <span className="font-bold text-sm tracking-tight">PolskiMine</span>
         </div>
         
         <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50">
                    <currentLanguage.Flag className="w-4 h-3 rounded-[2px]" />
                    <ChevronUp size={12} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                 {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => updateSettings({ language: lang.code })}
                    className="gap-3"
                  >
                    <lang.Flag className="w-4 h-3" />
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
         </DropdownMenu>
      </div>

      {/* --- Main Content --- */}
      {/* Adjusted margin-left for desktop, padding for mobile header/footer */}
      <main className="flex-1 w-full min-h-screen flex flex-col bg-background md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="flex-1 p-6 md:p-12 max-w-screen-2xl mx-auto w-full animate-in fade-in duration-500">
            {children}
        </div>
      </main>

      {/* Global Modals */}
      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCard}
      />
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <CramModal 
        isOpen={isCramModalOpen} 
        onClose={() => setIsCramModalOpen(false)} 
      />
      <SabotageStore 
        isOpen={isSabotageOpen}
        onClose={() => setIsSabotageOpen(false)}
      />
    </div>
  );
};

## src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
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

## src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
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

## src/components/ui/card.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
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

## src/components/ui/color-picker.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToHSL, hslToHex } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value: string; // HSL string
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  const hexValue = React.useMemo(() => {
    try {
      return hslToHex(value);
    } catch (e) {
      return '#000000';
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const newHSL = hexToHSL(newHex);
    onChange(newHSL);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    // Allow typing, but only update if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
        const newHSL = hexToHSL(newHex);
        onChange(newHSL);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded-md overflow-hidden border border-input shadow-sm">
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

## src/components/ui/dialog.tsx
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
      // Changed: Lighter background with backdrop blur for a cleaner, modern feel
      "fixed inset-0 z-50 bg-white/80 dark:bg-black/60 backdrop-blur-[2px]",
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
        // Changed: w-[95vw] for mobile to ensure it fits but has margins
        "fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-6 shadow-2xl rounded-lg sm:rounded-xl",
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
      // Changed: Added tracking-tight to match Dashboard headers
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
    // Changed: Lighter gray for better hierarchy
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
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

## src/components/ui/dropdown-menu.tsx
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
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
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
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
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

## src/components/ui/flags.tsx
import React from 'react';

interface FlagProps {
  className?: string;
}

export const PolishFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <rect y="12" width="32" height="12" fill="#FF6B6B"/>
  </svg>
);

export const NorwegianFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FF6B6B"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#FFFFFF" strokeWidth="6"/>
    <path d="M0,12 h32 M10,0 v24" stroke="#4D96FF" strokeWidth="3"/>
  </svg>
);

export const JapaneseFlag: React.FC<FlagProps> = ({ className }) => (
  <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
    <rect width="32" height="24" fill="#FFFFFF"/>
    <circle cx="16" cy="12" r="7" fill="#FF6B6B"/>
  </svg>
);

## src/components/ui/input.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

## src/components/ui/label.tsx
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

## src/components/ui/progress.tsx
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

## src/components/ui/select.tsx
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
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
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
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
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

## src/components/ui/sheet.tsx
import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

## src/components/ui/slider.tsx
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
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

## src/components/ui/switch.tsx
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

## src/components/ui/textarea.tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

## src/components/ui/tooltip.tsx
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

## src/constants.ts
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


const generateMockHistory = (): ReviewHistory => {
  const history: ReviewHistory = {};
  const today = new Date();
  for (let i = 0; i < 100; i++) {

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));
    const dateKey = pastDate.toISOString().split('T')[0];
    

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
  japanese: 'Japanese'
} as const;

## src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string | null;
  xp: number;
  level: number;
  avatar_url?: string | null;
  updated_at?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  loading: boolean;
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

    setProfile(data as Profile);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      toast.error(error.message);
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

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, loading }}
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

## src/contexts/DeckContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, DeckStats, Grade, ReviewHistory } from '@/types';
import { BEGINNER_DECK } from '@/features/deck/data/beginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { getSRSDate } from '@/features/study/logic/srs';
import {
  saveAllCards,
  saveCard,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import {
  getHistory as fetchHistory,
  incrementHistory,
} from '@/services/db/repositories/historyRepository';
import {
  getStats as fetchStats,
  getTodayReviewStats,
} from '@/services/db/repositories/statsRepository';
import { supabase } from '@/lib/supabase';

interface DeckContextValue {
  history: ReviewHistory;
  stats: DeckStats;
  reviewsToday: { newCards: number; reviewCards: number };
  isLoading: boolean;
  dataVersion: number;
  recordReview: (card: Card, grade: Grade) => Promise<void>;
  undoReview: () => Promise<void>;
  canUndo: boolean;
  refreshDeckData: () => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

const languageLabel = (language: string) => {
  if (language === 'norwegian') return 'Norwegian';
  if (language === 'japanese') return 'Japanese';
  return 'Polish';
};

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [history, setHistory] = useState<ReviewHistory>({});
  const [stats, setStats] = useState<DeckStats>({
    total: 0,
    due: 0,
    learned: 0,
    streak: 0,
    totalReviews: 0,
    longestStreak: 0,
  });
  const [reviewsToday, setReviewsToday] = useState({ newCards: 0, reviewCards: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const [dbStats, dueCards, todayReviews] = await Promise.all([
        fetchStats(settings.language),
        getDueCards(new Date(), settings.language),
        getTodayReviewStats(settings.language),
      ]);

      setReviewsToday(todayReviews);
      setStats((prev) => ({
        ...prev,
        total: dbStats.total,
        learned: dbStats.learned,
        due: dueCards.length,
      }));
    } catch (error) {
      console.error('Failed to refresh stats', error);
    }
  }, [settings.language]);

  const refreshDeckData = useCallback(() => {
    setDataVersion((version) => version + 1);
  }, []);

  // Removed local card state management functions as we now use React Query


  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedHistory = await fetchHistory(settings.language);
        setHistory(loadedHistory);
        await refreshStats();
        
        // Check if deck is empty and load beginner deck if needed
        const { count } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('language', settings.language);
          
        if (count === 0) {
          const deck =
            settings.language === 'norwegian'
              ? NORWEGIAN_BEGINNER_DECK
              : settings.language === 'japanese'
              ? JAPANESE_BEGINNER_DECK
              : BEGINNER_DECK;
          await saveAllCards(deck);
          toast.success(`Loaded Beginner ${languageLabel(settings.language)} course!`);
          await refreshStats();
        }
      } catch (error) {
        console.error('Failed to load data from DB', error);
        toast.error('Failed to load your deck. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshStats, settings.language, dataVersion]);

  useEffect(() => {
    const sortedDates = Object.keys(history).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const totalReviews = Object.values(history).reduce(
      (acc, val) => acc + (typeof val === 'number' ? val : 0),
      0
    );

    const srsToday = getSRSDate(new Date());
    const todayStr = format(srsToday, 'yyyy-MM-dd');
    const srsYesterday = new Date(srsToday);
    srsYesterday.setDate(srsYesterday.getDate() - 1);
    const yesterdayStr = format(srsYesterday, 'yyyy-MM-dd');

    if (history[todayStr]) {
      currentStreak = 1;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (history[dateStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (history[yesterdayStr]) {
      currentStreak = 0;
      const checkDate = new Date(srsYesterday);
      while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
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

    setStats((prev) => ({
      ...prev,
      streak: currentStreak,
      totalReviews,
      longestStreak,
    }));
  }, [history]);

  const recordReview = useCallback(
    async (oldCard: Card, grade: Grade) => {
      const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
      
      setHistory((prev) => ({
        ...prev,
        [today]: (prev[today] || 0) + 1,
      }));
      
      setStats((prev) => ({
        ...prev,
        due: Math.max(0, prev.due - 1),
        totalReviews: prev.totalReviews + 1,
      }));

      setLastReview({ card: oldCard, date: today });
      try {
        await incrementHistory(today, 1, oldCard.language || settings.language);
        if (user) {
          const xpAmount =
            oldCard.status === 'new'
              ? 50
              : grade === 'Again'
              ? 1
              : grade === 'Hard'
              ? 5
              : 10;

          void supabase
            .from('activity_log')
            .insert({
              user_id: user.id,
              activity_type: oldCard.status === 'new' ? 'new_card' : 'review',
              xp_awarded: xpAmount,
              language: oldCard.language || settings.language,
            })
            .then(({ error }) => {
              if (error) {
                console.error('Failed to award XP', error);
              }
            });
        }
      } catch (error) {
        console.error(error);
        // Rollback
        setHistory((prev) => ({ ...prev, [today]: Math.max(0, (prev[today] || 0) - 1) }));
        setStats((prev) => ({
          ...prev,
          due: prev.due + 1,
          totalReviews: Math.max(0, prev.totalReviews - 1),
        }));
        toast.error("Failed to save review progress");
      }
    },
    [settings.language, user]
  );

  const undoReview = useCallback(async () => {
    if (!lastReview) return;
    const { card, date } = lastReview;
    
    try {
      await saveCard(card);
      setHistory((prev) => ({
        ...prev,
        [date]: Math.max(0, (prev[date] || 0) - 1),
      }));
      
      setStats((prev) => ({
        ...prev,
        due: prev.due + 1,
        totalReviews: Math.max(0, prev.totalReviews - 1),
      }));

      await incrementHistory(date, -1, card.language || settings.language);
      setLastReview(null);
      toast.success('Review undone');
    } catch (error) {
      console.error(error);
    }
  }, [lastReview, settings.language]);

  const value = useMemo(
    () => ({
      history,
      stats,
      reviewsToday,
      isLoading,
      dataVersion,
      recordReview,
      undoReview,
      canUndo: !!lastReview,
      refreshDeckData,
    }),
    [history, stats, reviewsToday, isLoading, dataVersion, recordReview, undoReview, lastReview, refreshDeckData]
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

## src/contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { FSRS_DEFAULTS } from '../constants';

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'polish',
  languageColors: {
    polish: '346 84% 45%',
    norwegian: '200 90% 40%',
    japanese: '330 85% 65%',
  },
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
  autoPlayAudio: false,
  blindMode: false,
  showTranslationAfterFlip: true,
  ignoreLearningStepsWhenNoCards: false,
  // Added TTS Defaults
  tts: {
    provider: 'browser',
    voiceURI: null, // null = use browser default
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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('language_mining_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setSettings(prev => ({
            ...prev,
            ...parsed,
            // Deep merge nested objects to ensure new fields (like tts) exist if local storage is old
            fsrs: { ...prev.fsrs, ...(parsed.fsrs || {}) },
            tts: { ...prev.tts, ...(parsed.tts || {}) },
            languageColors: { ...prev.languageColors, ...(parsed.languageColors || {}) }
        }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        fsrs: { ...prev.fsrs, ...(newSettings.fsrs || {}) },
        tts: { ...prev.tts, ...(newSettings.tts || {}) },
        languageColors: { ...prev.languageColors, ...(newSettings.languageColors || {}) }
      };
      localStorage.setItem('language_mining_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('language_mining_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
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

## src/contexts/ThemeContext.tsx
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
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
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

## src/features/auth/AuthPage.tsx
import React, { useState } from 'react';
import { Command, ArrowRight, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, username);
        toast.success('Account created! Please check your email to verify.');
      } else {
        await signInWithEmail(email, password);
        toast.success('Welcome back');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary text-background flex items-center justify-center rounded-full mb-6">
            <Command size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground">Enter your credentials to access PolskiMine</p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <div className="relative">
                  <UserIcon size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <Mail size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock size={16} className="absolute left-0 top-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-transparent border-b border-border py-3 pl-6 text-base outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground h-11 rounded-md font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            type="button"
            className="w-full border border-border h-11 rounded-md font-medium hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp((prev) => !prev)}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

## src/features/auth/LoginScreen.tsx
import React from 'react';
import { LogIn, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          <Command size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PolskiMine</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Sign in to sync your decks, earn XP, and climb the global leaderboard.
          </p>
        </div>
      </div>
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 font-medium shadow-sm"
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

## src/features/dashboard/components/Dashboard.tsx
import React, { useMemo } from 'react';
import { Card as CardType, DeckStats, ReviewHistory } from '@/types';
import { ArrowRight, Play } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { useSettings } from '@/contexts/SettingsContext';
import { useChartColors } from '@/hooks/useChartColors';
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis
} from 'recharts';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

interface DashboardProps {
  metrics: { new: number; learning: number; graduated: number; known: number };
  forecast: { day: string; fullDate: string; count: number }[];
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
}

// Ultra Minimal Stat
const StatItem = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
    <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-4xl lg:text-6xl font-light tracking-tighter text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted-foreground font-medium">{sub}</span>}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  forecast,
  stats,
  history,
  onStartSession,
}) => {
  const { settings } = useSettings();
  const colors = useChartColors();

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10">
        <div className="space-y-2 md:space-y-4">
            {/* Responsive text sizing: 5xl on mobile, 8xl on desktop */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground leading-[0.9]">
                {stats.due} <span className="text-muted-foreground/30">Due</span>
            </h1>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest pl-1 md:pl-2">
               {settings.language} — {stats.total} Total Cards
            </p>
        </div>
        <div className="pb-2 w-full md:w-auto">
            <button 
                onClick={onStartSession}
                disabled={stats.due === 0}
                className="w-full md:w-auto justify-center group relative flex items-center gap-4 pl-8 pr-6 py-4 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg md:shadow-none"
            >
                <span className="relative z-10">Start Session</span>
                <div className="relative z-10 w-6 h-6 bg-background rounded-full flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                    <Play size={10} fill="currentColor" className="ml-0.5" />
                </div>
            </button>
        </div>
      </section>

      {/* Data Grid - 2 columns on mobile, 4 on desktop */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-4 md:gap-16 border-t border-border pt-12 md:pt-16">
        <StatItem label="New" value={metrics.new} />
        <StatItem label="Learning" value={metrics.learning} />
        <StatItem label="Review" value={metrics.graduated} />
        <StatItem label="Mastered" value={metrics.known} />
      </section>

      {/* Analytics Row */}
      <section className="flex flex-col gap-12 md:gap-16 border-t border-border pt-12 md:pt-16">
        
        {/* Heatmap */}
        <div className="space-y-6 md:space-y-8 overflow-hidden">
            <div className="flex items-baseline justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Consistency</h3>
                <span className="text-xs text-foreground font-medium">{stats.streak} Day Streak</span>
            </div>
            <Heatmap history={history} />
        </div>

        {/* Forecast Chart - Utilitarian Style */}
        <div className="space-y-6 md:space-y-8">
            <div className="flex items-baseline justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Forecast</h3>
                <span className="text-xs text-muted-foreground">Next 14 Days</span>
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast} barGap={0}>
                        <Tooltip 
                          cursor={{ fill: colors.muted }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                              <div
                                className="text-[10px] py-1 px-2 font-mono rounded shadow-sm text-primary-foreground"
                                style={{ backgroundColor: colors.primary }}
                              >
                              {payload[0].payload.fullDate}: <span className="font-bold">{payload[0].value}</span>
                              </div>
                            );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill={colors.primary} radius={[2, 2, 2, 2]} barSize={8} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </section>
    </div>
  );
};

## src/features/dashboard/components/Heatmap.tsx
import React, { useMemo } from 'react';
import { ReviewHistory } from '@/types';
import { addDays, subDays, startOfDay, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = ({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];
    // Show last 52 weeks (approx 1 year)
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
    if (count === 0) return 'bg-border';
    if (count <= 2) return 'bg-primary/40';
    if (count <= 5) return 'bg-primary/60';
    if (count <= 9) return 'bg-primary/80';
    return 'bg-primary';
  };

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto no-scrollbar">
          <div className="w-max">
              <div className="grid grid-rows-7 grid-flow-col gap-1">
              {calendarData.map((day) => (
                  <Tooltip key={day.dateKey} delayDuration={100}>
                      <TooltipTrigger asChild>
                          <div
                              className={`w-3 h-3 rounded-sm transition-colors duration-200 ${day.inFuture ? 'opacity-0 pointer-events-none' : getColorClass(day.count)}`}
                          />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] font-mono bg-primary text-primary-foreground border-none">
                          {format(day.date, 'MMM d, yyyy')}: <span className="font-bold">{day.count}</span> reviews
                      </TooltipContent>
                  </Tooltip>
              ))}
              </div>
          </div>
      </div>
    </TooltipProvider>
  );
};

## src/features/dashboard/components/RetentionStats.tsx
import React, { useMemo } from 'react';
import { Card } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useChartColors } from '@/hooks/useChartColors';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const colors = useChartColors();


  const forecastData = useMemo(() => {
    const daysToShow = 30;
    const data = new Array(daysToShow).fill(0).map((_, i) => ({ day: i, count: 0, label: `+${i}d` }));
    const today = new Date();

    cards.forEach(card => {
      if (card.status === 'known' || card.status === 'new') return;
      
      const dueDate = parseISO(card.dueDate);
      const diff = differenceInCalendarDays(dueDate, today);
      
      if (diff >= 0 && diff < daysToShow) {
        data[diff].count++;
      }
    });
    

    data[0].label = 'Today';
    data[1].label = 'Tmrw';
    
    return data;
  }, [cards]);


  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '1-3d', min: 1, max: 3, count: 0 },
      { label: '3-7d', min: 3, max: 7, count: 0 },
      { label: '7-14d', min: 7, max: 14, count: 0 },
      { label: '14-30d', min: 14, max: 30, count: 0 },
      { label: '1-3m', min: 30, max: 90, count: 0 },
      { label: '3-6m', min: 90, max: 180, count: 0 },
      { label: '6m-1y', min: 180, max: 365, count: 0 },
      { label: '1y+', min: 365, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [cards]);


  const statusData = useMemo(() => {
    const counts = {
      new: 0,
      learning: 0,
      graduated: 0,
      known: 0
    };
    
    cards.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return [
      { name: 'New', value: counts.new, color: colors.primary },
      { name: 'Learning', value: counts.learning, color: colors.muted },
      { name: 'Graduated', value: counts.graduated, color: colors.border },
      { name: 'Known', value: counts.known, color: colors.foreground },
    ];
  }, [cards, colors.primary, colors.muted, colors.border, colors.foreground]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Reviews (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: colors.foreground }} 
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: colors.foreground }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{ fill: colors.muted }}
                />
                <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Card Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                     borderRadius: '8px',
                     border: `1px solid ${colors.border}`,
                     backgroundColor: colors.background,
                     color: colors.foreground,
                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                   }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stability Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Memory Stability (Retention Strength)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Shows how long cards are expected to be remembered (90% retention probability). Higher is better.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: colors.foreground }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: colors.foreground }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                cursor={{ fill: colors.muted }}
              />
              <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

## src/features/deck/components/AddCardModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, initialCard, settings.language]);

  const handleAutoFill = async () => {
    if (!form.sentence) return;
    setIsGenerating(true);
    try {
        const targetLanguage = initialCard?.language || settings.language;
        const result = await aiService.generateCardContent(form.sentence, targetLanguage);
        
        setForm(prev => ({ 
            ...prev, 
            sentence: (targetLanguage === 'japanese' && result.furigana) ? result.furigana : prev.sentence,
            translation: result.translation, 
            notes: result.notes,
            furigana: result.furigana || prev.furigana 
        }));
        toast.success("Content generated");
    } catch (e) {
        toast.error("Generation failed");
    } finally {
        setIsGenerating(false);
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
        // If Japanese, the input sentence might contain furigana brackets.
        // We treat the input as the source of truth for furigana.
        furigana = form.sentence;
        // Strip brackets for the clean target sentence
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

  // Subtle highlight preview
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
      <DialogContent className="sm:max-w-2xl p-12 bg-background border border-border shadow-2xl sm:rounded-xl gap-0">
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
                    className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Save <ArrowRight size={16} />
                </button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

## src/features/deck/components/CardList.tsx
import React from 'react';
import clsx from 'clsx';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardStatus } from '@/types';

interface CardListProps {
  cards: Card[];
  searchTerm: string;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

interface RowData {
  cards: Card[];
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
}

const statusColors: Record<CardStatus, string> = {
  new: 'bg-blue-500',
  learning: 'bg-amber-500',
  graduated: 'bg-emerald-500',
  known: 'bg-gray-300',
};

const Row = ({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { cards, onEditCard, onDeleteCard } = data;
  const card = cards[index];
  
  if (!card) return null;
  return (
    <div
      style={style}
      className="group flex items-center border-b border-gray-50 dark:border-gray-900 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-default"
    >
      <div className="w-6 md:w-8 flex justify-center items-center gap-1 shrink-0">
        <div className={clsx('w-1.5 h-1.5 rounded-full', statusColors[card.status as CardStatus])} />
        {card.isLeech && (
            <div title="Leech Card">
                <AlertTriangle size={10} className="text-amber-500" />
            </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 pr-2 md:pr-4">
        <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-3">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {card.targetSentence}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600 truncate flex-1">
            {card.nativeTranslation}
          </span>
        </div>
      </div>

      {/* Date hidden on mobile */}
      <div className="hidden md:block w-24 text-right text-[10px] font-mono text-gray-300 dark:text-gray-700 shrink-0">
        {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </div>
      
      <div className="w-14 md:w-16 flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEditCard(card)} className="text-gray-400 hover:text-black dark:hover:text-white p-1">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDeleteCard(card.id)} className="text-gray-400 hover:text-red-600 p-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const CardList: React.FC<CardListProps> = ({ cards, searchTerm, onEditCard, onDeleteCard }) => {
  const filteredCards = cards;

  return (
    <div className="flex-1 h-full min-h-[400px] flex flex-col">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={filteredCards.length}
            itemSize={56}
            itemData={{ cards: filteredCards, onEditCard, onDeleteCard }}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

## src/features/deck/components/GenerateCardsModal.tsx
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
  
  // Config State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('A1');
  const [count, setCount] = useState([5]);

  // Preview State
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const results = await aiService.generateBatchCards({
        difficulty,
        topic,
        count: count[0],
        language: settings.language
      });
      
      setGeneratedData(results);
      // Select all by default
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
        // Clean Japanese sentence if furigana is provided separately in the raw sentence
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
      <DialogContent className="sm:max-w-2xl p-8 bg-background border border-border shadow-2xl sm:rounded-xl">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={20} />
          </div>
          <div>
             <DialogTitle className="text-xl font-bold tracking-tight">AI Deck Generator</DialogTitle>
             <DialogDescription className="text-xs text-muted-foreground">Generate content for {settings.language}</DialogDescription>
          </div>
        </div>

        {step === 'config' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <MetaLabel>Difficulty Level</MetaLabel>
                <EditorialSelect
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  options={DIFFICULTIES.map(d => ({ value: d, label: `${d} Level` }))}
                />
              </div>
              <div>
                 <div className="flex justify-between mb-3">
                    <MetaLabel className="mb-0">Card Count</MetaLabel>
                    <span className="font-mono text-sm font-bold">{count[0]}</span>
                 </div>
                 <Slider
                    value={count}
                    onValueChange={setCount}
                    min={3}
                    max={10}
                    step={1}
                 />
              </div>
            </div>

            <div>
              <MetaLabel>Topic / Context</MetaLabel>
              <EditorialInput 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Business Meetings, Ordering Food, Harry Potter..."
                autoFocus
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-auto">
                {loading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2" size={16} /> Generate Cards</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
               {generatedData.map((card, idx) => (
                 <div 
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`
                        p-4 rounded-lg border cursor-pointer transition-all duration-200 relative group
                        ${selectedIndices.has(idx) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border opacity-60 hover:opacity-100'
                        }
                    `}
                 >
                    <div className="absolute top-3 right-3">
                        {selectedIndices.has(idx) ? <Check size={16} className="text-primary" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                    </div>
                    <div className="pr-8">
                        <div className="font-medium text-lg mb-1">{card.targetSentence}</div>
                        <div className="text-sm text-muted-foreground">{card.nativeTranslation}</div>
                        <div className="flex gap-2 mt-2">
                            {card.targetWord && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-foreground">{card.targetWord}</span>}
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">{difficulty}</span>
                        </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
                <button onClick={() => setStep('config')} className="text-sm text-muted-foreground hover:text-foreground">
                    Back to Config
                </button>
                <Button onClick={handleSave} disabled={selectedIndices.size === 0}>
                    Save {selectedIndices.size} Cards <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

## src/features/deck/data/beginnerDeck.ts
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

export const BEGINNER_DECK: Card[] = [

  createCard("Dzień dobry.", "Good morning / Good afternoon.", undefined, "Formal greeting used during the day."),
  createCard("Dobry wieczór.", "Good evening.", undefined, "Formal greeting used in the evening."),
  createCard("Cześć.", "Hi / Bye.", undefined, "Informal greeting and farewell."),
  createCard("Do widzenia.", "Goodbye.", undefined, "Formal farewell."),
  createCard("Dobranoc.", "Good night.", undefined, "Used before going to sleep."),
  createCard("Dziękuję.", "Thank you.", undefined, ""),
  createCard("Proszę.", "Please / Here you go.", undefined, ""),
  createCard("Przepraszam.", "I'm sorry / Excuse me.", undefined, ""),
  createCard("Tak.", "Yes.", undefined, ""),
  createCard("Nie.", "No.", undefined, ""),


  createCard("Jak masz na imię?", "What is your name?", "imię", "Informal."),
  createCard("Mam na imię Anna.", "My name is Anna.", "imię", ""),
  createCard("Miło mi cię poznać.", "Nice to meet you.", "poznać", "Informal."),
  createCard("Skąd jesteś?", "Where are you from?", "jesteś", "Informal."),
  createCard("Jestem z Polski.", "I am from Poland.", "Polski", "Genitive case of Polska."),
  createCard("Mieszkam w Warszawie.", "I live in Warsaw.", "Warszawie", "Locative case of Warszawa."),


  createCard("Jestem zmęczony.", "I am tired.", "Jestem", "Masculine form."),
  createCard("Jesteś głodna?", "Are you hungry?", "Jesteś", "Feminine form."),
  createCard("On jest w domu.", "He is at home.", "jest", ""),
  createCard("Ona jest w pracy.", "She is at work.", "jest", ""),
  createCard("To jest trudne.", "This is difficult.", "jest", ""),


  createCard("Mam pytanie.", "I have a question.", "Mam", ""),
  createCard("Masz czas?", "Do you have time?", "Masz", ""),
  createCard("On ma psa.", "He has a dog.", "ma", "Accusative: pies -> psa."),
  createCard("Ona ma kota.", "She has a cat.", "ma", "Accusative: kot -> kota."),
  createCard("Nie mam pieniędzy.", "I don't have money.", "mam", "Genitive required after negation."),


  createCard("Idę do sklepu.", "I am walking to the store.", "Idę", "Motion on foot."),
  createCard("Jadę do Krakowa.", "I am going (by vehicle) to Krakow.", "Jadę", "Motion by vehicle."),
  createCard("Gdzie idziesz?", "Where are you going?", "idziesz", ""),
  createCard("Idziemy na spacer.", "We are going for a walk.", "Idziemy", ""),


  createCard("Chcę kawę.", "I want coffee.", "Chcę", "Accusative: kawa -> kawę."),
  createCard("Co chcesz robić?", "What do you want to do?", "chcesz", ""),
  createCard("On chce spać.", "He wants to sleep.", "chce", ""),


  createCard("Lubię Polskę.", "I like Poland.", "Lubię", "Accusative: Polska -> Polskę."),
  createCard("Lubisz czytać?", "Do you like reading?", "Lubisz", ""),
  createCard("Nie lubię tego.", "I don't like this.", "lubię", "Genitive after negation."),


  createCard("Poproszę wodę.", "Water, please.", "wodę", "Accusative: woda -> wodę."),
  createCard("Smacznego!", "Bon appétit!", undefined, ""),
  createCard("To jest pyszne.", "This is delicious.", "pyszne", ""),
  createCard("Jestem głodny.", "I am hungry.", "głodny", "Masculine."),
  createCard("Chcę jeść.", "I want to eat.", "jeść", ""),


  createCard("Która jest godzina?", "What time is it?", "godzina", ""),
  createCard("Jest pierwsza.", "It is one o'clock.", "pierwsza", ""),
  createCard("Jeden, dwa, trzy.", "One, two, three.", undefined, ""),
  createCard("Ile to kosztuje?", "How much does this cost?", "kosztuje", ""),


  createCard("Gdzie jest toaleta?", "Where is the toilet?", "toaleta", ""),
  createCard("Prosto i w prawo.", "Straight and to the right.", "prawo", ""),
  createCard("W lewo.", "To the left.", "lewo", ""),
  createCard("Szukam dworca.", "I am looking for the station.", "dworca", "Genitive: dworzec -> dworca."),


  createCard("To jest moja matka.", "This is my mother.", "matka", ""),
  createCard("To jest mój ojciec.", "This is my father.", "ojciec", ""),
  createCard("Masz rodzeństwo?", "Do you have siblings?", "rodzeństwo", ""),


  createCard("Zimno mi.", "I am cold.", "Zimno", ""),
  createCard("Jest gorąco.", "It is hot.", "gorąco", ""),
  createCard("Pada deszcz.", "It is raining.", "Pada", ""),
  createCard("Świeci słońce.", "The sun is shining.", "słońce", ""),


  createCard("Jestem naukowcem.", "I am a scientist."),
  createCard("Jestem inżynierem.", "I am an engineer."),
  createCard("Jestem specjalistą.", "I am a specialist."),
  createCard("Jestem studentem.", "I am a student."),
  createCard("To jest uniwersytet.", "This is the university."),
  createCard("Studiuję ochronę środowiska.", "I study environmental protection."),
  createCard("Interesuje mnie ekologia.", "Ecology interests me."),
  createCard("To jest woda.", "This is water."),
  createCard("Badam jakość wody.", "I investigate the quality of the water."),
  createCard("To jest powietrze.", "This is air."),
  createCard("Analizuję zanieczyszczenie powietrza.", "I analyze the pollution of the air."),
  createCard("Lubię przyrodę.", "I like nature."),


  createCard("Jestem w domu.", "I am at home."),
  createCard("Idę do domu.", "I am going home."),
  createCard("Jestem na uniwersytecie.", "I am at the university."),
  createCard("Idę na uniwersytet.", "I am going to the university."),
  createCard("Mieszkam w mieście.", "I live in the city."),
  createCard("Jadę do miasta.", "I am driving to the city."),
  createCard("To jest Kraków.", "This is Krakow."),
  createCard("Lubię Kraków.", "I like Krakow."),
  createCard("Jestem w Krakowie.", "I am in Krakow."),


  createCard("Czytam książkę.", "I am reading a book."),
  createCard("Mam książkę.", "I have a book."),
  createCard("Szukam książki.", "I am looking for a book."),
  createCard("Piszę e-mail.", "I am writing an email."),
  createCard("Wysyłam e-mail.", "I am sending an email."),
  createCard("Nie mam e-maila.", "I do not have the email."),
  createCard("Piję kawę.", "I am drinking coffee."),
  createCard("Nie ma kawy.", "There is no coffee."),
  createCard("Potrzebuję kawy.", "I need coffee."),
  createCard("Zamawiam kawę.", "I am ordering coffee."),
  createCard("Chcę herbatę.", "I want tea."),
  createCard("Nie chcę herbaty.", "I do not want tea."),
  createCard("Lubię kawę.", "I like coffee."),
  createCard("Nie lubię kawy.", "I do not like coffee."),
  createCard("Jem obiad.", "I am eating lunch."),
  createCard("Nie jem obiadu.", "I am not eating lunch."),
  createCard("Widzę problem.", "I see a problem."),
  createCard("Nie widzę problemu.", "I do not see a problem."),


  createCard("To jest słońce.", "This is the sun."),
  createCard("Widzę słońce.", "I see the sun."),
  createCard("Nie ma słońca.", "There is no sun."),
  createCard("To jest deszcz.", "This is rain."),
  createCard("Pada deszcz.", "It is raining."),
  createCard("Nie lubię deszczu.", "I do not like rain."),
  createCard("To jest smog.", "This is smog."),
  createCard("W mieście jest smog.", "There is smog in the city."),
  createCard("Badamy smog.", "We are investigating the smog."),
  createCard("To jest rzeka.", "This is a river."),
  createCard("Widzę rzekę.", "I see a river."),
  createCard("Idę nad rzekę.", "I am going to the river."),
  createCard("To jest las.", "This is a forest."),
  createCard("Lubię las.", "I like the forest."),
  createCard("Idziemy na spacer.", "We are going for a walk."),
  createCard("To jest morze.", "This is the sea."),
  createCard("Jedziemy nad morze.", "We are going to the seaside."),
  createCard("Wieje wiatr.", "The wind is blowing."),
  createCard("To jest ziemia.", "This is earth/soil."),
  createCard("To jest ogień.", "This is fire."),
  createCard("Widzę drzewo.", "I see a tree."),
  createCard("Ptaki śpiewają.", "Birds are singing."),


  createCard("To jest laboratorium.", "This is the laboratory."),
  createCard("Pracuję w laboratorium.", "I work in the laboratory."),
  createCard("Wchodzę do laboratorium.", "I am entering the laboratory."),
  createCard("To jest mikroskop.", "This is a microscope."),
  createCard("Używam mikroskopu.", "I am using a microscope."),
  createCard("Mam wynik.", "I have a result."),
  createCard("Szukam wyniku.", "I am looking for the result."),
  createCard("Piszę raport.", "I am writing a report."),
  createCard("Analizuję raport.", "I am analyzing the report."),
  createCard("Wysyłam raport.", "I am sending the report."),


  createCard("To jest profesor.", "This is the professor."),
  createCard("Słucham profesora.", "I am listening to the professor."),
  createCard("Rozmawiam z profesorem.", "I am talking with the professor."),
  createCard("To jest koleżanka.", "This is a colleague/friend."),
  createCard("Lubię koleżankę.", "I like the colleague."),
  createCard("Idę z koleżanką.", "I am going with the colleague."),
  createCard("To jest student.", "This is a student."),
  createCard("Widzę studenta.", "I see the student."),
  createCard("To jest grupa.", "This is a group."),
  createCard("Pracuję z grupą.", "I work with the group."),
  createCard("To jest człowiek.", "This is a human/man."),
  createCard("Nie znam tego człowieka.", "I do not know that man."),
  createCard("Widzę ludzi.", "I see people."),
  createCard("Tam są ludzie.", "There are people there."),
  createCard("To jest kobieta.", "This is a woman."),
  createCard("To jest mężczyzna.", "This is a man."),
  createCard("On jest dobrym człowiekiem.", "He is a good human."),
  createCard("Wszyscy to wiedzą.", "Everyone knows that."),
  createCard("Nikt nie wie.", "Nobody knows."),
  createCard("Kto to jest?", "Who is that?"),


  createCard("Jestem tutaj.", "I am here."),
  createCard("Nie ma mnie tam.", "I am not there."),
  createCard("Jesteś gotowy?", "Are you ready?"),
  createCard("On jest w domu.", "He is at home."),
  createCard("To jest możliwe.", "This is possible."),
  createCard("To nie jest łatwe.", "This is not easy."),
  createCard("Wszystko jest w porządku.", "Everything is in order."),
  createCard("To jest duży problem.", "This is a big problem."),
  createCard("To jest moja sprawa.", "This is my business."),


  createCard("Mam czas.", "I have time."),
  createCard("Nie mam czasu.", "I do not have time."),
  createCard("Mam pytanie.", "I have a question."),
  createCard("Masz rację.", "You are right."),
  createCard("Co masz?", "What do you have?"),
  createCard("Chcę to zrobić.", "I want to do this."),
  createCard("Nie chcę tego robić.", "I do not want to do this."),
  createCard("Potrzebuję pomocy.", "I need help."),
  createCard("On ma samochód.", "He has a car."),
  createCard("Nie mamy pieniędzy.", "We do not have money."),
  createCard("Wiem to.", "I know this."),
  createCard("Nie wiem.", "I do not know."),
  createCard("Wiesz, o co chodzi?", "Do you know what it's about?"),
  createCard("Rozumiem.", "I understand."),
  createCard("Nie rozumiem słowa.", "I do not understand the word."),
  createCard("Mówię po polsku.", "I speak Polish."),
  createCard("Co mówisz?", "What are you saying?"),
  createCard("On nic nie mówi.", "He says nothing."),
  createCard("Myślę, że tak.", "I think so."),
  createCard("Pamiętam ten dzień.", "I remember that day."),


  createCard("Co robisz?", "What are you doing?"),
  createCard("Nic nie robię.", "I am doing nothing."),
  createCard("Idę do pracy.", "I am going to work."),
  createCard("Wracam z pracy.", "I am returning from work."),
  createCard("Praca jest ważna.", "Work is important."),
  createCard("Szukam pracy.", "I am looking for work."),
  createCard("Lubię moją pracę.", "I like my work."),
  createCard("To działa.", "It works."),
  createCard("Kupuję chleb.", "I am buying bread."),
  createCard("Jem śniadanie.", "I am eating breakfast."),


  createCard("Jest teraz.", "It is now."),
  createCard("Teraz idę.", "I am going now."),
  createCard("Masz chwilę?", "Do you have a moment?"),
  createCard("To jest koniec.", "This is the end."),
  createCard("Czekam na ciebie.", "I am waiting for you."),
  createCard("Jutro będę.", "I will be there tomorrow."),
  createCard("To było wczoraj.", "That was yesterday."),
  createCard("Czas to pieniądz.", "Time is money."),
  createCard("Zawsze tak jest.", "It is always like this."),
  createCard("Nigdy tego nie robię.", "I never do that."),


  createCard("Jadę do domu.", "I am driving home."),
  createCard("Gdzie jest samochód?", "Where is the car?"),
  createCard("Nie mam samochodu.", "I do not have a car."),
  createCard("Idę na nogach.", "I am going on foot."),
  createCard("To jest długa droga.", "This is a long way."),
  createCard("Jesteśmy na miejscu.", "We have arrived."),
  createCard("Czekam na autobus.", "I am waiting for the bus."),
  createCard("Autobus już jedzie.", "The bus is coming."),
  createCard("Gdzie idziesz?", "Where are you walking?"),
  createCard("Wracam zaraz.", "I am returning right away."),
  createCard("Idź prosto.", "Go straight."),
  createCard("Skręć w prawo.", "Turn right."),
  createCard("Skręć w lewo.", "Turn left."),
  createCard("To jest blisko.", "This is close."),
  createCard("To jest daleko.", "This is far."),
  createCard("Patrz w górę.", "Look up."),
  createCard("Patrz w dół.", "Look down."),
  createCard("Stoję obok ciebie.", "I am standing next to you."),
  createCard("Jestem w środku.", "I am inside."),
  createCard("Czekam na zewnątrz.", "I am waiting outside."),


  createCard("To jest dobry pomysł.", "This is a good idea."),
  createCard("To jest zły pomysł.", "This is a bad idea."),
  createCard("Mam nowy telefon.", "I have a new phone."),
  createCard("To jest stary dom.", "This is an old house."),
  createCard("Ona jest młoda.", "She is young."),
  createCard("Ten dzień jest długi.", "This day is long."),
  createCard("Język polski jest trudny.", "The Polish language is difficult."),
  createCard("To jest proste.", "This is simple."),
  createCard("Wszystko jest jasne.", "Everything is clear."),
  createCard("To jest ważne pytanie.", "This is an important question."),
  createCard("Widzę cię.", "I see you."),
  createCard("Nie widzę cię.", "I do not see you."),
  createCard("Słyszysz mnie?", "Do you hear me?"),
  createCard("Nic nie słyszę.", "I hear nothing."),
  createCard("Słucham muzyki.", "I am listening to music."),
  createCard("Patrzę na to.", "I am looking at this."),
  createCard("Wyglądasz dobrze.", "You look good."),
  createCard("Czuję to.", "I feel it."),
  createCard("To dobrze pachnie.", "It smells good."),
  createCard("Widzę światło.", "I see the light."),


  createCard("Daj mi to.", "Give me this."),
  createCard("Co mi dasz?", "What will you give me?"),
  createCard("Biorę to.", "I am taking this."),
  createCard("Zabieram to do domu.", "I am taking this home."),
  createCard("Daję ci słowo.", "I give you my word."),
  createCard("Proszę o pomoc.", "I am asking for help."),
  createCard("Dziękuję za wszystko.", "Thank you for everything."),
  createCard("To jest dla ciebie.", "This is for you."),
  createCard("Nie mam nic dla ciebie.", "I have nothing for you."),
  createCard("Weź to.", "Take this."),
  createCard("Idę do sklepu.", "I am going to the shop."),
  createCard("Jestem w sklepie.", "I am in the shop."),
  createCard("Ile to kosztuje?", "How much does this cost?"),
  createCard("To jest tanie.", "This is cheap."),
  createCard("To jest drogie.", "This is expensive."),
  createCard("Płacę kartą.", "I am paying by card."),
  createCard("Płacę gotówką.", "I am paying with cash."),
  createCard("Chcę to kupić.", "I want to buy this."),
  createCard("Nie mam pieniędzy.", "I do not have money."),
  createCard("Masz drobne?", "Do you have change?"),


  createCard("To jest życie.", "This is life."),
  createCard("Takie jest życie.", "Such is life."),
  createCard("Kocham życie.", "I love life."),
  createCard("Świat jest mały.", "The world is small."),
  createCard("Mieszkam na świecie.", "I live in the world."),
  createCard("To jest historia.", "This is history/story."),
  createCard("Opowiem ci historię.", "I will tell you a story."),
  createCard("Koniec świata.", "The end of the world."),
  createCard("Szukam miejsca.", "I am looking for a place."),
  createCard("To jest moje miejsce.", "This is my place."),
  createCard("To jest prawda.", "This is the truth."),
  createCard("Mówię prawdę.", "I speak the truth."),
  createCard("Mam nadzieję.", "I have hope."),
  createCard("Wierzę ci.", "I believe you."),
  createCard("Wierzysz w Boga?", "Do you believe in God?"),
  createCard("To jest ważne.", "This is important."),
  createCard("To nie ma znaczenia.", "It doesn't matter."),
  createCard("Szukam sensu.", "I am looking for meaning."),
  createCard("To jest błąd.", "This is a mistake."),
  createCard("Mam pewność.", "I am sure."),
  createCard("Robię to, bo chcę.", "I do it because I want to."),
  createCard("Jeśli możesz, zrób to.", "If you can, do it."),
  createCard("Ale to nie jest prawda.", "But that is not true."),
  createCard("Albo ja, albo ty.", "Either me or you."),
  createCard("Więc idziemy.", "So we are going."),
  createCard("Tylko ty wiesz.", "Only you know."),
  createCard("Może jutro.", "Maybe tomorrow."),
  createCard("Nawet on to wie.", "Even he knows that."),
  createCard("Właśnie to robię.", "I am doing exactly that."),
  createCard("Dlatego pytam.", "That is why I ask."),


  createCard("Dzień jest jasny.", "The day is bright."),
  createCard("To był dobry dzień.", "It was a good day."),
  createCard("Cały dzień pracuję.", "I work all day."),
  createCard("Już jest noc.", "It is already night."),
  createCard("W nocy śpię.", "At night I sleep."),
  createCard("Idę spać.", "I am going to sleep."),
  createCard("Rano piję kawę.", "In the morning I drink coffee."),
  createCard("Wieczorem jestem w domu.", "In the evening I am at home."),
  createCard("Spotkamy się wieczorem.", "We will meet in the evening."),
  createCard("Czekam do rana.", "I am waiting until morning."),
  createCard("Jest mi zimno.", "I am cold."),
  createCard("Jest mi ciepło.", "I am warm."),
  createCard("Jestem głodny.", "I am hungry - male."),
  createCard("Jestem głodna.", "I am hungry - female."),
  createCard("Chce mi się pić.", "I am thirsty."),
  createCard("Jestem zmęczony.", "I am tired."),
  createCard("Jestem szczęśliwy.", "I am happy."),
  createCard("On jest smutny.", "He is sad."),
  createCard("Boję się.", "I am afraid."),
  createCard("Martwię się o ciebie.", "I worry about you."),


  createCard("To jest moja rodzina.", "This is my family."),
  createCard("Mam dużą rodzinę.", "I have a big family."),
  createCard("To jest moja matka.", "This is my mother."),
  createCard("Kocham moją matkę.", "I love my mother."),
  createCard("To jest mój ojciec.", "This is my father."),
  createCard("Rozmawiam z ojcem.", "I am talking with father."),
  createCard("Mam brata.", "I have a brother."),
  createCard("Nie mam siostry.", "I do not have a sister."),
  createCard("To są moje dzieci.", "These are my children."),
  createCard("Bawię się z dziećmi.", "I am playing with the children."),
  createCard("To jest moja głowa.", "This is my head."),
  createCard("Boli mnie głowa.", "My head hurts."),
  createCard("Mam dwie ręce.", "I have two hands."),
  createCard("Trzymam to w ręce.", "I am holding this in my hand."),
  createCard("To jest twoje serce.", "This is your heart."),
  createCard("Masz dobre serce.", "You have a good heart."),
  createCard("Patrz pod nogi.", "Look under your feet."),
  createCard("Boli mnie noga.", "My leg hurts."),
  createCard("Otwórz oczy.", "Open your eyes."),
  createCard("Jestem zdrowy.", "I am healthy."),


  createCard("Co to jest?", "What is this?"),
  createCard("Gdzie jesteś?", "Where are you?"),
  createCard("Kiedy wrócisz?", "When will you return?"),
  createCard("Kiedy masz czas?", "When do you have time?"),
  createCard("Dlaczego pytasz?", "Why do you ask?"),
  createCard("Dlaczego nie?", "Why not?"),
  createCard("Jak się masz?", "How are you?"),
  createCard("Jak to zrobić?", "How to do this?"),
  createCard("Jeden raz.", "One time."),
  createCard("Dwa razy.", "Two times."),
  createCard("Mam dużo pracy.", "I have a lot of work."),
  createCard("Masz mało czasu.", "You have little time."),
  createCard("Daj mi trochę.", "Give me a little."),
  createCard("To kosztuje dużo.", "This costs a lot."),
  createCard("Kilka dni temu.", "A few days ago."),
  createCard("Wszystko albo nic.", "Everything or nothing."),
  createCard("Tylko jeden.", "Only one."),
  createCard("Pierwszy raz.", "The first time."),


  createCard("To jest mój dom.", "This is my home."),
  createCard("Idę do pokoju.", "I am going to the room."),
  createCard("Jestem w pokoju.", "I am in the room."),
  createCard("To jest stół.", "This is a table."),
  createCard("Połóż to na stole.", "Put this on the table."),
  createCard("Gdzie jest klucz?", "Where is the key?"),
  createCard("Nie mam klucza.", "I do not have the key."),
  createCard("Otwórz drzwi.", "Open the door."),
  createCard("Zamknij okno.", "Close the window."),
  createCard("Gdzie jest mój telefon?", "Where is my phone?"),
  createCard("Dzwonię do ciebie.", "I am calling you."),
  createCard("Nie mam internetu.", "I do not have internet."),
  createCard("Czytasz wiadomości?", "Are you reading the news/messages?"),
  createCard("Napisz do mnie.", "Write to me."),
  createCard("To jest zdjęcie.", "This is a photo."),
  createCard("Robię zdjęcie.", "I am taking a photo."),
  createCard("Oglądam film.", "I am watching a movie."),
  createCard("Słucham radia.", "I am listening to the radio."),
  createCard("Komputer nie działa.", "The computer is not working."),
  createCard("Muszę się ubrać.", "I must get dressed."),
  createCard("Masz ładne buty.", "You have nice shoes."),
  createCard("Zdejmij buty.", "Take off your shoes."),
  createCard("Gdzie jest moja kurtka?", "Where is my jacket?"),
  createCard("Włóż płaszcz.", "Put on the coat."),
  createCard("Lubię ten kolor.", "I like this color."),
  createCard("To mi pasuje.", "This fits me."),
  createCard("Kupuję nową koszulę.", "I am buying a new shirt."),
  createCard("Jesteś gotowa do wyjścia?", "Are you ready to go out?"),
  createCard("Wyglądasz pięknie.", "You look beautiful."),


  createCard("To jest smaczne.", "This is tasty."),
  createCard("To jest pyszne.", "This is delicious."),
  createCard("Smacznego!", "Bon appétit!"),
  createCard("Jem owoce.", "I am eating fruit."),
  createCard("Lubię warzywa.", "I like vegetables."),
  createCard("Kup chleb.", "Buy bread."),
  createCard("Nie jem mięsa.", "I do not eat meat."),
  createCard("Poproszę wodę.", "Please give me water."),
  createCard("Daj mi sól.", "Give me the salt."),
  createCard("Kolacja jest gotowa.", "Dinner is ready."),
  createCard("Mam bilet.", "I have a ticket."),
  createCard("Gdzie jest dworzec?", "Where is the station?"),
  createCard("Pociąg jedzie.", "The train is coming."),
  createCard("Wsiadam do pociągu.", "I am getting into the train."),
  createCard("Wysiadam tutaj.", "I am getting off here."),
  createCard("Spóźnię się.", "I will be late."),
  createCard("Droga jest wolna.", "The road is clear."),
  createCard("Jedziesz szybko.", "You are driving fast."),
  createCard("Jedź wolniej.", "Drive slower."),
  createCard("Szukam taksówki.", "I am looking for a taxi."),
  createCard("Dzień dobry.", "Good day."),
  createCard("Dobry wieczór.", "Good evening."),
  createCard("Do widzenia.", "Goodbye."),
  createCard("Miło mi.", "Nice to meet you."),
  createCard("Przepraszam.", "I apologize/Excuse me."),
  createCard("Bardzo dziękuję.", "Thank you very much."),
  createCard("Proszę bardzo.", "You are welcome."),
  createCard("Nie ma za co.", "You are welcome - informal."),
  createCard("Jak masz na imię?", "What is your name?"),
  createCard("Mam na imię...", "My name is...")
];

## src/features/deck/data/japaneseBeginnerDeck.ts
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

  createCard("おはようございます。", "Good morning.", undefined, "Formal greeting used in the morning.", "おはようございます。"),
  createCard("こんにちは。", "Hello / Good afternoon.", undefined, "Used during the day.", "こんにちは。"),
  createCard("こんばんは。", "Good evening.", undefined, "Used in the evening.", "こんばんは。"),
  createCard("おやすみなさい。", "Good night.", undefined, "Used before going to sleep.", "おやすみなさい。"),
  createCard("ありがとうございます。", "Thank you.", undefined, "Formal.", "ありがとうございます。"),
  createCard("すみません。", "Excuse me / I'm sorry.", undefined, "", "すみません。"),
  createCard("はい。", "Yes.", undefined, "", "はい。"),
  createCard("いいえ。", "No.", undefined, "", "いいえ。"),


  createCard("はじめまして。", "Nice to meet you.", undefined, "Used when meeting someone for the first time.", "はじめまして。"),
  createCard("私の名前は田中です。", "My name is Tanaka.", "名前", "", "私[わたし]の 名前[なまえ]は 田中[たなか]です。"),
  createCard("よろしくお願いします。", "Please treat me well / Nice to meet you.", undefined, "Standard phrase used at the end of an introduction.", "よろしくお 願[ねが]いします。"),
  createCard("お元気ですか？", "How are you?", "元気", "", "お 元気[げんき]ですか？"),
  createCard("元気です。", "I am fine.", "元気", "", "元気[げんき]です。"),


  createCard("私は学生です。", "I am a student.", "学生", "", "私[わたし]は 学生[がくせい]です。"),
  createCard("これはペンです。", "This is a pen.", "これ", "", "これはペンです。"),
  createCard("日本語を勉強しています。", "I am studying Japanese.", "勉強", "", "日本語[にほんご]を 勉強[べんきょう]しています。"),
  createCard("分かりません。", "I don't understand.", "分かりません", "", "分[わ]かりません。"),
  createCard("もう一度お願いします。", "Once more, please.", "一度", "", "もう 一度[いちど]お 願[ねが]いします。"),


  createCard("水をください。", "Water, please.", "水", "", "水[みず]をください。"),
  createCard("いただきます。", "Thank you for the meal (before eating).", undefined, "", "いただきます。"),
  createCard("ごちそうさまでした。", "Thank you for the meal (after eating).", undefined, "", "ごちそうさまでした。"),
  createCard("美味しいです。", "It is delicious.", "美味しい", "", "美味[おい]しいです。"),


  createCard("一、二、三。", "One, two, three.", undefined, "", "一[いち]、 二[に]、 三[さん]。"),
  createCard("いくらですか？", "How much is it?", "いくら", "", "いくらですか？"),


  createCard("トイレはどこですか？", "Where is the toilet?", "トイレ", "", "トイレはどこですか？"),
  createCard("駅はどこですか？", "Where is the station?", "駅", "", "駅[えき]はどこですか？"),
];

## src/features/deck/data/norwegianBeginnerDeck.ts
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

  createCard("God morgen.", "Good morning.", undefined, "Formal morning greeting."),
  createCard("God dag.", "Good day.", undefined, "Formal daytime greeting."),
  createCard("God kveld.", "Good evening.", undefined, "Formal evening greeting."),
  createCard("Hei.", "Hi.", undefined, "Informal greeting."),
  createCard("Ha det.", "Goodbye.", undefined, "Informal farewell."),
  createCard("God natt.", "Good night.", undefined, "Used before going to sleep."),
  createCard("Takk.", "Thank you.", undefined, ""),
  createCard("Vær så snill.", "Please.", undefined, "Literally 'be so kind'."),
  createCard("Unnskyld.", "Excuse me / I'm sorry.", undefined, ""),
  createCard("Ja.", "Yes.", undefined, ""),
  createCard("Nei.", "No.", undefined, ""),


  
];

## src/features/deck/hooks/useCardOperations.ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types';
import {
  deleteCard as deleteCardFromRepo,
  saveCard,
} from '@/services/db/repositories/cardRepository';
import { useDeck } from '@/contexts/DeckContext';

interface CardOperations {
  addCard: (card: Card) => Promise<void>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
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

  return { addCard, updateCard, deleteCard };
};

## src/features/deck/hooks/useCardsQuery.ts
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
        query = query.or(`target_sentence.ilike.%${searchTerm}%,native_translation.ilike.%${searchTerm}%`);
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

## src/features/deck/services/ai.ts
import { supabase } from '@/lib/supabase';

interface BatchGenerationOptions {
  difficulty: string;
  topic: string;
  count: number;
  language: 'polish' | 'norwegian' | 'japanese';
}

function extractJSON(text: string): string {
  // Remove Markdown code blocks if present
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(markdownRegex);
  if (match) {
    return match[1];
  }
  
  // Fallback: Try to find first { or [ and last } or ]
  const firstOpen = text.search(/[{[]/);
  const lastClose = text.search(/[}\]]$/); 
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
  }

  // Ideally, just return text and let JSON.parse throw, 
  // but clean up common markdown artifacts first.
  return text.replace(/```json/g, '').replace(/```/g, '');
}

async function callGemini(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-card', {
    body: { prompt }
  });

  if (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to fetch from Gemini API');
  }

  return data.text;
}

export const aiService = {
  async translateText(text: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<string> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    const prompt = `Translate the following ${langName} text to English. Provide only the translation, no explanations.\n\nText: "${text}"`;
    return await callGemini(prompt);
  },

  async analyzeWord(word: string, contextSentence: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<{
    definition: string;
    partOfSpeech: string;
    contextMeaning: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    const prompt = `
      Analyze the ${langName} word "${word}" in the context of the sentence: "${contextSentence}".
      Return a JSON object with the following fields:
      - definition: The general English definition of the word.
      - partOfSpeech: The part of speech (noun, verb, adjective, etc.) and grammatical case/form if applicable.
      - contextMeaning: The specific meaning of the word in this context.
      
      Return ONLY the JSON object, no markdown formatting.
    `;
    
    const result = await callGemini(prompt);
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

  async generateCardContent(sentence: string, language: 'polish' | 'norwegian' | 'japanese' = 'polish'): Promise<{
    translation: string;
    notes: string;
    furigana?: string;
  }> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    
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

    const result = await callGemini(prompt);
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

  async generateBatchCards({ difficulty, topic, count, language }: BatchGenerationOptions): Promise<any[]> {
    const langName = language === 'norwegian' ? 'Norwegian' : (language === 'japanese' ? 'Japanese' : 'Polish');
    
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

    const result = await callGemini(prompt);
    
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

## src/features/leaderboard/Leaderboard.tsx
import React, { useEffect, useState } from 'react';
import { Trophy, Medal, User as UserIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  username: string | null;
  xp: number;
  level: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, xp, level')
        .order('xp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to load leaderboard', error);
      }

      setProfiles(data || []);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Medal className="text-yellow-500" />;
    if (index === 1) return <Medal className="text-gray-400" />;
    if (index === 2) return <Medal className="text-amber-600" />;
    return <span className="font-mono font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 dark:bg-yellow-900/20">
          <Trophy size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-muted-foreground">Top language miners globally</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading ranks...</div>
        ) : (
          profiles.map((profile, index) => (
            <div
              key={profile.id}
              className={`flex items-center p-4 border-b border-border last:border-0 ${
                profile.id === user?.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="w-12 flex justify-center font-mono font-bold text-lg text-muted-foreground">
                {renderRankIcon(index)}
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <UserIcon size={16} className="opacity-50" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {profile.username || 'Anonymous Miner'}
                    {profile.id === user?.id && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {profile.level}</div>
                </div>
              </div>
              <div className="font-mono font-bold text-lg tracking-tight">
                {profile.xp.toLocaleString()} {' '}
                <span className="text-xs font-sans font-normal text-muted-foreground">XP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

## src/features/sabotage/SabotageStore.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skull, Type, EyeOff, RefreshCcw, Zap } from 'lucide-react';

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

        <div className="mb-4 p-2 bg-destructive/10 rounded border border-destructive/20 text-center">
          Your Balance: <span className="font-mono font-bold text-xl">{profile?.xp ?? 0} XP</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Select Victim</label>
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {victims.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVictim(v.id)}
                  className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-all ${
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
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all disabled:opacity-50 text-left group"
              >
                <div className="p-2 bg-secondary rounded group-hover:bg-destructive/20 transition-colors">
                  <curse.icon size={20} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{curse.name}</div>
                  <div className="text-xs text-muted-foreground">{curse.desc}</div>
                </div>
                <div className="font-mono text-destructive text-sm whitespace-nowrap">-{curse.cost} XP</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

## src/features/settings/components/AlgorithmSettings.tsx
import React from 'react';
import { UserSettings } from '@/types';
import { Slider } from '@/components/ui/slider';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({ localSettings, setLocalSettings }) => (
  <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="bg-secondary/20 p-4 rounded text-xs text-muted-foreground leading-relaxed">
      This app uses the FSRS v5 algorithm. Tweaking these values will affect how future intervals are calculated.
    </div>

    <section>
      <div className="flex justify-between items-baseline mb-4">
        <MetaLabel className="mb-0">Target Retention</MetaLabel>
        <span className="font-mono text-sm font-bold">{Math.round(localSettings.fsrs.request_retention * 100)}%</span>
      </div>
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
      />
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
        <span>Fewer Reviews</span>
        <span>Higher Recall</span>
      </div>
    </section>

    <section className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Interval Fuzzing</div>
          <div className="text-xs text-muted-foreground">Slightly randomize due dates to prevent grouping.</div>
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
      </div>
    </section>
  </div>
);

## src/features/settings/components/AudioSettings.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';

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
  const provider = localSettings.tts.provider;
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({
      ...prev,
      tts: { ...prev.tts, ...partial },
    }));

  return (
    <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section>
        <MetaLabel>TTS Provider</MetaLabel>
        <EditorialSelect
          value={provider}
          onChange={(event) =>
            updateTts({ provider: event.target.value as UserSettings['tts']['provider'], voiceURI: null })
          }
          options={[
            { value: 'browser', label: 'Browser (Default)' },
            { value: 'google', label: 'Google Cloud' },
            { value: 'azure', label: 'Microsoft Azure' },
          ]}
        />
      </section>

      {provider !== 'browser' && (
        <section className="space-y-6 p-6 bg-secondary/20 rounded-lg border border-border/50">
          {provider === 'google' && (
            <div>
              <MetaLabel>API Key</MetaLabel>
              <EditorialInput
                type="password"
                placeholder="Google Cloud API Key"
                value={localSettings.tts.googleApiKey || ''}
                onChange={(event) => updateTts({ googleApiKey: event.target.value })}
              />
            </div>
          )}
          {provider === 'azure' && (
            <div className="space-y-6">
              <div>
                <MetaLabel>Subscription Key</MetaLabel>
                <EditorialInput
                  type="password"
                  placeholder="Azure Key"
                  value={localSettings.tts.azureApiKey || ''}
                  onChange={(event) => updateTts({ azureApiKey: event.target.value })}
                />
              </div>
              <div>
                <MetaLabel>Region</MetaLabel>
                <EditorialInput
                  placeholder="e.g. eastus"
                  value={localSettings.tts.azureRegion || ''}
                  onChange={(event) => updateTts({ azureRegion: event.target.value })}
                />
              </div>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <MetaLabel>Voice Model</MetaLabel>
          <button onClick={onTestAudio} className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
            <Volume2 size={10} /> Test
          </button>
        </div>
        <EditorialSelect
          value={localSettings.tts.voiceURI || 'default'}
          onChange={(event) =>
            updateTts({ voiceURI: event.target.value === 'default' ? null : event.target.value })
          }
          options={[
            { value: 'default', label: 'System Default' },
            ...availableVoices.map((voice) => ({ value: voice.id, label: voice.name })),
          ]}
        />
      </section>

      <section className="space-y-8 pt-4">
        <div>
          <div className="flex justify-between mb-4">
            <MetaLabel className="mb-0">Rate</MetaLabel>
            <span className="text-xs font-mono text-muted-foreground">{localSettings.tts.rate.toFixed(1)}x</span>
          </div>
          <Slider
            min={0.5}
            max={1.5}
            step={0.1}
            value={[localSettings.tts.rate]}
            onValueChange={([value]) => updateTts({ rate: value })}
          />
        </div>
        <div>
          <div className="flex justify-between mb-4">
            <MetaLabel className="mb-0">Volume</MetaLabel>
            <span className="text-xs font-mono text-muted-foreground">{Math.round(localSettings.tts.volume * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[localSettings.tts.volume]}
            onValueChange={([value]) => updateTts({ volume: value })}
          />
        </div>
      </section>
    </div>
  );
};

## src/features/settings/components/DataSettings.tsx
import React, { RefObject } from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
}) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onExport}
        className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group"
      >
        <Download className="text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-sm font-medium">Export JSON</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Full Backup</div>
        </div>
      </button>
      <button
        onClick={() => csvInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group"
      >
        <Upload className="text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-sm font-medium">Import CSV</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Bulk Add</div>
        </div>
      </button>
    </div>
    <div className="grid grid-cols-1">
      <button
        onClick={onSyncToCloud}
        disabled={isSyncingToCloud || syncComplete}
        className="flex flex-col items-center justify-center gap-3 p-6 border border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group disabled:opacity-60"
      >
        <RefreshCw
          className="text-muted-foreground group-hover:text-foreground transition-colors"
          strokeWidth={1.5}
        />
        <div className="text-center">
          <div className="text-sm font-medium">
            {syncComplete ? 'Cloud Sync Completed' : 'Sync Local Deck to Cloud'}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            {syncComplete
              ? 'All cards live in Supabase'
              : isSyncingToCloud
              ? 'Migrating...'
              : 'One-time IndexedDB migration'}
          </div>
        </div>
      </button>
    </div>
    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    <p className="text-xs text-muted-foreground">
      CSV headers supported: sentence, translation, targetWord, notes, tags. Separate multiple tags with |, ;, or commas.
    </p>
  </div>
);

## src/features/settings/components/GeneralSettings.tsx
import React from 'react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ localSettings, setLocalSettings }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section>
        <MetaLabel>Target Language</MetaLabel>
        <EditorialSelect
          value={localSettings.language}
          onChange={(event) =>
            setLocalSettings((prev) => ({
              ...prev,
              language: event.target.value as UserSettings['language'],
            }))
          }
          options={['polish', 'norwegian', 'japanese'].map((language) => ({
            value: language,
            label: LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES],
          }))}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Switching languages will filter your card view. It does not delete data.
        </p>
      </section>

      <section>
        <MetaLabel>Theme</MetaLabel>
        <EditorialSelect
          value={theme}
          onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Choose your preferred appearance.
        </p>
      </section>

      <section>
        <div className="space-y-4">
          <ColorPicker
            label="Accent Color"
            value={localSettings.languageColors?.[localSettings.language] || '0 0% 0%'}
            onChange={(newColor) =>
              setLocalSettings((prev) => ({
                ...prev,
                languageColors: {
                  ...(prev.languageColors || {}),
                  [prev.language]: newColor,
                } as any, // Cast to any to avoid strict typing issues with partial updates
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Customize the primary color for {LANGUAGE_NAMES[localSettings.language as keyof typeof LANGUAGE_NAMES]}.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Auto-play Audio</div>
            <div className="text-xs text-muted-foreground">Play TTS immediately upon revealing card.</div>
          </div>
          <Switch
            checked={localSettings.autoPlayAudio}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                autoPlayAudio: checked,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Blind Mode</div>
            <div className="text-xs text-muted-foreground">Play audio first, hide text until revealed.</div>
          </div>
          <Switch
            checked={localSettings.blindMode}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                blindMode: checked,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Show Translation</div>
            <div className="text-xs text-muted-foreground">Reveal native translation on back of card.</div>
          </div>
          <Switch
            checked={localSettings.showTranslationAfterFlip}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                showTranslationAfterFlip: checked,
              }))
            }
          />
        </div>
      </section>
    </div>
  );
};

## src/features/settings/components/SettingsModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
    getCards,
} from '@/services/db/repositories/cardRepository';
import { getDB } from '@/services/db/client';
import { getHistory } from '@/services/db/repositories/historyRepository';
import { BEGINNER_DECK } from '@/features/deck/data/beginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
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

const CLOUD_SYNC_FLAG = 'polskimine_cloud_sync_complete';
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
            if (inQuotes && line[i + 1] === '"') {
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
    value === 'polish' || value === 'norwegian' || value === 'japanese';

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

    const lines = sanitized
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

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

// --- Main Component ---

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
    const { refreshDeckData } = useDeck();
    const { signOut } = useAuth();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
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
        setConfirmResetDeck(false);
        setActiveTab('general');
        loadVoices();
        setHasSyncedToCloud(readCloudSyncFlag());
    }
  }, [isOpen, settings]);

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

  const handleSave = () => {
    const languageChanged = localSettings.language !== settings.language;
    updateSettings(localSettings);
    toast.success(languageChanged ? "Language switched." : "Preferences saved.");
    onClose();
  };

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
        setConfirmResetDeck(true);
        return;
    }
    try {
        await deleteCardsByLanguage(localSettings.language);
        const rawDeck = localSettings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK : (localSettings.language === 'japanese' ? JAPANESE_BEGINNER_DECK : BEGINNER_DECK);
        const deck = rawDeck.map(c => ({ ...c, id: uuidv4(), dueDate: new Date().toISOString() }));
        await saveAllCards(deck);
        window.location.reload();
    } catch (e) {
        toast.error("Failed to reset deck");
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

            // Sync Cards
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

            // Sync History
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
            
            // Create a safe copy of settings excluding secrets
            const safeSettings = {
                ...localSettings,
                tts: {
                    ...localSettings.tts,
                    googleApiKey: '', // Strip sensitive data
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

            const existingCards = await getCards();
            const seen = new Set(
                existingCards.map((card) =>
                    signatureForCard(card.targetSentence, (card.language || 'polish') as Language)
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
    { id: 'audio', label: 'Audio & TTS' },
    { id: 'study', label: 'Limits' },
    { id: 'algorithm', label: 'FSRS v5' },
    { id: 'data', label: 'Data Management' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] md:h-[600px] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-background border border-border shadow-2xl sm:rounded-xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-secondary/30 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col justify-between shrink-0">
            <div>
                <DialogTitle className="font-bold tracking-tight text-lg mb-8 flex items-center gap-2">
                    Settings
                </DialogTitle>
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-md text-sm transition-all whitespace-nowrap",
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
            
            {/* Mobile Hide / Desktop Show Footer */}
            <div className="hidden md:block text-[10px] font-mono text-muted-foreground/60">
                ID: {settings.language.toUpperCase()}_V1
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-8 md:p-10 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <GeneralSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-destructive shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-destructive uppercase tracking-wide">Reset Deck</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        This will permanently delete all cards for <strong>{localSettings.language}</strong> and reload the beginner course. Review history will be preserved where possible, but card-specific metrics will be lost.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetDeck}
                                className={clsx(
                                    "w-full py-3 text-xs font-mono uppercase tracking-widest transition-all rounded",
                                    confirmResetDeck 
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                                        : "bg-background border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                )}
                            >
                                {confirmResetDeck ? "Are you sure? Click to confirm." : "Reset Deck Data"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-background flex justify-between items-center gap-4 shrink-0 flex-wrap">
                <button 
                    onClick={() => {
                        onClose();
                        signOut();
                    }}
                    className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-md transition-colors flex items-center gap-2"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                </button>
                <div className="flex gap-4 ml-auto">
                    <button 
                        onClick={onClose} 
                        className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-primary text-primary-foreground px-8 py-2 text-sm font-medium rounded-full hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <Check size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

## src/features/settings/components/StudySettings.tsx
import React from 'react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { MetaLabel } from '@/components/form/MetaLabel';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => (
  <div className="space-y-10 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
    <section>
      <MetaLabel>New Cards / Day</MetaLabel>
      <EditorialInput
        type="number"
        value={localSettings.dailyNewLimit}
        onChange={(event) =>
          setLocalSettings((prev) => ({
            ...prev,
            dailyNewLimit: parseInt(event.target.value, 10) || 0,
          }))
        }
      />
    </section>
    <section>
      <MetaLabel>Reviews / Day</MetaLabel>
      <EditorialInput
        type="number"
        value={localSettings.dailyReviewLimit}
        onChange={(event) =>
          setLocalSettings((prev) => ({
            ...prev,
            dailyReviewLimit: parseInt(event.target.value, 10) || 0,
          }))
        }
      />
    </section>
  </div>
);

## src/features/study/components/CramModal.tsx
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
            <DialogContent className="sm:max-w-md p-8 bg-background border border-border">
                <div className="space-y-8">
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Cram Session</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">Practice without affecting SRS stats.</DialogDescription>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Filter Tag</label>
                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                                <SelectTrigger className="w-full border-b border-border rounded-none px-0 py-2 h-auto focus:ring-0 text-sm">
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
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Card Limit</label>
                                <span className="font-mono text-sm text-muted-foreground">{limit[0]}</span>
                            </div>
                            <Slider 
                                min={10} max={200} step={10} 
                                value={limit}
                                onValueChange={setLimit}
                                className="py-2"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={handleStart}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity rounded-md"
                        >
                            Start Cramming <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

## src/features/study/components/Flashcard.tsx
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Card, Language } from '@/types';
import { escapeRegExp, parseFurigana } from '@/lib/utils';
import { ttsService } from '@/services/tts';
import { useSettings } from '@/contexts/SettingsContext';
import { PlayCircle, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  autoPlayAudio?: boolean;
  blindMode?: boolean;
  showTranslation?: boolean;
  language?: Language;
}

export const Flashcard: React.FC<FlashcardProps> = ({ 
  card, 
  isFlipped, 
  autoPlayAudio = false, 
  blindMode = false,
  showTranslation = true, 
  language = 'polish' 
}) => {
  const { settings } = useSettings(); 
  const { user } = useAuth();
  const [isRevealed, setIsRevealed] = useState(!blindMode);
  const [activeCurse, setActiveCurse] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState({
    sentence: card.targetSentence,
    translation: card.nativeTranslation,
  });
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    setIsRevealed(!blindMode);
  }, [card.id, blindMode]);

  useEffect(() => {
    if (isFlipped) setIsRevealed(true);
  }, [isFlipped]);
  
  const speak = useCallback(() => {
    ttsService.speak(card.targetSentence, language, settings.tts);
  }, [card.targetSentence, language, settings.tts]);

  useEffect(() => {
    if (autoPlayAudio) speak();
    // Only run when the card ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    return () => ttsService.stop();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const checkCurses = async () => {
      const { data, error } = await supabase
        .from('active_curses')
        .select('curse_type, expires_at')
        .eq('victim_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch curses', error);
        return;
      }

      setActiveCurse(data?.curse_type ?? null);
    };

    checkCurses();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let sentence = card.targetSentence;
    let translation = card.nativeTranslation;

    if (activeCurse === 'uwu') {
      sentence = uwuify(sentence);
      translation = uwuify(translation);
    }

    setDisplayData({ sentence, translation });
  }, [activeCurse, card.targetSentence, card.nativeTranslation]);

  useEffect(() => {
    if (!isFlipped || activeCurse !== 'gaslight') return;

    if (Math.random() >= 0.3) return;

    const fakeAnswer = FAKE_ANSWERS[Math.floor(Math.random() * FAKE_ANSWERS.length)];
    setDisplayData(prev => ({ ...prev, translation: fakeAnswer }));

    let glitchTimeout: ReturnType<typeof setTimeout> | null = null;
    const revealTimeout = setTimeout(() => {
      setIsGlitching(true);
      glitchTimeout = setTimeout(() => {
        setDisplayData(prev => ({ ...prev, translation: card.nativeTranslation }));
        setIsGlitching(false);
      }, 300);
    }, 1500);

    return () => {
      clearTimeout(revealTimeout);
      if (glitchTimeout) clearTimeout(glitchTimeout);
      setIsGlitching(false);
      setDisplayData(prev => ({ ...prev, translation: card.nativeTranslation }));
    };
  }, [isFlipped, activeCurse, card.nativeTranslation]);

  const getContainerStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (activeCurse === 'comic_sans') {
      style.fontFamily = '"Comic Sans MS", "Chalkboard SE", sans-serif';
    }

    if (activeCurse === 'blur') {
      style.animation = 'drunkenBlur 3s infinite ease-in-out';
    }

    if (activeCurse === 'rotate') {
      style.transform = 'rotate(180deg)';
    }

    return style;
  };

  const displayedSentence = displayData.sentence;
  const displayedTranslation = displayData.translation;

  // High-impact typography for the sentence
  const HighlightedSentence = useMemo(() => {
    // Base font classes: smaller on mobile (3xl), larger on desktop (6xl)
    const fontClasses = "text-3xl md:text-6xl font-medium tracking-tight text-center leading-snug";

    if (!isRevealed) {
      return (
        <button 
          onClick={() => setIsRevealed(true)}
          className="group relative cursor-pointer appearance-none bg-transparent border-none w-full text-center"
          type="button"
          aria-label="Reveal sentence"
        >
          <p className={`${fontClasses} blur-lg select-none opacity-50 transition-all duration-300 group-hover:opacity-70 group-hover:blur-md`}>
            {displayedSentence}
          </p>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Eye className="w-8 h-8 text-foreground/50" />
          </div>
        </button>
      );
    }

    // Japanese Mode with Furigana
    if (language === 'japanese' && card.furigana) {
      const segments = parseFurigana(card.furigana);
      
      return (
        // Changed: Added 'items-end' to align Kanji base with Kana baseline
        <p className={`${fontClasses} flex flex-wrap justify-center items-end gap-1`}>
          {segments.map((segment, i) => {
            const text = segment.text.replace(/\s/g, '');
            if (!text && !segment.furigana) return null;

            const isTarget = card.targetWord && text === card.targetWord;
            
            if (segment.furigana) {
              return (
                <ruby key={i} className="group">
                  <span className={isTarget ? "border-b-2 border-foreground pb-1" : ""}>{text}</span>
                  <rt className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm md:text-xl text-muted-foreground font-normal select-none">{segment.furigana}</rt>
                </ruby>
              );
            } else {
               if (!card.targetWord) return <span key={i} className="opacity-80">{text}</span>;

               const parts = text.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
               return (
                 <span key={i} className="opacity-80">
                   {parts.map((part, j) => (
                     part.toLowerCase() === card.targetWord!.toLowerCase() ? (
                       <span key={j} className="border-b-2 border-foreground pb-1 inline-block text-foreground opacity-100">{part}</span>
                     ) : part
                   ))}
                 </span>
               );
            }
          })}
        </p>
      );
    }

    if (!card.targetWord) return <p className={fontClasses}>{displayedSentence}</p>;
    
    const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(card.targetWord)})`, 'gi'));
    return (
      <p className={fontClasses}>
        {parts.map((part, i) => (
          part.toLowerCase() === card.targetWord!.toLowerCase() ? (
            <span key={i} className="border-b-2 border-foreground pb-1 inline-block">{part}</span>
          ) : <span key={i} className="opacity-80">{part}</span>
        ))}
      </p>
    );
  }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language]);

  return (
    <div
      className={`w-full max-w-3xl flex flex-col items-center justify-center gap-8 md:gap-16 min-h-[40vh] ${isGlitching ? 'glitch-effect' : ''}`}
      style={getContainerStyle()}
    >
      
      {card.isLeech && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} />
                <span>Leech</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>You've struggled with this card many times.</p>
              <p>Consider rewriting or deleting it to avoid frustration.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Front Side */}
      <div className="flex flex-col items-center gap-6 md:gap-8 animate-in fade-in zoom-in-95 duration-500 px-4">
        {HighlightedSentence}
        
        <button 
          onClick={speak}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 opacity-50 hover:opacity-100"
        >
            <PlayCircle size={24} strokeWidth={1} />
        </button>
      </div>

      {/* Back Side (Answer) */}
      {isFlipped && (
        <div className="flex flex-col items-center gap-4 text-center animate-in slide-in-from-bottom-4 fade-in duration-500 border-t border-border/50 pt-8 md:pt-12 w-full md:w-3/4 px-4">
            <div className="font-serif text-xl md:text-3xl italic text-muted-foreground">
              {showTranslation ? displayedTranslation : <span className="blur-md">Hidden</span>}
            </div>
            
            {(card.notes || card.furigana) && (
                <div className="pt-4 flex flex-col gap-2 text-xs md:text-sm font-mono text-muted-foreground/70">
                    {card.furigana && <span>{card.furigana}</span>}
                    {card.notes && <span>{card.notes}</span>}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

## src/features/study/components/StudySession.tsx
import React, { useEffect, useRef } from 'react';
import { X, Undo2 } from 'lucide-react';
import { Card, Grade } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Flashcard } from './Flashcard';
import { useStudySession } from '../hooks/useStudySession';

interface StudySessionProps {
  dueCards: Card[];
  onUpdateCard: (card: Card) => void;
  onRecordReview: (oldCard: Card, grade: Grade) => void;
  onExit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const StudySession: React.FC<StudySessionProps> = ({
  dueCards,
  onUpdateCard,
  onRecordReview,
  onExit,
  onUndo,
  canUndo,
}) => {
  const { settings } = useSettings();
  const {
    sessionCards,
    currentCard,
    currentIndex,
    isFlipped,
    setIsFlipped,
    sessionComplete,
    isCurrentCardDue,
    handleGrade,
    handleUndo,
    progress,
  } = useStudySession({
    dueCards,
    settings,
    onUpdateCard,
    onRecordReview,
    canUndo,
    onUndo,
  });

  const stateRef = useRef({
    sessionComplete,
    currentCard,
    isFlipped,
    canUndo,
    handleGrade,
    handleUndo,
    setIsFlipped
  });

  useEffect(() => {
    stateRef.current = {
      sessionComplete,
      currentCard,
      isFlipped,
      canUndo,
      handleGrade,
      handleUndo,
      setIsFlipped
    };
  }, [sessionComplete, currentCard, isFlipped, canUndo, handleGrade, handleUndo, setIsFlipped]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        sessionComplete,
        currentCard,
        isFlipped,
        canUndo,
        handleGrade,
        handleUndo,
        setIsFlipped
      } = stateRef.current;

      if (sessionComplete && e.key !== 'z') return; 
      if (!currentCard && !sessionComplete) return;

      if (!isFlipped && !sessionComplete) {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else if (!sessionComplete) {
        if (e.code === 'Space' || e.key === '2') {
          e.preventDefault();
          handleGrade('Good');
        } else if (e.key === '1') {
          e.preventDefault();
          handleGrade('Again');
        }
      }

      if (e.key === 'z' && canUndo) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  if (sessionComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Session Complete</h2>
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!currentCard) return null;
  if (!isCurrentCardDue)
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center text-muted-foreground animate-pulse">
        Waiting for review step...
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="w-full h-16 flex justify-between items-center px-8">
        <button onClick={onExit} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground tracking-widest">
                {currentIndex + 1} / {sessionCards.length}
            </span>
            {canUndo && (
                <button onClick={handleUndo} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Undo2 size={16} />
                </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
         <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
            blindMode={settings.blindMode}
            showTranslation={settings.showTranslationAfterFlip}
            language={settings.language}
          />
      </div>

      {/* Bottom Controls (Large touch targets, minimal visuals) */}
      <div className="h-24 w-full max-w-2xl mx-auto mb-8 px-6">
        {!isFlipped ? (
             <button 
                onClick={() => setIsFlipped(true)}
                className="w-full h-full flex items-center justify-center border border-border rounded-xl text-sm font-mono uppercase tracking-widest text-muted-foreground hover:bg-secondary/50 transition-colors"
             >
                Reveal
             </button>
        ) : (
            <div className="grid grid-cols-2 gap-4 h-full animate-in slide-in-from-bottom-2 fade-in duration-300">
                <button 
                    onClick={() => handleGrade('Again')}
                    className="flex flex-col items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors gap-1"
                >
                    <span className="font-semibold text-lg">Again</span>
                    <span className="text-[10px] font-mono opacity-70">1</span>
                </button>

                <button 
                    onClick={() => handleGrade('Good')}
                    className="flex flex-col items-center justify-center bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-opacity gap-1"
                >
                    <span className="font-semibold text-lg">Good</span>
                    <span className="text-[10px] font-mono opacity-70">Space</span>
                </button>
            </div>
        )}
      </div>
      
      {/* Progress Line at absolute bottom */}
      <div className="h-1 w-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

## src/features/study/hooks/useStudySession.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Grade, UserSettings } from '@/types';
import { calculateNextReview, isCardDue } from '@/features/study/logic/srs';

interface UseStudySessionParams {
  dueCards: Card[];
  settings: UserSettings;
  onUpdateCard: (card: Card) => void;
  onRecordReview: (card: Card, grade: Grade) => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const useStudySession = ({
  dueCards,
  settings,
  onUpdateCard,
  onRecordReview,
  canUndo,
  onUndo,
}: UseStudySessionParams) => {
  const [sessionCards, setSessionCards] = useState<Card[]>(dueCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(dueCards.length === 0);
  const [now] = useState(() => new Date());
  const [actionHistory, setActionHistory] = useState<{ addedCard: boolean }[]>([]);

  useEffect(() => {
    setSessionCards(dueCards);
    setCurrentIndex(0);
    setSessionComplete(dueCards.length === 0);
    setActionHistory([]);
  }, [dueCards]);

  const currentCard = sessionCards[currentIndex];

  const isCurrentCardDue = useMemo(() => {
    if (!currentCard) return false;
    let due = isCardDue(currentCard, now);
    if (
      currentCard &&
      !due &&
      settings.ignoreLearningStepsWhenNoCards
    ) {
      const remainingCards = sessionCards.slice(currentIndex);
      if (!remainingCards.some((card) => isCardDue(card, now))) {
        due = true;
      }
    }
    return due;
  }, [currentCard, currentIndex, now, sessionCards, settings.ignoreLearningStepsWhenNoCards]);

  const handleGrade = useCallback(
    (grade: Grade) => {
      if (!currentCard) return;
      const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
      onUpdateCard(updatedCard);
      onRecordReview(currentCard, grade);

      let appended = false;
      if (updatedCard.status === 'learning') {
        setSessionCards((prev) => [...prev, updatedCard]);
        appended = true;
      }
      setActionHistory((prev) => [...prev, { addedCard: appended }]);

      if (currentIndex < sessionCards.length - 1 || appended) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    },
    [currentCard, currentIndex, onRecordReview, onUpdateCard, sessionCards.length, settings.fsrs]
  );

  const handleUndo = useCallback(() => {
    if (!canUndo || !onUndo) return;
    onUndo();
    if (currentIndex > 0 || sessionComplete) {
      const lastAction = actionHistory[actionHistory.length - 1];
      if (lastAction?.addedCard) {
        setSessionCards((prev) => prev.slice(0, -1));
      }
      setActionHistory((prev) => prev.slice(0, -1));
      setSessionComplete(false);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setIsFlipped(true);
    }
  }, [actionHistory, canUndo, currentIndex, onUndo, sessionComplete]);

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
    handleUndo,
    progress,
  };
};

## src/features/study/logic/srs.ts
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
  
  // Ensure we map the status back to a State if state is missing (e.g. imported cards)
  let currentState = card.state;
  if (currentState === undefined) {
      if (card.status === 'new') currentState = State.New;
      else if (card.status === 'learning') currentState = State.Learning;
      else currentState = State.Review;
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
    last_review: card.last_review ? new Date(card.last_review) : undefined
  } as FSRSCard;

  const rating = mapGradeToRating(grade);
  
  // FIX: Rely purely on FSRS for calculations to ensure S/D (Stability/Difficulty) are updated correctly.
  const schedulingCards = f.repeat(fsrsCard, now);
  const log = schedulingCards[rating].card;
  
  const isNew = currentState === State.New || (card.reps || 0) === 0;
  const tentativeStatus = mapStateToStatus(log.state);
  
  // Optional: If you want to force a custom learning step for "Again" on Graduated cards
  // (Relearning), FSRS handles this via State.Relearning.
  
  // Sanity check to prevent graduating "Learning" cards immediately if FSRS settings are aggressive,
  // though standard FSRS v5 is usually correct.
  const status = card.status === 'graduated' && tentativeStatus === 'learning' && grade !== 'Again'
    ? 'graduated'
    : tentativeStatus;

  // Leech Logic
  const currentLeechCount = card.leechCount || 0;
  let newLeechCount = 0;
  let isLeech = card.isLeech || false;

  if (grade === 'Again') {
    newLeechCount = currentLeechCount + 1;
    if (newLeechCount > 5) {
      isLeech = true;
    }
  } else {
    newLeechCount = 0;
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
    leechCount: newLeechCount,
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
  // Standard review cards are due if their date is before or equal to "Today" (4AM cutoff)
  // OR if the specific time has passed (fallback for weird timezones/migrations)
  return isBefore(due, srsToday) || due <= now;
};

## src/hooks/useChartColors.ts
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

## src/lib/memeUtils.ts
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

## src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

## src/lib/utils.ts
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
    // Text before the match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    // The match itself
    segments.push({ text: match[1], furigana: match[2] });

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

export function hexToHSL(hex: string): string {
  let r = 0, g = 0, b = 0;
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

  return `${h} ${s}% ${l}%`;
}

export function hslToHex(hslString: string): string {
  const [hStr, sStr, lStr] = hslString.split(' ');
  const h = parseFloat(hStr);
  const s = parseFloat(sStr.replace('%', ''));
  const l = parseFloat(lStr.replace('%', ''));

  const lVal = l / 100;
  const a = s * Math.min(lVal, 1 - lVal) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lVal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

## src/main.tsx
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
## src/router.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardRoute } from '@/routes/DashboardRoute';
import { StudyRoute } from '@/routes/StudyRoute';
import { CardsRoute } from '@/routes/CardsRoute';
import { Leaderboard } from '@/features/leaderboard/Leaderboard';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<DashboardRoute />} />
    <Route path="/study" element={<StudyRoute />} />
    <Route path="/cards" element={<CardsRoute />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
  </Routes>
);

## src/routes/CardsRoute.tsx
import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { AddCardModal } from '@/features/deck/components/AddCardModal';
import { GenerateCardsModal } from '@/features/deck/components/GenerateCardsModal';
import { CardList } from '@/features/deck/components/CardList';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { useCardsQuery } from '@/features/deck/hooks/useCardsQuery';

export const CardsRoute: React.FC = () => {
  const { settings } = useSettings();
  const { addCard, deleteCard } = useCardOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  const { data, isLoading, isPlaceholderData } = useCardsQuery(page, pageSize, debouncedSearch);
  const cards = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsAddModalOpen(true);
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
  };

  const handleAddCard = (card: Card) => {
    addCard(card);
  };

  const handleBatchAddCards = async (newCards: Card[]) => {
    for (const card of newCards) {
        await addCard(card);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Index</h2>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setIsGenerateModalOpen(true)} 
                className="flex items-center gap-2 text-xs md:text-sm font-medium text-primary hover:opacity-80 transition-opacity px-3 py-1.5 rounded-full bg-primary/10"
            >
                <Sparkles size={14} /> 
                <span>AI Generator</span>
            </button>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
            type="text"
            placeholder="Filter entries..."
            className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 pl-6 text-sm outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <CardList
            cards={cards}
            searchTerm="" // Search is handled by query now
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
          />
          
          <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              Showing {cards.length > 0 ? page * pageSize + 1 : 0} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                    setPage(p => p + 1);
                  }
                }}
                disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      <AddCardModal 
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingCard(undefined); }}
        onAdd={handleAddCard}
        initialCard={editingCard}
      />

      <GenerateCardsModal 
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onAddCards={handleBatchAddCards}
      />
    </div>
  );
};

## src/routes/DashboardRoute.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getDashboardStats } from '@/services/db/repositories/statsRepository';

export const DashboardRoute: React.FC = () => {
  const { history, stats } = useDeck();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboardStats', settings.language],
    queryFn: () => getDashboardStats(settings.language),
  });

  if (isLoading || !dashboardStats) {
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
      stats={stats}
      history={history}
      onStartSession={() => navigate('/study')}
    />
  );
};

## src/routes/StudyRoute.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Grade } from '@/types';
import { StudySession } from '@/features/study/components/StudySession';
import { useDeck } from '@/contexts/DeckContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { applyStudyLimits } from '@/services/studyLimits';
import {
  getCramCards,
  getDueCards,
} from '@/services/db/repositories/cardRepository';
import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';

export const StudyRoute: React.FC = () => {
  const { recordReview, undoReview, canUndo } = useDeck();
  const { updateCard } = useCardOperations();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
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
        } else {
          const due = await getDueCards(new Date(), settings.language);
          const reviewsToday = await getTodayReviewStats(settings.language);
          const limited = applyStudyLimits(due, {
            dailyNewLimit: settings.dailyNewLimit,
            dailyReviewLimit: settings.dailyReviewLimit,
            reviewsToday
          });
          setSessionCards(limited);
        }
      } catch (error) {
        console.error("Failed to load cards", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [settings.dailyNewLimit, settings.dailyReviewLimit, settings.language, isCramMode, searchParams]);

  const handleUpdateCard = (card: Card) => {
    if (!isCramMode) {
      updateCard(card);
    }
  };

  const handleRecordReview = (card: Card, grade: Grade) => {
    if (!isCramMode) {
      recordReview(card, grade);
    }
  };

  if (isLoading) {
    return (
      <div data-testid="loading-skeleton" className="w-full max-w-4xl mx-auto p-4 space-y-6 animate-pulse flex flex-col items-center justify-center min-h-[60vh]">
        {/* Header Skeleton */}
        <div className="w-full flex justify-between items-center mb-4">
           <div className="h-4 bg-gray-200 rounded w-24"></div>
           <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Card Skeleton */}
        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg h-[400px]"></div>

        {/* Controls Skeleton */}
        <div className="w-full max-w-md grid grid-cols-3 gap-4 mt-8">
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
           <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <StudySession 
      dueCards={sessionCards}
      onUpdateCard={handleUpdateCard}
      onRecordReview={handleRecordReview}
      onExit={() => navigate('/')}
      onUndo={isCramMode ? undefined : undoReview}
      canUndo={isCramMode ? false : canUndo}
    />
  );
};

## src/services/db/client.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card } from '@/types';

export interface HistoryEntry {
  date: string;
  count: number;
  byLanguage?: Record<string, number>;
}

export interface PolskiMineDB extends DBSchema {
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

const DB_NAME = 'polskimine-db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<PolskiMineDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PolskiMineDB>(DB_NAME, DB_VERSION, {
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

## src/services/db/index.ts
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

## src/services/db/repositories/cardRepository.ts
import { Card } from '@/types';
import { getSRSDate } from '@/features/study/logic/srs';
import { supabase } from '@/lib/supabase';

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
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapToCard);
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
  const { error } = await supabase.from('cards').upsert(payload);
  if (error) throw error;
};

export const clearAllCards = async () => {
  const userId = await ensureUser();
  const { error } = await supabase.from('cards').delete().eq('user_id', userId);
  if (error) throw error;
};

export const getDueCards = async (now: Date = new Date(), language?: Language): Promise<Card[]> => {
  const srsToday = getSRSDate(now);
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  let query = supabase
    .from('cards')
    .select('*')
    .neq('status', 'known')
    .lte('due_date', cutoffDate.toISOString())
    .order('due_date', { ascending: true });

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapToCard);
};

export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
  let query = supabase
    .from('cards')
    .select('*')
    .neq('status', 'known');

  if (language) {
    query = query.eq('language', language);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data, error } = await query.limit(Math.max(limit, 50));
  if (error) throw error;

  const cards = (data ?? []).map(mapToCard);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards.slice(0, limit);
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

export const getTags = async (language?: Language): Promise<string[]> => {
  let query = supabase.from('cards').select('tags');
  
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

## src/services/db/repositories/historyRepository.ts
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

## src/services/db/repositories/statsRepository.ts
import { getSRSDate } from '@/features/study/logic/srs';
import { SRS_CONFIG } from '@/constants';
import { supabase } from '@/lib/supabase';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

export const getDashboardStats = async (language?: string) => {
  let query = supabase
    .from('cards')
    .select('status, due_date');

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cards = data ?? [];

  // Metrics
  const counts = { new: 0, learning: 0, graduated: 0, known: 0 };
  cards.forEach((c: any) => {
    const status = c.status as keyof typeof counts;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  // Forecast
  const daysToShow = 14;
  const today = new Date();
  const forecast = new Array(daysToShow).fill(0).map((_, i) => ({ 
      day: format(addDays(today, i), 'd'),
      fullDate: format(addDays(today, i), 'MMM d'),
      count: 0 
  }));
  
  cards.forEach((card: any) => {
    if (card.status === 'known' || card.status === 'new') return;
    const dueDate = parseISO(card.due_date);
    const diff = differenceInCalendarDays(dueDate, today);
    if (diff >= 0 && diff < daysToShow) forecast[diff].count++;
  });

  return { counts, forecast };
};

export const getStats = async (language?: string) => {
  let query = supabase
    .from('cards')
    .select('status, due_date, language');

  if (language) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cards = data ?? [];
  const srsToday = getSRSDate(new Date());
  const cutoffDate = new Date(srsToday);
  cutoffDate.setDate(cutoffDate.getDate() + 1);

  const due = cards.filter(
    (card) => card.status !== 'known' && card.due_date <= cutoffDate.toISOString()
  ).length;
  const learned = cards.filter((card) => card.status === 'graduated' || card.status === 'known').length;

  return { total: cards.length, due, learned };
};

export const getTodayReviewStats = async (language?: string) => {
  const srsToday = getSRSDate(new Date());
  const rangeStart = new Date(srsToday);
  rangeStart.setHours(rangeStart.getHours() + SRS_CONFIG.CUTOFF_HOUR);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  let query = supabase
    .from('activity_log')
    .select('activity_type, language')
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

## src/services/studyLimits.ts
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

const isNewCard = (card: Card) => {

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

## src/services/tts/index.ts
import { Language, TTSSettings, TTSProvider } from "@/types";

// Map app language codes to BCP 47 language tags
const LANG_CODE_MAP: Record<Language, string[]> = {
    polish: ['pl-PL', 'pl'],
    norwegian: ['nb-NO', 'no-NO', 'no'],
    japanese: ['ja-JP', 'ja']
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

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Initialize voices
            this.updateVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                this.updateVoices();
            };
        }
    }

    private updateVoices() {
        this.browserVoices = window.speechSynthesis.getVoices();
    }

    /**
     * Get all available voices, optionally filtered by the app's target language
     */
    async getAvailableVoices(language: Language, settings: TTSSettings): Promise<VoiceOption[]> {
        const validCodes = LANG_CODE_MAP[language];
        
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
        this.stop();

        if (settings.provider === 'browser') {
            this.speakBrowser(text, language, settings);
        } else if (settings.provider === 'google') {
            await this.speakGoogle(text, language, settings);
        } else if (settings.provider === 'azure') {
            await this.speakAzure(text, language, settings);
        }
    }

    private speakBrowser(text: string, language: Language, settings: TTSSettings) {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_CODE_MAP[language][0];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        if (settings.voiceURI) {
            const selectedVoice = this.browserVoices.find(v => v.voiceURI === settings.voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        } 

        window.speechSynthesis.speak(utterance);
    }

    private async speakGoogle(text: string, language: Language, settings: TTSSettings) {
        if (!settings.googleApiKey) return;

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: settings.voiceURI ? { name: settings.voiceURI, languageCode: LANG_CODE_MAP[language][0] } : { languageCode: LANG_CODE_MAP[language][0] },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: settings.rate,
                        pitch: (settings.pitch - 1) * 20, // Google pitch is -20.0 to 20.0, app is 0 to 2
                        volumeGainDb: (settings.volume - 1) * 16 // Approx mapping
                    }
                })
            });

            const data = await response.json();
            if (data.audioContent) {
                this.playAudioContent(data.audioContent);
            }
        } catch (e) {
            console.error("Google TTS error", e);
        }
    }

    private async speakAzure(text: string, language: Language, settings: TTSSettings) {
        if (!settings.azureApiKey || !settings.azureRegion) return;

        try {
            const voiceName = settings.voiceURI || 'en-US-JennyNeural'; // Fallback needs to be smarter per lang, but voiceURI should be set
            
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
                    'User-Agent': 'PolskiMine'
                },
                body: ssml
            });

            if (!response.ok) throw new Error(await response.text());

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            this.playAudioBuffer(arrayBuffer);

        } catch (e) {
            console.error("Azure TTS error", e);
        }
    }

    private playAudioContent(base64Audio: string) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        this.playAudioBuffer(bytes.buffer);
    }

    private async playAudioBuffer(buffer: ArrayBuffer) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        try {
            const decodedBuffer = await this.audioContext.decodeAudioData(buffer);
            if (this.currentSource) {
                this.currentSource.stop();
            }
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = decodedBuffer;
            this.currentSource.connect(this.audioContext.destination);
            this.currentSource.start(0);
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }

    stop() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
    }
}

export const ttsService = new TTSService();

## src/types/index.ts
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
  learned: number;
  streak: number;
  totalReviews: number;
  longestStreak: number;
}

export type Language = 'polish' | 'norwegian' | 'japanese';

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
  dailyNewLimit: number;
  dailyReviewLimit: number;
  autoPlayAudio: boolean;
  blindMode: boolean; // New: Play audio before showing text
  showTranslationAfterFlip: boolean;
  ignoreLearningStepsWhenNoCards: boolean;
  tts: TTSSettings;
  fsrs: {
    request_retention: number; // 0.8 to 0.99
    maximum_interval: number; // Days
    w?: number[]; // Weights
    enable_fuzzing?: boolean;
  }
}

## src/vite-env.d.ts
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

## src/vitest.setup.ts
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

## supabase/functions/generate-card/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from Gemini API')
    }

    const text = data.candidates[0]?.content?.parts[0]?.text || ''

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

## vite.config.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        '__APP_VERSION__': JSON.stringify(version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      optimizeDeps: {
        include: ['react-window'],
      },
      build: {
        commonjsOptions: {
          include: [/react-window/, /node_modules/],
        },
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/vitest.setup.ts',
        coverage: {
          reporter: ['text', 'lcov'],
          include: [
            'src/services/**/*.ts',
            'src/components/**/*.tsx',
            'src/contexts/**/*.tsx',
            'src/routes/**/*.tsx'
          ]
        }
      }
    };
});
