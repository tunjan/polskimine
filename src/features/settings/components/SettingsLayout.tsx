import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Volume2, Target, Sliders, Database, Skull } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SettingsLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        { path: '/settings/general', label: 'General', icon: Settings },
        { path: '/settings/audio', label: 'Audio', icon: Volume2 },
        { path: '/settings/study', label: 'Limits', icon: Target },
        { path: '/settings/fsrs', label: 'FSRS', icon: Sliders },
        { path: '/settings/data', label: 'Data', icon: Database },
        { path: '/settings/danger', label: 'Danger', icon: Skull },
    ];

    // Determine the current tab value based on the path
    // We match if the current pathname starts with the tab path
    // This handles sub-routes if any, defaulting to the exact match.
    // For simplicity given the flat structure:
    const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.path || tabs[0].path;

    return (
        <div className="container max-w-4xl py-6 lg:py-10 space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-full">
                    <Tabs
                        value={currentTab}
                        onValueChange={(value) => navigate(value)}
                        className="w-full space-y-6"
                    >
                        <div className="relative overflow-x-auto pb-2">
                            <TabsList>
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.path}
                                        value={tab.path}
                                    >
                                        <div className="flex items-center gap-2">
                                            <tab.icon className="h-4 w-4" />
                                            <span>{tab.label}</span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <Outlet />
                    </Tabs>
                </div>
            </div>
        </div>
    );
};
