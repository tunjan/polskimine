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
    <div className="space-y-20 max-w-2xl">
      {/* Profile Section - Editorial style */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-4 pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90 flex-1">Identity</h3>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-terracotta/60">Public</span>
        </div>
        <div className="space-y-3 pl-1">
            <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your display name"
                className="font-serif text-base bg-transparent border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-terracotta/60 h-auto py-3 placeholder:text-muted-foreground/30 transition-colors font-light"
            />
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-light pl-0.5">
                Displayed on global leaderboards and achievements.
            </p>
        </div>
      </section>

      {/* Language Section - Warm and inviting */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-4 pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Language</h3>
        </div>
        <div className="space-y-8 pl-1">
            <div className="space-y-3">
                <label className="text-sm font-serif text-muted-foreground/80 font-light">Active Course</label>
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
                    className="border-0 border-b border-border/30 rounded-none px-0 focus:ring-0 py-3 h-auto font-serif text-base bg-transparent focus-visible:border-terracotta/60 font-light"
                />
            </div>

            <div className="space-y-3">
                 <ColorPicker
                    label="Theme Accent"
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
        </div>
      </section>

      {/* API Section - Professional and clean */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-4 pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90 flex-1">AI Integration</h3>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40">Gemini</span>
        </div>
        <div className="space-y-3 pl-1">
            <Input
                type="password"
                value={localSettings.geminiApiKey || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                placeholder="API key for content generation"
                className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-terracotta/60 h-auto py-3 placeholder:text-muted-foreground/30 transition-colors"
            />
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-light pl-0.5">
                Powers sentence generation and linguistic analysis features.
            </p>
         </div>
      </section>

      {/* Toggles - Calm and spacious */}
      <section className="space-y-8 pt-4">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Behavior</h3>
        </div>
        <div className="space-y-8 pl-1">
            {[
                { label: 'Automatic Audio', desc: 'Play pronunciation when card is revealed', key: 'autoPlayAudio' },
                { label: 'Listening Mode', desc: 'Hide text until audio completes', key: 'blindMode' },
                { label: 'Show Translation', desc: 'Display native language meaning', key: 'showTranslationAfterFlip' }
            ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-8 group py-2">
                    <div className="space-y-1.5 flex-1">
                        <div className="font-serif text-[15px] font-light group-hover:text-foreground transition-colors text-foreground/80">{item.label}</div>
                        <div className="text-xs text-muted-foreground/60 leading-relaxed font-light">{item.desc}</div>
                    </div>
                    <Switch
                        checked={(localSettings as any)[item.key]}
                        onCheckedChange={(checked) =>
                            setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
                        }
                        className="mt-1"
                    />
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};
