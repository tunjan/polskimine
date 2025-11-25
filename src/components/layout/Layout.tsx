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
      <SidebarHeader className="pt-8 pb-6">
        <div className="flex items-center justify-between px-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <div className="w-1.5 h-1.5 bg-terracotta rounded-full shrink-0" />
            <span className="font-serif text-[22px] font-light tracking-tight whitespace-nowrap text-foreground/90">LinguaFlow</span>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0 hover:bg-transparent hover:text-foreground/70" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Primary Nav */}
        <SidebarGroup className="px-0 py-4">
          <SidebarGroupLabel className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40 px-4 mb-3 font-normal">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
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
                      className={clsx(
                        "h-11 px-4 rounded-sm transition-all duration-200 relative group/item font-serif text-[15px] font-light tracking-wide",
                        isActive 
                          ? "text-foreground bg-terracotta/8 dark:bg-terracotta/12" 
                          : "text-muted-foreground/80 hover:text-foreground hover:bg-background/60"
                      )}
                    >
                      <Link to={item.to} className="flex items-center gap-4 w-full">
                        <item.icon size={18} strokeWidth={isActive ? 1.8 : 1.3} className="shrink-0" />
                        <span className="tracking-wide">{item.label}</span>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-terracotta rounded-r-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Elegant Separator */}
        <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent my-6 mx-4" />

        {/* Tools Section */}
        <SidebarGroup className="px-0 py-2">
          <SidebarGroupLabel className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40 px-4 mb-3 font-normal">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    onClick={item.onClick}
                    className="h-11 px-4 rounded-sm transition-all duration-200 text-muted-foreground/70 hover:text-foreground hover:bg-background/60 font-serif text-[15px] font-light tracking-wide"
                  >
                    <item.icon size={18} strokeWidth={1.3} className="shrink-0" />
                    <span className="tracking-wide">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden px-2 pb-6 pt-4">
        <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent mb-6" />
        
        <SidebarMenu className="gap-0.5">
          {/* Language Selector */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-11 px-4 rounded-sm text-muted-foreground/70 hover:text-foreground hover:bg-background/60 font-serif text-[15px] font-light tracking-wide">
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <currentLanguage.Flag className="w-full h-auto rounded-xs" />
                  </div>
                  <span className="tracking-wide">{currentLanguage.name}</span>
                  <ChevronUp className="ml-auto opacity-40" size={14} strokeWidth={1.5} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1.5 bg-background/95 backdrop-blur-sm border-border/40 rounded-lg shadow-lg">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-3 py-2.5 px-3 text-sm font-serif font-light rounded-sm"
                  >
                    <lang.Flag className="w-4 h-auto rounded-xs" />
                    <span className="flex-1 tracking-wide">{lang.name}</span>
                    {settings.language === lang.code && <Check size={14} className="ml-auto text-terracotta" strokeWidth={2} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => { onOpenSettings(); onCloseMobileMenu?.(); }}
              className="h-11 px-4 rounded-sm text-muted-foreground/70 hover:text-foreground hover:bg-background/60 font-serif text-[15px] font-light tracking-wide"
            >
              <Settings size={18} strokeWidth={1.3} />
              <span className="tracking-wide">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Info - Editorial style */}
        {user && (
          <div className="px-4 pt-6 pb-2 group-data-[collapsible=icon]:hidden border-t border-border/30 mt-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/35 truncate">
              {user.email}
            </p>
          </div>
        )}
        
        {/* Logout - Refined placement */}
        <SidebarMenu className="gap-0.5 mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { signOut(); onCloseMobileMenu?.(); }}
              className="h-10 px-4 rounded-sm text-red-600/60 dark:text-red-400/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 font-serif text-sm font-light tracking-wide transition-colors"
            >
              <LogOut size={16} strokeWidth={1.3} />
              <span className="tracking-wide">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_16px_rgba(0,0,0,0.2)]">
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
                strokeWidth={isActive ? 1.8 : 1.3}
                className={clsx(
                  "transition-all duration-200",
                  isActive ? "text-terracotta -translate-y-0.5" : "text-muted-foreground/70 group-hover:text-foreground"
                )}
              />
            </Link>
          );
        })}

        {/* Center FAB (Study) - Warm terracotta */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <Link
            to="/study"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-terracotta text-white shadow-lg shadow-terracotta/20 hover:shadow-terracotta/30 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-background"
          >
            <GraduationCap size={24} strokeWidth={1.8} className="ml-0.5" />
          </Link>
        </div>

        {/* Right Items */}
        <Link
          to="/leaderboard"
          className="flex flex-col items-center justify-center w-12 gap-1 group"
        >
          <Trophy
            size={20}
            strokeWidth={location.pathname === '/leaderboard' ? 1.8 : 1.3}
            className={clsx(
              "transition-all duration-200",
              location.pathname === '/leaderboard' ? "text-terracotta -translate-y-0.5" : "text-muted-foreground/70 group-hover:text-foreground"
            )}
          />
        </Link>

        {/* Menu Trigger using SidebarTrigger */}
        <SidebarTrigger className="flex flex-col items-center justify-center w-12 gap-1 hover:bg-transparent" />
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
          {/* Main Content Area */}
          <main className="flex-1 pb-20 md:pb-0">
            <div className="w-full h-full mx-auto max-w-7xl px-3 py-4 md:p-12">
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