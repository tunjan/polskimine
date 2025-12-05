import React, { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';
import { cn } from '@/lib/utils';

interface FloatingSyncButtonProps {
    className?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingSyncButton: React.FC<FloatingSyncButtonProps> = ({
    className,
    position = 'bottom-right'
}) => {
    const { saveToSyncFile, isSaving, lastSync } = useSyncthingSync();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        const success = await saveToSyncFile();
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    const positionClasses = {
        'bottom-right': 'bottom-20 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6',
    };

    return (
        <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
                'fixed z-50 flex items-center gap-2 px-4 py-3',
                'bg-card/95 backdrop-blur-sm border border-border/50',
                'hover:border-primary/50 hover:bg-card transition-all duration-200',
                'shadow-lg shadow-black/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group',
                positionClasses[position],
                className
            )}
            title={lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : 'Save changes to sync file'}
        >
            {isSaving ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-ui text-muted-foreground">Saving...</span>
                </>
            ) : showSuccess ? (
                <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-ui text-green-500">Saved!</span>
                </>
            ) : (
                <>
                    <Save className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-ui text-muted-foreground group-hover:text-foreground transition-colors">
                        Save Changes
                    </span>
                </>
            )}
        </button>
    );
};
