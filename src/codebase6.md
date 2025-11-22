
  ## App.tsx
  import React from 'react';
  import { BrowserRouter } from 'react-router-dom';
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

  const queryClient = new QueryClient();

  const LinguaFlowApp: React.FC = () => {
    const { user, profile, loading } = useAuth();

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

    // ---------------------------------------------------------
    // BLOCKING CHECK: If user exists but profile/username is missing
    // ---------------------------------------------------------
    
    // Case 1: Profile hasn't loaded yet (async fetch after auth)
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    // Case 2: Profile loaded, but username is null (First time Google Login)
    if (!profile.username) {
      return <UsernameSetup />;
    }

    // ---------------------------------------------------------

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
                  <SabotageProvider>
                    <LinguaFlowApp />
                    <Toaster position="bottom-right" />
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
        `;
      } else {
        styleTag.innerHTML = '';
      }

      // Cleanup on unmount to prevent theme leak
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
    Menu,
    Plus,
    Zap,
    Skull,
    Trophy,
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
  import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import { PolishFlag, NorwegianFlag, JapaneseFlag, SpanishFlag } from '@/components/ui/flags';
  import { toast } from 'sonner';
  import clsx from 'clsx';

  // --- Utility Components for the Sidebar ---

  const NavLinkItem = ({ 
    to, 
    icon: Icon, 
    label, 
    isActive, 
    onClick 
  }: { 
    to: string; 
    icon: React.ElementType; 
    label: string; 
    isActive: boolean;
    onClick?: () => void;
  }) => (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        "group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
        isActive 
          ? "bg-secondary/60 text-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      )}
    >
      <Icon 
        size={18} 
        strokeWidth={1.5} 
        className={clsx(
          "transition-colors", 
          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )} 
      />
      <span className="text-sm font-medium tracking-tight">{label}</span>
    </Link>
  );

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick,
    shortcut 
  }: { 
    icon: React.ElementType; 
    label: string; 
    onClick: () => void;
    shortcut?: string;
  }) => (
    <button
      onClick={onClick}
      className="w-full group flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm font-medium tracking-tight">{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-50 transition-opacity border border-border px-1 rounded">
          {shortcut}
        </span>
      )}
    </button>
  );

  export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { addCard } = useCardOperations();
    const { settings, updateSettings } = useSettings();
    const { signOut, user } = useAuth();
    const location = useLocation();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCramModalOpen, setIsCramModalOpen] = useState(false);
    const [isSabotageOpen, setIsSabotageOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const isStudyMode = location.pathname === '/study';

    const languages = [
      { code: 'polish', name: 'Polish', Flag: PolishFlag },
      { code: 'norwegian', name: 'Norwegian', Flag: NorwegianFlag },
      { code: 'japanese', name: 'Japanese', Flag: JapaneseFlag },
      { code: 'spanish', name: 'Spanish', Flag: SpanishFlag },
    ] as const;

    const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

    const handleMobileClick = () => {
      setIsMobileNavOpen(false);
    };

    const NavigationContent = () => (
      <div className="flex flex-col h-full py-6 px-4">
        {/* 1. Header / Logo */}
        <div className="px-2 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-foreground text-background rounded-[4px] flex items-center justify-center">
              <Command size={12} strokeWidth={3} />
            </div>
            <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/50 border border-border/50 px-1 rounded">
            V2.0
          </span>
        </div>

        {/* 2. Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Menu</span>
          </div>
          <NavLinkItem 
            to="/" 
            icon={LayoutDashboard} 
            label="Overview" 
            isActive={location.pathname === '/'} 
            onClick={handleMobileClick}
          />
          <NavLinkItem 
            to="/cards" 
            icon={ListIcon} 
            label="Index" 
            isActive={location.pathname === '/cards'} 
            onClick={handleMobileClick}
          />
          <NavLinkItem 
            to="/study" 
            icon={GraduationCap} 
            label="Study" 
            isActive={location.pathname === '/study'} 
            onClick={handleMobileClick}
          />
          <NavLinkItem 
            to="/leaderboard" 
            icon={Trophy} 
            label="Leaderboard" 
            isActive={location.pathname === '/leaderboard'} 
            onClick={handleMobileClick}
          />
        </div>

        {/* 3. Utilities / Tools */}
        <div className="mt-8 space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Tools</span>
          </div>
          <ActionButton 
            icon={Plus} 
            label="Add Entry" 
            onClick={() => { setIsAddModalOpen(true); handleMobileClick(); }} 
          />
          <ActionButton 
            icon={Zap} 
            label="Cram Mode" 
            onClick={() => { setIsCramModalOpen(true); handleMobileClick(); }} 
          />
          <ActionButton 
            icon={Skull} 
            label="Sabotage" 
            onClick={() => { setIsSabotageOpen(true); handleMobileClick(); }} 
          />
        </div>

        {/* 4. Footer (User & Settings) */}
        <div className="mt-auto pt-6 space-y-2 border-t border-border/40">
          
          {/* Language Selector */}
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all group">
                  <div className="flex items-center gap-3">
                      <div className="w-4 h-4 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                          <currentLanguage.Flag className="w-full h-auto rounded-[2px]" />
                      </div>
                      <span className="text-sm font-medium">{currentLanguage.name}</span>
                  </div>
                  <ChevronUp size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 p-1 bg-background border-border">
              {languages.map((lang) => (
                  <DropdownMenuItem
                  key={lang.code}
                  onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      handleMobileClick();
                  }}
                  className="gap-3 py-2 text-xs font-medium"
                  >
                  <lang.Flag className="w-3.5 h-auto rounded-[2px]" />
                  <span className="flex-1">{lang.name}</span>
                  {settings.language === lang.code && <Check size={14} className="ml-auto" />}
                  </DropdownMenuItem>
              ))}
              </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <button
            onClick={() => { setIsSettingsOpen(true); handleMobileClick(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all"
          >
            <Settings size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={() => { signOut(); handleMobileClick(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">Log out</span>
          </button>
          
          {user && (
              <div className="px-3 pt-2">
                  <p className="text-[10px] font-mono text-muted-foreground/40 truncate">
                      {user.email}
                  </p>
              </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
        
        {/* Desktop Sidebar - Fixed Left */}
        {!isStudyMode && (
          <aside className="hidden md:block fixed left-0 top-0 h-full w-64 border-r border-border/40 z-40 bg-background">
            <NavigationContent />
          </aside>
        )}

        {/* Mobile Header */}
        {!isStudyMode && (
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-foreground text-background rounded-[4px] flex items-center justify-center">
                  <Command size={12} strokeWidth={3} />
              </div>
              <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
            </div>
            
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground active:opacity-70">
                  <Menu size={20} strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r border-border/40">
                <NavigationContent />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Main Content Area */}
        <main className={clsx(
          "min-h-screen transition-all duration-300 ease-in-out",
          !isStudyMode ? "md:ml-64 pt-14 md:pt-0" : "p-0"
        )}>
          <div className={clsx(
            "w-full h-full mx-auto",
            !isStudyMode ? "max-w-7xl p-6 md:p-12" : ""
          )}>
            {children}
            <SabotageNotification />
          </div>
        </main>

        {/* Global Modals */}
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
        <SabotageStore isOpen={isSabotageOpen} onClose={() => setIsSabotageOpen(false)} />
      </div>
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
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 border border-transparent",
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
  ## components/ui/color-picker.tsx
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
        // Changed: Darker background with backdrop blur for better contrast
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
          // Changed: w-[95vw] for mobile to ensure it fits but has margins
          "fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-2xl rounded-lg sm:rounded-xl",
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

  const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
      return (
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-foreground/20",
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
  ## components/ui/sheet.tsx
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
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
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

  interface Profile {
    id: string;
    username: string | null;
    xp: number;     // Lifetime accumulation for Ranking
    points: number; // Spendable currency for Sabotage
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
    updateUsername: (username: string) => Promise<void>;
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

    // --- REALTIME LISTENER FOR POINTS/XP ---
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
            // Prevent XP/Points downgrade during optimistic updates
            // Only accept server updates if they are higher than current local state
            setProfile(prev => {
              if (!prev) return newProfile;
              // Guard against race condition: don't downgrade XP if local is ahead
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

      // Ensure points exists, default to 0 if column is missing or null
      const safeData = {
          ...data,
          points: data.points ?? 0
      };

      setProfile(safeData as Profile);
    };

    const signInWithGoogle = async () => {
      const redirectTo = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
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
      // No need to manually setProfile here, the realtime subscription will catch it
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

    return (
      <AuthContext.Provider
        value={{ session, user, profile, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail, updateUsername, loading, incrementXPOptimistically }}
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
  import {
    useDeckStatsQuery,
    useDueCardsQuery,
    useReviewsTodayQuery,
    useHistoryQuery,
    useRecordReviewMutation,
    useUndoReviewMutation,
  } from '@/features/deck/hooks/useDeckQueries';

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
    if (language === 'spanish') return 'Spanish';
    return 'Polish';
  };

  export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const { user } = useAuth();
    
    // Queries
    const { data: dbStats, isLoading: statsLoading } = useDeckStatsQuery();
    const { data: dueCards, isLoading: dueCardsLoading } = useDueCardsQuery();
    const { data: reviewsToday, isLoading: reviewsLoading } = useReviewsTodayQuery();
    const { data: history, isLoading: historyLoading } = useHistoryQuery();
    
    // Mutations
    const recordReviewMutation = useRecordReviewMutation();
    const undoReviewMutation = useUndoReviewMutation();

    const [lastReview, setLastReview] = useState<{ card: Card; date: string } | null>(null);

    const isLoading = statsLoading || dueCardsLoading || reviewsLoading || historyLoading;

    // Prevent double loading of beginner deck
    const isSeeding = useRef(false);
    // Track which languages have been successfully seeded
    const seededLanguages = useRef<Set<string>>(new Set());

    // Memoize streak calculation separately with higher granularity control
    // to prevent expensive recalculation on every review
    const streakStats = useMemo(() => {
      // Calculate streaks from history
      const sortedDates = Object.keys(history || {}).sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const totalReviews = Object.values(history || {}).reduce(
        (acc, val) => acc + (typeof val === 'number' ? val : 0),
        0
      );

      // Use UTC date strings consistently to prevent timezone mismatches
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

    // Derived Stats
    // Performance note: This calculation now delegates expensive streak computation
    // to a separate useMemo to reduce render cost during rapid reviews
    // 
    // IMPORTANT: The 'due' count is derived from limitedCards.length to ensure consistency.
    // The optimistic update in useDeckQueries also updates deckStats.due, but this context
    // uses the client-side array as the source of truth for the current session.
    // This prevents desync between the mutation's filter logic and the context's applyStudyLimits.
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

    // Beginner Deck Loading
    useEffect(() => {
      const loadBeginnerDeck = async () => {
        // Abort if currently seeding or this language already seeded
        if (isSeeding.current || seededLanguages.current.has(settings.language)) return;

        if (!statsLoading && dbStats && dbStats.total === 0 && user) {
          // Lock the process immediately
          isSeeding.current = true;

          const rawDeck =
                settings.language === 'norwegian'
                  ? NORWEGIAN_BEGINNER_DECK
                  : settings.language === 'japanese'
                  ? JAPANESE_BEGINNER_DECK
                  : settings.language === 'spanish'
                  ? SPANISH_BEGINNER_DECK
                  : POLISH_BEGINNER_DECK;
              
          // FIX: Generate fresh UUIDs to prevent database collisions
          const deck = rawDeck.map(card => ({
            ...card,
            id: crypto.randomUUID(),
            dueDate: new Date().toISOString()
          }));
              
          try {
            await saveAllCards(deck);
            // Mark this language as seeded only after success
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
            // Always unlock so retries (e.g. language switch) are possible
            isSeeding.current = false;
          }
        }
      };
      
      loadBeginnerDeck();
    }, [dbStats, statsLoading, user, settings.language, queryClient]);

    const recordReview = useCallback(async (oldCard: Card, grade: Grade) => {
        const today = getUTCDateString(getSRSDate(new Date()));
        setLastReview({ card: oldCard, date: today });
        
        try {
          await recordReviewMutation.mutateAsync({ card: oldCard, grade });
        } catch (error) {
            console.error("Failed to record review", error);
            toast.error("Failed to save review progress");
            // Only clear undo state if the failed card matches current lastReview
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
          // If we have an origin ID, we try to fetch the name.
          if (curse.origin_user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', curse.origin_user_id)
              .single();
            
            // If profile found, use username. Fallback to 'Unknown Rival' if ID exists but name fetch fails.
            return { ...curse, sender_username: profile?.username || 'Unknown Rival' };
          }
          // Only truly anonymous if no ID exists
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
              // Default to Unknown Rival immediately if we have an ID, so we don't show Anonymous on error
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

  // Helper to create per-language limits objects
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
  }

  const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

  export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Lazy initialization: read localStorage before first render to avoid overwriting saved settings
    const [settings, setSettings] = useState<UserSettings>(() => {
      if (typeof window === 'undefined') return DEFAULT_SETTINGS;
      try {
        const saved = localStorage.getItem('language_mining_settings');
        if (saved) {
          const parsed = JSON.parse(saved);

          // Migration: single numeric fields -> per-language objects
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
              geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey
          };
        }
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
      return DEFAULT_SETTINGS;
    });

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

    // Sync settings to localStorage whenever they change
    // (separated from state updater to ensure pure reducer functions and prevent
    // multiple writes in Strict Mode)
    useEffect(() => {
      localStorage.setItem('language_mining_settings', JSON.stringify(settings));
    }, [settings]);

    const resetSettings = () => {
      setSettings(DEFAULT_SETTINGS);
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
    // Always force light theme
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
            <p className="text-muted-foreground">Enter your credentials to access LinguaFlow</p>
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
                className="w-full bg-primary text-primary-foreground h-11 rounded-md text-xs font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
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
              className="w-full border border-border h-11 rounded-md text-xs font-mono uppercase tracking-wider hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
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
  ## features/auth/LoginScreen.tsx
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
            <h1 className="text-3xl font-bold tracking-tight">LinguaFlow</h1>
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
  ## features/auth/UsernameSetup.tsx
  import React, { useState } from 'react';
  import { User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
  import { toast } from 'sonner';
  import { useAuth } from '@/contexts/AuthContext';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';

  export const UsernameSetup: React.FC = () => {
    const { updateUsername, user } = useAuth();
    const [username, setUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!username.trim()) {
        toast.error("Username cannot be empty");
        return;
      }

      if (username.length < 3) {
        toast.error("Username must be at least 3 characters");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateUsername(username.trim());
        toast.success("Welcome, " + username + "!");
        // The AuthContext realtime listener will automatically update the 'profile'
        // state in App.tsx, causing this component to unmount and the app to load.
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to update username");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-6 relative">
              <Sparkles size={32} strokeWidth={1.5} />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
                  <User size={16} className="text-muted-foreground" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight">
              One last thing...
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Choose a unique username to identify yourself on the global leaderboard.
            </p>
          </div>

          <div className="bg-card border border-border/50 p-8 rounded-xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-muted-foreground/50" />
                  <Input
                    className="pl-9 h-11 bg-secondary/20 border-border/50 focus:bg-background transition-all"
                    placeholder="e.g. PolyglotMaster"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    disabled={isSubmitting}
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">
                  This will be visible to other users.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isSubmitting || !username}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Complete Setup <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center">
              <p className="text-xs text-muted-foreground">
                  Logged in as <span className="font-mono text-foreground">{user?.email}</span>
              </p>
          </div>
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
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Unseen</span>
              </div>
              <div className="w-px bg-border/60 h-12" />
              <div className="flex flex-col gap-1">
                  <span className="text-3xl font-light tabular-nums">{stats.reviewDue}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Mature</span>
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

        <div className="w-full h-px bg-border/40" />

        {/* --- STATS GRID --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatCard label="Unseen" value={metrics.new} />
          <StatCard label="Learning" value={metrics.learning} />
          <StatCard label="Mature" value={metrics.graduated} />
          <StatCard label="Known" value={metrics.known} />
        </section>

        <div className="w-full h-px bg-border/40" />

        {/* --- ACTIVITY & RETENTION --- */}
        <section className="space-y-20">
          {/* Activity Heatmap */}
          <div className="space-y-8">
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
          </div>

          {/* Retention Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              <RetentionStats cards={cards} />
          </div>
        </section>
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
      // Inverse of: level = Math.floor(Math.sqrt(xp / 100)) + 1
      // Therefore: xp = 100 * (level - 1)^2
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

    // --- DATA PREPARATION ---
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
        if (card.status === 'known' || card.status === 'new' || !card.dueDate) return;
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
          <div className="bg-foreground text-background text-[10px] font-mono uppercase tracking-wider px-3 py-2 shadow-xl border-none">
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
    
    // Track previous open state to detect modal opening
    const wasOpen = useRef(false);

    useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
      // Only reset form when modal transitions from closed to open
      // This prevents wiping user input when settings change while modal is open
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

    // Determine FSRS label
    const getFsrsLabel = (state?: number) => {
        if (state === 0) return 'New';
        if (state === 1) return 'Learning';
        if (state === 2) return 'Review';
        if (state === 3) return 'Relearning';
        return 'Unknown';
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-background border border-border shadow-2xl sm:rounded-xl p-0 gap-0 overflow-hidden">
          
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
  import React from 'react';
  import { FixedSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
  import AutoSizer from 'react-virtualized-auto-sizer';
  import { MoreHorizontal, Pencil, Trash2, Calendar, History, Zap, CheckSquare, Square } from 'lucide-react';
  import { Card } from '@/types';
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
  import clsx from 'clsx';
  import { formatDistanceToNow, parseISO, isValid, format } from 'date-fns';

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

  const StatusDot = ({ status }: { status: string }) => {
      const colorClass = 
          status === 'new' ? 'bg-blue-500' :
          status === 'learning' ? 'bg-amber-500' :
          status === 'graduated' ? 'bg-emerald-500' : 
          'bg-zinc-300 dark:bg-zinc-700';

      return <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", colorClass)} />;
  };

  const DueDateLabel = ({ dateStr, status }: { dateStr: string, status: string }) => {
    if (status === 'new') return <span className="text-muted-foreground/40">-</span>;
    
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;

    // Check if it's prioritized (approx 1970)
    if (date.getFullYear() === 1970) {
        return <span className="text-primary font-bold tracking-wider text-[10px] uppercase">Next</span>;
    }

    return (
      <div className="flex items-center gap-2 text-muted-foreground" title={format(date, 'PPP')}>
        <span className="truncate">{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>
    );
  };

  // Memoized Row Component
  const Row = React.memo(({ index, style, data }: ListChildComponentProps<any>) => {
    const { cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect } = data;
    const card = cards[index];
    if (!card) return null;

    const isSelected = selectedIds.has(card.id);

    return (
      <div 
          style={style} 
          className={clsx(
              "group border-b border-border/40 flex items-center px-1 transition-colors",
              isSelected ? "bg-primary/5" : "hover:bg-secondary/20"
          )}
      >
        {/* 0. Selection Checkbox */}
        <div className="w-10 flex items-center justify-center shrink-0">
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(card.id, index, e.shiftKey);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSelected ? (
                  <CheckSquare size={16} className="text-primary" />
              ) : (
                  <Square size={16} className="opacity-30 group-hover:opacity-100" />
              )}
            </button>
        </div>

        {/* 1. Status & Sentence (Main Content) */}
        <div 
          className="flex-1 min-w-0 pr-4 flex flex-col justify-center h-full py-3 cursor-pointer"
          onClick={() => onViewHistory(card)}
        >
            <div className="flex items-baseline gap-3 mb-1">
              <StatusDot status={card.status} />
              <span className={clsx(
                  "text-lg font-light tracking-tight truncate transition-colors",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
              )}>
                  {card.targetSentence}
              </span>
            </div>
            <div className="pl-4.5">
              <span className="text-sm text-muted-foreground/60 font-light truncate block">
                  {card.nativeTranslation}
              </span>
            </div>
        </div>

        {/* 2. Metadata Columns */}
        <div className="hidden md:flex items-center gap-8 mr-4 pointer-events-none">
            <div className="w-20 flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</span>
                <span className="text-xs font-medium capitalize text-muted-foreground">{card.status}</span>
            </div>

            <div className="w-20 flex flex-col justify-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Interval</span>
                <span className="text-xs font-mono text-muted-foreground">{card.interval}d <span className="opacity-30">/</span> {card.reps}r</span>
            </div>

            <div className="w-24 flex flex-col justify-center text-right">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-0.5">Due</span>
                <span className="text-xs font-mono text-muted-foreground"><DueDateLabel dateStr={card.dueDate} status={card.status} /></span>
            </div>
        </div>
        
        {/* 3. Actions */}
        <div className="w-10 flex items-center justify-end mr-2">
          <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-md text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all outline-none">
                  <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onPrioritizeCard(card.id)} className="text-xs font-mono uppercase tracking-wider text-primary focus:text-primary">
                      <Zap size={12} className="mr-2" /> Learn Now
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewHistory(card)} className="text-xs font-mono uppercase tracking-wider">
                      <History size={12} className="mr-2" /> History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditCard(card)} className="text-xs font-mono uppercase tracking-wider">
                      <Pencil size={12} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteCard(card.id)} className="text-xs font-mono uppercase tracking-wider text-destructive focus:text-destructive">
                      <Trash2 size={12} className="mr-2" /> Delete
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }, areEqual);

  export const CardList: React.FC<CardListProps> = ({ 
      cards, 
      onEditCard, 
      onDeleteCard, 
      onViewHistory, 
      onPrioritizeCard,
      selectedIds,
      onToggleSelect
  }) => {
    const itemData = React.useMemo(() => ({
      cards,
      onEditCard,
      onDeleteCard,
      onViewHistory,
      onPrioritizeCard,
      selectedIds,
      onToggleSelect
    }), [cards, onEditCard, onDeleteCard, onViewHistory, onPrioritizeCard, selectedIds, onToggleSelect]);

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/40 space-y-4 border-t border-border/40">
                <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center">
                    <Calendar size={20} strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest">No cards found</p>
            </div>
        );
    }

    return (
      <div className="flex-1 h-full w-full">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={cards.length}
              itemSize={88}
              itemData={itemData}
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
        <DialogContent className="sm:max-w-3xl p-12 bg-white dark:bg-black border border-border shadow-2xl sm:rounded-xl gap-0">
          
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
    // --- GREETINGS & SELF INTRO ---
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

    // --- PARTICLES & BASICS (Wa, Desu) ---
    createCard("これは何ですか？", "What is this?", "何", "", "これは 何[なん]ですか？"),
    createCard("それは私のペンです。", "That is my pen.", "私", "", "それは 私[わたし]のペンです。"),
    createCard("トイレはどこですか？", "Where is the toilet?", "どこ", "", "トイレはどこですか？"),
    createCard("駅はあそこです。", "The station is over there.", "駅", "", "駅[えき]はあそこです。"),
    createCard("私は学生です。", "I am a student.", "学生", "", "私[わたし]は 学生[がくせい]です。"),
    createCard("彼は先生ではありません。", "He is not a teacher.", "先生", "", "彼[かれ]は 先生[せんせい]ではありません。"),

    // --- VERBS (Masu Form) & OBJECTS (Wo) ---
    createCard("私は寿司を食べます。", "I eat sushi.", "食べます", "", "私[わたし]は 寿司[すし]を 食[た]べます。"),
    createCard("何を飲みますか？", "What will you drink?", "飲みます", "", "何[なに]を 飲[の]みますか？"),
    createCard("毎日、日本語を勉強します。", "I study Japanese every day.", "勉強", "", "毎日[まいにち]、 日本語[にほんご]を 勉強[べんきょう]します。"),
    createCard("テレビを見ました。", "I watched TV.", "見ました", "Past tense.", "テレビを 見[み]ました。"),
    createCard("音楽を聴きます。", "I listen to music.", "聴きます", "", "音楽[おんがく]を 聴[き]きます。"),
    createCard("新聞を読みます。", "I read the newspaper.", "読みます", "", "新聞[しんぶん]を 読[よ]みます。"),
    createCard("写真を撮ります。", "I take a photo.", "撮ります", "", "写真[しゃしん]を 撮[と]ります。"),
    createCard("手紙を書きます。", "I write a letter.", "書きます", "", "手紙[てがみ]を 書[か]きます。"),

    // --- MOVEMENT (Ni/E) & TIME ---
    createCard("明日、東京に行きます。", "I will go to Tokyo tomorrow.", "行きます", "", "明日[あした]、 東京[とうきょう]に 行[い]きます。"),
    createCard("何時に帰りますか？", "What time will you go home?", "帰り", "", "何時[なんじ]に 帰[かえ]りますか？"),
    createCard("友達と来ました。", "I came with a friend.", "来ました", "", "友達[ともだち]と 来[き]ました。"),
    createCard("いつ日本に来ましたか？", "When did you come to Japan?", "いつ", "", "いつ 日本[にほん]に 来[き]ましたか？"),
    createCard("バスで学校へ行きます。", "I go to school by bus.", "学校", "", "バスで 学校[がっこう]へ 行[い]きます。"),

    // --- EXISTENCE (Iru/Aru) ---
    createCard("猫がいます。", "There is a cat.", "います", "Used for living things.", "猫[ねこ]がいます。"),
    createCard("お金がありません。", "I don't have money.", "ありません", "Negative existence (inanimate).", "お 金[かね]がありません。"),
    createCard("コンビニがありますか？", "Is there a convenience store?", "あります", "", "コンビニがありますか？"),
    createCard("誰がいますか？", "Who is there?", "誰", "", "誰[だれ]がいますか？"),
    createCard("机の上に本があります。", "There is a book on the desk.", "机", "", "机[つくえ]の 上[うえ]に 本[ほん]があります。"),

    // --- ADJECTIVES ---
    createCard("このラーメンは美味しいです。", "This ramen is delicious.", "美味しい", "", "このラーメンは 美味[おい]しいです。"),
    createCard("今日は暑いですね。", "It is hot today, isn't it?", "暑い", "", "今日[きょう]は 暑[あつ]いですね。"),
    createCard("日本の夏は蒸し暑いです。", "Japanese summers are humid.", "蒸し暑い", "", "日本[にほん]の 夏[なつ]は 蒸[む]し 暑[あつ]いです。"),
    createCard("それは面白そうですね。", "That looks interesting.", "面白", "", "それは 面白[おもしろ]そうですね。"),
    createCard("この部屋は広いです。", "This room is spacious.", "広い", "", "この 部屋[へや]は 広[ひろ]いです。"),
    createCard("あの映画はつまらないです。", "That movie is boring.", "つまらない", "", "あの 映画[えいが]はつまらないです。"),
    createCard("忙しいですか？", "Are you busy?", "忙しい", "", "忙[いそが]しいですか？"),

    // --- REQUESTS & SURVIVAL ---
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
    // --- GREETINGS & ESSENTIALS ---
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

    // --- TO BE (VÆRE) ---
    createCard("Jeg er trøtt.", "I am tired.", "er", "Verb: å være (to be)."),
    createCard("Det er kaldt i dag.", "It is cold today.", "er", ""),
    createCard("Hvor er toalettet?", "Where is the toilet?", "er", ""),
    createCard("Vi er fra Norge.", "We are from Norway.", "er", ""),
    createCard("Er du sulten?", "Are you hungry?", "Er", ""),
    createCard("Det er min venn.", "That is my friend.", "er", ""),
    createCard("Er det sant?", "Is that true?", "Er", ""),

    // --- TO HAVE (HA) ---
    createCard("Jeg har en bil.", "I have a car.", "har", "Verb: å ha (to have)."),
    createCard("Har du tid?", "Do you have time?", "Har", ""),
    createCard("Vi har ikke penger.", "We don't have money.", "har", ""),
    createCard("Hun har lyst på kaffe.", "She wants coffee.", "lyst", "Idiom: Ha lyst på (want/crave)."),
    createCard("Jeg har vondt i hodet.", "I have a headache.", "vondt", "Idiom: Ha vondt (have pain)."),

    // --- COMMON VERBS ---
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

    // --- PRONOUNS & QUESTIONS ---
    createCard("Hvem er det?", "Who is that?", "Hvem", ""),
    createCard("Hva er dette?", "What is this?", "Hva", ""),
    createCard("Hvor bor du?", "Where do you live?", "Hvor", ""),
    createCard("Når kommer toget?", "When is the train coming?", "Når", ""),
    createCard("Hvorfor gråter du?", "Why are you crying?", "Hvorfor", ""),
    createCard("Hvordan kommer jeg dit?", "How do I get there?", "Hvordan", ""),
    createCard("Hvilken liker du?", "Which one do you like?", "Hvilken", ""),

    // --- SURVIVAL & COMMON PHRASES ---
    createCard("Hjelp!", "Help!", "Hjelp", ""),
    createCard("Jeg trenger en lege.", "I need a doctor.", "trenger", "Verb: å trenge (to need)."),
    createCard("Hvor mye koster det?", "How much does it cost?", "koster", ""),
    createCard("Jeg elsker deg.", "I love you.", "elsker", ""),
    createCard("Bare hyggelig.", "You're welcome.", "hyggelig", "Response to thank you."),
    createCard("Unnskyld meg.", "Excuse me.", "Unnskyld", ""),
    createCard("Jeg er enig.", "I agree.", "enig", ""),
    createCard("Det går bra.", "It's going well / It's fine.", "går", ""),

    // --- ADJECTIVES & DESCRIBING ---
    createCard("Norge er et vakkert land.", "Norway is a beautiful country.", "vakkert", ""),
    createCard("Det er veldig bra.", "That is very good.", "bra", ""),
    createCard("Jeg er glad.", "I am happy.", "glad", ""),
    createCard("Det er vanskelig.", "It is difficult.", "vanskelig", ""),
    createCard("Maten er god.", "The food is good.", "god", ""),
    createCard("Jeg er opptatt.", "I am busy.", "opptatt", ""),

    // --- TIME & PLACE ---
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
    // --- GREETINGS & ESSENTIALS ---
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

    // --- TO BE (BYĆ) ---
    createCard("Jestem zmęczony.", "I am tired (male).", "Jestem", ""),
    createCard("Ona jest bardzo miła.", "She is very nice.", "jest", ""),
    createCard("To jest mój dom.", "This is my house.", "To", "Used as a pointer here."),
    createCard("Jesteśmy w pracy.", "We are at work.", "pracy", "Locative case of 'praca'."),
    createCard("Gdzie oni są?", "Where are they?", "są", ""),
    createCard("Czy jesteś głodny?", "Are you hungry?", "jesteś", ""),
    createCard("Byłem tam wczoraj.", "I was there yesterday (male).", "Byłem", "Past tense."),

    // --- TO HAVE (MIEĆ) ---
    createCard("Mam pytanie.", "I have a question.", "Mam", ""),
    createCard("Nie mam czasu.", "I don't have time.", "czasu", "Genitive case of 'czas' (negation)."),
    createCard("Masz ochotę na piwo?", "Do you feel like having a beer?", "ochotę", "Idiom: Mieć ochotę na..."),
    createCard("On nie ma pieniędzy.", "He doesn't have money.", "pieniędzy", "Genitive plural."),
    createCard("Mamy nowy samochód.", "We have a new car.", "Mamy", ""),

    // --- COMMON VERBS ---
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

    // --- PRONOUNS & QUESTIONS ---
    createCard("Kto to jest?", "Who is this?", "Kto", ""),
    createCard("Dlaczego płaczesz?", "Why are you crying?", "Dlaczego", ""),
    createCard("Kiedy wracasz?", "When are you coming back?", "Kiedy", ""),
    createCard("Gdzie mieszkasz?", "Where do you live?", "Gdzie", ""),
    createCard("Jak się nazywasz?", "What is your name?", "Jak", "Literally: How do you call yourself?"),
    createCard("Co to jest?", "What is this?", "Co", ""),
    createCard("Ile to kosztuje?", "How much does it cost?", "Ile", ""),

    // --- SURVIVAL & COMMON PHRASES ---
    createCard("Wszystko w porządku?", "Is everything in order/okay?", "porządku", ""),
    createCard("Nic się nie stało.", "Nothing happened.", "Nic", "Double negation is standard."),
    createCard("Na zdrowie!", "Cheers! / Bless you!", "zdrowie", ""),
    createCard("Smacznego.", "Bon appétit.", "Smacznego", ""),
    createCard("Pomocy!", "Help!", "Pomocy", ""),
    createCard("Zgubiłem się.", "I am lost (male).", "Zgubiłem", ""),
    createCard("Potrzebuję lekarza.", "I need a doctor.", "Potrzebuję", ""),

    // --- ADJECTIVES & DESCRIBING ---
    createCard("Ten samochód jest szybki.", "This car is fast.", "szybki", ""),
    createCard("Pogoda jest dzisiaj ładna.", "The weather is nice today.", "ładna", ""),
    createCard("Jest mi zimno.", "I am cold.", "zimno", "Literally: 'It is cold to me'."),
    createCard("To jest za drogie.", "This is too expensive.", "drogie", ""),
    createCard("Jestem szczęśliwy.", "I am happy (male).", "szczęśliwy", ""),
    createCard("To jest trudne.", "This is difficult.", "trudne", ""),

    // --- TIME & PLACE ---
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
    // --- GREETINGS & BASICS ---
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

    // --- SER vs ESTAR ---
    createCard("Soy de España.", "I am from Spain.", "Soy", "Ser: Origin/Permanent."),
    createCard("Estoy cansado.", "I am tired.", "Estoy", "Estar: Condition/Temporary."),
    createCard("Ella es inteligente.", "She is intelligent.", "es", "Ser: Characteristic."),
    createCard("¿Dónde estás?", "Where are you?", "estás", "Estar: Location."),
    createCard("La fiesta es mañana.", "The party is tomorrow.", "es", "Ser: Time/Event."),
    createCard("Estamos listos.", "We are ready.", "Estamos", "Estar: Condition."),
    createCard("Eres mi mejor amigo.", "You are my best friend.", "Eres", "Ser: Relationship."),

    // --- COMMON VERBS ---
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

    // --- QUESTIONS & PLACES ---
    createCard("¿Qué hora es?", "What time is it?", "hora", ""),
    createCard("¿Dónde está el baño?", "Where is the bathroom?", "baño", ""),
    createCard("¿Cuánto cuesta esto?", "How much does this cost?", "cuesta", ""),
    createCard("Vamos a la playa.", "Let's go to the beach.", "playa", ""),
    createCard("La cuenta, por favor.", "The check, please.", "cuenta", ""),
    createCard("¿Quién es él?", "Who is he?", "Quién", ""),
    createCard("¿Por qué preguntas?", "Why do you ask?", "Por", ""),
    createCard("¿Cuándo llegas?", "When do you arrive?", "Cuándo", ""),
    createCard("¿Cómo te llamas?", "What is your name?", "llamas", ""),

    // --- SURVIVAL & USEFUL PHRASES ---
    createCard("¡Ayuda!", "Help!", "Ayuda", ""),
    createCard("Necesito un médico.", "I need a doctor.", "Necesito", ""),
    createCard("Estoy perdido.", "I am lost (male).", "perdido", ""),
    createCard("¡Salud!", "Cheers! / Bless you!", "Salud", ""),
    createCard("Buen provecho.", "Bon appétit.", "provecho", ""),
    createCard("Tengo hambre.", "I am hungry.", "hambre", "Literally: I have hunger."),
    createCard("Tengo sed.", "I am thirsty.", "sed", "Literally: I have thirst."),
    createCard("Hace calor.", "It is hot.", "calor", "Literally: It makes heat."),
    createCard("Hace frío.", "It is cold.", "frío", "Literally: It makes cold."),

    // --- ADJECTIVES & NOUNS ---
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
          // Set due_date to epoch (1970) to ensure they appear first in ascending sort
          const { error } = await supabase
            .from('cards')
            .update({ due_date: new Date(0).toISOString() })
            .in('id', ids);

          if (error) throw error;

          await queryClient.invalidateQueries({ queryKey: ['cards'] });
          // Also invalidate due cards so the study session picks them up immediately
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
  import { Card, Grade } from '@/types';
  import { getSRSDate } from '@/features/study/logic/srs';
  import { format } from 'date-fns';
  import { supabase } from '@/lib/supabase';
  import { useAuth } from '@/contexts/AuthContext';
  import { toast } from 'sonner';

  // REWORKED: Only award XP for New cards. 0 for everything else.
  const calculateXP = (cardStatus: string, grade: Grade): number => {
    // Only 'new' cards give immediate gratification
    if (cardStatus === 'new') return 50;
    return 0;
  };

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
      mutationFn: async ({ card, grade }: { card: Card; grade: Grade }) => {
        const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
        
        // 1. Increment history in DB
        await incrementHistory(today, 1, card.language || settings.language);
        
        // 2. Award XP ONLY if it's a new card
        const xpAmount = calculateXP(card.status, grade);

        if (user) {
          // Insert activity log
          await supabase
            .from('activity_log')
            .insert({
              user_id: user.id,
              activity_type: card.status === 'new' ? 'new_card' : 'review',
              xp_awarded: xpAmount, // This will be 0 for reviews
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
      onMutate: async ({ card, grade }) => {
        const today = format(getSRSDate(new Date()), 'yyyy-MM-dd');
        
        // 1. Cancel ALL relevant queries to prevent overwrites from background refetches
        await Promise.all([
          queryClient.cancelQueries({ queryKey: ['history', settings.language] }),
          queryClient.cancelQueries({ queryKey: ['reviewsToday', settings.language] }),
          queryClient.cancelQueries({ queryKey: ['dueCards', settings.language] }),
          queryClient.cancelQueries({ queryKey: ['deckStats', settings.language] }),
          queryClient.cancelQueries({ queryKey: ['dashboardStats', settings.language] }) // Added: prevent overwrite of optimistic language XP
        ]);
        
        // 2. Snapshot previous values for rollback
        const previousHistory = queryClient.getQueryData(['history', settings.language]);
        const previousReviewsToday = queryClient.getQueryData(['reviewsToday', settings.language]);
        const previousDueCards = queryClient.getQueryData(['dueCards', settings.language]);
        const previousDashboardStats = queryClient.getQueryData(['dashboardStats', settings.language]); // Added snapshot
        
        // 3. Optimistically update history
        queryClient.setQueryData(['history', settings.language], (old: any) => {
          if (!old) return { [today]: 1 };
          return { ...old, [today]: (old[today] || 0) + 1 };
        });
        
        // 4. Optimistically update reviewsToday
        queryClient.setQueryData(['reviewsToday', settings.language], (old: any) => {
          if (!old) return { newCards: 0, reviewCards: 0 };
          return {
              newCards: card.status === 'new' ? old.newCards + 1 : old.newCards,
              reviewCards: card.status !== 'new' ? old.reviewCards + 1 : old.reviewCards
          };
        });

        // 5. Optimistically update: REMOVE CARD FROM DUE QUEUE regardless of grade.
        // If graded 'Again', it enters a short learning interval and should not count as currently due.
        // The study session manages immediate re-queue locally.
        queryClient.setQueryData(['dueCards', settings.language], (old: Card[] | undefined) => {
          if (!old) return [];
          return old.filter(c => c.id !== card.id);
        });

        // Note: We do NOT optimistically update deckStats.due here because DeckContext
        // derives the due count from the dueCards array. Updating both causes desync.
        // The invalidation on settlement will sync deckStats from the server.

        // 7. Optimistically update Profile XP (Only if > 0)
        if (user) {
          const xpAmount = calculateXP(card.status, grade);
          incrementXPOptimistically(xpAmount);

          // Update Dashboard Stats
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
        // Rollback EVERYTHING if it fails
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

  // NEW: Mutation to claim the daily completion bonus
  export const useClaimDailyBonusMutation = () => {
    const queryClient = useQueryClient();
    const { settings } = useSettings();
    const { user, incrementXPOptimistically } = useAuth();
    const BONUS_AMOUNT = 300; // Big reward for finishing

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
          
          // Update Dashboard Stats
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

  interface BatchGenerationOptions {
    difficulty: string;
    topic: string;
    count: number;
    language: 'polish' | 'norwegian' | 'japanese' | 'spanish';
  }

  function extractJSON(text: string): string {
    // Try to find a JSON code block first (case-insensitive)
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1];
    }
    
    // Fallback: Find the outermost curly braces or brackets
    const firstOpenBrace = text.indexOf('{');
    const firstOpenBracket = text.indexOf('[');
    
    let firstOpen = -1;
    if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
      firstOpen = Math.min(firstOpenBrace, firstOpenBracket);
    } else {
      firstOpen = Math.max(firstOpenBrace, firstOpenBracket);
    }

    if (firstOpen !== -1) {
      // Find the corresponding last close
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

    // UPDATED: Explicitly stringify body and set headers (required by Edge Function)
    const { data, error } = await supabase.functions.invoke('generate-card', {
      body: JSON.stringify({ prompt, apiKey }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error("AI Service Error:", error);
      // Attempt to parse structured error from Response body
      try {
        const body = error instanceof Response ? await error.json() : null;
        if (body?.error) throw new Error(body.error);
      } catch (_) {
        // Swallow JSON parse issues silently
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
  ## features/leaderboard/Leaderboard.tsx
  import React, { useEffect, useState } from 'react';
  import { Trophy, Info, Globe, Calendar, Filter } from 'lucide-react';
  import { supabase } from '@/lib/supabase';
  import { useAuth } from '@/contexts/AuthContext';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import clsx from 'clsx';

  interface LeaderboardEntry {
    id: string;
    username: string | null;
    xp: number;
    level: number;
  }

  type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  type LanguageFilter = 'all' | 'polish' | 'norwegian' | 'japanese';

  export const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
    const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');

    useEffect(() => {
      const fetchLeaderboard = async () => {
        setLoading(true);
        
        try {
          // Call the RPC function we created in Supabase
          const { data, error } = await supabase.rpc('get_leaderboard', {
            time_range: timeRange,
            language_filter: languageFilter
          });

          if (error) throw error;
          setProfiles(data || []);
        } catch (error) {
          console.error('Failed to load leaderboard', error);
        } finally {
          setLoading(false);
        }
      };

      fetchLeaderboard();
    }, [timeRange, languageFilter]);

    const RankDisplay = ({ rank }: { rank: number }) => {
      if (rank <= 3) {
        return (
          <div className="relative flex items-center justify-center w-8 h-8">
              <span className={clsx(
                  "text-3xl font-bold tracking-tighter leading-none",
                  rank === 1 ? "text-yellow-500" : 
                  rank === 2 ? "text-zinc-400" : 
                  "text-amber-700"
              )}>
                  {rank}
              </span>
          </div>
        );
      }
      return <span className="font-mono text-sm text-muted-foreground/50">#{rank}</span>;
    };

    return (
      <div className="max-w-5xl mx-auto pb-20 space-y-12 md:space-y-16 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <header className="space-y-8">
          <div className="flex items-center gap-4 text-muted-foreground">
              <Trophy size={20} strokeWidth={1.5} />
              <span className="text-xs font-mono uppercase tracking-widest">Global Rankings</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-start gap-4">
                  <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-foreground leading-[0.85]">
                  Top Miners
                  </h1>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger>
                              <Info size={24} className="text-muted-foreground hover:text-foreground transition-colors mt-2" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="max-w-xs p-4">
                              <div className="space-y-2">
                                  <p>Rankings are calculated based on XP earned during the selected time period.</p>
                                  <p className="text-xs text-muted-foreground">XP is earned by adding cards (50xp) and reviewing them (1-10xp).</p>
                              </div>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  {/* Language Filter */}
                  <div className="w-full sm:w-40">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-2">
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
                          </SelectContent>
                      </Select>
                  </div>

                  {/* Time Range Filter */}
                  <div className="w-full sm:w-40">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block flex items-center gap-2">
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

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-foreground text-[10px] font-mono uppercase tracking-widest text-muted-foreground pb-2">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-6">Miner</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-3 text-right">
              {timeRange === 'lifetime' ? 'Lifetime XP' : 'XP Gained'}
          </div>
        </div>

        {/* List */}
        <div className="space-y-1 min-h-[300px]">
          {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
                  <Filter size={24} className="opacity-50" />
                  <span className="font-mono text-xs tracking-widest">CALCULATING RANKS...</span>
              </div>
          ) : profiles.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <span className="font-mono text-xs tracking-widest">NO DATA FOR THIS PERIOD</span>
              </div>
          ) : (
            profiles.map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = profile.id === user?.id;
              // Calculate level dynamically from XP (per-language or global)
              const level = Math.floor(Math.sqrt(profile.xp / 100)) + 1;

              return (
                <div
                  key={profile.id}
                  className={clsx(
                    "group relative grid grid-cols-12 gap-4 items-center py-4 md:py-5 border-b border-border/40 transition-all duration-300",
                    isCurrentUser ? "opacity-100 bg-secondary/10" : "opacity-70 hover:opacity-100"
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    <RankDisplay rank={rank} />
                  </div>
                  
                  {/* User Info */}
                  <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                      <span className={clsx(
                          "text-lg md:text-xl font-medium tracking-tight truncate",
                          isCurrentUser && "text-primary"
                      )}>
                          {profile.username || 'Anonymous'}
                      </span>
                      {isCurrentUser && (
                          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase tracking-widest">
                              You
                          </div>
                      )}
                  </div>

                  {/* Level (Hidden on small mobile) */}
                  <div className="hidden md:block col-span-2">
                    <span className="text-sm font-mono text-muted-foreground">
                      Lvl {level}
                    </span>
                  </div>
                  
                  {/* XP */}
                  <div className="col-span-3 md:col-span-3 text-right">
                      <span className="text-xl md:text-2xl font-light tracking-tight tabular-nums">
                          {profile.xp.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-1">xp</span>
                  </div>

                  {/* Hover Indicator Line */}
                  <div className="absolute bottom-0 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full opacity-20" />
                </div>
              );
            })
          )}
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
            'sm:max-w-md border-destructive/50 bg-destructive/10 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]',
            shake && 'animate-shake'
          )}
        >
          <div className="flex flex-col items-center text-center space-y-6 py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive blur-2xl opacity-20 animate-pulse rounded-full" />
              <div className="relative bg-background p-4 rounded-full border-2 border-destructive shadow-xl">
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

      // Client-side check (Server should also verify)
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
  ## features/settings/components/AudioSettings.tsx
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
            onChange={(value) =>
              updateTts({ provider: value as UserSettings['tts']['provider'], voiceURI: null })
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
            onChange={(value) =>
              updateTts({ voiceURI: value === 'default' ? null : value })
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
  ## features/settings/components/DataSettings.tsx
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
  ## features/settings/components/GeneralSettings.tsx
  import React from 'react';
  import { LANGUAGE_NAMES } from '@/constants';
  import { UserSettings } from '@/types';
  import { EditorialSelect } from '@/components/form/EditorialSelect';
  import { MetaLabel } from '@/components/form/MetaLabel';
  import { Switch } from '@/components/ui/switch';
  import { ColorPicker } from '@/components/ui/color-picker';
  import { useTheme } from '@/contexts/ThemeContext';
  import { Input } from '@/components/ui/input';

  interface GeneralSettingsProps {
    localSettings: UserSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
    username: string;
    setUsername: (username: string) => void;
  }

  export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
    localSettings, 
    setLocalSettings,
    username,
    setUsername
  }) => {
    const { theme, setTheme } = useTheme();

    return (
      <div className="space-y-6 md:space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
        <section>
          <MetaLabel>Profile</MetaLabel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Username</div>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              This is how you'll appear on the leaderboard.
            </p>
          </div>
        </section>

        <section>
          <MetaLabel>AI Configuration</MetaLabel>
          <div className="space-y-2">
            <div className="text-sm font-medium">Gemini API Key</div>
            <Input
              type="password"
              value={localSettings.geminiApiKey || ''}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
              placeholder="AIzaSy..."
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Required for Auto-Fill and Card Generation.
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="ml-1 underline hover:text-primary">
                Get a free key here.
              </a>
            </p>
          </div>
        </section>

        <section>
          <MetaLabel>Target Language</MetaLabel>
          <EditorialSelect
            value={localSettings.language}
            onChange={(value) =>
              setLocalSettings((prev) => ({
                ...prev,
                language: value as UserSettings['language'],
              }))
            }
            options={['polish', 'norwegian', 'japanese', 'spanish'].map((language) => ({
              value: language,
              label: LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES],
            }))}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Switching languages will filter your card view. It does not delete data.
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
        {/* UPDATED: Responsive height and padding */}
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl h-[90vh] md:h-[600px] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-background border border-border shadow-2xl rounded-xl">
          
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
                          className="bg-primary/50 text-primary-foreground border border-primary px-8 py-2 text-xs font-mono uppercase tracking-wider rounded-md hover:bg-primary/70 transition-all flex items-center gap-2"
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
  ## features/settings/components/StudySettings.tsx
  import React from 'react';
  import { UserSettings } from '@/types';
  import { EditorialInput } from '@/components/form/EditorialInput';
  import { MetaLabel } from '@/components/form/MetaLabel';
  import { LANGUAGE_NAMES } from '@/constants';

  interface StudySettingsProps {
    localSettings: UserSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  }

  export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
    const currentLangName = LANGUAGE_NAMES[localSettings.language];
    const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
    const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

    return (
      <div className="space-y-10 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="bg-secondary/20 p-4 rounded text-xs text-muted-foreground leading-relaxed mb-6">
          These limits apply specifically to your <strong>{currentLangName}</strong> deck.
        </div>
        <section>
          <MetaLabel>New Cards / Day</MetaLabel>
          <EditorialInput
            type="number"
            value={currentDailyNew}
            onChange={(event) => {
              const val = parseInt(event.target.value, 10) || 0;
              setLocalSettings(prev => ({
                ...prev,
                dailyNewLimits: {
                  ...prev.dailyNewLimits,
                  [prev.language]: val
                }
              }));
            }}
          />
        </section>
        <section>
          <MetaLabel>Reviews / Day</MetaLabel>
          <EditorialInput
            type="number"
            value={currentDailyReview}
            onChange={(event) => {
              const val = parseInt(event.target.value, 10) || 0;
              setLocalSettings(prev => ({
                ...prev,
                dailyReviewLimits: {
                  ...prev.dailyReviewLimits,
                  [prev.language]: val
                }
              }));
            }}
          />
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
  ## features/study/components/Flashcard.tsx
  import React, { useMemo, useEffect, useCallback, useState } from 'react';
  import { Card, Language } from '@/types';
  import { escapeRegExp, parseFurigana, cn } from '@/lib/utils';
  import { ttsService } from '@/services/tts';
  import { useSettings } from '@/contexts/SettingsContext';
  import { useSabotage } from '@/contexts/SabotageContext';
  import { uwuify, FAKE_ANSWERS } from '@/lib/memeUtils';
  import { Play } from 'lucide-react';

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
    const { isCursedWith } = useSabotage();
    const [isRevealed, setIsRevealed] = useState(!blindMode);
    
    const hasSpokenRef = React.useRef<string | null>(null);
    
    // Gaslight State
    const [displayedTranslation, setDisplayedTranslation] = useState(card.nativeTranslation);
    const [isGaslit, setIsGaslit] = useState(false);

    useEffect(() => { setIsRevealed(!blindMode); }, [card.id, blindMode]);
    useEffect(() => { if (isFlipped) setIsRevealed(true); }, [isFlipped]);
    
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

    const processText = (text: string) => {
        if (isCursedWith('uwu')) return uwuify(text);
        return text;
    };
    
    const speak = useCallback(() => {
      ttsService.speak(card.targetSentence, language, settings.tts);
    }, [card.targetSentence, language, settings.tts]);

    useEffect(() => {
      if (hasSpokenRef.current !== card.id) {
        hasSpokenRef.current = null;
      }

      if (autoPlayAudio && hasSpokenRef.current !== card.id) {
        speak();
        hasSpokenRef.current = card.id;
      }
      
      return () => {
        ttsService.stop();
      };
    }, [card.id, autoPlayAudio, speak]);

    const displayedSentence = processText(card.targetSentence);

    // --- DYNAMIC FONT SCALING ---
    const fontSizeClass = useMemo(() => {
      const cleanLength = language === 'japanese' && card.furigana 
          ? parseFurigana(card.furigana).reduce((acc, curr) => acc + curr.text.length, 0)
          : displayedSentence.length;

      if (cleanLength < 10) return "text-6xl md:text-8xl"; 
      if (cleanLength < 20) return "text-5xl md:text-7xl"; 
      if (cleanLength < 40) return "text-4xl md:text-6xl"; 
      if (cleanLength < 80) return "text-3xl md:text-5xl"; 
      return "text-2xl md:text-4xl"; 
    }, [displayedSentence, language, card.furigana]);

    const RenderedSentence = useMemo(() => {
      const baseClasses = cn(
          "font-medium tracking-tight leading-tight text-center transition-all duration-500 text-balance max-w-5xl mx-auto",
          fontSizeClass
      );
      
      if (!isRevealed) {
        return (
          <div 
            onClick={() => setIsRevealed(true)}
            className="cursor-pointer group flex flex-col items-center gap-4"
          >
            <p className={cn(baseClasses, "blur-xl opacity-20 group-hover:opacity-30")}>
              {displayedSentence}
            </p>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Reveal
            </span>
          </div>
        );
      }

      if (language === 'japanese' && card.furigana) {
        const segments = parseFurigana(card.furigana);
        return (
          <div className={cn(baseClasses, "flex flex-wrap justify-center items-end gap-x-[0.1em] leading-relaxed")}>
            {segments.map((segment, i) => {
              const isPartOfTarget = card.targetWord && (
                card.targetWord === segment.text || 
                card.targetWord.includes(segment.text) ||
                segment.text === card.targetWord
              );
              
              if (segment.furigana) {
                return (
                  <div key={i} className="group flex flex-col items-center justify-end">
                    {/* FIX: Changed opacity-70 to opacity-0 so it is hidden by default */}
                    <span className="text-[0.5em] text-muted-foreground mb-[0.1em] select-none opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                        {processText(segment.furigana)}
                    </span>
                    <span className={isPartOfTarget ? "text-primary" : ""}>
                        {processText(segment.text)}
                    </span>
                  </div>
                );
              }
              return (
                <span key={i} className={isPartOfTarget ? "text-primary" : ""}>
                    {processText(segment.text)}
                </span>
              );
            })}
          </div>
        );
      }

      if (card.targetWord) {
          const rawTarget = card.targetWord;
          const parts = displayedSentence.split(new RegExp(`(${escapeRegExp(rawTarget)})`, 'gi'));
          
          if (parts.length === 1 && parts[0] === displayedSentence && isCursedWith('uwu')) {
              return <p className={baseClasses}>{displayedSentence}</p>;
          }

          return (
              <p className={baseClasses}>
                  {parts.map((part, i) => 
                      part.toLowerCase() === rawTarget.toLowerCase() 
                      ? <span key={i} className="text-primary border-b-2 border-primary/30">{processText(part)}</span> 
                      : <span key={i}>{processText(part)}</span>
                  )}
              </p>
          );
      }

      return <p className={baseClasses}>{displayedSentence}</p>;
    }, [displayedSentence, card.targetWord, card.furigana, isRevealed, language, isCursedWith, fontSizeClass]);

    const containerClasses = cn(
        "w-full max-w-6xl mx-auto flex flex-col items-center justify-center h-full transition-all duration-700",
        isCursedWith('rotate') && "rotate-180",
        isCursedWith('comic_sans') && "font-['Comic_Sans_MS']",
        isCursedWith('blur') && "animate-pulse blur-[1px]"
    );

    return (
      <div className={containerClasses}>
        {/* Main Content */}
        <div className="w-full px-6 flex flex-col items-center gap-8">
          {RenderedSentence}
          
          {/* Audio Control */}
          <button 
              onClick={speak}
              className="text-muted-foreground hover:text-foreground transition-colors p-4 rounded-full hover:bg-secondary/50"
          >
                  <Play size={24} fill="currentColor" className="opacity-50" />
          </button>
        </div>

        {/* Back Side / Answer */}
        {isFlipped && (
          <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
              <div className="h-px w-12 bg-border mb-4" />
              {showTranslation && (
                  <div className="relative">
                      <p className={cn(
                          "text-xl md:text-2xl text-muted-foreground font-light text-center max-w-2xl leading-relaxed text-balance",
                          isGaslit && "text-destructive animate-pulse"
                      )}>
                          {processText(displayedTranslation)}
                      </p>
                      {isGaslit && (
                          <p className="absolute -right-16 top-0 text-[8px] uppercase tracking-widest text-destructive -rotate-12 opacity-50">
                              Gaslit
                          </p>
                      )}
                  </div>
              )}
              {card.notes && (
                  <p className="text-sm font-mono text-muted-foreground/60 mt-2 max-w-md text-center">
                      {processText(card.notes)}
                  </p>
              )}
          </div>
        )}
      </div>
    );
  };
  ## features/study/components/StudySession.tsx
  import React, { useEffect, useMemo, useRef } from 'react';
  import { X, Undo2, Archive } from 'lucide-react';
  import { Card, Grade } from '@/types';
  import { useSettings } from '@/contexts/SettingsContext';
  import { Flashcard } from './Flashcard';
  import { useStudySession } from '../hooks/useStudySession';
  import clsx from 'clsx';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

  const getCardStatus = (card: Card) => {
    // FSRS State: New=0, Learning=1, Review=2, Relearning=3
    if (card.state === 0 || (card.state === undefined && card.status === 'new')) 
      return { text: 'Unseen', className: 'text-blue-500' };
    if (card.state === 1 || (card.state === undefined && card.status === 'learning')) 
      return { text: 'Learning', className: 'text-orange-500' };
    if (card.state === 3) 
      return { text: 'Lapse', className: 'text-red-500' };
    return { text: 'Mature', className: 'text-green-500' };
  };

  const getQueueCounts = (cards: Card[]) => {
    return cards.reduce(
      (acc, card) => {
        const state = card.state;
        if (state === 0 || (state === undefined && card.status === 'new')) {
          acc.unseen++;
        } else if (state === 1 || (state === undefined && card.status === 'learning')) {
          acc.learning++;
        } else if (state === 3) {
          acc.lapse++;
        } else {
          acc.mature++;
        }
        return acc;
      },
      { unseen: 0, learning: 0, lapse: 0, mature: 0 }
    );
  };

  interface StudySessionProps {
    dueCards: Card[];
    onUpdateCard: (card: Card) => void;
    onRecordReview: (oldCard: Card, grade: Grade) => void;
    onExit: () => void;
    onComplete?: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
  }

  export const StudySession: React.FC<StudySessionProps> = ({
    dueCards,
    onUpdateCard,
    onRecordReview,
    onExit,
    onComplete,
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
      handleGrade,
      handleMarkKnown,
      handleUndo,
      progress,
      isProcessing,
    } = useStudySession({
      dueCards,
      settings,
      onUpdateCard,
      onRecordReview,
      canUndo,
      onUndo,
    });

    const counts = useMemo(() => {
      return getQueueCounts(sessionCards.slice(currentIndex));
    }, [sessionCards, currentIndex]);

    const stateRef = useRef({ 
      isFlipped, 
      sessionComplete, 
      currentCard,
      canUndo,
      isProcessing,
    });

    const handleGradeRef = useRef(handleGrade);
    const handleMarkKnownRef = useRef(handleMarkKnown);
    const handleUndoRef = useRef(handleUndo);
    const onUndoRef = useRef(onUndo);
    const onExitRef = useRef(onExit);

    useEffect(() => {
      stateRef.current = { isFlipped, sessionComplete, currentCard, canUndo, isProcessing };
    }, [isFlipped, sessionComplete, currentCard, canUndo, isProcessing]);

    useEffect(() => {
      handleGradeRef.current = handleGrade;
      handleMarkKnownRef.current = handleMarkKnown;
      handleUndoRef.current = handleUndo;
      onUndoRef.current = onUndo;
      onExitRef.current = onExit;
    }, [handleGrade, handleMarkKnown, handleUndo, onUndo, onExit]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const state = stateRef.current;
        if (!state.currentCard && !state.sessionComplete) return;
        
        if (!state.isFlipped && !state.sessionComplete && e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(true);
        } else if (state.isFlipped && !state.sessionComplete && !state.isProcessing) {
          if (e.code === 'Space' || e.key === '2') { e.preventDefault(); handleGradeRef.current('Good'); }
          else if (e.key === '1') { e.preventDefault(); handleGradeRef.current('Again'); }
          else if (e.key === '3') { e.preventDefault(); handleGradeRef.current('Easy'); }
          else if (e.key === '4') { e.preventDefault(); handleGradeRef.current('Hard'); }
        }

        if (e.code === 'KeyK' && !state.sessionComplete && !state.isProcessing) {
          e.preventDefault();
          handleMarkKnownRef.current();
        }

        if (e.key === 'z' && state.canUndo && onUndoRef.current) {
          e.preventDefault();
          handleUndoRef.current();
        }
        if (e.key === 'Escape') onExitRef.current();
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (sessionComplete) {
      return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-light tracking-tighter">Session Complete</h2>
            <p className="text-muted-foreground">Queue cleared for now.</p>
            
            <button 
              onClick={() => onComplete ? onComplete() : onExit()}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md text-sm font-mono uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Finish & Claim Rewards
            </button>
          </div>
        </div>
      );
    }

    if (!currentCard) return null;

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Minimal Progress Bar */}
        <div className="h-1 w-full bg-secondary/30 shrink-0">
          <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }} 
          />
        </div>

        {/* Controls Overlay (Top) */}
        {/* Mobile: Smaller padding to gain vertical space */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
          <div className="flex items-center gap-2 md:gap-4 font-mono text-xs pointer-events-auto">
              {/* Counters: Boxed on mobile for legibility, simple text on desktop */}
              <div className="flex gap-3 md:gap-6 font-bold bg-background/90 backdrop-blur border border-border/50 px-3 py-2 md:py-0 rounded-md md:rounded-none md:border-none md:bg-transparent shadow-sm md:shadow-none">
                <span className="text-blue-500" title="Unseen">{counts.unseen}</span>
                <span className="text-red-500" title="Lapse">{counts.lapse}</span>
                <span className="text-orange-500" title="Learning">{counts.learning}</span>
                <span className="text-green-500" title="Mature">{counts.mature}</span>
              </div>

              {/* Status Label: Hidden on mobile to prevent collision */}
              <div className="hidden sm:flex items-center gap-4">
                  <span className="text-muted-foreground/30">|</span>
                  {(() => {
                      const status = getCardStatus(currentCard);
                      return (
                          <span className={clsx("font-bold uppercase tracking-wider", status.className)}>
                              {status.text}
                          </span>
                      );
                  })()}
              </div>
          </div>

          {/* Action Buttons: Boxed on mobile for consistency */}
          <div className="flex gap-2 md:gap-4 pointer-events-auto bg-background/90 backdrop-blur border border-border/50 p-1 rounded-md md:rounded-none md:border-none md:bg-transparent md:p-0 shadow-sm md:shadow-none">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={handleMarkKnown} 
                      disabled={isProcessing}
                      className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <Archive size={18} className="md:w-5 md:h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark as Known (K)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {canUndo && (
                  <button onClick={handleUndo} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Undo2 size={18} className="md:w-5 md:h-5" />
                  </button>
              )}
              <button onClick={onExit} className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} className="md:w-5 md:h-5" />
              </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative">
          <Flashcard 
              card={currentCard} 
              isFlipped={isFlipped} 
              autoPlayAudio={settings.autoPlayAudio || settings.blindMode}
              blindMode={settings.blindMode}
              showTranslation={settings.showTranslationAfterFlip}
              language={settings.language}
            />
        </div>

        {/* Bottom Actions */}
        <div className="h-32 md:h-40 shrink-0 flex items-center justify-center px-4 md:px-6 pb-6 md:pb-8">
          {!isFlipped ? (
              <button 
                onClick={() => setIsFlipped(true)}
                disabled={isProcessing}
                className="w-full max-w-md h-14 rounded-md border border-border/50 hover:border-foreground/50 hover:bg-secondary/50 transition-all text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Reveal Answer'}
              </button>
          ) : (
              <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
                <button 
                  onClick={() => handleGrade('Again')}
                  disabled={isProcessing}
                  className="group h-16 rounded-md border border-border/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground group-hover:text-red-500">Again</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">1</span>
                </button>
                <button 
                  onClick={() => handleGrade('Good')}
                  disabled={isProcessing}
                  className="group h-16 rounded-md border border-primary/30 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-foreground group-hover:text-primary">Good</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">Space</span>
                </button>
              </div>
          )}
        </div>
      </div>
    );
  };
  ## features/study/hooks/useStudySession.ts
  import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    const [actionHistory, setActionHistory] = useState<{ addedCard: boolean }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const isInitialized = useRef(false);
    
    // Synchronous ref to prevent race condition in keyboard event handler
    const isProcessingRef = useRef(false);

    // Initialize session only once to prevent index resets when dueCards change during reviews
    useEffect(() => {
      if (!isInitialized.current && dueCards.length > 0) {
        setSessionCards(dueCards);
        setCurrentIndex(0);
        setSessionComplete(dueCards.length === 0);
        setActionHistory([]);
        isInitialized.current = true;
      }
    }, [dueCards]);

    const currentCard = sessionCards[currentIndex];

    const isCurrentCardDue = useMemo(() => {
      if (!currentCard) return false;
      const now = new Date();
      // Relaxed check: treat the current card as reviewable if its dueDate <= now.
      // Early reviews (slightly in future) are managed by queue logic; we don't gate UI here.
      return isCardDue(currentCard, now);
    }, [currentCard]);

    const handleGrade = useCallback(
      async (grade: Grade) => {
        // Check synchronous ref instead of state
        if (!currentCard || isProcessingRef.current) return;
        
        // Lock immediately before any async operations
        isProcessingRef.current = true;
        setIsProcessing(true);
        
        try {
          const updatedCard = calculateNextReview(currentCard, grade, settings.fsrs);
          // Sequence: update card, then record review. Fail fast without advancing index.
          await Promise.resolve(onUpdateCard(updatedCard));
          await Promise.resolve(onRecordReview(currentCard, grade));

          let appended = false;
          if (updatedCard.status === 'learning') {
            setSessionCards((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === updatedCard.id) return prev; // Prevent duplicate append
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
          // Unlock synchronously
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
        const updatedCard: Card = {
          ...currentCard,
          status: 'known',
        };

        await Promise.resolve(onUpdateCard(updatedCard));
        
        // We don't record a review for "known" as it's a manual override,
        // but we do advance the queue.
        setActionHistory((prev) => [...prev, { addedCard: false }]);

        if (currentIndex < sessionCards.length - 1) {
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
    }, [currentCard, currentIndex, onUpdateCard, sessionCards.length]);

    const handleUndo = useCallback(() => {
      if (!canUndo || !onUndo) return;
      onUndo();
      
      if (currentIndex > 0 || sessionComplete) {
        setActionHistory((prev) => {
          const newHistory = prev.slice(0, -1);
          const lastAction = prev[prev.length - 1];
          
          // If the last action added a card to the queue (learning status),
          // remove that ghost card from the end of sessionCards
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
    
    // Ensure we map the status back to a State if state is missing (e.g. imported cards)
    let currentState = card.state;
    if (currentState === undefined) {
        if (card.status === 'new') currentState = State.New;
        else if (card.status === 'learning') currentState = State.Learning;
        else currentState = State.Review;
    }

    const lastReviewDate = card.last_review ? new Date(card.last_review) : undefined;

    // If somehow state is Review but no last_review exists, force New to prevent crash
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
    // Standard review cards are due if their date is before or equal to "Today" (4AM cutoff)
    // OR if the specific time has passed (fallback for weird timezones/migrations)
    return isBefore(due, srsToday) || due <= now;
  };
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

  export const AppRoutes: React.FC = () => (
    <Routes>
      <Route path="/" element={<DashboardRoute />} />
      <Route path="/study" element={<StudyRoute />} />
      <Route path="/cards" element={<CardsRoute />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
  ## routes/CardsRoute.tsx
  import React, { useState, useEffect, useCallback } from 'react';
  import { Search, ChevronLeft, ChevronRight, Plus, Sparkles, Zap, X, Trash2 } from 'lucide-react';
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

  const StatItem = ({ label, value }: { label: string; value: number }) => (
      <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className="text-2xl font-light tracking-tight tabular-nums">{value}</span>
      </div>
  );

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

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    // Add state to track the last clicked index for range selection
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(searchTerm);
        setPage(0);
      }, 300);
      return () => clearTimeout(timer);
    }, [searchTerm]);

    // Clear selection when page or search changes to avoid confusion
    useEffect(() => {
      setSelectedIds(new Set());
      setLastSelectedIndex(null); // Reset this too
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

          // RANGE SELECTION (Shift + Click)
          if (isShift && lastSelectedIndex !== null) {
              const start = Math.min(lastSelectedIndex, index);
              const end = Math.max(lastSelectedIndex, index);
              
              // Get all IDs in the range from the current visible cards
              const idsInRange = cards.slice(start, end + 1).map(c => c.id);
              
              // Determine target state based on the card clicked
              // If the clicked card was NOT selected, we select the whole range.
              // If it WAS selected, strictly speaking we usually still select the range in file explorers,
              // but let's stick to "Add range to selection" for simplicity.
              const shouldSelect = !prev.has(id);

              if (shouldSelect) {
                  idsInRange.forEach(rangeId => next.add(rangeId));
              } else {
                  // Optional: If you want shift-click to deselect a range if the target is deselected
                  idsInRange.forEach(rangeId => next.delete(rangeId));
              }
          } 
          // SINGLE SELECTION (No Shift)
          else {
              if (next.has(id)) next.delete(id);
              else next.add(id);
              
              // Only update the anchor point on a single click
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
      if (confirm(`Are you sure you want to delete ${selectedIds.size} cards?`)) {
          const ids = Array.from(selectedIds);
          // We don't have a batch delete hook yet, so loop for now (or add one later)
          // For UI responsiveness, we'll just use a loop but a real batch RPC is better for production
          for (const id of ids) {
              await deleteCard(id);
          }
          setSelectedIds(new Set());
          toast.success("Deleted selected cards");
      }
    };

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full animate-in fade-in duration-700 relative">
          
          {/* Header Stats Section */}
          <div className="pt-6 pb-12 border-b border-border/40 mb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="space-y-6">
                      <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              {settings.language} Database
                          </span>
                      </div>
                      <h1 className="text-6xl md:text-7xl font-light tracking-tighter text-foreground leading-[0.8]">
                          Index
                      </h1>
                  </div>

                  <div className="flex gap-12 pr-4">
                      <StatItem label="Total Cards" value={stats.total} />
                      <div className="w-px bg-border/40 h-10 self-center hidden sm:block" />
                      <StatItem label="Learned" value={stats.learned} />
                  </div>
              </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-end mb-6 px-1">
              <div className="relative w-full md:max-w-md group">
                  <Search size={16} className="absolute left-0 top-3 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                  <input 
                      type="text"
                      placeholder="Search sentence or translation..."
                      className="w-full bg-transparent border-b border-border/60 py-2.5 pl-8 text-base font-light outline-none focus:border-foreground transition-all placeholder:text-muted-foreground/40"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                      onClick={() => setIsGenerateModalOpen(true)} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border hover:border-foreground/50 hover:bg-secondary/20 transition-all text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                      <Sparkles size={14} />
                      <span>AI Gen</span>
                  </button>
                  <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all text-xs font-mono uppercase tracking-widest"
                  >
                      <Plus size={14} />
                      <span>New Entry</span>
                  </button>
              </div>
          </div>

          {/* Table / List Area */}
          <div className="flex-1 min-h-0 flex flex-col border-t border-border/40 relative">
              <div className="hidden md:flex items-center px-1 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 border-b border-border/40">
                  <div className="w-10 flex justify-center">
                      {/* Select All placeholder - for now just a label */}
                  </div>
                  <div className="flex-1">Content</div>
                  <div className="w-20 mr-4">Status</div>
                  <div className="w-20 mr-4">Progress</div>
                  <div className="w-24 mr-4 text-right">Schedule</div>
                  <div className="w-10 mr-2"></div>
              </div>

              {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Loading Index...</span>
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
                  />
              )}
          </div>

          {/* Pagination */}
          <div className="py-4 flex items-center justify-between border-t border-border/40 mt-auto">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {totalCount} entries found
              </span>
              
              <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Page {page + 1}
                  </span>
                  <div className="flex gap-1">
                      <button
                          onClick={() => setPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          className="p-2 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                          <ChevronLeft size={14} />
                      </button>
                      <button
                          onClick={() => {
                              if (!isPlaceholderData && (page + 1) * pageSize < totalCount) {
                                  setPage(p => p + 1);
                              }
                          }}
                          disabled={isPlaceholderData || (page + 1) * pageSize >= totalCount}
                          className="p-2 rounded hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                          <ChevronRight size={14} />
                      </button>
                  </div>
              </div>
          </div>

          {/* Batch Action Floating Bar */}
          <div className={clsx(
              "absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-300",
              selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
          )}>
              <div className="bg-foreground text-background px-4 py-3 rounded-full shadow-xl flex items-center gap-6">
                  <div className="flex items-center gap-3 pl-2">
                      <div className="w-5 h-5 bg-background text-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {selectedIds.size}
                      </div>
                      <span className="text-xs font-mono uppercase tracking-widest">Selected</span>
                  </div>
                  
                  <div className="h-4 w-px bg-background/20" />
                  
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={handleBatchPrioritize}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-background/20 transition-colors text-xs font-mono uppercase tracking-wider"
                      >
                          <Zap size={14} /> Learn Now
                      </button>
                      <button 
                          onClick={handleBatchDelete}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors text-xs font-mono uppercase tracking-wider"
                      >
                          <Trash2 size={14} /> Delete
                      </button>
                  </div>

                  <div className="h-4 w-px bg-background/20" />

                  <button 
                      onClick={() => setSelectedIds(new Set())}
                      className="p-1.5 hover:bg-background/20 rounded-full transition-colors"
                  >
                      <X size={14} />
                  </button>
              </div>
          </div>

          {/* Modals */}
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
  import { applyStudyLimits } from '@/services/studyLimits';
  import {
    getCramCards,
    getDueCards,
  } from '@/services/db/repositories/cardRepository';
  import { getTodayReviewStats } from '@/services/db/repositories/statsRepository';
  import { useClaimDailyBonusMutation } from '@/features/deck/hooks/useDeckQueries';

  export const StudyRoute: React.FC = () => {
    const { recordReview, undoReview, canUndo } = useDeck();
    const { updateCard } = useCardOperations();
    const { settings } = useSettings();
    const claimBonus = useClaimDailyBonusMutation();
    
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
            const currentNewLimit = settings.dailyNewLimits?.[settings.language] ?? 20;
            const currentReviewLimit = settings.dailyReviewLimits?.[settings.language] ?? 100;
            const limited = applyStudyLimits(due, {
              dailyNewLimit: currentNewLimit,
              dailyReviewLimit: currentReviewLimit,
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
    }, [settings.dailyNewLimits, settings.dailyReviewLimits, settings.language, isCramMode, searchParams]);

    const handleUpdateCard = (card: Card) => {
      // Prevent SRS updates in Cram Mode. 
      // Only allow status updates if the user explicitly archives the card (sets to 'known').
      if (isCramMode) {
        if (card.status === 'known') {
          updateCard(card);
        }
        return;
      }
      updateCard(card);
    };

    const handleRecordReview = (card: Card, grade: Grade) => {
      if (!isCramMode) {
        recordReview(card, grade);
      }
    };

    const handleSessionComplete = () => {
      // Only claim daily bonus for real study sessions
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
        onUpdateCard={handleUpdateCard}
        onRecordReview={handleRecordReview}
        onExit={() => navigate('/')}
        onComplete={handleSessionComplete}
        onUndo={isCramMode ? undefined : undoReview}
        canUndo={isCramMode ? false : canUndo}
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

  // Lightweight selection for dashboard retention & forecast computations
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
    // Batch to avoid oversized payloads for very large imports
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

  export const getDueCards = async (now: Date = new Date(), language?: Language): Promise<Card[]> => {
    const userId = await ensureUser();
    const srsToday = getSRSDate(now);
    const cutoffDate = new Date(srsToday);
    cutoffDate.setDate(cutoffDate.getDate() + 1);

    let query = supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'known')
      .lte('due_date', cutoffDate.toISOString())
      .order('due_date', { ascending: true });

    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query.limit(1000);
    if (error) throw error;
    return (data ?? []).map(mapToCard);
  };

  export const getCramCards = async (limit: number, tag?: string, language?: Language): Promise<Card[]> => {
    const userId = await ensureUser();
    // Use server-side randomization via RPC to avoid fetching entire table into memory.
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
  ## services/db/repositories/statsRepository.ts
  import { getSRSDate } from '@/features/study/logic/srs';
  import { SRS_CONFIG } from '@/constants';
  import { supabase } from '@/lib/supabase';
  import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

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
    let query = supabase
      .from('cards')
      .select('status, due_date')
      .eq('user_id', userId);

    if (language) {
      query = query.eq('language', language);
    }

    const { data: cardsData, error: cardsError } = await query;
    if (cardsError) throw cardsError;

    const cards = cardsData ?? [];

    // Language specific XP via RPC (returns 0 if no language or no data)
    let languageXp = 0;
    if (language) {
      const { data: xpData, error: xpError } = await supabase.rpc('get_user_language_xp', {
        target_language: language
      });
      if (!xpError && typeof xpData === 'number') {
        languageXp = xpData;
      }
    }

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

  // Map app language codes to BCP 47 language tags
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
      * Cleanup method to properly dispose of AudioContext and prevent memory leaks
      * Call this when the service is being destroyed or on app unmount
      */
      dispose() {
          this.stop();
          if (this.audioContext) {
              this.audioContext.close().catch(() => {});
              this.audioContext = null;
          }
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
          // Abort any in-flight network request before starting new speak
          if (this.abortController) {
              this.abortController.abort();
          }
          this.stop();
          const opId = ++this.currentOperationId;
          this.abortController = new AbortController();

          
          if (settings.provider === 'browser') {
              this.speakBrowser(text, language, settings);
          } else if (settings.provider === 'google') {
              await this.speakGoogle(text, language, settings, opId);
          } else if (settings.provider === 'azure') {
              await this.speakAzure(text, language, settings, opId);
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

      private async speakGoogle(text: string, language: Language, settings: TTSSettings, opId: number) {
          if (!settings.googleApiKey) return;

          try {
              const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.googleApiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  signal: this.abortController?.signal,
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
              
              // Check if this operation is still the latest active one
              if (this.currentOperationId !== opId) return;
              
              if (data.audioContent) {
                  this.playAudioContent(data.audioContent, opId);
              }
          } catch (e: any) {
              if (e?.name === 'AbortError') return; // Silently ignore aborted fetches
              console.error("Google TTS error", e);
          }
      }

      private async speakAzure(text: string, language: Language, settings: TTSSettings, opId: number) {
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
                      'User-Agent': 'LinguaFlow'
                  },
                  signal: this.abortController?.signal,
                  body: ssml
              });

              if (!response.ok) throw new Error(await response.text());

              // Check if this operation is still the latest active one
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
              
              // CRITICAL CHECK: Ensure we are still on the same operation
              if (this.currentOperationId !== opId) return;

              if (this.currentSource) {
                  this.currentSource.stop();
              }
                          this.currentSource = this.audioContext.createBufferSource();
                          this.currentSource.buffer = decodedBuffer;
                          this.currentSource.connect(this.audioContext.destination);
                          this.currentSource.onended = () => {
                              // Suspend the context when idle to conserve resources & avoid autoplay blocking policies
                              if (this.audioContext && this.audioContext.state === 'running') {
                                  this.audioContext.suspend().catch(() => {});
                              }
                          };
                          // Resume if previously suspended (user initiated playback implied)
                          if (this.audioContext.state === 'suspended') {
                              try { await this.audioContext.resume(); } catch {}
                          }
                          this.currentSource.start(0);
          } catch (e) {
              console.error("Audio playback error", e);
          }
      }

      stop() {
          this.currentOperationId++; // Invalidate any pending async operations
          if (this.abortController) {
              this.abortController.abort();
              this.abortController = null;
          }
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
  // supabase/functions/generate-card/index.ts
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  serve(async (req: Request) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // 2. Parse Body safely
      let prompt, userApiKey;
      try {
        const body = await req.json();
        prompt = body.prompt;
        userApiKey = body.apiKey;
      } catch (e) {
        throw new Error("Invalid JSON body");
      }

      // 3. Resolve API Key
      const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY')
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing Gemini API Key' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 4. Call Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      // 5. CATCH-ALL: Ensure CORS headers are sent even on crash
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
    // Per-language study limits (migrated from single number fields)
    dailyNewLimits: Record<Language, number>;
    dailyReviewLimits: Record<Language, number>;
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
    geminiApiKey: string; // Gemini API key for client-side AI calls
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
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }