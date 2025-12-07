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
  Save,
  Download
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useCardOperations } from '@/features/deck/hooks/useCardOperations';
import { AddCardModal } from '@/features/deck/components/AddCardModal';

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
    { icon: Download, label: isSyncingLoad ? 'Loading...' : 'Import Changes', onClick: () => { if (!isSyncingLoad) { onSyncLoad(); } }, disabled: isSyncingLoad },
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
          <div className="w-full h-px bg-linear-to-r from-transparent via-border/50 to-transparent my-2" />
        </div>

        {/* Tools Section */}
        <SidebarGroup className="px-0 py-2 group-data-[collapsible=icon]:py-2">
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-3 mb-2 group-data-[collapsible=icon]:hidden">
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
          <div className="h-px flex-1 bg-linear-to-r from-border/40 to-transparent" />
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
              asChild
              className="h-8 px-3 rounded-none text-muted-foreground hover:text-foreground hover:bg-transparent text-[13px] tracking-wide group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/settings" onClick={onCloseMobileMenu}>
                <Settings size={14} strokeWidth={1.25} className="shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Info */}
        {profile && (
          <div className="px-3 py-2 group-data-[collapsible=icon]:hidden mt-1">
            <p className="text-[11px] text-muted-foreground/50 truncate tracking-wide uppercase">
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



interface MobileNavProps {
  onOpenAdd: () => void;
}

const MobileBottomNav: React.FC<MobileNavProps> = ({ onOpenAdd }) => {
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
                  "text-[10px] uppercase tracking-widest mt-0.5 transition-colors",
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

          {/* Add Button */}
          <button
            onClick={onOpenAdd}
            className="relative flex flex-col items-center justify-center w-14 h-14 group"
          >
            <div className="relative flex items-center justify-center w-8 h-8 transition-all">
              <Plus
                size={20}
                strokeWidth={1.5}
                className="text-muted-foreground group-hover:text-foreground transition-all"
              />
            </div>
            <span className="text-[10px] uppercase tracking-widest mt-0.5 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
              Add
            </span>
          </button>

          {/* Menu Trigger */}
          <div className="relative flex flex-col items-center justify-center w-14 h-14">
            <SidebarTrigger className="flex items-center justify-center w-8 h-8 hover:bg-transparent [&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:stroke-[1.2]" />
            <span className="text-[10px] uppercase tracking-widest mt-0.5 text-muted-foreground/70">
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
  const { saveToSyncFile, loadFromSyncFile, isSaving: isSyncing, isLoading: isSyncingLoad } = useSyncthingSync();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isCramModalOpen, setIsCramModalOpen] = useState(false);

  const isStudyMode = location.pathname === '/study';

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
        <main className="min-h-screen p-0">
          {children}
        </main>

        {/* Global Modals */}
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />

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
            <div className="w-full h-full overflow-y-auto md:overflow-y-auto [&:has(.page-full-height)]:overflow-hidden [&:has(.page-full-height)]:p-0 md:[&:has(.page-full-height)]:p-0">
              <div className="w-full min-h-full [&:has(.page-full-height)]:h-full">
                {children}
              </div>
            </div>
          </main>

          {/* Mobile Navigation */}
          <MobileBottomNav onOpenAdd={() => setIsAddModalOpen(true)} />
        </div>
      </div>

      {/* Global Modals */}
      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />

      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
    </SidebarProvider>
  );
};
