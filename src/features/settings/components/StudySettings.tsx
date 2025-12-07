import React from 'react';
import { Target, ListOrdered, ToggleLeft, Clock } from 'lucide-react';
import { UserSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { LANGUAGE_NAMES } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;
  const [stepsInput, setStepsInput] = React.useState(localSettings.learningSteps?.join(' ') || '1 10');

  const handleStepsChange = (val: string) => {
    setStepsInput(val);
    const steps = val.split(/[\s,]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
    if (steps.length > 0) {
      setLocalSettings(prev => ({ ...prev, learningSteps: steps }));
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info Banner */}
      <Card className="border-primary/20">
        <CardContent className="flex items-center gap-3 p-4">
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Daily study configuration for <span className="text-foreground font-medium">{currentLangName}</span>. Limits reset at 4:00 AM.
          </p>
        </CardContent>
      </Card>

      {/* Daily Limits Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Daily Limits
        </h3>
        <p className="text-sm text-muted-foreground">Maximum cards per day</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                New Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyNew}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyNewLimits: { ...prev.dailyNewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Unseen vocabulary</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 text-center p-6">
            <div className="flex items-center justify-center gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium ">
                Review Cards
              </label>
            </div>
            <Input
              type="number"
              value={currentDailyReview}
              className="text-5xl md:text-6xl font-light h-auto py-2 border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center shadow-none"
              onChange={(event) => {
                const val = parseInt(event.target.value, 10) || 0;
                setLocalSettings(prev => ({
                  ...prev,
                  dailyReviewLimits: { ...prev.dailyReviewLimits, [prev.language]: val }
                }));
              }}
            />
            <p className="text-xs text-muted-foreground/60 font-light">Due for review</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Study Preferences Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ToggleLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          Study Preferences
        </h3>
        <p className="text-sm text-muted-foreground">Session behavior options</p>
      </div>
      <div className="space-y-3">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground ">Learning Steps</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Minutes between reviews (e.g. "1 10")</p>
            </div>
            <Input
              type="text"
              value={stepsInput}
              className="w-32 bg-transparent border-0 border-b border-border/30 text-sm  focus:outline-none focus:border-primary/60 transition-colors py-1 px-1 text-right text-foreground font-light shadow-none focus-visible:ring-0 rounded-none h-auto"
              onChange={(e) => handleStepsChange(e.target.value)}
              placeholder="1 10"
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground ">Card Order</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-6">Choose presentation priority</p>
            </div>
            <Select
              value={localSettings.cardOrder || 'newFirst'}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, cardOrder: value as any }))}
            >
              <SelectTrigger className="w-[140px] border-0 border-b border-border/30 rounded-none shadow-none focus:ring-0 px-2 h-8">
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newFirst">New First</SelectItem>
                <SelectItem value="reviewFirst">Review First</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Binary Rating</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Simplified pass/fail grading reduces decision fatigue</p>
            </div>
            <Switch
              checked={localSettings.binaryRatingMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Full Sentence Front</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Show the full sentence on the front of the card instead of just the target word</p>
            </div>
            <Switch
              checked={localSettings.showWholeSentenceOnFront}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, showWholeSentenceOnFront: checked }))
              }
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="flex items-center justify-between gap-6 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground ">Skip Learning Wait</span>
              </div>
              <p className="text-xs text-muted-foreground/60 font-light pl-3">Continue reviewing other due cards instead of waiting for learning steps to cool down</p>
            </div>
            <Switch
              checked={localSettings.ignoreLearningStepsWhenNoCards}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, ignoreLearningStepsWhenNoCards: checked }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

