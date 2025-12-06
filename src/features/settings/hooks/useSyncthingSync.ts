import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
    saveSyncFile,
    loadSyncFile,
    importSyncData,
    checkSyncFile,
    getLastSyncTime,
    setLastSyncTime,
    SyncData
} from '@/services/sync/syncService';

export const useSyncthingSync = () => {
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());

    const saveToSyncFile = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await saveSyncFile(settings);

            if (result.success) {
                const now = new Date().toISOString();
                setLastSyncTime(now);
                setLastSync(now);
                toast.success('Changes saved to sync file');
                return true;
            } else {
                toast.error(result.error || 'Failed to save sync file');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Save error:', error);
            toast.error(`Save failed: ${error.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [settings]);

    const loadFromSyncFile = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await loadSyncFile();

            if (!result.success) {
                toast.error(result.error || 'Failed to load sync file');
                return false;
            }

            if (!result.data) {
                toast.error('No data found in sync file');
                return false;
            }

            const syncData = result.data;
            const confirmed = window.confirm(
                `Load data from sync file?\n\n` +
                `Last synced: ${new Date(syncData.lastSynced).toLocaleString()}\n` +
                `Device: ${syncData.deviceId?.slice(0, 8)}...\n` +
                `Cards: ${syncData.cards.length}\n\n` +
                `This will replace your current data. Continue?`
            );

            if (!confirmed) {
                return false;
            }

            const importResult = await importSyncData(syncData, updateSettings);

            if (importResult.success) {
                const now = new Date().toISOString();
                setLastSyncTime(now);
                setLastSync(now);
                toast.success(`Loaded ${syncData.cards.length} cards from sync file`);

                queryClient.invalidateQueries();

                setTimeout(() => window.location.reload(), 1000);
                return true;
            } else {
                toast.error(importResult.error || 'Failed to import sync data');
                return false;
            }
        } catch (error: any) {
            console.error('[Sync] Load error:', error);
            toast.error(`Load failed: ${error.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [updateSettings, queryClient]);

    const checkSyncStatus = useCallback(async () => {
        try {
            const result = await checkSyncFile();
            return result;
        } catch (error) {
            console.error('[Sync] Check error:', error);
            return { exists: false };
        }
    }, []);

    return {
        saveToSyncFile,
        loadFromSyncFile,
        checkSyncStatus,
        isSaving,
        isLoading,
        lastSync
    };
};
