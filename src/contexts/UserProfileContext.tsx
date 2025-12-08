import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/db/dexie';

interface LocalProfile {
    id: string;
}

interface UserProfileContextType {
    profile: LocalProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const LOCAL_USER_ID = 'local-user';

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<LocalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const count = await db.profile.where('id').equals(LOCAL_USER_ID).count();
            if (count > 0) {
                setProfile({ id: LOCAL_USER_ID });
            } else {
                setProfile(null);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <UserProfileContext.Provider value={{ profile, isLoading, refreshProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};
