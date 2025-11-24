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