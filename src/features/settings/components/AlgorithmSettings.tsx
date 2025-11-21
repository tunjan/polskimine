import React from 'react';
import { UserSettings } from '@/types';
import { Slider } from '@/components/ui/slider';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';

interface AlgorithmSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({ localSettings, setLocalSettings }) => (
  <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="bg-secondary/20 p-4 rounded text-xs text-muted-foreground leading-relaxed">
      This app uses the FSRS v5 algorithm. Tweaking these values will affect how future intervals are calculated.
    </div>

    <section>
      <div className="flex justify-between items-baseline mb-4">
        <MetaLabel className="mb-0">Target Retention</MetaLabel>
        <span className="font-mono text-sm font-bold">{Math.round(localSettings.fsrs.request_retention * 100)}%</span>
      </div>
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
      />
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
        <span>Fewer Reviews</span>
        <span>Higher Recall</span>
      </div>
    </section>

    <section className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Interval Fuzzing</div>
          <div className="text-xs text-muted-foreground">Slightly randomize due dates to prevent grouping.</div>
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
    </section>
  </div>
);