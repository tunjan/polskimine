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

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-20 max-w-2xl">
      <div className="flex items-start gap-3 px-1">
        <div className="w-1 h-1 mt-2 bg-terracotta/60 rounded-full shrink-0" />
        <p className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-lg">
          Daily study configuration for <em className="text-foreground font-normal">{currentLangName}</em>. Limits automatically reset at 4:00 AM.
        </p>
      </div>

      <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Daily Limits</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pl-1">
            <div className="space-y-5">
                <label className="text-sm font-serif text-muted-foreground/80 font-light">New Cards</label>
                <EditorialInput
                    type="number"
                    value={currentDailyNew}
                    className="text-6xl font-serif font-extralight h-auto py-3 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-terracotta/60 tabular-nums bg-transparent transition-colors"
                    onChange={(event) => {
                      const val = parseInt(event.target.value, 10) || 0;
                      setLocalSettings(prev => ({
                        ...prev,
                        dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                      }));
                    }}
                />
            </div>
            <div className="space-y-5">
                <label className="text-sm font-serif text-muted-foreground/80 font-light">Review Cards</label>
                <EditorialInput
                    type="number"
                    value={currentDailyReview}
                    className="text-6xl font-serif font-extralight h-auto py-3 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-terracotta/60 tabular-nums bg-transparent transition-colors"
                    onChange={(event) => {
                      const val = parseInt(event.target.value, 10) || 0;
                      setLocalSettings(prev => ({
                        ...prev,
                        dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                      }));
                    }}
                />
            </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Study Preferences</h3>
        </div>
        <div className="space-y-8 pl-1">
            <div className="flex items-start justify-between gap-8 group py-2">
              <div className="space-y-1.5 flex-1">
                <div className="font-serif text-[15px] font-light group-hover:text-foreground transition-colors text-foreground/80">Card Order</div>
                <div className="text-xs text-muted-foreground/60 leading-relaxed font-light">Choose presentation priority</div>
              </div>
              <select
                value={localSettings.cardOrder || 'newFirst'}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, cardOrder: e.target.value as any }))}
                className="bg-transparent border-0 border-b border-border/30 text-sm font-serif focus:outline-none focus:border-terracotta/60 transition-colors py-1.5 text-foreground/80 font-light mt-0.5"
              >
                <option value="newFirst" className="bg-background text-foreground">New First</option>
                <option value="reviewFirst" className="bg-background text-foreground">Review First</option>
                <option value="mixed" className="bg-background text-foreground">Mixed</option>
              </select>
            </div>

            <div className="flex items-start justify-between gap-8 group py-2">
              <div className="space-y-1.5 flex-1">
                <div className="font-serif text-[15px] font-light group-hover:text-foreground transition-colors text-foreground/80">Binary Rating</div>
                <div className="text-xs text-muted-foreground/60 leading-relaxed font-light">Simplified pass/fail grading reduces decision fatigue during intensive review sessions</div>
              </div>
              <Switch
                checked={localSettings.binaryRatingMode}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
                }
                className="mt-1"
              />
            </div>
        </div>
      </section>
    </div>
  );
};
