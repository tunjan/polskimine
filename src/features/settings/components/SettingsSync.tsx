import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { migrateLocalSettingsToDatabase, getFullSettings, updateUserSettings } from '@/services/db/repositories/settingsRepository';
import { toast } from 'sonner';

export const SettingsSync: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const setSettingsLoading = useSettingsStore(s => s.setSettingsLoading);
    const setSettings = useSettingsStore(s => s.setSettings);

    // Cloud/DB Sync
    useEffect(() => {
        const loadSettingsFromDb = async () => {
            if (authLoading || !user) return;

            setSettingsLoading(true);
            try {
                // 1. Attempt migration from old localStorage (one-time)
                await migrateLocalSettingsToDatabase(user.id);

                // 2. Load from DB
                const dbSettings = await getFullSettings(user.id);
                if (dbSettings) {
                    setSettings(prev => ({
                        ...prev,
                        ...dbSettings,
                        // Ensure nested objects are merged correctly if dbSettings has them
                        // Note: dbSettings is now LocalSettings which includes Partial<UserSettings>
                        fsrs: { ...prev.fsrs, ...(dbSettings.fsrs || {}) },
                        tts: { ...prev.tts, ...(dbSettings.tts || {}) },
                        languageColors: { ...prev.languageColors, ...(dbSettings.languageColors || {}) },
                        dailyNewLimits: { ...prev.dailyNewLimits, ...(dbSettings.dailyNewLimits || {}) },
                        dailyReviewLimits: { ...prev.dailyReviewLimits, ...(dbSettings.dailyReviewLimits || {}) },
                    }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setSettingsLoading(false);
            }
        };

        loadSettingsFromDb();
    }, [user, authLoading, setSettings, setSettingsLoading]);

    // Save to DB on change + Update Local Cache
    useEffect(() => {
        // 1. Update Local Cache (Sync)
        const localCache = {
            ...settings,
            geminiApiKey: '', // Don't cache sensitive keys in the UI settings key if avoiding duplication, but logic above uses it from there.
            // Actually useSettingsStore initializes from 'language_mining_settings', so we should put it there.
            tts: {
                ...settings.tts,
                googleApiKey: '',
                azureApiKey: '',
            }
        };
        localStorage.setItem('language_mining_settings', JSON.stringify(localCache));

        // 2. Save to DB (Async, persisting everything including keys securely)
        const saveSettingsToDb = async () => {
            if (!user) return;

            try {
                await updateUserSettings(user.id, settings);
            } catch (e) {
                console.error('Failed to save settings to DB', e);
            }
        };

        const timeoutId = setTimeout(saveSettingsToDb, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);
    }, [settings, user]);

    return null;
};
