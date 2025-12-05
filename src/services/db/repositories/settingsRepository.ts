// Settings are now stored entirely in localStorage
// No cloud sync needed for local-only app

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

const SETTINGS_KEY = 'linguaflow_api_keys';

/**
 * Fetch user settings (API keys) from localStorage
 */
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

/**
 * Update user settings (API keys) in localStorage
 */
export async function updateUserSettings(userId: string, settings: UserApiKeys): Promise<void> {
    try {
        // Merge with existing settings
        const existing = await getUserSettings(userId);
        const merged = { ...existing, ...settings };

        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

/**
 * Migration helper - no longer needed for local-only app
 * Kept for API compatibility but returns false immediately
 */
export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    // No migration needed - already local
    return false;
}
