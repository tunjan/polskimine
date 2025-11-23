import React from 'react';
import { Volume2, HelpCircle } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceOption {
  id: string;
  name: string;
}

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
  const provider = localSettings.tts.provider;
  const updateTts = (partial: Partial<UserSettings['tts']>) =>
    setLocalSettings((prev) => ({
      ...prev,
      tts: { ...prev.tts, ...partial },
    }));

  return (
    <div className="space-y-10 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section>
        <MetaLabel>TTS Provider</MetaLabel>
        <EditorialSelect
          value={provider}
          onChange={(value) =>
            updateTts({ provider: value as UserSettings['tts']['provider'], voiceURI: null })
          }
          options={[
            { value: 'browser', label: 'Browser (Default)' },
            { value: 'google', label: 'Google Cloud' },
            { value: 'azure', label: 'Microsoft Azure' },
          ]}
        />
      </section>

      {provider !== 'browser' && (
        <section className="space-y-6 p-6 bg-secondary/20 rounded-lg border border-border/50">
          {provider === 'google' && (
            <div>
              <div className="flex items-center gap-2">
                <MetaLabel>API Key</MetaLabel>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help mb-2 hover:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4 bg-popover border-border text-popover-foreground">
                      <p className="font-semibold mb-2 text-sm">How to get a Google Cloud API Key:</p>
                      <ol className="list-decimal ml-4 space-y-1 text-xs text-muted-foreground">
                        <li>Create a project in <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-primary">Google Cloud Console</a></li>
                        <li>Enable <strong>"Cloud Text-to-Speech API"</strong></li>
                        <li>Create an <strong>API Key</strong> in Credentials</li>
                        <li>Paste the key here</li>
                      </ol>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <EditorialInput
                type="password"
                placeholder="Google Cloud API Key"
                value={localSettings.tts.googleApiKey || ''}
                onChange={(event) => updateTts({ googleApiKey: event.target.value })}
              />
            </div>
          )}
          {provider === 'azure' && (
            <div className="space-y-6">
              <div>
                <MetaLabel>Subscription Key</MetaLabel>
                <EditorialInput
                  type="password"
                  placeholder="Azure Key"
                  value={localSettings.tts.azureApiKey || ''}
                  onChange={(event) => updateTts({ azureApiKey: event.target.value })}
                />
              </div>
              <div>
                <MetaLabel>Region</MetaLabel>
                <EditorialInput
                  placeholder="e.g. eastus"
                  value={localSettings.tts.azureRegion || ''}
                  onChange={(event) => updateTts({ azureRegion: event.target.value })}
                />
              </div>
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <MetaLabel>Voice Model</MetaLabel>
          <button onClick={onTestAudio} className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
            <Volume2 size={10} /> Test
          </button>
        </div>
        <EditorialSelect
          value={localSettings.tts.voiceURI || 'default'}
          onChange={(value) =>
            updateTts({ voiceURI: value === 'default' ? null : value })
          }
          options={[
            { value: 'default', label: 'System Default' },
            ...availableVoices.map((voice) => ({ value: voice.id, label: voice.name })),
          ]}
        />
      </section>

      <section className="space-y-8 pt-4">
        <div>
          <div className="flex justify-between mb-4">
            <MetaLabel className="mb-0">Rate</MetaLabel>
            <span className="text-xs font-mono text-muted-foreground">{localSettings.tts.rate.toFixed(1)}x</span>
          </div>
          <Slider
            min={0.5}
            max={1.5}
            step={0.1}
            value={[localSettings.tts.rate]}
            onValueChange={([value]) => updateTts({ rate: value })}
          />
        </div>
        <div>
          <div className="flex justify-between mb-4">
            <MetaLabel className="mb-0">Volume</MetaLabel>
            <span className="text-xs font-mono text-muted-foreground">{Math.round(localSettings.tts.volume * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[localSettings.tts.volume]}
            onValueChange={([value]) => updateTts({ volume: value })}
          />
        </div>
      </section>
    </div>
  );
};