import React, { RefObject } from "react";
import {
  Download,
  Upload,
  Cloud,
  Check,
  Database,
  HardDrive,
  RotateCcw,
  Key,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SyncthingSettings } from "./SyncthingSettings";
import { Switch } from "@/components/ui/switch";

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  jsonInputRef: RefObject<HTMLInputElement>;
  isRestoring: boolean;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
  onSyncthingSave?: () => void;
  onSyncthingLoad?: () => void;
  isSyncthingSaving?: boolean;
  isSyncthingLoading?: boolean;
  lastSyncthingSync?: string | null;
  includeApiKeys: boolean;
  onIncludeApiKeysChange: (checked: boolean) => void;
  importApiKeys: boolean;
  onImportApiKeysChange: (checked: boolean) => void;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onRestoreBackup,
  jsonInputRef,
  isRestoring,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
  onSyncthingSave,
  onSyncthingLoad,
  isSyncthingSaving,
  isSyncthingLoading,
  lastSyncthingSync,
  includeApiKeys,
  onIncludeApiKeysChange,
  importApiKeys,
  onImportApiKeysChange,
}) => (
  <div className="space-y-6 max-w-2xl">
    <div className="mb-6">
      <h3 className="text-lg font-medium">Import & Export</h3>
      <p className="text-sm text-muted-foreground">
        Backup and restore your data
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors"
        onClick={onExport}
      >
        <Download className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="font-medium text-foreground">Export Backup</span>
        <span className="text-sm text-muted-foreground font-normal">
          Download complete data archive
        </span>
      </Button>

      <Button
        variant="outline"
        className={`h-auto flex flex-col items-center text-center p-6 space-y-2 hover:bg-muted/50 transition-colors ${isRestoring ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => !isRestoring && jsonInputRef.current?.click()}
        disabled={isRestoring}
      >
        <RotateCcw
          className={`h-8 w-8 text-muted-foreground mb-2 ${isRestoring ? "animate-spin" : ""}`}
        />
        <span className="font-medium text-foreground">
          {isRestoring ? "Restoring..." : "Restore Backup"}
        </span>
        <span className="text-sm text-muted-foreground font-normal">
          Import from JSON backup file
        </span>
      </Button>
    </div>

    <Button
      variant="outline"
      className="w-full h-auto flex items-center justify-start gap-4 p-4 hover:bg-muted/50 transition-colors"
      onClick={() => csvInputRef.current?.click()}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <div className="text-left">
        <div className="font-medium text-foreground">Import Cards</div>
        <div className="text-sm text-muted-foreground font-normal">
          Add flashcards from CSV file (without replacing existing)
        </div>
      </div>
    </Button>

    <Separator className="my-6" />

    <div className="mb-6">
      <h3 className="text-lg font-medium">API Key Options</h3>
      <p className="text-sm text-muted-foreground">
        Control how API keys are handled
      </p>
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Include API Keys in Export</h4>
          <p className="text-sm text-muted-foreground">
            Include your API keys when exporting backup files
          </p>
        </div>
        <Switch
          checked={includeApiKeys}
          onCheckedChange={onIncludeApiKeysChange}
        />
      </div>
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <h4 className="font-medium">Import API Keys from Backup</h4>
          <p className="text-sm text-muted-foreground">
            Restore API keys when importing backup files
          </p>
        </div>
        <Switch
          checked={importApiKeys}
          onCheckedChange={onImportApiKeysChange}
        />
      </div>
    </div>

    <Separator className="my-6" />

    <div className="mb-6">
      <h3 className="text-lg font-medium">Cloud Storage</h3>
      <p className="text-sm text-muted-foreground">Sync data across devices</p>
    </div>
    <Card className={syncComplete ? "border-green-500/50" : ""}>
      <CardContent className="flex items-center gap-4 py-4">
        {syncComplete ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Cloud className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h4 className="font-medium">
            {syncComplete ? "Synchronized" : "Sync to Cloud"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isSyncingToCloud
              ? "Uploading data..."
              : syncComplete
                ? "Your data is backed up"
                : "Migrate local database to cloud"}
          </p>
        </div>
        {!syncComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </Button>
        )}
      </CardContent>
    </Card>

    <Separator className="my-6" />

    {onSyncthingSave && onSyncthingLoad && (
      <SyncthingSettings
        onSave={onSyncthingSave}
        onLoad={onSyncthingLoad}
        isSaving={isSyncthingSaving || false}
        isLoading={isSyncthingLoading || false}
        lastSync={lastSyncthingSync || null}
      />
    )}

    <input
      type="file"
      ref={csvInputRef}
      accept=".csv,.txt"
      className="hidden"
      onChange={onImport}
    />
    <input
      type="file"
      ref={jsonInputRef}
      accept=".json"
      className="hidden"
      onChange={onRestoreBackup}
    />

    <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">Restore Backup:</span>{" "}
        Replaces all data with a previous JSON backup.
      </p>
      <p>
        <span className="font-semibold text-foreground">Import Cards:</span>{" "}
        Adds cards from CSV without replacing existing data.
      </p>
    </div>
  </div>
);
