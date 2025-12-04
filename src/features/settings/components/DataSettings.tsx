import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check, Database, HardDrive } from 'lucide-react';
import { GamePanel, GameSectionHeader, GameDivider, GameButton } from '@/components/ui/game-ui';

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
}) => (
  <div className="space-y-8 max-w-2xl">
    
    {/* Import & Export Section */}
    <GameSectionHeader 
      title="Import & Export" 
      subtitle="Backup and restore your data"
      icon={<HardDrive className="w-4 h-4" strokeWidth={1.5} />}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <GamePanel variant="default" size="md" glowOnHover className="cursor-pointer group" onClick={onExport}>
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <Download className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">Export Backup</p>
            <p className="text-xs text-muted-foreground/60 font-light">Download complete data archive</p>
          </div>
        </div>
      </GamePanel>

      <GamePanel variant="default" size="md" glowOnHover className="cursor-pointer group" onClick={() => csvInputRef.current?.click()}>
        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-12 h-12 bg-card flex items-center justify-center border border-border/30 group-hover:border-primary/40 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/70 transition-colors" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-ui text-foreground mb-1">Import Cards</p>
            <p className="text-xs text-muted-foreground/60 font-light">Add flashcards from CSV file</p>
          </div>
        </div>
      </GamePanel>
    </div>

    <GameDivider />

    {/* Cloud Storage Section */}
    <GameSectionHeader 
      title="Cloud Storage" 
      subtitle="Sync data across devices"
      icon={<Cloud className="w-4 h-4" strokeWidth={1.5} />}
    />
    <GamePanel 
      variant={syncComplete ? "stat" : "default"} 
      size="md" 
      glowOnHover={!syncComplete}
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
          <GameButton
            variant="secondary"
            size="sm"
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud}
          >
            {isSyncingToCloud ? "Syncing..." : "Sync"}
          </GameButton>
        )}
      </div>
    </GamePanel>

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    
    {/* Help Text */}
    <GamePanel variant="stat" size="sm" className="border-border/20">
      <div className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/30 mt-1.5 shrink-0" />
        <p className="text-xs text-muted-foreground/50 font-light leading-relaxed">
          CSV format: sentence, translation, target word, notes, tags. Delimiter automatically detected.
        </p>
      </div>
    </GamePanel>
  </div>
);
