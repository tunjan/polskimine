import React from 'react';
import { UserSettings } from '@/types';
import { EditorialInput } from '@/components/form/EditorialInput';
import { MetaLabel } from '@/components/form/MetaLabel';

interface StudySettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const StudySettings: React.FC<StudySettingsProps> = ({ localSettings, setLocalSettings }) => (
  <div className="space-y-10 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
    <section>
      <MetaLabel>New Cards / Day</MetaLabel>
      <EditorialInput
        type="number"
        value={localSettings.dailyNewLimit}
        onChange={(event) =>
          setLocalSettings((prev) => ({
            ...prev,
            dailyNewLimit: parseInt(event.target.value, 10) || 0,
          }))
        }
      />
    </section>
    <section>
      <MetaLabel>Reviews / Day</MetaLabel>
      <EditorialInput
        type="number"
        value={localSettings.dailyReviewLimit}
        onChange={(event) =>
          setLocalSettings((prev) => ({
            ...prev,
            dailyReviewLimit: parseInt(event.target.value, 10) || 0,
          }))
        }
      />
    </section>
  </div>
);