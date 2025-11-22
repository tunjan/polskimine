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
  Check
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
import { PolishFlag, NorwegianFlag, JapaneseFlag } from '@/components/ui/flags';
import { toast } from 'sonner';
import clsx from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addCard } = useCardOperations();
  const { settings, updateSettings } = useSettings();
  const { signOut } = useAuth();
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
  ] as const;

  const currentLanguage = languages.find(lang => lang.code === settings.language) || languages[0];

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: ListIcon, label: 'Index', path: '/cards' },
    { icon: GraduationCap, label: 'Study', path: '/study' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  ];

  const Navigation: React.FC<{ onInteract?: () => void }> = ({ onInteract }) => (
    <div className="flex flex-col h-full py-8 md:py-6">
      <div className="px-6 mb-12 md:mb-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
             <span className="text-background font-bold text-[10px] tracking-tighter">LF</span>
          </div>
          <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-4 md:px-3 space-y-1 md:space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                // Close sheet on mobile after navigation
                onInteract && onInteract();
              }}
              className={clsx(
                "flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md transition-all duration-200 group",
                isActive 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon className={clsx("w-6 h-6 md:w-4 md:h-4 transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={2} />
              <span className="text-lg md:text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        <div className="pt-8 md:pt-6 pb-4 md:pb-2 px-4 md:px-3">
          <p className="text-xs md:text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">Actions</p>
        </div>

        <button
          onClick={() => { setIsAddModalOpen(true); onInteract && onInteract(); }}
          className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200 group"
        >
            <Plus className="w-6 h-6 md:w-4 md:h-4" strokeWidth={2} />
            <span className="text-lg md:text-sm font-medium">Add Entry</span>
        </button>
        <button
          onClick={() => { setIsCramModalOpen(true); onInteract && onInteract(); }}
            className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200 group"
        >
            <Zap className="w-6 h-6 md:w-4 md:h-4" strokeWidth={2} />
            <span className="text-lg md:text-sm font-medium">Cram</span>
        </button>
        <button
          onClick={() => { setIsSabotageOpen(true); onInteract && onInteract(); }}
            className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200 group"
        >
            <Skull className="w-6 h-6 md:w-4 md:h-4" strokeWidth={2} />
            <span className="text-lg md:text-sm font-medium">Sabotage</span>
        </button>
      </nav>

      <div className="px-4 md:px-3 mt-auto space-y-2 md:space-y-1 pb-8 md:pb-0">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all group">
                <div className="flex items-center gap-4 md:gap-3">
                    <currentLanguage.Flag className="w-5 h-auto md:w-3.5 rounded-xs grayscale group-hover:grayscale-0 transition-all" />
                    <span className="text-lg md:text-sm font-medium">{currentLanguage.name}</span>
                </div>
                <ChevronUp size={14} className="text-muted-foreground group-hover:text-foreground opacity-50" />
            </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1">
            {languages.map((lang) => (
                <DropdownMenuItem
                key={lang.code}
                onClick={() => {
                    updateSettings({ language: lang.code });
                    toast.success(`Switched to ${lang.name}`);
              onInteract && onInteract();
                }}
                className="gap-3 py-2"
                >
                <lang.Flag className="w-3.5 h-auto rounded-xs" />
                <span className="font-medium text-sm">{lang.name}</span>
                {settings.language === lang.code && <Check size={14} className="ml-auto" />}
                </DropdownMenuItem>
            ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => { setIsSettingsOpen(true); onInteract && onInteract(); }}
          className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          <Settings className="w-6 h-6 md:w-4 md:h-4" strokeWidth={2} />
          <span className="text-lg md:text-sm font-medium">Settings</span>
        </button>
        <button
          onClick={() => { signOut(); onInteract && onInteract(); }}
          className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-6 h-6 md:w-4 md:h-4" strokeWidth={2} />
          <span className="text-lg md:text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      {/* Desktop Sidebar */}
      {!isStudyMode && (
        <aside className="hidden md:block fixed left-0 top-0 h-full w-60 border-r border-border/40 z-30 bg-background/50 backdrop-blur-xl">
          <Navigation />
        </aside>
      )}

      {/* Mobile Header */}
      {!isStudyMode && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
                <span className="text-background font-bold text-[8px] tracking-tighter">LF</span>
             </div>
             <span className="font-semibold tracking-tight text-sm">LinguaFlow</span>
          </div>
          {/* Controlled Sheet for mobile sidebar */}
          <Sheet
            // Radix Dialog root supports controlled open state
            open={isMobileNavOpen}
            onOpenChange={(open) => setIsMobileNavOpen(open)}
          >
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground"><Menu size={20} strokeWidth={1.5} /></button>
            </SheetTrigger>
            <SheetContent side="top" className="p-0 w-full h-full border-b-0">
              <Navigation onInteract={() => setIsMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content */}
      <main className={clsx(
        "min-h-screen transition-all duration-300",
        !isStudyMode ? "md:ml-60 pt-14 md:pt-0" : "p-0"
      )}>
        <div className={clsx(
          "mx-auto w-full h-full",
          !isStudyMode ? "max-w-6xl p-6 md:p-12 lg:p-16" : ""
        )}>
          {children}
          <SabotageNotification />
        </div>
      </main>

      {/* Modals */}
      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={addCard} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CramModal isOpen={isCramModalOpen} onClose={() => setIsCramModalOpen(false)} />
      <SabotageStore isOpen={isSabotageOpen} onClose={() => setIsSabotageOpen(false)} />
    </div>
  );
};
