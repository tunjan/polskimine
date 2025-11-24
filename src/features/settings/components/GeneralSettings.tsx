import React from 'react';
import { LANGUAGE_NAMES } from '@/constants';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface GeneralSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  username: string;
  setUsername: (username: string) => void;
}

// ...existing code...
export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  localSettings, 
  setLocalSettings,
  username,
  setUsername
}) => {
  return (
    <div className="space-y-16 max-w-xl">
      {/* Profile Section */}
      <section className="space-y-8">
        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Identity</MetaLabel>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Public</span>
            </div>
            <div className="space-y-2">
                <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="USERNAME"
                    className="font-mono text-sm bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground h-auto py-3 placeholder:text-muted-foreground/20 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground/60">Visible on global leaderboards.</p>
            </div>
        </div>
      </section>

      {/* Language Section */}
      <section className="space-y-8">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Active Course</MetaLabel>
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
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus:ring-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        <div className="space-y-4">
             <ColorPicker
                label="THEME ACCENT"
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
      </section>

      {/* API Section */}
      <section className="space-y-8">
         <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Intelligence</MetaLabel>
                <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Gemini API</span>
            </div>
            <Input
                type="password"
                value={localSettings.geminiApiKey || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="ENTER API KEY"
                className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground h-auto py-3 placeholder:text-muted-foreground/20 transition-colors"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Required for sentence generation and linguistic analysis.
            </p>
         </div>
      </section>

      {/* Toggles */}
      <section className="space-y-8 pt-4">
        {[
            { label: 'Auto-play Audio', desc: 'Trigger TTS on reveal', key: 'autoPlayAudio' },
            { label: 'Blind Mode', desc: 'Hide text until audio plays', key: 'blindMode' },
            { label: 'Show Translation', desc: 'Display native meaning', key: 'showTranslationAfterFlip' }
        ].map((item) => (
            <div key={item.key} className="flex items-center justify-between group">
                <div className="space-y-1">
                    <div className="text-sm font-medium group-hover:text-foreground transition-colors font-mono uppercase tracking-wider text-muted-foreground">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground/60">{item.desc}</div>
                </div>
                <Switch
                    checked={(localSettings as any)[item.key]}
                    onCheckedChange={(checked) =>
                        setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
                    }
                />
            </div>
        ))}
      </section>
    </div>
  );
};
