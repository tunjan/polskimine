import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const usePlatformSetup = () => {
    useEffect(() => {
        // Platform specific setup
        if (Capacitor.isNativePlatform()) {
            // Handle native platform setup here
            // e.g. Deep links, status bar, splash screen hiding, etc.
            console.log('Running on native platform');
        }
    }, []);
};
