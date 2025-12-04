import React from 'react';
import { Volume2, Mic, Gauge } from 'lucide-react';
import { UserSettings } from '@/types';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { EditorialInput } from '@/components/form/EditorialInput';
import { Slider } from '@/components/ui/slider';
import { GamePanel, GameSectionHeader, GameDivider, GameButton } from '@/components/ui/game-ui';

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
    <div className="space-y-8 max-w-2xl">
      {/* Speech Provider Section */}
      <GameSectionHeader 
        title="Speech Provider" 
        subtitle="Text-to-speech engine configuration"
        icon={<Mic className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
            <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
              Provider
            </label>
          </div>
          <EditorialSelect
            value={localSettings.tts.provider}
            onChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
            options={[
              { value: 'browser', label: 'Browser Native' },
              { value: 'google', label: 'Google Cloud TTS' },
              { value: 'azure', label: 'Microsoft Azure' },
            ]}
            className="font-ui"
          />
        </div>

        {localSettings.tts.provider !== 'browser' && (
          <div className="space-y-5 pt-6 mt-6 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                  API Credentials
                </label>
              </div>
              <EditorialInput
                type="password"
                placeholder={localSettings.tts.provider === 'google' ? "Google Cloud API key" : "Azure subscription key"}
                value={localSettings.tts.provider === 'google' ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                onChange={(e) => updateTts(localSettings.tts.provider === 'google' ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                className="font-mono"
              />
            </div>
            {localSettings.tts.provider === 'azure' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                  <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                    Region
                  </label>
                </div>
                <EditorialInput
                  placeholder="e.g., eastus, westeurope"
                  value={localSettings.tts.azureRegion}
                  onChange={(e) => updateTts({ azureRegion: e.target.value })}
                  className="font-mono"
                />
              </div>
            )}
          </div>
        )}
      </GamePanel>

      <GameDivider />

      {/* Voice Selection Section */}
      <GameSectionHeader 
        title="Voice Selection" 
        subtitle="Choose and test your preferred voice"
        icon={<Volume2 className="w-4 h-4" strokeWidth={1.5} />}
      />
      <GamePanel variant="default" size="md" glowOnHover>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
              <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">
                Voice
              </label>
            </div>
            <GameButton 
              variant="ghost" 
              size="sm"
              onClick={onTestAudio}
            >
              <Volume2 size={14} strokeWidth={1.5} /> Test Voice
            </GameButton>
          </div>
          <EditorialSelect
            value={localSettings.tts.voiceURI || 'default'}
            onChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
            options={[{ value: 'default', label: 'System Default' }, ...availableVoices.map(v => ({ value: v.id, label: v.name }))]}
            className="font-ui"
          />
        </div>
      </GamePanel>

      <GameDivider />

      {/* Playback Settings */}
      <GameSectionHeader 
        title="Playback" 
        subtitle="Audio speed and volume controls"
        icon={<Gauge className="w-4 h-4" strokeWidth={1.5} />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GamePanel variant="stat" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">Speed</label>
              </div>
              <span className="text-2xl font-light tabular-nums text-foreground">{localSettings.tts.rate.toFixed(1)}<span className="text-sm text-muted-foreground/40">×</span></span>
            </div>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[localSettings.tts.rate]}
              onValueChange={([v]) => updateTts({ rate: v })}
              className="py-3"
            />
          </div>
        </GamePanel>
        
        <GamePanel variant="stat" size="md" glowOnHover>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                <label className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-light font-ui">Volume</label>
              </div>
              <span className="text-2xl font-light tabular-nums text-foreground">{Math.round(localSettings.tts.volume * 100)}<span className="text-sm text-muted-foreground/40">%</span></span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[localSettings.tts.volume]}
              onValueChange={([v]) => updateTts({ volume: v })}
              className="py-3"
            />
          </div>
        </GamePanel>
      </div>
    </div>
  );
};
