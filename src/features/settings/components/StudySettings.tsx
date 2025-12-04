import React from 'react';
import { Target, ListOrdered, ToggleLeft } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { GamePanel, GameSectionHeader, GameDivider } from '@/components/ui/game-ui';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info Banner */}
      <GamePanel variant="stat" size="sm" className="border-primary/20">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Daily study configuration for <span className="text-foreground font-medium">{currentLangName}</span>. Limits reset at 4:00 AM.
          </p>
        </div>
      </GamePanel>

      {/* Daily Limits Section */}
      <GameSectionHeader 
        title="Daily Limits" 
        subtitle="Maximum cards per day"
        icon={<Target className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GamePanel variant="highlight" size="md" glowOnHover>
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/60" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                New Cards
              </label>
            </div>
            <EditorialInput
              type="number"
              value={currentDailyNew}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Unseen vocabulary</p>
          </div>
        </GamePanel>

        <GamePanel variant="highlight" size="md" glowOnHover>
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-sky-500/60" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Review Cards
              </label>
            </div>
            <EditorialInput
              type="number"
              value={currentDailyReview}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Due for review</p>
          </div>
        </GamePanel>
      </div>

      <GameDivider />

      {/* Study Preferences Section */}
      <GameSectionHeader 
        title="Study Preferences" 
        subtitle="Session behavior options"
        icon={<ToggleLeft className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-light text-foreground font-ui">Card Order</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Choose presentation priority</p>
            </div>
            <select
              value={localSettings.cardOrder || 'newFirst'}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, cardOrder: e.target.value as any }))}
              className="bg-transparent border border-border/30 text-sm font-ui focus:outline-none focus:border-primary/60 transition-colors py-2 px-3 text-foreground font-light"
            >
              <option value="newFirst" className="bg-background text-foreground">New First</option>
              <option value="reviewFirst" className="bg-background text-foreground">Review First</option>
              <option value="mixed" className="bg-background text-foreground">Mixed</option>
            </select>
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Binary Rating</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Simplified pass/fail grading reduces decision fatigue</p>
            </div>
            <Switch
              checked={localSettings.binaryRatingMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
              }
            />
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Full Sentence Front</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Show the full sentence on the front of the card instead of just the target word</p>
            </div>
            <Switch
              checked={localSettings.showWholeSentenceOnFront || false}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, showWholeSentenceOnFront: checked }))
              }
            />
          </div>
        </GamePanel>

        <GamePanel variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1 h-1 rotate-45 bg-primary/40" />
                <span className="text-sm font-light text-foreground font-ui">Skip Learning Wait</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Continue reviewing other due cards instead of waiting for learning steps to cool down</p>
            </div>
            <Switch
              checked={localSettings.ignoreLearningStepsWhenNoCards}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, ignoreLearningStepsWhenNoCards: checked }))
              }
            />
          </div>
        </GamePanel>
      </div>
    </div>
  );
};

