import { db, LocalSettings } from '../dexie';
import { UserSettings } from '@/types';

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

const SETTINGS_KEY = 'linguaflow_api_keys';
const UI_SETTINGS_KEY = 'language_mining_settings';

export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const settings = await db.settings.get(userId);
        if (!settings) return null;

        // Return just the API keys part for compatibility, or the whole object?
        // The current usage expects UserApiKeys in some places, but we want to store everything.
        // Let's return the whole object cast as UserApiKeys for now to satisfy the interface,
        // but consumers might need updating if they expect strictly only keys.
        // Looking at usage: SettingsSync uses it to load keys.
        return settings as UserApiKeys;
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        return null;
    }
}

export async function getFullSettings(userId: string): Promise<LocalSettings | null> {
    try {
        const settings = await db.settings.get(userId);
        return settings || null;
    } catch (error) {
        console.error('Failed to fetch full settings:', error);
        return null;
    }
}

export async function updateUserSettings(userId: string, settings: Partial<LocalSettings>): Promise<void> {
    try {
        const existing = await db.settings.get(userId);
        const merged = { ...existing, ...settings, id: userId };
        await db.settings.put(merged);
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    try {
        // Check if we already have settings in DB
        const existingDb = await db.settings.get(userId);
        if (existingDb) return false;

        // Load from LocalStorage
        const storedKeys = localStorage.getItem(SETTINGS_KEY);
        const storedUi = localStorage.getItem(UI_SETTINGS_KEY);

        if (!storedKeys && !storedUi) return false;

        const apiKeys = storedKeys ? JSON.parse(storedKeys) : {};
        const uiSettings = storedUi ? JSON.parse(storedUi) : {};

        // Merge and save to DB
        const merged: LocalSettings = {
            id: userId,
            ...uiSettings,
            ...apiKeys
        };

        await db.settings.put(merged);

        // Optional: Clear localStorage? 
        // valid argument to keep them as backup for now, or clear to avoid confusion.
        // Let's keep them for safety but maybe log it.
        console.log('Migrated settings to IndexedDB');
        return true;
    } catch (error) {
        console.error('Failed to migrate settings:', error);
        return false;
    }
}
