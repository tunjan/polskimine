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

  const isStudyMode = location.pathname === '/study';

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
      <aside className={clsx(
        "w-64 flex-col fixed h-full z-40 border-r border-border bg-background transition-colors duration-300",
        isStudyMode ? "hidden" : "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-background flex items-center justify-center rounded-full">
                <Command size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-none">LinguaFlow</span>
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
              <DropdownMenuContent align="start" className="w-56 p-1.5 bg-white dark:bg-black border-border shadow-xl rounded-lg">
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
      <nav className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe",
        isStudyMode && "hidden"
      )}>
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
      <div className={clsx(
        "md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4",
        isStudyMode && "hidden"
      )}>
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-background flex items-center justify-center rounded-full">
                <Command size={12} strokeWidth={3} />
            </div>
            <span className="font-bold text-sm tracking-tight">LinguaFlow</span>
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
      <main className={clsx(
        "flex-1 w-full min-h-screen flex flex-col bg-background",
        !isStudyMode && "md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0"
      )}>
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