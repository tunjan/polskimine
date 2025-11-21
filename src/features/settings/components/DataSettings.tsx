import React, { RefObject } from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';

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
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        onClick={onExport}
        className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group"
      >
        <Download className="text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-sm font-medium">Export JSON</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Full Backup</div>
        </div>
      </button>
      <button
        onClick={() => csvInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 p-8 border border-dashed border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group"
      >
        <Upload className="text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        <div className="text-center">
          <div className="text-sm font-medium">Import CSV</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Bulk Add</div>
        </div>
      </button>
    </div>
    <div className="grid grid-cols-1">
      <button
        onClick={onSyncToCloud}
        disabled={isSyncingToCloud || syncComplete}
        className="flex flex-col items-center justify-center gap-3 p-6 border border-border hover:border-foreground hover:bg-secondary/20 transition-all rounded-lg group disabled:opacity-60"
      >
        <RefreshCw
          className="text-muted-foreground group-hover:text-foreground transition-colors"
          strokeWidth={1.5}
        />
        <div className="text-center">
          <div className="text-sm font-medium">
            {syncComplete ? 'Cloud Sync Completed' : 'Sync Local Deck to Cloud'}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            {syncComplete
              ? 'All cards live in Supabase'
              : isSyncingToCloud
              ? 'Migrating...'
              : 'One-time IndexedDB migration'}
          </div>
        </div>
      </button>
    </div>
    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    <p className="text-xs text-muted-foreground">
      CSV headers supported: sentence, translation, targetWord, notes, tags. Separate multiple tags with |, ;, or commas.
    </p>
  </div>
);