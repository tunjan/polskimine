
export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

const SETTINGS_KEY = 'linguaflow_api_keys';

export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return null;

        return JSON.parse(stored) as UserApiKeys;
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        return null;
    }
}

export async function updateUserSettings(userId: string, settings: UserApiKeys): Promise<void> {
    try {
        const existing = await getUserSettings(userId);
        const merged = { ...existing, ...settings };

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    return false;
}
