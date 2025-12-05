import { toast } from 'sonner';

export const useCloudSync = () => {
    const handleSyncToCloud = async () => {
        toast.info('This is a local-only app. Your data is stored on this device.');
    };

    return {
        handleSyncToCloud,
        isSyncingToCloud: false,
        syncComplete: false
    };
};
