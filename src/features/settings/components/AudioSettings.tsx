import React from 'react';
import { Volume2 } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface VoiceOption { id: string; name: string; }

interface AudioSettingsProps {
  localSettings: UserSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  availableVoices: VoiceOption[];
  onTestAudio: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  localSettings,
  setLocalSettings,
  availableVoices,
  onTestAudio,
}) => {
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-20 max-w-2xl">
      <section className="space-y-6">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Speech Provider</h3>
        </div>
        <div className="space-y-3 pl-1">
            <EditorialSelect
                value={localSettings.tts.provider}
                onChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
                options={[
                    { value: 'browser', label: 'Browser Native' },
                    { value: 'google', label: 'Google Cloud TTS' },
                    { value: 'azure', label: 'Microsoft Azure' },
                ]}
                className="border-0 border-b border-border/30 rounded-none px-0 py-3 h-auto font-serif text-base bg-transparent focus-visible:border-terracotta/60 font-light"
            />
        </div>

        {localSettings.tts.provider !== 'browser' && (
            <div className="space-y-6 pl-1 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                    <label className="text-sm font-serif text-muted-foreground/80 font-light">API Credentials</label>
                    <EditorialInput
                        type="password"
                        placeholder={localSettings.tts.provider === 'google' ? "Google Cloud API key" : "Azure subscription key"}
                        value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                        onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                        className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-3 placeholder:text-muted-foreground/30 focus-visible:border-terracotta/60"
                    />
                </div>
                {localSettings.tts.provider === 'azure' && (
                     <div className="space-y-3">
                        <label className="text-sm font-serif text-muted-foreground/80 font-light">Region</label>
                        <EditorialInput
                            placeholder="e.g., eastus, westeurope"
                            value={localSettings.tts.azureRegion}
                            onChange={(e) => updateTts({ azureRegion: e.target.value })}
                            className="font-mono text-sm bg-transparent border-0 border-b border-border/30 rounded-none px-0 py-3 placeholder:text-muted-foreground/30 focus-visible:border-terracotta/60"
                        />
                    </div>
                )}
            </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Voice Selection</h3>
            <Button 
                variant="ghost" 
                size="sm"
                onClick={onTestAudio}
                className="text-xs font-serif tracking-wide text-terracotta/70 hover:text-terracotta h-auto px-3 py-1.5 hover:bg-terracotta/5 transition-colors"
            >
                <Volume2 size={14} strokeWidth={1.5} className="mr-2" /> Test Voice
            </Button>
        </div>
        <div className="space-y-3 pl-1">
            <EditorialSelect
                value={localSettings.tts.voiceURI || 'default'}
                onChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
                options={[{ value: 'default', label: 'System Default' }, ...availableVoices.map(v => ({ value: v.id, label: v.name }))]}
                className="border-0 border-b border-border/30 rounded-none px-0 py-3 h-auto font-serif text-base bg-transparent focus-visible:border-terracotta/60 font-light"
            />
        </div>
      </section>

      <section className="space-y-8">
        <div className="pb-4 border-b border-border/20">
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground/90">Playback</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pl-1">
            <div className="space-y-5">
                <div className="flex justify-between items-baseline">
                    <label className="text-sm font-serif text-muted-foreground/80 font-light">Speed</label>
                    <span className="text-2xl font-serif font-light tabular-nums text-foreground/70">{localSettings.tts.rate.toFixed(1)}<span className="text-sm text-muted-foreground/40">×</span></span>
                </div>
                <Slider
                    min={0.5} max={2} step={0.1}
                    value={[localSettings.tts.rate]}
                    onValueChange={([v]) => updateTts({ rate: v })}
                    className="py-3"
                />
            </div>
            <div className="space-y-5">
                <div className="flex justify-between items-baseline">
                    <label className="text-sm font-serif text-muted-foreground/80 font-light">Volume</label>
                    <span className="text-2xl font-serif font-light tabular-nums text-foreground/70">{Math.round(localSettings.tts.volume * 100)}<span className="text-sm text-muted-foreground/40">%</span></span>
                </div>
                <Slider
                    min={0} max={1} step={0.1}
                    value={[localSettings.tts.volume]}
                    onValueChange={([v]) => updateTts({ volume: v })}
                    className="py-3"
                />
            </div>
        </div>
      </section>
    </div>
  );
};
