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

// Default sync file name - will be in Syncthing folder
const SYNC_FILENAME = 'linguaflow-sync.json';

// Store the file handle for reuse (File System Access API)
let cachedFileHandle: FileSystemFileHandle | null = null;

// Get or create a unique device ID
const getDeviceId = (): string => {
    const storageKey = 'linguaflow_device_id';
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
};

// Get the sync file path based on platform
export const getSyncFilePath = (): string => {
    // For Android, we'll use the Documents directory which Syncthing can access
    // For web/desktop, we'll use a configurable path
    const customPath = localStorage.getItem('linguaflow_sync_path');
    return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = (path: string): void => {
    localStorage.setItem('linguaflow_sync_path', path);
};

// Clear the cached file handle (e.g., when user wants to pick a new file)
export const clearSyncFileHandle = (): void => {
    cachedFileHandle = null;
};

/**
 * Export all app data to a sync-ready format
 */
export const exportSyncData = async (settings: Partial<UserSettings>): Promise<SyncData> => {
    const cards = await getCards();
    const history = await getHistory();
    const revlog = await db.revlog.toArray();
    const profiles = await db.profile.toArray();
    const aggregatedStats = await db.aggregated_stats.toArray();

    // Sanitize settings - remove API keys
    const safeSettings: Partial<UserSettings> = {
        ...settings,
        geminiApiKey: ''
    };

    // Handle TTS settings separately to avoid type issues
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

/**
 * Save sync data to file (for Syncthing to pick up)
 */
export const saveSyncFile = async (settings: Partial<UserSettings>): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const syncData = await exportSyncData(settings);
        const jsonContent = JSON.stringify(syncData, null, 2);
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            // On mobile, first write to cache directory, then use Share to let user choose destination
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

            // Use Share API to let user choose where to save the file
            await Share.share({
                title: 'LinguaFlow Backup',
                text: 'Save your LinguaFlow backup data',
                url: uri.uri,
                dialogTitle: 'Save backup file to...'
            });

            console.log('[Sync] Shared file for saving:', uri.uri);
            return { success: true, path: uri.uri };
        } else {
            // On web, use File System Access API if available
            if ('showSaveFilePicker' in window) {
                try {
                    // Reuse cached file handle if available
                    let handle = cachedFileHandle;

                    if (handle) {
                        // Verify we still have permission
                        const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
                        if (permission !== 'granted') {
                            const requestResult = await (handle as any).requestPermission({ mode: 'readwrite' });
                            if (requestResult !== 'granted') {
                                // Permission denied, need to pick a new file
                                handle = null;
                            }
                        }
                    }

                    if (!handle) {
                        // No cached handle or permission denied, ask user to pick a file
                        handle = await (window as any).showSaveFilePicker({
                            suggestedName: filename,
                            types: [{
                                description: 'JSON Files',
                                accept: { 'application/json': ['.json'] }
                            }]
                        });
                        // Cache the handle for future saves
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
                    // If there's an error with cached handle, clear it and retry
                    if (cachedFileHandle) {
                        cachedFileHandle = null;
                        return saveSyncFile(settings); // Retry without cache
                    }
                    throw e;
                }
            } else {
                // Fallback: download the file
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

/**
 * Load sync data from file
 */
export const loadSyncFile = async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
        const filename = getSyncFilePath();

        if (Capacitor.isNativePlatform()) {
            // On mobile, read from Documents directory
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
            // On web, use File System Access API or file picker
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

/**
 * Check if sync file exists and get its metadata
 */
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

/**
 * Import sync data into the app (replaces all local data)
 */
export const importSyncData = async (
    data: SyncData,
    updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validate data structure
        if (!data.cards || !Array.isArray(data.cards)) {
            return { success: false, error: 'Invalid sync data: missing cards' };
        }

        // Clear existing data
        await clearAllCards();
        await clearHistory();
        await db.revlog.clear();
        await db.aggregated_stats.clear();
        await db.profile.clear();

        // Restore cards
        if (data.cards.length > 0) {
            await saveAllCards(data.cards);
        }

        // Restore history
        if (data.history && typeof data.history === 'object') {
            const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
            const primaryLanguage = languages.size > 0 ? [...languages][0] : 'polish';
            await saveFullHistory(data.history, primaryLanguage);
        }

        // Restore revlog
        if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
            await db.revlog.bulkPut(data.revlog);
        }

        // Restore profile
        if (data.profile) {
            await db.profile.put(data.profile);
        }

        // Restore aggregated stats
        if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
            await db.aggregated_stats.bulkPut(data.aggregatedStats);
        }

        // Restore settings (preserve local API keys)
        if (data.settings) {
            // Get current keys from DB before update (if possible)
            // Since we cleared the profile, we might have lost the user reference, 
            // but we can try to recover keys if we had grabbed them before clearing.
            // Ideally, we should have fetched them at the start of the function.

            // However, implementing 'fetch before clear' requires moving code up.
            // Let's rely on the fact that we migrated to db.settings with specific IDs.
            // If the imported profile has the SAME ID as the local one, we should find the settings in db.settings (which we did NOT clear! We cleared profile/cards/history/revlog, but did NOT clear settings table in the logic above).
            // Wait, check lines 320-324:
            // await db.revlog.clear();
            // await db.aggregated_stats.clear();
            // await db.profile.clear();
            // IT DOES NOT CLEAR db.settings!

            // So, if the imported profile is restored:
            const restoredProfile = data.profile; // We just put this into db.profile
            let preservedKeys: Partial<UserSettings> | UserSettings['tts'] = {}; // Type safety is hard here with partials

            // Re-read settings for this user if they exist
            if (restoredProfile) {
                const existingSettings = await getFullSettings(restoredProfile.id);
                if (existingSettings) {
                    preservedKeys = {
                        geminiApiKey: existingSettings.geminiApiKey,
                        tts: {
                            provider: existingSettings.tts?.provider || 'browser',
                            // ... other required tts props to satisfy type if needed, or just partial merge
                            // actually we just want the keys
                            googleApiKey: existingSettings.googleTtsApiKey || existingSettings.tts?.googleApiKey,
                            azureApiKey: existingSettings.azureTtsApiKey || existingSettings.tts?.azureApiKey,
                        } as any // simpler to cast for partial merge logic
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

/**
 * Get last sync time from localStorage
 */
export const getLastSyncTime = (): string | null => {
    return localStorage.getItem('linguaflow_last_sync');
};

/**
 * Set last sync time
 */
export const setLastSyncTime = (time: string): void => {
    localStorage.setItem('linguaflow_last_sync', time);
};
