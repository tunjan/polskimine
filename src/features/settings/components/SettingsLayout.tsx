import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings, Volume2, Target, Sliders, Database, Skull, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { OrnateSeparator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/useSettingsStore';

export const SettingsLayout: React.FC = () => {
    const settings = useSettingsStore(s => s.settings);

    const tabs = [
        { path: 'general', label: 'General', icon: Settings },
        { path: 'audio', label: 'Audio', icon: Volume2 },
        { path: 'study', label: 'Limits', icon: Target },
        { path: 'fsrs', label: 'FSRS', icon: Sliders },
        { path: 'data', label: 'Data', icon: Database },
        { path: 'danger', label: 'Danger', icon: Skull },
    ];

    return (
        <div className="flex h-full bg-card border border-border overflow-hidden rounded-lg">
            {/* Sidebar */}
            <div className="w-64 bg-card border-r border-border flex flex-col shrink-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="w-2 h-2 rotate-45 bg-primary/60" />
                        <span className="text-xl font-medium text-foreground tracking-tight font-ui">Settings</span>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {tabs.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
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
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-background">
                <div className="p-8 max-w-4xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
