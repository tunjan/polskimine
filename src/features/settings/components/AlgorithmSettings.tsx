import React, { useState } from 'react';
import { Wand2, RefreshCw, Target, Sliders, Settings } from 'lucide-react';
import { UserSettings } from '@/types';
import { FSRS_DEFAULTS } from '@/constants';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { EditorialInput } from '@/components/form/EditorialInput';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewLogs } from '@/services/db/repositories/revlogRepository';
import { optimizeFSRS } from '@/lib/fsrsOptimizer';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { OrnateSeparator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

      const worker = new Worker(new URL('../../../workers/fsrs.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e) => {
        const { type, progress, w, error } = e.data;
        if (type === 'progress') {
          setProgress(progress);
        } else if (type === 'result') {
          setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === 'error') {
          toast.error(`Optimization failed: ${error}`);
          worker.terminate();
          setIsOptimizing(false);
        }
      };

      worker.postMessage({ logs, currentW });
    } catch (e) {
      toast.error("Optimization failed to start");
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Retention Target Section */}
      <SectionHeader
        title="Retention Target"
        subtitle="Target accuracy for scheduled reviews"
        icon={<Target className="w-4 h-4" strokeWidth={1.5} />}
      />
      <Card variant="highlight" size="lg">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Target Retention
              </span>
            </div>
            <span className="text-5xl md:text-6xl font-light tabular-nums text-foreground">
              {Math.round(localSettings.fsrs.request_retention * 100)}<span className="text-xl text-muted-foreground/40">%</span>
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
              className="py-3"
            />
            <div className="flex justify-between text-[10px] font-ui text-muted-foreground/50 uppercase tracking-wider">
              <span>Faster Reviews</span>
              <span>Higher Accuracy</span>
            </div>
          </div>
        </div>
      </Card>

      <OrnateSeparator />

      {/* Optimization Section */}
      <SectionHeader
        title="Optimization"
        subtitle="Personalize algorithm parameters"
        icon={<Wand2 className="w-4 h-4" strokeWidth={1.5} />}
      />
      <Card variant="default" size="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Analyzes {report ? `${report.reviews} review records` : 'your review history'} to calculate personalized parameters.
            </p>
            {report && (
              <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-pine-500">Complete</span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground font-ui mb-1 uppercase tracking-wider">Processing review data</div>
              <Progress
                value={progress}
                variant="xp"
                size="sm"
              />
            </div>
          ) : (
            <Button
              onClick={handleOptimize}
              variant="secondary"
              className="w-full"
            >
              <Wand2 size={14} strokeWidth={1.5} /> Optimize Parameters
            </Button>
          )}
        </div>
      </Card>

      <OrnateSeparator />

      {/* Advanced Settings Section */}
      <SectionHeader
        title="Advanced"
        subtitle="Fine-tune scheduling behavior"
        icon={<Settings className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        <Card variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Maximum Interval (days)
              </label>
            </div>
            <EditorialInput
              type="number"
              className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-2 placeholder:text-muted-foreground/30 focus-visible:border-primary/60"
              value={localSettings.fsrs.maximum_interval}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev, fsrs: { ...prev.fsrs, maximum_interval: parseInt(e.target.value) || 36500 },
                }))
              }
            />
          </div>
        </Card>

        <Card variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Enable Fuzzing</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Prevents clustering of due dates by adding randomness</p>
            </div>
            <Switch
              checked={localSettings.fsrs.enable_fuzzing}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, enable_fuzzing: checked } }))
              }
            />
          </div>
        </Card>
      </div>

      {/* Reset Button */}
      <div className="pt-4">
        <button
          onClick={() => setLocalSettings(prev => ({ ...prev, fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w } }))}
          className="text-xs font-ui uppercase tracking-widest text-muted-foreground/40 hover:text-destructive/70 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </button>
      </div>
    </div>
  );
};

