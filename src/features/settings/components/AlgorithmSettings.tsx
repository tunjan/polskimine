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
    <div className="space-y-20 max-w-2xl">
      <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Retention Target</h3>
        </div>
        
        <div className="space-y-8 pl-1">
            <div className="flex justify-between items-baseline">
                <span className="text-6xl font-serif font-extralight tabular-nums text-foreground/80">
                    {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-2xl text-muted-foreground/40">%</span>
                </span>
            </div>
            
            <div className="space-y-6">
                <Slider
                    min={0.7} max={0.99} step={0.01}
                    value={[localSettings.fsrs.request_retention]}
                    onValueChange={([value]) =>
                        setLocalSettings((prev) => ({
                        ...prev, fsrs: { ...prev.fsrs, request_retention: value },
                        }))
                    }
                    className="py-3"
                />
                <div className="flex justify-between text-[10px] font-serif text-muted-foreground/50 tracking-wide">
                    <span>Faster Reviews</span>
                    <span>Higher Accuracy</span>
                </div>
            </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-baseline pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Optimization</h3>
            {report && <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-600/80">Complete</span>}
        </div>
        
        <p className="text-sm text-muted-foreground/70 leading-relaxed font-light pl-1">
            Analyzes {report ? `${report.reviews} review records` : 'your review history'} to calculate personalized algorithm parameters for optimal retention.
        </p>

        {isOptimizing ? (
            <div className="space-y-3 pl-1">
                <Progress value={progress} className="h-0.5 bg-secondary" />
                <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground/60 tracking-wider">
                    <span>Processing</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
        ) : (
            <Button 
                onClick={handleOptimize}
                variant="outline"
                className="w-full py-6 text-sm font-serif tracking-wide border-border/40 hover:bg-terracotta/5 hover:text-terracotta hover:border-terracotta/60 transition-all"
            >
                <Wand2 size={14} strokeWidth={1.5} className="mr-2" /> Optimize Parameters
            </Button>
        )}
      </section>

      <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Advanced</h3>
        </div>
        
        <div className="space-y-8 pl-1">
            <div className="space-y-3">
                <label className="text-sm font-serif text-muted-foreground/80 font-light">Maximum Interval (days)</label>
                <EditorialInput
                    type="number"
                    className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-3 placeholder:text-muted-foreground/30 focus-visible:border-terracotta/60"
                    value={localSettings.fsrs.maximum_interval}
                    onChange={(e) =>
                        setLocalSettings((prev) => ({
                            ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                        }))
                    }
                />
            </div>

            <div className="flex items-start justify-between gap-8 group py-2">
                <div className="space-y-1.5 flex-1">
                    <div className="font-serif text-[15px] font-light group-hover:text-foreground transition-colors text-foreground/80">Enable Fuzzing</div>
                    <div className="text-xs text-muted-foreground/60 leading-relaxed font-light">Prevents clustering of due dates by adding randomness to scheduling</div>
                </div>
                <Switch
                    checked={localSettings.fsrs.enable_fuzzing}
                    onCheckedChange={(checked) =>
                        setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
                    }
                    className="mt-1"
                />
            </div>
        </div>
      </section>

      <div className="pt-4 pl-1">
        <button 
            onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
            className="text-xs font-serif text-muted-foreground/40 hover:text-red-500/70 transition-colors flex items-center gap-2"
        >
            <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </button>
      </div>
    </div>
  );
};
