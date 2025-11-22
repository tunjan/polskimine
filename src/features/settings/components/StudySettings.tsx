import React from 'react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { MetaLabel } from '@/components/form/MetaLabel';
import { LANGUAGE_NAMES } from '@/constants';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => {
  const currentLangName = LANGUAGE_NAMES[localSettings.language];
  const currentDailyNew = localSettings.dailyNewLimits?.[localSettings.language] ?? 0;
  const currentDailyReview = localSettings.dailyReviewLimits?.[localSettings.language] ?? 0;

  return (
    <div className="space-y-10 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-secondary/20 p-4 rounded text-xs text-muted-foreground leading-relaxed mb-6">
        These limits apply specifically to your <strong>{currentLangName}</strong> deck.
      </div>
      <section>
        <MetaLabel>New Cards / Day</MetaLabel>
        <EditorialInput
          type="number"
          value={currentDailyNew}
          onChange={(event) => {
            const val = parseInt(event.target.value, 10) || 0;
            setLocalSettings(prev => ({
              ...prev,
              dailyNewLimits: {
                ...prev.dailyNewLimits,
                [prev.language]: val
              }
            }));
          }}
        />
      </section>
      <section>
        <MetaLabel>Reviews / Day</MetaLabel>
        <EditorialInput
          type="number"
          value={currentDailyReview}
          onChange={(event) => {
            const val = parseInt(event.target.value, 10) || 0;
            setLocalSettings(prev => ({
              ...prev,
              dailyReviewLimits: {
                ...prev.dailyReviewLimits,
                [prev.language]: val
              }
            }));
          }}
        />
      </section>
    </div>
  );
};