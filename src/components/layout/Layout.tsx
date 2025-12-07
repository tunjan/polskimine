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
  SidebarInset,
  SidebarSeparator
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PolishFlag, NorwegianFlag, JapaneseFlag, SpanishFlag, GermanFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
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
  const { signOut } = useAuth();
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
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-primary-foreground">
                    <currentLanguage.Flag className="w-full h-full object-cover rounded-sm" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentLanguage.name}</span>
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
                    {settings.language === lang.code && (
                      <span className="ml-auto text-xs text-muted-foreground">Active</span>
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground">
                  <span className='font-bold'>{profile.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile.username}</span>
                  <span className="truncate text-xs">Free Plan</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { signOut(); onCloseMobileMenu?.(); }}>
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
        <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
        <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar {...sidebarProps} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex-1 flex flex-col p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min md:flex-col overflow-y-auto">
            {children}
          </div>
        </div>
      </SidebarInset>

      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
    </SidebarProvider>
  );
};

