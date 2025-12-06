import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { db } from '@/services/db/dexie';
import { getCards, saveAllCards, clearAllCards } from '@/services/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/services/db/repositories/historyRepository';
import { getFullSettings } from '@/services/db/repositories/settingsRepository';
import { UserSettings, Card } from '@/types';

export interface SyncData {
    version: number;
    lastSynced: string;
    deviceId: string;
    cards: Card[];
    history: Record<string, number>;
    revlog: Array<{
        id: string;
        card_id: string;
        grade: number;
        state: number;
        elapsed_days: number;
        scheduled_days: number;
        stability: number;
        difficulty: number;
        created_at: string;
    }>;
    settings: Partial<UserSettings>;
    profile: {
        id: string;
        username: string;
        xp: number;
        points: number;
        level: number;
        language_level?: string;
        initial_deck_generated?: boolean;
        created_at: string;
        updated_at: string;
    } | null;
    aggregatedStats: Array<{
        id: string;
        language: string;
        metric: string;
        value: number;
        updated_at: string;
    }>;
}

const SYNC_FILENAME = 'linguaflow-sync.json';

let cachedFileHandle: FileSystemFileHandle | null = null;

const getDeviceId = (): string => {
    const storageKey = 'linguaflow_device_id';
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
};

export const getSyncFilePath = (): string => {
    const customPath = localStorage.getItem('linguaflow_sync_path');
    return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = (path: string): void => {
    localStorage.setItem('linguaflow_sync_path', path);
};

export const clearSyncFileHandle = (): void => {
    cachedFileHandle = null;
};

export const exportSyncData = async (settings: Partial<UserSettings>): Promise<SyncData> => {
    const cards = await getCards();
    const history = await getHistory();
    const revlog = await db.revlog.toArray();
    const profiles = await db.profile.toArray();
    const aggregatedStats = await db.aggregated_stats.toArray();

    const safeSettings: Partial<UserSettings> = {
        ...settings,
        geminiApiKey: ''
    };

    if (settings.tts) {
        safeSettings.tts = {
            ...settings.tts,
            googleApiKey: '',
            azureApiKey: ''
        };
    }

    return {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: getDeviceId(),
        cards,
        history,
        revlog,
        settings: safeSettings,
        profile: profiles.length > 0 ? profiles[0] : null,
        aggregatedStats
    };
};

export const saveSyncFile = async (settings: Partial<UserSettings>): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const syncData = await exportSyncData(settings);
        const jsonContent = JSON.stringify(syncData, null, 2);
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            const tempFilename = `linguaflow-backup-${Date.now()}.json`;

            await Filesystem.writeFile({
                path: tempFilename,
                data: jsonContent,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            const uri = await Filesystem.getUri({
                path: tempFilename,
                directory: Directory.Cache
            });

            await Share.share({
                title: 'LinguaFlow Backup',
                text: 'Save your LinguaFlow backup data',
                url: uri.uri,
                dialogTitle: 'Save backup file to...'
            });

            console.log('[Sync] Shared file for saving:', uri.uri);
            return { success: true, path: uri.uri };
        } else {
            if ('showSaveFilePicker' in window) {
                try {
                    let handle = cachedFileHandle;

                    if (handle) {
                        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
                        if (permission !== 'granted') {
                            const requestResult = await (handle as any).requestPermission({ mode: 'readwrite' });
                            if (requestResult !== 'granted') {
                                handle = null;
                            }
                        }
                    }

                    if (!handle) {
                        handle = await (window as any).showSaveFilePicker({
                            suggestedName: filename,
                            types: [{
                                description: 'JSON Files',
                                accept: { 'application/json': ['.json'] }
                            }]
                        });
                        cachedFileHandle = handle;
                    }

                    const writable = await handle!.createWritable();
                    await writable.write(jsonContent);
                    await writable.close();
                    return { success: true, path: handle!.name };
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        return { success: false, error: 'Save cancelled' };
                    }
                    if (cachedFileHandle) {
                        cachedFileHandle = null;
                        return saveSyncFile(settings);
                    }
                    throw e;
                }
            } else {
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return { success: true, path: filename };
            }
        }
    } catch (error: any) {
        console.error('[Sync] Save failed:', error);
        return { success: false, error: error.message };
    }
};

export const loadSyncFile = async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.readFile({
                    path: filename,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });

                const data = JSON.parse(result.data as string) as SyncData;
                return { success: true, data };
            } catch (e: any) {
                if (e.message?.includes('not exist') || e.message?.includes('No such file')) {
                    return { success: false, error: 'No sync file found' };
                }
                throw e;
            }
        } else {
            if ('showOpenFilePicker' in window) {
                try {
                    const [handle] = await (window as any).showOpenFilePicker({
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });
                    const file = await handle.getFile();
                    const text = await file.text();
                    const data = JSON.parse(text) as SyncData;
                    return { success: true, data };
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        return { success: false, error: 'Load cancelled' };
                    }
                    throw e;
                }
            } else {
                return { success: false, error: 'File picker not available. Please use file import.' };
            }
        }
    } catch (error: any) {
        console.error('[Sync] Load failed:', error);
        return { success: false, error: error.message };
    }
};

export const checkSyncFile = async (): Promise<{ exists: boolean; lastSynced?: string; deviceId?: string }> => {
    try {
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.readFile({
                    path: filename,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });
                const data = JSON.parse(result.data as string) as SyncData;
                return {
                    exists: true,
                    lastSynced: data.lastSynced,
                    deviceId: data.deviceId
                };
            } catch {
                return { exists: false };
            }
        }

        return { exists: false };
    } catch {
        return { exists: false };
    }
};

export const importSyncData = async (
    data: SyncData,
    updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        if (!data.cards || !Array.isArray(data.cards)) {
            return { success: false, error: 'Invalid sync data: missing cards' };
        }

        await clearAllCards();
        await clearHistory();
        await db.revlog.clear();
        await db.aggregated_stats.clear();
        await db.profile.clear();

        if (data.cards.length > 0) {
            await saveAllCards(data.cards);
        }

        if (data.history && typeof data.history === 'object') {
            const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
            const primaryLanguage = languages.size > 0 ? [...languages][0] : 'polish';
            await saveFullHistory(data.history, primaryLanguage);
        }

        if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
            await db.revlog.bulkPut(data.revlog);
        }

        if (data.profile) {
            await db.profile.put(data.profile);
        }

        if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
            await db.aggregated_stats.bulkPut(data.aggregatedStats);
        }

        if (data.settings) {


            const restoredProfile = data.profile; let preservedKeys: Partial<UserSettings> | UserSettings['tts'] = {};
            if (restoredProfile) {
                const existingSettings = await getFullSettings(restoredProfile.id);
                if (existingSettings) {
                    preservedKeys = {
                        geminiApiKey: existingSettings.geminiApiKey,
                        tts: {
                            provider: existingSettings.tts?.provider || 'browser',
                            googleApiKey: existingSettings.googleTtsApiKey || existingSettings.tts?.googleApiKey,
                            azureApiKey: existingSettings.azureTtsApiKey || existingSettings.tts?.azureApiKey,
                        } as any
                    };
                }
            }

            const restoredSettings: Partial<UserSettings> = {
                ...data.settings,
                geminiApiKey: preservedKeys.geminiApiKey || '',
                tts: {
                    ...(data.settings.tts || {}),
                    googleApiKey: (preservedKeys.tts as any)?.googleApiKey || '',
                    azureApiKey: (preservedKeys.tts as any)?.azureApiKey || '',
                } as UserSettings['tts'],
            };
            updateSettings(restoredSettings);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Sync] Import failed:', error);
        return { success: false, error: error.message };
    }
};

export const getLastSyncTime = (): string | null => {
    return localStorage.getItem('linguaflow_last_sync');
};

export const setLastSyncTime = (time: string): void => {
    localStorage.setItem('linguaflow_last_sync', time);
};
