import React, { useState } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewLogs } from '@/services/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

// ...existing code...
export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ reviews: number; } | null>(null);

  const handleOptimize = async () => {
    if (!user) return;
    setIsOptimizing(true);
    setProgress(0);
    try {
      const logs = await getAllReviewLogs(localSettings.language);
      if (logs.length < 50) {
        toast.error("Insufficient data (50+ reviews required).");
        setIsOptimizing(false);
        return;
      }
      const currentW = localSettings.fsrs.w || FSRS_DEFAULTS.w;
      const optimizedW = await optimizeFSRS(logs, currentW, setProgress);
      setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: optimizedW } }));
      setReport({ reviews: logs.length });
      toast.success("Optimization complete");
    } catch (e) {
      toast.error("Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-16 max-w-xl">
      <section className="space-y-8">
        <div className="flex justify-between items-end">
            <MetaLabel className="mb-0 text-xs">Request Retention</MetaLabel>
            <span className="text-5xl font-light tabular-nums">
                {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-lg text-muted-foreground/40 ml-1">%</span>
            </span>
        </div>
        
        <div className="space-y-4">
            <Slider
                min={0.7} max={0.99} step={0.01}
                value={[localSettings.fsrs.request_retention]}
                onValueChange={([value]) =>
                    setLocalSettings((prev) => ({
                    ...prev, fsrs: { ...prev.fsrs, request_retention: value },
                    }))
                }
                className="py-2"
            />
            <div className="flex justify-between text-[9px] font-mono uppercase text-muted-foreground/40 tracking-widest">
                <span>Efficiency (0.70)</span>
                <span>Precision (0.99)</span>
            </div>
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex justify-between items-baseline">
            <MetaLabel className="mb-0 text-xs">Parameter Optimization</MetaLabel>
            {report && <span className="text-[10px] font-mono text-green-600 uppercase tracking-wider">Optimized</span>}
        </div>
        
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-md">
            Analyzes {report ? report.reviews : 'your'} review history to calculate custom weights for the FSRS algorithm.
        </p>

        {isOptimizing ? (
            <div className="space-y-2">
                <Progress value={progress} className="h-0.5 rounded-none bg-secondary" />
                <div className="flex justify-between text-[9px] font-mono uppercase text-muted-foreground">
                    <span>Processing...</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
        ) : (
            <Button 
                onClick={handleOptimize}
                variant="outline"
                className="w-full h-12 text-[10px] font-mono uppercase tracking-widest border-border/40 hover:bg-foreground hover:text-background hover:border-foreground transition-all rounded-none"
            >
                <Wand2 size={12} className="mr-2" /> Run Optimizer
            </Button>
        )}
      </section>

      <section className="space-y-8 pt-4">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Max Interval (Days)</MetaLabel>
            <EditorialInput
                type="number"
                className="font-mono text-sm bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                value={localSettings.fsrs.maximum_interval}
                onChange={(e) =>
                    setLocalSettings((prev) => ({
                        ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                    }))
                }
            />
        </div>

        <div className="flex items-center justify-between group">
            <div className="space-y-1">
                <div className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Fuzzing</div>
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Avoid Due Date Clustering</div>
            </div>
            <Switch
                checked={localSettings.fsrs.enable_fuzzing}
                onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
                }
            />
        </div>
      </section>

      <div className="pt-8">
        <button 
            onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
            className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 hover:text-red-500 transition-colors flex items-center gap-2"
        >
            <RefreshCw size={10} /> Reset Weights
        </button>
      </div>
    </div>
  );
};
