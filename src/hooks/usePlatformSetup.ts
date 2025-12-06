import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const usePlatformSetup = () => {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
        }
    }, []);
};
