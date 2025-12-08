import { db } from "@/db/dexie";
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

export const importSyncData = async (
  data: SyncData,
  updateSettings: (settings: Partial<UserSettings>) => void,
  options: ImportOptions = {},
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!data.cards || !Array.isArray(data.cards)) {
      return { success: false, error: "Invalid sync data: missing cards" };
    }

    const currentUserId = getCurrentUserId();
    const existingProfile = currentUserId
      ? await db.profile.get(currentUserId)
      : (await db.profile.toArray())[0];

    await clearAllCards();
    await clearHistory();
    await db.revlog.clear();
    await db.aggregated_stats.clear();

    if (data.cards.length > 0) {
      await saveAllCards(data.cards);
    }

    if (data.history && typeof data.history === "object") {
      const languages = new Set(
        data.cards.map((c) => c.language).filter(Boolean),
      );
      const primaryLanguage = languages.size > 0 ? [...languages][0] : "polish";
      await saveFullHistory(data.history, primaryLanguage);
    }

    if (data.revlog && Array.isArray(data.revlog) && data.revlog.length > 0) {
      const currentUserId = getCurrentUserId();
      const revlogWithUser = data.revlog.map((r) => ({
        ...r,
        user_id: currentUserId || undefined,
      }));
      await db.revlog.bulkPut(revlogWithUser);
    }

    if (data.profile && existingProfile) {
      const mergedProfile = {
        ...data.profile,
        id: existingProfile.id,
        username: existingProfile.username,
      };
      await db.profile.put(mergedProfile);
    } else if (data.profile && !existingProfile) {
      const profileToRestore = {
        ...data.profile,
        id: currentUserId || data.profile.id,
        username: data.profile.username || "User",
      };
      await db.profile.put(profileToRestore);
    }

    if (data.aggregatedStats && Array.isArray(data.aggregatedStats)) {
      const currentUserId = getCurrentUserId();
      const statsWithUser = data.aggregatedStats.map((s) => ({
        ...s,
        user_id: currentUserId || undefined,
      }));
      await db.aggregated_stats.bulkPut(statsWithUser);
    }

    if (data.settings) {
      const restoredProfile = data.profile;
      let preservedKeys: Partial<UserSettings> | UserSettings["tts"] = {};
      
      // Try to get settings from the correct profile ID
      const targetSettingsId = restoredProfile?.id || (existingProfile ? existingProfile.id : null);
      
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
        ...data.settings,
        geminiApiKey:
          options.importApiKeys && data.settings.geminiApiKey
            ? data.settings.geminiApiKey
            : preservedKeys.geminiApiKey || "",
        tts: {
          ...(data.settings.tts || {}),
          googleApiKey:
            options.importApiKeys && data.settings.tts?.googleApiKey
              ? data.settings.tts.googleApiKey
              : (preservedKeys.tts as any)?.googleApiKey || "",
          azureApiKey:
            options.importApiKeys && data.settings.tts?.azureApiKey
              ? data.settings.tts.azureApiKey
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
