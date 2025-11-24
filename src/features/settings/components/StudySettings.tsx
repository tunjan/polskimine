import React from 'react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { MetaLabel } from '@/components/form/MetaLabel';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

// ...existing code...
export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-16 max-w-xl">
      <div className="flex items-start gap-4 p-0">
        <div className="w-1 h-1 mt-2 bg-foreground rounded-full shrink-0" />
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed uppercase tracking-wide max-w-md">
            Configuration for <span className="text-foreground font-medium">{currentLangName}</span> deck. Limits reset daily at 04:00.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-16">
        <div className="space-y-4">
            <MetaLabel className="text-xs">New Cards</MetaLabel>
            <EditorialInput
                type="number"
                value={currentDailyNew}
                className="text-5xl font-light h-auto py-2 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums bg-transparent"
                onChange={(event) => {
                    const val = parseInt(event.target.value, 10) || 0;
                    setLocalSettings(prev => ({
                    ...prev,
                    dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                    }));
                }}
            />
        </div>
        <div className="space-y-4">
            <MetaLabel className="text-xs">Review Limit</MetaLabel>
            <EditorialInput
                type="number"
                value={currentDailyReview}
                className="text-5xl font-light h-auto py-2 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground tabular-nums bg-transparent"
                onChange={(event) => {
                    const val = parseInt(event.target.value, 10) || 0;
                    setLocalSettings(prev => ({
                    ...prev,
                    dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                    }));
                }}
            />
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between group">
          <div className="space-y-1">
            <div className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Binary Rating</div>
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pass / Fail Only</div>
          </div>
          <Switch
            checked={localSettings.binaryRatingMode}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
            }
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-sm">
            Reduces cognitive load by removing "Hard" and "Easy" options. Recommended for rapid review sessions.
        </p>
      </section>
    </div>
  );
};
