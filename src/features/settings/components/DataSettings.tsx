import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check, Database, HardDrive, RotateCcw, Key } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { OrnateSeparator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SyncthingSettings } from './SyncthingSettings';
import { Switch } from '@/components/ui/switch';

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
  <div className="space-y-8 max-w-2xl">

    {/* Import & Export Section */}
    <SectionHeader
      title="Import & Export"
      subtitle="Backup and restore your data"
      icon={<HardDrive className="w-4 h-4" strokeWidth={1.5} />}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card variant="default" size="md" isInteractive className="group" onClick={onExport}>
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <Download className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">Export Backup</p>
            <p className="text-xs text-muted-foreground/60 font-light">Download complete data archive</p>
          </div>
        </div>
      </Card>

      <Card
        variant="default"
        size="md"
        isInteractive={!isRestoring}
        className={`group ${isRestoring ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => !isRestoring && jsonInputRef.current?.click()}
      >
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <RotateCcw className={`w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors ${isRestoring ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">{isRestoring ? 'Restoring...' : 'Restore Backup'}</p>
            <p className="text-xs text-muted-foreground/60 font-light">Import from JSON backup file</p>
          </div>
        </div>
      </Card>
    </div>

    {/* Import Cards Section */}
    <Card variant="default" size="md" isInteractive className="group" onClick={() => csvInputRef.current?.click()}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-ui text-foreground mb-1">Import Cards</p>
          <p className="text-xs text-muted-foreground/60 font-light">Add flashcards from CSV file (without replacing existing)</p>
        </div>
      </div>
    </Card>

    <OrnateSeparator />

    {/* API Key Options Section */}
    <SectionHeader
      title="API Key Options"
      subtitle="Control how API keys are handled"
      icon={<Key className="w-4 h-4" strokeWidth={1.5} />}
    />
    <div className="space-y-3">
      <Card variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-1 rotate-45 bg-primary/40" />
              <span className="text-sm font-light text-foreground font-ui">Include API Keys in Export</span>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light pl-3">Include your API keys when exporting backup files</p>
          </div>
          <Switch
            checked={includeApiKeys}
            onCheckedChange={onIncludeApiKeysChange}
          />
        </div>
      </Card>
      <Card variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-1 rotate-45 bg-primary/40" />
              <span className="text-sm font-light text-foreground font-ui">Import API Keys from Backup</span>
            </div>
            <p className="text-xs text-muted-foreground/60 font-light pl-3">Restore API keys when importing backup files</p>
          </div>
          <Switch
            checked={importApiKeys}
            onCheckedChange={onImportApiKeysChange}
          />
        </div>
      </Card>
    </div>

    <OrnateSeparator />

    {/* Cloud Storage Section */}
    <SectionHeader
      title="Cloud Storage"
      subtitle="Sync data across devices"
      icon={<Cloud className="w-4 h-4" strokeWidth={1.5} />}
    />
    <Card
      variant={syncComplete ? "stat" : "default"}
      size="md"
      className={syncComplete ? "border-pine-500/30" : ""}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center border ${syncComplete ? "bg-pine-500/10 border-pine-500/30" : "bg-card border-border/30"}`}>
          {syncComplete ? (
            <Check className="w-5 h-5 text-pine-500" strokeWidth={1.5} />
          ) : (
            <Cloud className="w-5 h-5 text-muted-foreground/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-ui text-foreground mb-1">
            {syncComplete ? "Synchronized" : "Sync to Cloud"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-light">
            {isSyncingToCloud
              ? "Uploading data..."
              : syncComplete
                ? "Your data is backed up"
                : "Migrate local database to cloud"
            }
          </p>
        </div>
        {!syncComplete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </Button>
        )}
      </div>
    </Card>

    <OrnateSeparator />

    {/* Syncthing Sync Section */}
    {onSyncthingSave && onSyncthingLoad && (
      <SyncthingSettings
        onSave={onSyncthingSave}
        onLoad={onSyncthingLoad}
        isSaving={isSyncthingSaving || false}
        isLoading={isSyncthingLoading || false}
        lastSync={lastSyncthingSync || null}
      />
    )}

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    <input type="file" ref={jsonInputRef} accept=".json" className="hidden" onChange={onRestoreBackup} />

    {/* Help Text */}
    <Card variant="stat" size="sm" className="border-border/20">
      <div className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/30 mt-1.5 shrink-0" />
        <div className="text-xs text-muted-foreground/50 font-light leading-relaxed space-y-1">
          <p><strong className="text-muted-foreground/70">Restore Backup:</strong> Replaces all data with a previous JSON backup.</p>
          <p><strong className="text-muted-foreground/70">Import Cards:</strong> Adds cards from CSV without replacing existing data.</p>
        </div>
      </div>
    </Card>
  </div>
);
