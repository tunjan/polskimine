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

    useEffect(() => {
        const loadSettingsFromDb = async () => {
            if (authLoading || !user) return;

            setSettingsLoading(true);
            try {
                await migrateLocalSettingsToDatabase(user.id);

                const dbSettings = await getFullSettings(user.id);
                if (dbSettings) {
                    setSettings(prev => ({
                        ...prev,
                        ...dbSettings,
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

    useEffect(() => {
        const localCache = {
            ...settings,
            geminiApiKey: '', tts: {
                ...settings.tts,
                googleApiKey: '',
                azureApiKey: '',
            }
        };
        localStorage.setItem('language_mining_settings', JSON.stringify(localCache));

        const saveSettingsToDb = async () => {
            if (!user) return;

            try {
                await updateUserSettings(user.id, settings);
            } catch (e) {
                console.error('Failed to save settings to DB', e);
            }
        };

        const timeoutId = setTimeout(saveSettingsToDb, 1000); return () => clearTimeout(timeoutId);
    }, [settings, user]);

    return null;
};
