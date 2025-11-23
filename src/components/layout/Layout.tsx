import React, { useState, useCallback } from 'react';
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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

// --- Shared Components ---

const NavLinkItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  className
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={clsx(
      "group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
      isActive 
        ? "bg-secondary/60 text-foreground" 
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
      className
    )}
  >
    <Icon 
      size={18} 
      strokeWidth={isActive ? 2 : 1.5} 
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

// --- Extracted Sidebar Component ---

const SidebarContent: React.FC<NavActionProps> = ({ 
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

  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo Area */}
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

      {/* Primary Nav */}
      <div className="space-y-1">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Menu</span>
        </div>
        <NavLinkItem 
          to="/" 
          icon={LayoutDashboard} 
          label="Overview" 
          isActive={location.pathname === '/'} 
          onClick={onCloseMobileMenu}
        />
        <NavLinkItem 
          to="/cards" 
          icon={ListIcon} 
          label="Index" 
          isActive={location.pathname === '/cards'} 
          onClick={onCloseMobileMenu}
        />
        <NavLinkItem 
          to="/study" 
          icon={GraduationCap} 
          label="Study" 
          isActive={location.pathname === '/study'} 
          onClick={onCloseMobileMenu}
        />
        <NavLinkItem 
          to="/leaderboard" 
          icon={Trophy} 
          label="Leaderboard" 
          isActive={location.pathname === '/leaderboard'} 
          onClick={onCloseMobileMenu}
        />
        <NavLinkItem 
          to="/multiplayer" 
          icon={Swords} 
          label="Deck Wars" 
          isActive={location.pathname.startsWith('/multiplayer')} 
          onClick={onCloseMobileMenu}
        />
      </div>

      {/* Tools Section */}
      <div className="mt-8 space-y-1">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Tools</span>
        </div>
        <ActionButton 
          icon={Plus} 
          label="Add Entry" 
          onClick={() => { onOpenAdd(); onCloseMobileMenu?.(); }} 
        />
        <ActionButton 
          icon={Zap} 
          label="Cram Mode" 
          onClick={() => { onOpenCram(); onCloseMobileMenu?.(); }} 
        />
        <ActionButton 
          icon={Skull} 
          label="Sabotage" 
          onClick={() => { onOpenSabotage(); onCloseMobileMenu?.(); }} 
        />
      </div>

      {/* Footer / User Area */}
      <div className="mt-auto pt-6 space-y-2 border-t border-border/40">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all group">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                        <currentLanguage.Flag className="w-full h-auto rounded-xs" />
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

        <button
          onClick={() => { onOpenSettings(); onCloseMobileMenu?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all"
        >
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <button
          onClick={() => { signOut(); onCloseMobileMenu?.(); }}
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
};

// --- Extracted Mobile Nav Component ---

const MobileBottomNav: React.FC<{ 
  isStudyMode: boolean; 
  sidebarProps: NavActionProps;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}> = ({ isStudyMode, sidebarProps, isMenuOpen, setIsMenuOpen }) => {
  const location = useLocation();
  
  // FIX: Don't render if in study mode, BUT ensure there is a way back in your Study page component.
  // If the study page is full screen, this is correct.
  if (isStudyMode) return null;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/cards', icon: ListIcon, label: 'Index' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-15 bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 px-6 pb-safe">
      <div className="flex items-center justify-between h-full max-w-md mx-auto relative">
        
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
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-background"
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

        {/* Menu Trigger */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-12 gap-1 group">
              <Menu size={20} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80 border-l border-border/40">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Main menu for mobile devices</SheetDescription>
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isStudyMode = location.pathname === '/study';

  // Memoize handlers to prevent prop churn
  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const sidebarProps: NavActionProps = {
    onOpenAdd: () => setIsAddModalOpen(true),
    onOpenCram: () => setIsCramModalOpen(true),
    onOpenSabotage: () => setIsSabotageOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onCloseMobileMenu: handleCloseMobileMenu
  };

  // Separate props for desktop sidebar (doesn't need to close mobile menu)
  const desktopSidebarProps: NavActionProps = {
    ...sidebarProps,
    onCloseMobileMenu: undefined // Don't trigger state updates on desktop
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
      
      {/* Desktop Sidebar - Fixed Left */}
      {!isStudyMode && (
        <aside className="hidden md:block fixed left-0 top-0 h-full w-64 border-r border-border/40 z-40 bg-background">
          <SidebarContent {...desktopSidebarProps} />
        </aside>
      )}

      {/* Mobile Top Bar (Logo Only) */}
      {!isStudyMode && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md z-40 flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-foreground text-background rounded-[4px] flex items-center justify-center">
                <Command size={12} strokeWidth={3} />
             </div>
             <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={clsx(
        "min-h-screen transition-all duration-300 ease-in-out",
        !isStudyMode ? "md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0" : "p-0"
      )}>
        <div className={clsx(
          "w-full h-full mx-auto",
          !isStudyMode ? "max-w-7xl p-4 md:p-12" : ""
        )}>
          {children}
          <SabotageNotification />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileBottomNav 
        isStudyMode={isStudyMode} 
        sidebarProps={sidebarProps}
        isMenuOpen={isMobileMenuOpen}
        setIsMenuOpen={setIsMobileMenuOpen}
      />

      {/* Global Modals */}
      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      <SabotageStore isOpen={isSabotageOpen} onClose={() => setIsSabotageOpen(false)} />
    </div>
  );
};