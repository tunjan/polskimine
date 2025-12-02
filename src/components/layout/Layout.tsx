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
import { GameMenuItemChevron } from '@/components/ui/game-menu-item';
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
      <SidebarHeader className="pt-4 pb-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2 overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="text-sm font-medium tracking-tight whitespace-nowrap text-foreground" style={{ fontFamily: 'var(--font-sans)' }}>LinguaFlow</span>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0 hover:bg-transparent hover:text-foreground/60 h-7 w-7" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-2">
        {/* Primary Nav */}
        <SidebarGroup className="px-0 py-2 group-data-[collapsible=icon]:py-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-2 mb-2 font-light group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'var(--font-sans)' }}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 group-data-[collapsible=icon]:gap-1">
              {mainNavItems.map((item) => {
                const isActive = item.to === '/multiplayer'
                  ? location.pathname.startsWith(item.to)
                  : location.pathname === item.to;

                return (
                  <SidebarMenuItem key={item.to}>
                    <GameMenuItemChevron isActive={isActive}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        onClick={onCloseMobileMenu}
                        className={clsx(
                          "h-9 px-2 rounded-none transition-colors relative text-sm font-light group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center",
                          isActive 
                            ? "text-foreground bg-card/80" 
                            : "text-muted-foreground hover:text-foreground hover:bg-card/30"
                        )}
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        <Link to={item.to} className="flex items-center gap-2.5 w-full">
                          <item.icon size={14} strokeWidth={isActive ? 1.8 : 1.5} className="shrink-0" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </GameMenuItemChevron>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Separator */}
        <div className="h-px bg-border/50 my-3 mx-2 group-data-[collapsible=icon]:hidden" />

        {/* Tools Section */}
        <SidebarGroup className="px-0 py-2 group-data-[collapsible=icon]:py-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-2 mb-2 font-light group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'var(--font-sans)' }}>
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:gap-1">
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <GameMenuItemChevron>
                    <SidebarMenuButton 
                      onClick={item.onClick}
                      className="h-9 px-2 rounded-none transition-colors text-muted-foreground hover:text-foreground hover:bg-card/30 text-sm font-light group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      <item.icon size={14} strokeWidth={1.5} className="shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </GameMenuItemChevron>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden px-2 pb-4 pt-2">
        
        <SidebarMenu className="gap-0.5">
          {/* Language Selector */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  className="h-9 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/50 text-sm font-light"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <currentLanguage.Flag className="w-full h-auto rounded-sm" />
                  </div>
                  <span>{currentLanguage.name}</span>
                  <ChevronUp className="ml-auto opacity-40" size={12} strokeWidth={1.5} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="p-1">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      updateSettings({ language: lang.code });
                      toast.success(`Switched to ${lang.name}`);
                      onCloseMobileMenu?.();
                    }}
                    className="gap-2.5 py-2 px-2.5 text-sm font-light rounded-md"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    <lang.Flag className="w-4 h-auto rounded-sm" />
                    <span className="flex-1">{lang.name}</span>
                    {settings.language === lang.code && <Check size={14} className="ml-auto text-foreground" strokeWidth={2} />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => { onOpenSettings(); onCloseMobileMenu?.(); }}
              className="h-9 px-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/50 text-sm font-light"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <Settings size={14} strokeWidth={1.5} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Info */}
        {user && (
          <div className="px-2 pt-3 pb-1 group-data-[collapsible=icon]:hidden border-t border-border/30 mt-3">
            <p className="text-[10px] tracking-[0.1em] text-muted-foreground/60 truncate" style={{ fontFamily: 'var(--font-sans)' }}>
              {user.email}
            </p>
          </div>
        )}
        
        {/* Logout */}
        <SidebarMenu className="gap-0.5 mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { signOut(); onCloseMobileMenu?.(); }}
              className="h-9 px-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-sm font-light transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <LogOut size={14} strokeWidth={1.5} />
              <span>Sign Out</span>
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between h-14 px-6 max-w-md mx-auto relative">

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
                size={18}
                strokeWidth={isActive ? 1.8 : 1.3}
                className={clsx(
                  "transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
            </Link>
          );
        })}

        {/* Center FAB (Study) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Link
            to="/study"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all border-4 border-background"
          >
            <GraduationCap size={20} strokeWidth={1.8} />
          </Link>
        </div>

        {/* Right Items */}
        <Link
          to="/leaderboard"
          className="flex flex-col items-center justify-center w-12 gap-1 group"
        >
          <Trophy
            size={18}
            strokeWidth={location.pathname === '/leaderboard' ? 1.8 : 1.3}
            className={clsx(
              "transition-colors",
              location.pathname === '/leaderboard' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
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
      <div className="min-h-screen bg-background text-foreground font-sans">
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
      <div className="min-h-screen bg-background text-foreground font-sans flex w-full">

        {/* Desktop Sidebar */}
        <AppSidebar {...sidebarProps} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Main Content Area */}
          <main className="flex-1 pb-16 md:pb-0">
            <div className="w-full h-full mx-auto max-w-6xl px-4 py-4 md:p-8">
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