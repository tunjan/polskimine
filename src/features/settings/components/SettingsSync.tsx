import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateLocalSettingsToDatabase, getUserSettings } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const SettingsSync: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const setSettingsLoading = useSettingsStore(s => s.setSettingsLoading);
    const setSettings = useSettingsStore(s => s.setSettings);

    // Cloud Sync
    useEffect(() => {
        const loadCloudSettings = async () => {
            if (authLoading || !user) return;

            setSettingsLoading(true);
            try {
                const migrated = await migrateLocalSettingsToDatabase(user.id);
                if (migrated) {
                    toast.success('Settings migrated to cloud');
                }

                const cloudSettings = await getUserSettings(user.id);
                if (cloudSettings) {
                    setSettings(prev => ({
                        ...prev,
                        geminiApiKey: cloudSettings.geminiApiKey || '',
                        tts: {
                            ...prev.tts,
                            googleApiKey: cloudSettings.googleTtsApiKey || '',
                            azureApiKey: cloudSettings.azureTtsApiKey || '',
                            azureRegion: cloudSettings.azureRegion || 'eastus',
                        }
                    }));
                }
            } catch (error) {
                console.error('Failed to load cloud settings:', error);
            } finally {
                setSettingsLoading(false);
            }
        };

        loadCloudSettings();
    }, [user, authLoading, setSettings, setSettingsLoading]);

    // Local Storage Sync
    useEffect(() => {
        const localSettings = {
            ...settings,
            geminiApiKey: '',
            tts: {
                ...settings.tts,
                googleApiKey: '',
                azureApiKey: '',
            }
        };
        localStorage.setItem('language_mining_settings', JSON.stringify(localSettings));
    }, [settings]);

    return null;
};
