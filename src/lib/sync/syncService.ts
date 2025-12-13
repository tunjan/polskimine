import { db } from "@/db/dexie";
import { Revlog } from "@/db/types";
import {
  getCards,
  saveAllCards,
  clearAllCards,
  getCurrentUserId,
} from "@/db/repositories/cardRepository";
import {
  getHistory,
  saveFullHistory,
  clearHistory,
} from "@/db/repositories/historyRepository";
import {
  getFullSettings,
  getSystemSetting,
  setSystemSetting,
} from "@/db/repositories/settingsRepository";
import { UserSettings, Card } from "@/types";

export interface SyncData {
  version: number;
  lastSynced: string;
  deviceId: string;
  cards: Card[];
  history: Record<string, number> | Array<{ date: string; language: string; count: number }>;
  revlog: Revlog[];
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

const SYNC_FILENAME = "linguaflow-sync.json";

let cachedFileHandle: FileSystemFileHandle | null = null;

const getDeviceId = async (): Promise<string> => {
  const storageKey = "deviceId";
  let deviceId = await getSystemSetting<string>(storageKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await setSystemSetting(storageKey, deviceId);
  }
  return deviceId;
};

export const getSyncFilePath = async (): Promise<string> => {
  const customPath = await getSystemSetting<string>("syncPath");
  return customPath || SYNC_FILENAME;
};

export const setSyncFilePath = async (path: string): Promise<void> => {
  await setSystemSetting("syncPath", path);
};

export const clearSyncFileHandle = (): void => {
  cachedFileHandle = null;
};

export interface ExportOptions {
  includeApiKeys?: boolean;
  keepUsername?: boolean;
}

export const exportSyncData = async (
  settings: Partial<UserSettings>,
  options: ExportOptions = {},
): Promise<SyncData> => {
  const cards = await getCards();
  const history = await getHistory();
  const revlog = await db.revlog.toArray();
  const aggregatedStats = await db.aggregated_stats.toArray();

  const safeSettings: Partial<UserSettings> = {
    ...settings,
    geminiApiKey: options.includeApiKeys ? settings.geminiApiKey : "",
  };

  if (settings.tts) {
    safeSettings.tts = {
      ...settings.tts,
      googleApiKey: options.includeApiKeys ? settings.tts.googleApiKey : "",
      azureApiKey: options.includeApiKeys ? settings.tts.azureApiKey : "",
    };
  }

  const currentUserId = getCurrentUserId();
  const profile = currentUserId
    ? await db.profile.get(currentUserId)
    : (await db.profile.toArray())[0];

  const profileForExport = profile
    ? {
        ...profile,
        username: options.keepUsername ? profile.username : undefined,
      }
    : null;

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
    aggregatedStats: cleanStats,
  };
};

export const saveSyncFile = async (
  settings: Partial<UserSettings>,
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const syncData = await exportSyncData(settings);
    const jsonContent = JSON.stringify(syncData, null, 2);
    const filename = await getSyncFilePath();

    if ("showSaveFilePicker" in window) {
      try {
        let handle = cachedFileHandle;

        if (handle) {
          const permission = await (handle as any).queryPermission({
            mode: "readwrite",
          });
          if (permission !== "granted") {
            const requestResult = await (handle as any).requestPermission({
              mode: "readwrite",
            });
            if (requestResult !== "granted") {
              handle = null;
            }
          }
        }

        if (!handle) {
          handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: "JSON Files",
                accept: { "application/json": [".json"] },
              },
            ],
          });
          cachedFileHandle = handle;
        }

        const writable = await handle!.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        return { success: true, path: handle!.name };
      } catch (e: any) {
        if (e.name === "AbortError") {
          return { success: false, error: "Save cancelled" };
        }
        if (cachedFileHandle) {
          cachedFileHandle = null;
          return saveSyncFile(settings);
        }
        throw e;
      }
    } else {
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, path: filename };
    }
  } catch (error: any) {
    console.error("[Sync] Save failed:", error);
    return { success: false, error: error.message };
  }
};

export const loadSyncFile = async (): Promise<{
  success: boolean;
  data?: SyncData;
  error?: string;
}> => {
  try {
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text) as SyncData;
        return { success: true, data };
      } catch (e: any) {
        if (e.name === "AbortError") {
          return { success: false, error: "Load cancelled" };
        }
        throw e;
      }
    } else {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.style.display = "none";
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
            resolve({ success: false, error: "No file selected" });
          }
          cleanup();
        };

        input.addEventListener("cancel", () => {
          resolve({ success: false, error: "Load cancelled" });
          cleanup();
        });

        input.click();
      });
    }
  } catch (error: any) {
    console.error("[Sync] Load failed:", error);
    return { success: false, error: error.message };
  }
};

export const checkSyncFile = async (): Promise<{
  exists: boolean;
  lastSynced?: string;
  deviceId?: string;
}> => {
  return { exists: false };
};

export interface ImportOptions {
  importApiKeys?: boolean;
}

export interface DexieExportData {
  formatName: "dexie";
  formatVersion: number;
  data: {
    databaseName: string;
    databaseVersion: number;
    tables: any[];
    data: Array<{
      tableName: string;
      inbound: boolean;
      rows: any[];
    }>;
  };
}

export const importSyncData = async (
  data: SyncData | DexieExportData,
  updateSettings: (settings: Partial<UserSettings>) => void,
  options: ImportOptions = {},
): Promise<{ success: boolean; error?: string }> => {
  try {
    let cards: Card[] = [];
    let history: any = {};
    let revlog: Revlog[] = [];
    let aggregatedStats: any[] = [];
    let profile: any = null;
    let settings: any = null;

    const isDexieFormat = (d: any): d is DexieExportData =>
      d && d.formatName === "dexie" && d.data && Array.isArray(d.data.data);

    if (isDexieFormat(data)) {
      
      const tables = data.data.data;
      
      const getTableRows = (name: string) => 
        tables.find(t => t.tableName === name)?.rows || [];

      const rawCards = getTableRows("cards");
      cards = rawCards.map((c: any) => ({
        id: c.id.toString(),
        targetSentence: c.target_sentence,
        nativeTranslation: c.native_translation,
        targetWord: c.target_word,
        targetWordTranslation: c.target_word_translation,
        targetWordPartOfSpeech: c.target_word_part_of_speech,
        notes: c.notes,
        
        language: c.language,
        
        type: c.type,
        queue: c.queue,
        due: (c.queue === 2 || c.queue === 3) && c.due > 200000 
            ? Math.floor(c.due / 86400) 
            : c.due,
        last_modified: c.mod,
        left: c.left,
        
        interval: c.ivl,
        easeFactor: c.factor,
        
        stability: c.stability,
        difficulty: c.difficulty,
        elapsed_days: c.elapsed_days,
        scheduled_days: c.scheduled_days,
        reps: c.reps,
        lapses: c.lapses,
        state: c.state,
        
        isLeech: c.isLeech,
        isBookmarked: c.isBookmarked,
        
        user_id: c.user_id,
        created_at: c.created_at || c.id,
      }));
      revlog = getTableRows("revlog");
      history = getTableRows("history"); 
      aggregatedStats = getTableRows("aggregated_stats");
      profile = getTableRows("profile")[0] || null;
      settings = getTableRows("settings")[0] || null;

    } else {
      
      const legacyData = data as SyncData;
      if (!legacyData.cards || !Array.isArray(legacyData.cards)) {
        return { success: false, error: "Invalid sync data: missing cards" };
      }
      cards = legacyData.cards;
      history = legacyData.history || {};
      revlog = legacyData.revlog || [];
      aggregatedStats = legacyData.aggregatedStats || [];
      profile = legacyData.profile || null;
      settings = legacyData.settings || null;
    }

    const currentUserId = getCurrentUserId();
    const existingProfile = currentUserId
      ? await db.profile.get(currentUserId)
      : (await db.profile.toArray())[0];

    await clearAllCards();
    await clearHistory();
    await db.revlog.clear();
    await db.aggregated_stats.clear();

    if (cards.length > 0) {
        const currentUserId = getCurrentUserId();
        const cardsWithUser = cards.map(c => ({
            ...c,
            user_id: currentUserId || undefined
        }));
      await saveAllCards(cardsWithUser);
    }

    if (history) {
      if (Array.isArray(history)) {
         const currentUserId = getCurrentUserId();
         const historyWithUser = history.map((h: any) => ({
             ...h,
             user_id: currentUserId || undefined
         }));
         await db.history.bulkPut(historyWithUser);
      } else if (typeof history === "object" && Object.keys(history).length > 0) {
        
        const languages = new Set(
          cards.map((c) => c.language).filter(Boolean),
        );
        const primaryLanguage = languages.size > 0 ? [...languages][0] : "polish";
        await saveFullHistory(history, primaryLanguage);
      }
    }

    if (revlog.length > 0) {
      const currentUserId = getCurrentUserId();
      const revlogWithUser = revlog.map((r) => ({
        ...r,
        user_id: currentUserId || undefined,
      }));
      await db.revlog.bulkPut(revlogWithUser);
    }

    if (profile && existingProfile) {
      const mergedProfile = {
        ...profile,
        id: existingProfile.id,
        username: existingProfile.username,
      };
      await db.profile.put(mergedProfile);
    } else if (profile && !existingProfile) {
      const profileToRestore = {
        ...profile,
        id: currentUserId || profile.id,
        username: profile.username || "User",
      };
      await db.profile.put(profileToRestore);
    }

    if (aggregatedStats.length > 0) {
      const currentUserId = getCurrentUserId();
      const statsWithUser = aggregatedStats.map((s) => ({
        ...s,
        id: currentUserId ? `${currentUserId}:${s.language}:${s.metric}` : s.id,
        user_id: currentUserId || undefined,
      }));
      await db.aggregated_stats.bulkPut(statsWithUser);
    }

    if (settings) {
      const restoredProfile = profile;
      let preservedKeys: Partial<UserSettings> | UserSettings["tts"] = {};

      const targetSettingsId =
        restoredProfile?.id || (existingProfile ? existingProfile.id : null);

      if (targetSettingsId) {
        const existingSettings = await getFullSettings(targetSettingsId);
        if (existingSettings) {
          preservedKeys = {
            geminiApiKey: existingSettings.geminiApiKey,
            tts: {
              provider: existingSettings.tts?.provider || "browser",
              googleApiKey:
                existingSettings.googleTtsApiKey ||
                existingSettings.tts?.googleApiKey,
              azureApiKey:
                existingSettings.azureTtsApiKey ||
                existingSettings.tts?.azureApiKey,
            } as any,
          };
        }
      }

      const restoredSettings: Partial<UserSettings> = {
        ...settings,
        geminiApiKey:
          options.importApiKeys && settings.geminiApiKey
            ? settings.geminiApiKey
            : preservedKeys.geminiApiKey || "",
        tts: {
          ...(settings.tts || {}),
          googleApiKey:
            options.importApiKeys && settings.tts?.googleApiKey
              ? settings.tts.googleApiKey
              : (preservedKeys.tts as any)?.googleApiKey || "",
          azureApiKey:
            options.importApiKeys && settings.tts?.azureApiKey
              ? settings.tts.azureApiKey
              : (preservedKeys.tts as any)?.azureApiKey || "",
        } as UserSettings["tts"],
      };
      updateSettings(restoredSettings);
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Sync] Import failed:", error);
    return { success: false, error: error.message };
  }
};

export const getLastSyncTime = async (): Promise<string | null> => {
  return (await getSystemSetting<string>("lastSync")) || null;
};

export const setLastSyncTime = async (time: string): Promise<void> => {
  await setSystemSetting("lastSync", time);
};
