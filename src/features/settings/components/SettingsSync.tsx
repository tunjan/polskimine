import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateLocalSettingsToDatabase, getFullSettings } from '@/db/repositories/settingsRepository';

export const SettingsSync: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const setSettingsLoading = useSettingsStore(s => s.setSettingsLoading);
    const initializeStore = useSettingsStore(s => s.initializeStore);

    useEffect(() => {
        const loadSettingsFromDb = async () => {
            if (authLoading) return;
            
            const userId = user?.id || 'local-user';

            setSettingsLoading(true);
            try {
                                await migrateLocalSettingsToDatabase(userId);

                const dbSettings = await getFullSettings(userId);
                if (dbSettings) {
                    initializeStore(userId, dbSettings);
                } else {
                                                                                                                                                   const { DEFAULT_SETTINGS } = await import('@/stores/useSettingsStore');
                     initializeStore(userId, DEFAULT_SETTINGS);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setSettingsLoading(false);
            }
        };

        loadSettingsFromDb();
    }, [user, authLoading, initializeStore, setSettingsLoading]);

    return null;
};
