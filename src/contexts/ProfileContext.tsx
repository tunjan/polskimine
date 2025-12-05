import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, LocalProfile } from '@/services/db/dexie';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ProfileContextType {
    profile: LocalProfile | null;
    loading: boolean;
    createLocalProfile: (username: string, languageLevel?: string) => Promise<void>;
    updateUsername: (username: string) => Promise<void>;
    updateLanguageLevel: (level: string) => Promise<void>;
    markInitialDeckGenerated: (userId?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<LocalProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            const existingProfile = await db.profile.get(user.id);
            setProfile(existingProfile || null);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const createLocalProfile = async (username: string, languageLevel?: string) => {
        const userId = user?.id || 'local-user';

        const newProfile: LocalProfile = {
            id: userId,
            username,
            xp: 0,
            points: 0,
            level: 1,
            language_level: languageLevel,
            initial_deck_generated: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await db.profile.put(newProfile);
        setProfile(newProfile);
        toast.success('Profile created!');
    };

    const updateUsername = async (newUsername: string) => {
        if (!profile || !user) return;

        await db.profile.update(user.id, {
            username: newUsername,
            updated_at: new Date().toISOString()
        });

        setProfile(prev => prev ? { ...prev, username: newUsername } : null);
    };

    const updateLanguageLevel = async (level: string) => {
        if (!profile || !user) return;

        await db.profile.update(user.id, {
            language_level: level,
            updated_at: new Date().toISOString()
        });

        setProfile(prev => prev ? { ...prev, language_level: level } : null);
    };

    const markInitialDeckGenerated = async (userId?: string) => {
        const targetUserId = userId || user?.id;
        if (!targetUserId) {
            console.error('[ProfileContext] markInitialDeckGenerated: No user ID available');
            return;
        }

        console.log('[ProfileContext] markInitialDeckGenerated: Starting update for user', targetUserId);

        // Optimistic update
        setProfile(prev => prev ? { ...prev, initial_deck_generated: true } : null);

        try {
            await db.profile.update(targetUserId, {
                initial_deck_generated: true,
                updated_at: new Date().toISOString()
            });
            console.log('[ProfileContext] markInitialDeckGenerated: DB update successful');

            // Force a refresh from DB to ensure consistency
            await fetchProfile();
            console.log('[ProfileContext] markInitialDeckGenerated: Profile refreshed');
        } catch (error) {
            console.error('[ProfileContext] markInitialDeckGenerated: Failed to update profile', error);
            // Revert optimistic update on failure (optional, but good practice)
            // For now, we'll just throw, as the app state might be inconsistent
            throw error;
        }
    };

    return (
        <ProfileContext.Provider
            value={{
                profile,
                loading,
                createLocalProfile,
                updateUsername,
                updateLanguageLevel,
                markInitialDeckGenerated,
                refreshProfile: fetchProfile
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
};
