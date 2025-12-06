import React from 'react';
import { User, Globe, Sparkles, Settings } from 'lucide-react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { OrnateSeparator } from '@/components/ui/separator';

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  username: string;
  setUsername: (username: string) => void;
  languageLevel: string;
  onUpdateLevel: (level: string) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  localSettings,
  setLocalSettings,
  username,
  setUsername,
  languageLevel,
  onUpdateLevel
}) => {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <SectionHeader
        title="Identity"
        subtitle="Your public profile information"
        icon={<User className="w-4 h-4" strokeWidth={1.5} />}
      />
      <Card variant="default" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Display Name
            </label>
            <span className="text-[9px] text-primary/60 uppercase tracking-wider ml-auto font-ui">Public</span>
          </div>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your display name"
            className="font-ui"
          />
          <p className="text-xs text-muted-foreground/60 leading-relaxed font-light">
            Displayed on global leaderboards and achievements.
          </p>
        </div>
      </Card>

      <OrnateSeparator />

      {/* Language Section */}
      <SectionHeader
        title="Language"
        subtitle="Active course configuration"
        icon={<Globe className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-4">
        <Card variant="default" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Active Course
              </label>
            </div>
            <EditorialSelect
              value={localSettings.language}
              onChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  language: value as UserSettings['language'],
                }))
              }
              options={Object.entries(LANGUAGE_NAMES).map(([key, label]) => ({
                value: key,
                label: label,
              }))}
              className="font-ui"
            />
          </div>
        </Card>

        <Card variant="default" size="md">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Proficiency Level
            </label>
          </div>
          <EditorialSelect
            value={languageLevel || 'A1'}
            onChange={onUpdateLevel}
            options={[
              { value: 'A1', label: 'A1 - Beginner' },
              { value: 'A2', label: 'A2 - Elementary' },
              { value: 'B1', label: 'B1 - Intermediate' },
              { value: 'C1', label: 'C1 - Advanced' },
            ]}
          />
          <p className="text-xs text-muted-foreground mt-2">Controls AI complexity.</p>
        </Card>

        <Card variant="default" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Theme Accent
              </label>
            </div>
            <ColorPicker
              label=""
              value={localSettings.languageColors?.[localSettings.language] || '0 0% 0%'}
              onChange={(newColor) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  languageColors: {
                    ...(prev.languageColors || {}),
                    [prev.language]: newColor,
                  } as any,
                }))
              }
            />
          </div>
        </Card>
      </div>

      <OrnateSeparator />

      {/* API Section */}
      <SectionHeader
        title="AI Integration"
        subtitle="Gemini API configuration"
        icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
      />
      <Card variant="default" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              API Key
            </label>
          </div>
          <Input
            type="password"
            value={localSettings.geminiApiKey || ''}
            onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
            placeholder="API key for content generation"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground/60 leading-relaxed font-light">
            Powers sentence generation and linguistic analysis features.
          </p>
        </div>
      </Card>

      <OrnateSeparator />

      {/* Behavior Toggles */}
      <SectionHeader
        title="Behavior"
        subtitle="Study session preferences"
        icon={<Settings className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="space-y-3">
        {[
          { label: 'Automatic Audio', desc: 'Play pronunciation when card is revealed', key: 'autoPlayAudio' },
          { label: 'Listening Mode', desc: 'Hide text until audio completes', key: 'blindMode' },
          { label: 'Show Translation', desc: 'Display native language meaning', key: 'showTranslationAfterFlip' }
        ].map((item) => (
          <Card key={item.key} variant="stat" size="sm" className="hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rotate-45 bg-primary/40" />
                  <span className="text-sm font-light text-foreground font-ui">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground/60 font-light pl-3">{item.desc}</p>
              </div>
              <Switch
                checked={(localSettings as any)[item.key]}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
