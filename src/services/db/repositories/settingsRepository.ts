import { supabase } from '@/lib/supabase';

export interface UserSettingsDB {
    id: string;
    user_id: string;
    gemini_api_key: string | null;
    google_tts_api_key: string | null;
    azure_tts_api_key: string | null;
    azure_region: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserApiKeys {
    geminiApiKey?: string;
    googleTtsApiKey?: string;
    azureTtsApiKey?: string;
    azureRegion?: string;
}

/**
 * Fetch user settings (API keys) from the database
 */
export async function getUserSettings(userId: string): Promise<UserApiKeys | null> {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return {
            geminiApiKey: data.gemini_api_key || undefined,
            googleTtsApiKey: data.google_tts_api_key || undefined,
            azureTtsApiKey: data.azure_tts_api_key || undefined,
            azureRegion: data.azure_region || undefined,
        };
    } catch (error) {
        console.error('Failed to fetch user settings:', error);
        throw error;
    }
}

/**
 * Update or insert user settings (API keys) in the database
 */
export async function updateUserSettings(userId: string, settings: UserApiKeys): Promise<void> {
    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                gemini_api_key: settings.geminiApiKey || null,
                google_tts_api_key: settings.googleTtsApiKey || null,
                azure_tts_api_key: settings.azureTtsApiKey || null,
                azure_region: settings.azureRegion || null,
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Failed to update user settings:', error);
        throw error;
    }
}

/**
 * One-time migration: Move API keys from localStorage to database
 */
export async function migrateLocalSettingsToDatabase(userId: string): Promise<boolean> {
    try {
        
        const migrationFlag = localStorage.getItem('api_keys_migrated');
        if (migrationFlag === 'true') {
            return false; 
        }

        
        const localSettingsStr = localStorage.getItem('language_mining_settings');
        if (!localSettingsStr) {
            localStorage.setItem('api_keys_migrated', 'true');
            return false; 
        }

        const localSettings = JSON.parse(localSettingsStr);

        
        const apiKeys: UserApiKeys = {
            geminiApiKey: localSettings.geminiApiKey || undefined,
            googleTtsApiKey: localSettings.tts?.googleApiKey || undefined,
            azureTtsApiKey: localSettings.tts?.azureApiKey || undefined,
            azureRegion: localSettings.tts?.azureRegion || undefined,
        };

        
        const hasKeys = apiKeys.geminiApiKey || apiKeys.googleTtsApiKey || apiKeys.azureTtsApiKey;

        if (hasKeys) {
            await updateUserSettings(userId, apiKeys);
            localStorage.setItem('api_keys_migrated', 'true');
            return true; 
        } else {
            localStorage.setItem('api_keys_migrated', 'true');
            return false; 
        }
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
}
