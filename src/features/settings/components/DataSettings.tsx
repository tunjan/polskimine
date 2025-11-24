import React, { RefObject } from 'react';
import { Download, Upload, Cloud, Check } from 'lucide-react';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DataSettingsProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvInputRef: RefObject<HTMLInputElement>;
  onSyncToCloud: () => void;
  isSyncingToCloud: boolean;
  syncComplete: boolean;
}

// ...existing code...
export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
}) => (
  <div className="space-y-16 max-w-xl">
    
    <section className="space-y-8">
        <MetaLabel className="text-xs">Local I/O</MetaLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button 
                variant="outline"
                onClick={onExport}
                className="flex flex-col items-center justify-center gap-4 h-40 border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all"
            >
                <Download className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
                <div className="text-center space-y-2">
                    <div className="text-xs font-medium uppercase tracking-widest">Export JSON</div>
                    <div className="text-[9px] text-muted-foreground/60 font-mono">Full Backup</div>
                </div>
            </Button>

            <Button 
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 h-40 border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all"
            >
                <Upload className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
                <div className="text-center space-y-2">
                    <div className="text-xs font-medium uppercase tracking-widest">Import CSV</div>
                    <div className="text-[9px] text-muted-foreground/60 font-mono">Bulk Add</div>
                </div>
            </Button>
        </div>
    </section>

    <section className="space-y-8 pt-4">
        <MetaLabel className="text-xs">Cloud Sync</MetaLabel>
        <Button
            variant={syncComplete ? "default" : "outline"}
            onClick={onSyncToCloud}
            disabled={isSyncingToCloud || syncComplete}
            className="flex flex-col items-center justify-center gap-4 h-40 w-full border-border/40 hover:border-foreground hover:bg-transparent group rounded-none transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5"
        >
            {syncComplete ? (
                <Check className="text-primary transition-colors" strokeWidth={1} size={24} />
            ) : (
                <Cloud className="text-muted-foreground/60 group-hover:text-foreground transition-colors" strokeWidth={1} size={24} />
            )}
            <div className="text-center space-y-2">
                <div className="text-xs font-medium uppercase tracking-widest">{syncComplete ? "Synced" : "Sync to Cloud"}</div>
                <div className="text-[9px] text-muted-foreground/60 font-mono">{isSyncingToCloud ? "Processing..." : "Migrate LocalDB to Supabase"}</div>
            </div>
        </Button>
    </section>

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    
    <div className="p-0 text-[10px] text-muted-foreground/40 font-mono leading-relaxed uppercase tracking-wide">
        CSV Format: sentence, translation, targetWord, notes, tags. Delimiter auto-detected.
    </div>
  </div>
);
