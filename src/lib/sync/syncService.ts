import { db } from '@/db/dexie';
import { getCards, saveAllCards, clearAllCards, getCurrentUserId } from '@/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/db/repositories/historyRepository';
import { getFullSettings, getSystemSetting, setSystemSetting } from '@/db/repositories/settingsRepository';
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
        username?: string;
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

const getDeviceId = async (): Promise<string> => {
    const storageKey = 'deviceId';
    let deviceId = await getSystemSetting<string>(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        await setSystemSetting(storageKey, deviceId);
    }
    return deviceId;
};

export const getSyncFilePath = async (): Promise<string> => {
    const customPath = await getSystemSetting<string>('syncPath');
    return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = async (path: string): Promise<void> => {
    await setSystemSetting('syncPath', path);
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

    // Export profile without username (username is device-specific)
    const profileForExport = profiles.length > 0 ? {
        ...profiles[0],
        username: undefined,  // Don't export username
    } : null;

    // Remove user_id from export data
    const cleanCards = cards.map(({ user_id, ...rest }) => rest);
    const cleanRevlog = revlog.map(({ user_id, ...rest }) => rest);
    const cleanStats = aggregatedStats.map(({ user_id, ...rest }) => rest);

    return {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: await getDeviceId(),
        cards: cleanCards,
        history,
        revlog: cleanRevlog,
        settings: safeSettings,
        profile: profileForExport,
        aggregatedStats: cleanStats
    };
};

export const saveSyncFile = async (settings: Partial<UserSettings>): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const syncData = await exportSyncData(settings);
        const jsonContent = JSON.stringify(syncData, null, 2);
        const filename = await getSyncFilePath();

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
    } catch (error: any) {
        console.error('[Sync] Save failed:', error);
        return { success: false, error: error.message };
    }
};

export const loadSyncFile = async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
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
            // Fallback for browsers that don't support File System Access API
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json,.json';
                input.style.display = 'none';
                document.body.appendChild(input);

                const cleanup = () => {
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                };

                input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        try {
                            const text = await file.text();
                            const data = JSON.parse(text) as SyncData;
                            resolve({ success: true, data });
                        } catch (error: any) {
                            resolve({ success: false, error: error.message });
                        }
                    } else {
                        resolve({ success: false, error: 'No file selected' });
                    }
                    cleanup();
                };

                // Handle cancellation (supported in modern browsers)
                input.addEventListener('cancel', () => {
                    resolve({ success: false, error: 'Load cancelled' });
                    cleanup();
                });

                input.click();
            });
        }
    } catch (error: any) {
        console.error('[Sync] Load failed:', error);
        return { success: false, error: error.message };
    }
};

export const checkSyncFile = async (): Promise<{ exists: boolean; lastSynced?: string; deviceId?: string }> => {
    // Web platform cannot check for sync file existence without user interaction
    return { exists: false };
};

export const importSyncData = async (
    data: SyncData,
    updateSettings: (settings: Partial<UserSettings>) => void
): Promise<{ success: boolean; error?: string }> => {
    try {
        if (!data.cards || !Array.isArray(data.cards)) {
            return { success: false, error: 'Invalid sync data: missing cards' };
        }

        // Get existing profile before clearing to preserve id and username
        const existingProfiles = await db.profile.toArray();
        const existingProfile = existingProfiles.length > 0 ? existingProfiles[0] : null;

        await clearAllCards();
        await clearHistory();
        await db.revlog.clear();
        await db.aggregated_stats.clear();
        // Don't clear profile - we'll merge instead

        if (data.cards.length > 0) {
            await saveAllCards(data.cards);
        }

        if (data.history && typeof data.history === 'object') {
            const languages = new Set(data.cards.map(c => c.language).filter(Boolean));
            const primaryLanguage = languages.size > 0 ? [...languages][0] : 'polish';
            await saveFullHistory(data.history, primaryLanguage);
        }

        if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
            const currentUserId = getCurrentUserId();
            const revlogWithUser = data.revlog.map(r => ({
                ...r,
                user_id: currentUserId || undefined
            }));
            await db.revlog.bulkPut(revlogWithUser);
        }

        // Merge imported profile with existing profile, preserving id and username
        if (data.profile && existingProfile) {
            const mergedProfile = {
                ...data.profile,
                id: existingProfile.id,  // Keep existing id
                username: existingProfile.username,  // Keep existing username
            };
            await db.profile.put(mergedProfile);
        } else if (existingProfile) {
            // If no profile in import data, keep existing profile
            // (profile already exists, nothing to do)
        }

        if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
            const currentUserId = getCurrentUserId();
            const statsWithUser = data.aggregatedStats.map(s => ({
                ...s,
                user_id: currentUserId || undefined
            }));
            await db.aggregated_stats.bulkPut(statsWithUser);
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

export const getLastSyncTime = async (): Promise<string | null> => {
    return await getSystemSetting<string>('lastSync') || null;
};

export const setLastSyncTime = async (time: string): Promise<void> => {
    await setSystemSetting('lastSync', time);
};
