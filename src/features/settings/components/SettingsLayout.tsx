import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings, Volume2, Target, Sliders, Database, Skull, ChevronRight, Menu } from 'lucide-react';
import clsx from 'clsx';
import { OrnateSeparator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const SettingsLayout: React.FC = () => {
    const settings = useSettingsStore(s => s.settings);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const tabs = [
        { path: '/settings/general', label: 'General', icon: Settings },
        { path: '/settings/audio', label: 'Audio', icon: Volume2 },
        { path: '/settings/study', label: 'Limits', icon: Target },
        { path: '/settings/fsrs', label: 'FSRS', icon: Sliders },
        { path: '/settings/data', label: 'Data', icon: Database },
        { path: '/settings/danger', label: 'Danger', icon: Skull },
    ];

    const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
        <>
            <div className={clsx("flex items-center gap-3 mb-8", mobile && "px-2")}>
                <span className="w-2 h-2 rotate-45 bg-primary/60" />
                <span className="text-xl font-medium text-foreground tracking-tight font-ui">Settings</span>
            </div>

            <nav className="flex flex-col gap-1">
                {tabs.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => mobile && setIsMobileOpen(false)}
                        className={({ isActive }) => clsx(
                            "relative group flex items-center gap-3 text-left px-3 py-3 transition-all duration-200",
                            isActive
                                ? "text-foreground bg-card/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Left accent line */}
                                <span className={clsx(
                                    "absolute left-0 top-1/4 bottom-1/4 w-[2px] transition-all duration-200",
                                    isActive ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
                                )} />

                                <span className={clsx(
                                    "transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary/70"
                                )}>
                                    <item.icon className="w-4 h-4" strokeWidth={1.5} />
                                </span>
                                <span className="text-sm font-light font-ui tracking-wide relative z-10">
                                    {item.label}
                                </span>
                                {isActive && (
                                    <ChevronRight className="w-3 h-3 ml-auto text-primary/60" strokeWidth={2} />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-6">
                <OrnateSeparator className="my-4" />
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                    <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground/50">
                        Deck: {settings.language}
                    </span>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex flex-col md:flex-row h-full bg-card page-full-height">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
                    <span className="text-lg font-medium font-ui">Settings</span>
                </div>
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2">
                            <Menu className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-6 pt-10">
                        <NavContent mobile />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0">
                <div className="p-6 h-full flex flex-col">
                    <NavContent />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-background">
                <div className="p-4 md:p-8 max-w-4xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
