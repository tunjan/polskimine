import React from 'react';
import { Save, Download, FolderSync, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SyncthingSettingsProps {
    onSave: () => void;
    onLoad: () => void;
    isSaving: boolean;
    isLoading: boolean;
    lastSync: string | null;
}

export const SyncthingSettings: React.FC<SyncthingSettingsProps> = ({
    onSave,
    onLoad,
    isSaving,
    isLoading,
    lastSync,
}) => {
    const formatLastSync = (timestamp: string | null) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    Syncthing Sync
                </h3>
                <p className="text-sm text-muted-foreground">Sync data between devices using a shared file</p>
            </div>

            {/* Last Sync Status */}
            <Card className="border-border/30">
                <CardContent className="flex items-center gap-3 p-4">
                    <Clock className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground/60 font-light">Last synced</p>
                        <p className="text-sm text-foreground">{formatLastSync(lastSync)}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Sync Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Save Changes Button */}
                <Button
                    variant="outline"
                    className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onSave}
                    disabled={isSaving}
                >
                    <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
                        <Save className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isSaving ? 'animate-pulse' : ''}`} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-normal">
                            Write to sync file for Syncthing
                        </p>
                    </div>
                </Button>

                {/* Load from Sync File Button */}
                <Button
                    variant="outline"
                    className={`h-auto flex flex-col items-center text-center space-y-3 py-6 hover:bg-muted/50 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={onLoad}
                    disabled={isLoading}
                >
                    <div className="w-12 h-12 bg-card flex items-center justify-center rounded-full border border-border/30 group-hover:border-primary/40 transition-colors">
                        <Download className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                            {isLoading ? 'Loading...' : 'Load from File'}
                        </p>
                        <p className="text-xs text-muted-foreground/60 font-normal">
                            Import data from sync file
                        </p>
                    </div>
                </Button>
            </div>

            {/* Instructions */}
            <Card className="border-border/20">
                <CardContent className="flex items-start gap-3 p-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                    <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-2">
                        <p><strong className="text-muted-foreground/70">How it works:</strong></p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Set up Syncthing to sync a folder between your devices</li>
                            <li>Click "Save Changes" to write your data to the sync file</li>
                            <li>Syncthing will automatically sync the file to other devices</li>
                            <li>On the other device, click "Load from File" to import</li>
                        </ol>
                        <p className="mt-2">
                            <strong className="text-muted-foreground/70">Note:</strong> On mobile, the file is saved to the Documents folder. Make sure Syncthing has access to it.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
