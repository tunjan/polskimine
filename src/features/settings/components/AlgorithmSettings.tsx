import React, { useState } from "react";
import {
  Wand2,
  RefreshCw,
  Target,
  Sliders,
  Settings,
  Download,
  Upload,
} from "lucide-react";
import { UserSettings } from "@/types";
import { FSRS_DEFAULTS } from "@/constants";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAllReviewLogs } from "@/db/repositories/revlogRepository";
import { optimizeFSRS } from "@/lib/fsrsOptimizer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { exportRevlogToCSV } from "@/features/settings/logic/optimizer";
import { db } from "@/db/dexie";
import { Textarea } from "@/components/ui/textarea";

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
  const [report, setReport] = useState<{ reviews: number } | null>(null);
  const [manualWeights, setManualWeights] = useState(
    localSettings.fsrs.w.join(", "),
  );
  const [showManual, setShowManual] = useState(false);

  const handleExport = async () => {
    try {
      await exportRevlogToCSV(db);
      toast.success("RevLog exported to CSV");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const handleWeightsChange = (val: string) => {
    setManualWeights(val);
    const weights = val
      .split(/[\s,]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    if (weights.length === 19) {
      setLocalSettings((prev) => ({
        ...prev,
        fsrs: { ...prev.fsrs, w: weights },
      }));
    }
  };

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

      const worker = new Worker(
        new URL("../../../workers/fsrs.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (e) => {
        const { type, progress, w, error } = e.data;
        if (type === "progress") {
          setProgress(progress);
        } else if (type === "result") {
          setLocalSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === "error") {
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
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Retention Target
        </h3>
        <p className="text-sm text-muted-foreground">
          Target accuracy for scheduled reviews
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Target Retention
              </label>
            </div>
            <span className="text-5xl md:text-6xl font-light tabular-nums text-foreground">
              {Math.round(localSettings.fsrs.request_retention * 100)}
              <span className="text-xl text-muted-foreground/40">%</span>
            </span>
          </div>

          <div className="space-y-4">
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
              className="py-3"
            />
            <div className="flex justify-between text-xs  text-muted-foreground/50 uppercase tracking-wider">
              <span>Faster Reviews</span>
              <span>Higher Accuracy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Optimization
        </h3>
        <p className="text-sm text-muted-foreground">
          Personalize algorithm parameters
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Analyzes{" "}
              {report
                ? `${report.reviews} review records`
                : "your review history"}{" "}
              to calculate personalized parameters.
            </p>
            {report && (
              <span className="text-xs  uppercase tracking-[0.15em] text-pine-500">
                Complete
              </span>
            )}
          </div>

          {isOptimizing ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground  mb-1 uppercase tracking-wider">
                Processing review data
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleOptimize}
                variant="secondary"
                className="w-full"
              >
                <Wand2 size={14} strokeWidth={1.5} /> Quick Optimize
                (In-Browser)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Download size={12} className="mr-2" /> Export Data
                </Button>
                <Button
                  onClick={() => setShowManual(!showManual)}
                  variant="outline"
                  className="w-full text-xs box-border"
                >
                  <Sliders size={12} className="mr-2" /> Manual Params
                </Button>
              </div>

              {showManual && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                  <p className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">
                    Parameters (w)
                  </p>
                  <Textarea
                    value={manualWeights}
                    onChange={(e) => handleWeightsChange(e.target.value)}
                    className="font-mono text-xs bg-muted/30 min-h-[80px]"
                    placeholder="0.4, 0.6, 2.4, ..."
                  />
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Paste the 19 comma-separated weights from the FSRS optimizer
                    output here.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Settings
            className="w-4 h-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          Advanced
        </h3>
        <p className="text-sm text-muted-foreground">
          Fine-tune scheduling behavior
        </p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Maximum Interval (days)
              </label>
            </div>
            <Input
              type="number"
              className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-2 placeholder:text-muted-foreground/30 focus-visible:border-primary/60 shadow-none focus-visible:ring-0"
              value={localSettings.fsrs.maximum_interval}
              onChange={(e) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  fsrs: {
                    ...prev.fsrs,
                    maximum_interval: parseInt(e.target.value) || 36500,
                  },
                }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">
                  Enable Fuzzing
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">
                Prevents clustering of due dates by adding randomness
              </p>
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
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setLocalSettings((prev) => ({
              ...prev,
              fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w },
            }))
          }
          className="text-xs uppercase tracking-widest text-muted-foreground/40 hover:text-destructive hover:bg-transparent h-auto p-0 flex items-center gap-2"
        >
          <RefreshCw size={11} strokeWidth={1.5} /> Reset to Default Parameters
        </Button>
      </div>
    </div>
  );
};
