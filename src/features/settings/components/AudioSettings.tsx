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

// ...existing code...
export const AudioSettings: React.FC<AudioSettingsProps> = ({
  localSettings,
  setLocalSettings,
  availableVoices,
  onTestAudio,
}) => {
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  return (
    <div className="space-y-16 max-w-xl">
      <section className="space-y-8">
        <div className="space-y-4">
            <MetaLabel className="text-xs">Provider</MetaLabel>
            <EditorialSelect
                value={localSettings.tts.provider}
                onChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
                options={[
                    { value: 'browser', label: 'Browser Native' },
                    { value: 'google', label: 'Google Cloud' },
                    { value: 'azure', label: 'Microsoft Azure' },
                ]}
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        {localSettings.tts.provider !== 'browser' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <MetaLabel className="text-xs">API Credentials</MetaLabel>
                <EditorialInput
                    type="password"
                    placeholder={localSettings.tts.provider === 'google' ? "GOOGLE API KEY" : "AZURE KEY"}
                    value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                    onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                    className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                />
                {localSettings.tts.provider === 'azure' && (
                     <EditorialInput
                        placeholder="REGION (e.g. eastus)"
                        value={localSettings.tts.azureRegion}
                        onChange={(e) => updateTts({ azureRegion: e.target.value })}
                        className="font-mono text-xs bg-transparent border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 placeholder:text-muted-foreground/20"
                    />
                )}
            </div>
        )}
      </section>

      <section className="space-y-8">
        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <MetaLabel className="mb-0 text-xs">Voice Model</MetaLabel>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onTestAudio}
                    className="text-[10px] font-mono uppercase tracking-widest text-foreground/60 hover:text-foreground h-auto px-2 py-1 hover:bg-transparent"
                >
                    <Volume2 size={12} className="mr-2" /> Test
                </Button>
            </div>
            <EditorialSelect
                value={localSettings.tts.voiceURI || 'default'}
                onChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
                options={[{ value: 'default', label: 'System Default' }, ...availableVoices.map(v => ({ value: v.id, label: v.name }))]}
                className="border-x-0 border-t-0 border-b border-border/40 rounded-none px-0 py-3 h-auto font-mono text-sm"
            />
        </div>

        <div className="grid grid-cols-2 gap-16 pt-4">
            <div className="space-y-6">
                <div className="flex justify-between">
                    <MetaLabel className="mb-0 text-xs">Speed</MetaLabel>
                    <span className="text-xs font-mono text-muted-foreground">{localSettings.tts.rate.toFixed(1)}x</span>
                </div>
                <Slider
                    min={0.5} max={2} step={0.1}
                    value={[localSettings.tts.rate]}
                    onValueChange={([v]) => updateTts({ rate: v })}
                    className="py-2"
                />
            </div>
            <div className="space-y-6">
                <div className="flex justify-between">
                    <MetaLabel className="mb-0 text-xs">Volume</MetaLabel>
                    <span className="text-xs font-mono text-muted-foreground">{Math.round(localSettings.tts.volume * 100)}%</span>
                </div>
                <Slider
                    min={0} max={1} step={0.1}
                    value={[localSettings.tts.volume]}
                    onValueChange={([v]) => updateTts({ volume: v })}
                    className="py-2"
                />
            </div>
        </div>
      </section>
    </div>
  );
};
