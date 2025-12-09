import { db, LocalSettings } from "../dexie";
import { UserSettings } from "@/types";

export interface UserApiKeys {
  geminiApiKey?: string;
  googleTtsApiKey?: string;
  azureTtsApiKey?: string;
  azureRegion?: string;
}

const SETTINGS_KEY = "linguaflow_api_keys";
const UI_SETTINGS_KEY = "language_mining_settings";

export async function getUserSettings(
  userId: string,
): Promise<UserApiKeys | null> {
  try {
    const settings = await db.settings.get(userId);
    if (!settings) return null;

    return settings as UserApiKeys;
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return null;
  }
}

export async function getFullSettings(
  userId: string,
): Promise<LocalSettings | null> {
  try {
    const settings = await db.settings.get(userId);
    return settings || null;
  } catch (error) {
    console.error("Failed to fetch full settings:", error);
    return null;
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<LocalSettings>,
): Promise<void> {
  try {
    const existing = await db.settings.get(userId);
    const merged = { ...existing, ...settings, id: userId };
    await db.settings.put(merged);
  } catch (error) {
    console.error("Failed to update user settings:", error);
    throw error;
  }
}

export async function getSystemSetting<T>(
  key: keyof LocalSettings,
  userId: string = "local-user",
): Promise<T | undefined> {
  try {
    const settings = await db.settings.get(userId);
    return settings?.[key] as T;
  } catch (error) {
    console.error(`Failed to fetch system setting ${key}:`, error);
    return undefined;
  }
}

export async function setSystemSetting(
  key: keyof LocalSettings,
  value: any,
  userId: string = "local-user",
): Promise<void> {
  try {
    const existing = (await db.settings.get(userId)) || { id: userId };
    await db.settings.put({ ...existing, [key]: value });
  } catch (error) {
    console.error(`Failed to update system setting ${key}:`, error);
    throw error;
  }
}

export async function migrateLocalSettingsToDatabase(
  userId: string,
): Promise<boolean> {
  try {
    const existingDb = await db.settings.get(userId);

    const storedKeys = localStorage.getItem(SETTINGS_KEY);
    const storedUi = localStorage.getItem(UI_SETTINGS_KEY);

    if (existingDb) {
      if (storedKeys) localStorage.removeItem(SETTINGS_KEY);
      if (storedUi) localStorage.removeItem(UI_SETTINGS_KEY);
      return false;
    }

    if (!storedKeys && !storedUi) return false;

    const apiKeys = storedKeys ? JSON.parse(storedKeys) : {};
    const uiSettings = storedUi ? JSON.parse(storedUi) : {};

    const merged: LocalSettings = {
      id: userId,
      ...uiSettings,
      ...apiKeys,
    };

    await db.settings.put(merged);

    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(UI_SETTINGS_KEY);

    return true;
  } catch (error) {
    console.error("Failed to migrate settings:", error);
    return false;
  }
}
