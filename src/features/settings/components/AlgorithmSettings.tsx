import React, { useState } from 'react';
import { Wand2, CheckCircle2, RefreshCw, BrainCircuit, Loader2, Microscope, TrendingUp } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getAllReviewLogs } from '@/services/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  localSettings,
  setLocalSettings,
}) => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [optimizationReport, setOptimizationReport] = useState<{
    reviewsAnalyzed: number;
    initialAccuracy: number;
    finalAccuracy: number;
    w0_change: string;
    w2_change: string;
  } | null>(null);

  const handleOptimize = async () => {
    if (!user) return;
    setIsOptimizing(true);
    setProgress(0);
    setOptimizationReport(null);

    try {
      // 1. Fetch Revlogs
      const logs = await getAllReviewLogs(localSettings.language);

      if (logs.length < 50) {
        toast.error("Need more review history (50+ reviews) to optimize accurately.");
        setIsOptimizing(false);
        return;
      }

      // 2. Run Optimization
      const currentW = localSettings.fsrs.w || FSRS_DEFAULTS.w;
      
      const optimizedW = await optimizeFSRS(logs, currentW, (p) => {
        setProgress(p);
      });

      // 3. Apply Result
      setLocalSettings(prev => ({
        ...prev,
        fsrs: { ...prev.fsrs, w: optimizedW }
      }));

      setOptimizationReport({
        reviewsAnalyzed: logs.length, // Updated property name
        initialAccuracy: 0, // You can calculate this in optimizer if needed
        finalAccuracy: 0,
        w0_change: "0", // Logic to calc % change
        w2_change: "0"
      });
      
      toast.success("Optimization complete");

    } catch (e: any) {
      console.error(e);
      toast.error("Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      
      {/* 1. Target Retention */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-base font-medium tracking-tight">Target Retention</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    The percentage of cards you want to remember correctly.
                </p>
            </div>
            <div className="font-mono text-2xl font-medium tracking-tighter bg-secondary/30 px-3 py-1 rounded">
                {Math.round(localSettings.fsrs.request_retention * 100)}%
            </div>
        </div>
        
        <div className="space-y-4 pt-2">
            <Slider
                min={0.7}
                max={0.99}
                step={0.01}
                value={[localSettings.fsrs.request_retention]}
                onValueChange={([value]) =>
                    setLocalSettings((prev) => ({
                    ...prev,
                    fsrs: { ...prev.fsrs, request_retention: value },
                    }))
                }
                className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                <span>0.70 (Efficiency)</span>
                <span>0.99 (Perfection)</span>
            </div>
        </div>
        
        <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-md flex gap-3 items-start">
             <TrendingUp className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
             <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Recommendation:</strong> Aim for <strong>85-90%</strong>. Higher retention requires significantly more reviews for diminishing returns.
             </p>
        </div>
      </section>

      <div className="w-full h-px bg-border/40" />

      {/* 2. Hybrid Optimizer */}
      <section className="space-y-6">
        <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0 mt-1">
                <BrainCircuit size={18} />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-medium tracking-tight">Hybrid Optimizer</h3>
                <p className="text-sm text-muted-foreground">
                    Analyzes your review history to calculate optimal FSRS parameters for your specific learning patterns.
                </p>
            </div>
        </div>

        {optimizationReport ? (
            <div className="bg-secondary/10 border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/20 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground">Optimization Complete</span>
                </div>
                
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Reviews</span>
                        <span className="font-mono text-lg font-medium">{optimizationReport.reviewsAnalyzed}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Retention</span>
                        <span className="font-mono text-lg font-medium">{optimizationReport.initialAccuracy}%</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Stability</span>
                        <span className={cn("font-mono text-lg font-medium", parseFloat(optimizationReport.w2_change) > 0 ? "text-green-500" : "text-amber-500")}>
                           {parseFloat(optimizationReport.w2_change) > 0 ? '+' : ''}{optimizationReport.w2_change}%
                        </span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Penalty</span>
                        <span className="font-mono text-lg font-medium text-muted-foreground">
                           {parseFloat(optimizationReport.w0_change) > 0 ? '+' : ''}{optimizationReport.w0_change}%
                        </span>
                    </div>
                </div>

                <div className="p-3 bg-secondary/5 border-t border-border">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleOptimize} 
                        className="w-full text-xs h-8 hover:bg-secondary/50"
                    >
                        Run Again
                    </Button>
                </div>
            </div>
        ) : (
             <div className="pt-2">
                {isOptimizing ? (
                    <div className="space-y-3 p-4 border border-border rounded-lg bg-secondary/5">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Microscope size={12} className="animate-pulse text-primary" /> Analyzing Reviews...
                            </span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                ) : (
                    <Button 
                        onClick={handleOptimize}
                        className="w-full sm:w-auto h-10 px-6 text-xs font-medium uppercase tracking-wider shadow-sm"
                        variant="outline"
                    >
                        <Wand2 size={14} className="mr-2 text-primary" />
                        Run Optimization
                    </Button>
                )}
             </div>
        )}
      </section>

      <div className="w-full h-px bg-border/40" />

      {/* 3. Safety Limits */}
      <section className="space-y-6">
        <h3 className="text-base font-medium tracking-tight">Advanced Parameters</h3>
        
        <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/10 transition-colors">
                <div className="space-y-0.5">
                    <div className="text-sm font-medium">Maximum Interval</div>
                    <div className="text-xs text-muted-foreground">Cap the maximum review interval in days.</div>
                </div>
                <div className="flex items-center gap-2">
                    <EditorialInput
                        type="number"
                        className="w-20 text-right font-mono h-9 text-sm"
                        value={localSettings.fsrs.maximum_interval}
                        onChange={(e) =>
                        setLocalSettings((prev) => ({
                            ...prev,
                            fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                        }))
                        }
                    />
                    <span className="text-xs text-muted-foreground font-mono">days</span>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/10 transition-colors">
                <div className="space-y-0.5">
                    <div className="text-sm font-medium">Interval Fuzzing</div>
                    <div className="text-xs text-muted-foreground">Slightly randomize due dates to prevent clustering.</div>
                </div>
                <Switch
                    checked={localSettings.fsrs.enable_fuzzing}
                    onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({
                        ...prev,
                        fsrs: { ...prev.fsrs, enable_fuzzing: checked },
                    }))
                    }
                />
            </div>
        </div>
      </section>

      {/* Reset Action */}
      <div className="pt-4 flex justify-center">
        <button 
            onClick={() => {
                setLocalSettings(prev => ({ 
                    ...prev, 
                    fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } 
                }));
                setOptimizationReport(null);
                toast.success("Parameters reset to defaults");
            }}
            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2 opacity-60 hover:opacity-100"
        >
            <RefreshCw size={10} /> Reset FSRS Parameters
        </button>
      </div>
    </div>
  );
};