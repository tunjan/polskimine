import React from 'react';
import { Volume2, Mic, Gauge } from 'lucide-react';
import { UserSettings } from '@/types';
import { TTS_PROVIDER } from '@/constants/settings';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    <div className="space-y-6 max-w-2xl">
      {/* Speech Provider Section */}
      <div>
        <h3 className="text-lg font-medium">Speech Provider</h3>
        <p className="text-sm text-muted-foreground">Text-to-speech engine configuration</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={localSettings.tts.provider}
              onValueChange={(value) => updateTts({ provider: value as any, voiceURI: null })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: TTS_PROVIDER.BROWSER, label: 'Browser Native' },
                  { value: TTS_PROVIDER.GOOGLE, label: 'Google Cloud TTS' },
                  { value: TTS_PROVIDER.AZURE, label: 'Microsoft Azure' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localSettings.tts.provider !== TTS_PROVIDER.BROWSER && (
            <div className="pt-4 space-y-4 border-t mt-4">
              <div className="space-y-2">
                <Label>API Credentials</Label>
                <Input
                  type="password"
                  placeholder={localSettings.tts.provider === TTS_PROVIDER.GOOGLE ? "Google Cloud API key" : "Azure subscription key"}
                  value={localSettings.tts.provider === TTS_PROVIDER.GOOGLE ? localSettings.tts.googleApiKey : localSettings.tts.azureApiKey}
                  onChange={(e) => updateTts(localSettings.tts.provider === TTS_PROVIDER.GOOGLE ? { googleApiKey: e.target.value } : { azureApiKey: e.target.value })}
                  className="font-mono"
                />
              </div>
              {localSettings.tts.provider === TTS_PROVIDER.AZURE && (
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    placeholder="e.g., eastus, westeurope"
                    value={localSettings.tts.azureRegion}
                    onChange={(e) => updateTts({ azureRegion: e.target.value })}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Selection Section */}
      <div>
        <h3 className="text-lg font-medium">Voice Selection</h3>
        <p className="text-sm text-muted-foreground">Choose and test your preferred voice</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Voice</Label>
              <Select
                value={localSettings.tts.voiceURI || 'default'}
                onValueChange={(value) => updateTts({ voiceURI: value === 'default' ? null : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">System Default</SelectItem>
                  {availableVoices.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={onTestAudio}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Test Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Playback Settings */}
      <div>
        <h3 className="text-lg font-medium">Playback</h3>
        <p className="text-sm text-muted-foreground">Audio speed and volume controls</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Speed</CardTitle>
            <CardDescription>Adjust playback rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">{localSettings.tts.rate.toFixed(1)}x</span>
            </div>
            <Slider
              min={0.5} max={2} step={0.1}
              value={[localSettings.tts.rate]}
              onValueChange={([v]) => updateTts({ rate: v })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>Adjust output volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-light">{Math.round(localSettings.tts.volume * 100)}%</span>
            </div>
            <Slider
              min={0} max={1} step={0.1}
              value={[localSettings.tts.volume]}
              onValueChange={([v]) => updateTts({ volume: v })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
