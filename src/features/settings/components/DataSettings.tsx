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

export const DataSettings: React.FC<DataSettingsProps> = ({
  onExport,
  onImport,
  csvInputRef,
  onSyncToCloud,
  isSyncingToCloud,
  syncComplete,
}) => (
  <div className="space-y-20 max-w-2xl">
    
    <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Import & Export</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-1">
            <Button 
                variant="outline"
                onClick={onExport}
                className="flex flex-col items-start justify-between gap-6 h-48 border-border/30 hover:border-terracotta/60 hover:bg-terracotta/5 group p-6 transition-all"
            >
                <Download className="text-muted-foreground/50 group-hover:text-terracotta/80 transition-colors" strokeWidth={1} size={28} />
                <div className="text-left space-y-2 w-full">
                    <div className="text-sm font-serif tracking-wide text-foreground/80">Export Backup</div>
                    <div className="text-xs text-muted-foreground/60 font-light leading-relaxed">Download complete data archive</div>
                </div>
            </Button>

            <Button 
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                className="flex flex-col items-start justify-between gap-6 h-48 border-border/30 hover:border-terracotta/60 hover:bg-terracotta/5 group p-6 transition-all"
            >
                <Upload className="text-muted-foreground/50 group-hover:text-terracotta/80 transition-colors" strokeWidth={1} size={28} />
                <div className="text-left space-y-2 w-full">
                    <div className="text-sm font-serif tracking-wide text-foreground/80">Import Cards</div>
                    <div className="text-xs text-muted-foreground/60 font-light leading-relaxed">Add flashcards from CSV file</div>
                </div>
            </Button>
        </div>
    </section>

    <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Cloud Storage</h3>
        </div>
        <div className="pl-1">
            <Button
                variant={syncComplete ? "default" : "outline"}
                onClick={onSyncToCloud}
                disabled={isSyncingToCloud || syncComplete}
                className="flex flex-col items-start justify-between gap-6 h-48 w-full border-border/30 hover:border-terracotta/60 hover:bg-terracotta/5 group p-6 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {syncComplete ? (
                    <Check className="text-emerald-600 transition-colors" strokeWidth={1} size={28} />
                ) : (
                    <Cloud className="text-muted-foreground/50 group-hover:text-terracotta/80 transition-colors" strokeWidth={1} size={28} />
                )}
                <div className="text-left space-y-2 w-full">
                    <div className="text-sm font-serif tracking-wide text-foreground/80">{syncComplete ? "Synchronized" : "Sync to Cloud"}</div>
                    <div className="text-xs text-muted-foreground/60 font-light leading-relaxed">
                        {isSyncingToCloud ? "Uploading data..." : syncComplete ? "Your data is backed up" : "Migrate local database to cloud"}
                    </div>
                </div>
            </Button>
        </div>
    </section>

    <input type="file" ref={csvInputRef} accept=".csv,.txt" className="hidden" onChange={onImport} />
    
    <div className="px-1 py-4 text-xs text-muted-foreground/50 font-light leading-relaxed border-t border-border/20">
        CSV format: sentence, translation, target word, notes, tags. Delimiter automatically detected.
    </div>
  </div>
);
