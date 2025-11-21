import React from 'react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { useTheme } from '@/contexts/ThemeContext';

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ localSettings, setLocalSettings }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section>
        <MetaLabel>Target Language</MetaLabel>
        <EditorialSelect
          value={localSettings.language}
          onChange={(value) =>
            setLocalSettings((prev) => ({
              ...prev,
              language: value as UserSettings['language'],
            }))
          }
          options={['polish', 'norwegian', 'japanese'].map((language) => ({
            value: language,
            label: LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES],
          }))}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Switching languages will filter your card view. It does not delete data.
        </p>
      </section>

      <section>
        <div className="space-y-4">
          <ColorPicker
            label="Accent Color"
            value={localSettings.languageColors?.[localSettings.language] || '0 0% 0%'}
            onChange={(newColor) =>
              setLocalSettings((prev) => ({
                ...prev,
                languageColors: {
                  ...(prev.languageColors || {}),
                  [prev.language]: newColor,
                } as any, // Cast to any to avoid strict typing issues with partial updates
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Customize the primary color for {LANGUAGE_NAMES[localSettings.language as keyof typeof LANGUAGE_NAMES]}.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Auto-play Audio</div>
            <div className="text-xs text-muted-foreground">Play TTS immediately upon revealing card.</div>
          </div>
          <Switch
            checked={localSettings.autoPlayAudio}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                autoPlayAudio: checked,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Blind Mode</div>
            <div className="text-xs text-muted-foreground">Play audio first, hide text until revealed.</div>
          </div>
          <Switch
            checked={localSettings.blindMode}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                blindMode: checked,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Show Translation</div>
            <div className="text-xs text-muted-foreground">Reveal native translation on back of card.</div>
          </div>
          <Switch
            checked={localSettings.showTranslationAfterFlip}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({
                ...prev,
                showTranslationAfterFlip: checked,
              }))
            }
          />
        </div>
      </section>
    </div>
  );
};