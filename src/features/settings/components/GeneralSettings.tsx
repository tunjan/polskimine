import React from "react";
import { User, Globe, Sparkles, Settings } from "lucide-react";
import { LANGUAGE_NAMES } from "@/constants";
import { UserSettings } from "@/types";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onUpdateLevel,
}) => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium">Identity</h3>
        <p className="text-sm text-muted-foreground">
          Your public profile information
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Displayed on global leaderboards and achievements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Language</h3>
        <p className="text-sm text-muted-foreground">
          Active course configuration
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Course</CardTitle>
            <CardDescription>
              Select the language you are currently learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={localSettings.language}
              onValueChange={(value) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  language: value as UserSettings["language"],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGE_NAMES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proficiency Level</CardTitle>
            <CardDescription>
              Controls the complexity of AI-generated content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={languageLevel || "A1"} onValueChange={onUpdateLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "A1", label: "A1 - Beginner" },
                  { value: "A2", label: "A2 - Elementary" },
                  { value: "B1", label: "B1 - Intermediate" },
                  { value: "C1", label: "C1 - Advanced" },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Accent</CardTitle>
            <CardDescription>
              Customize the accent color for this language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ColorPicker
              label=""
              value={
                localSettings.languageColors?.[localSettings.language] ||
                "0 0% 0%"
              }
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
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">AI Integration</h3>
        <p className="text-sm text-muted-foreground">
          Gemini API configuration
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>
            Powers sentence generation and linguistic analysis features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="password"
            value={localSettings.geminiApiKey || ""}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                geminiApiKey: e.target.value,
              }))
            }
            placeholder="Enter your API key"
            className="font-mono"
          />
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Behavior</h3>
        <p className="text-sm text-muted-foreground">
          Study session preferences
        </p>
      </div>
      <div className="space-y-4">
        {[
          {
            label: "Automatic Audio",
            desc: "Play pronunciation when card is revealed",
            key: "autoPlayAudio",
          },
          {
            label: "Listening Mode",
            desc: "Hide text until audio completes",
            key: "blindMode",
          },
          {
            label: "Show Translation",
            desc: "Display native language meaning",
            key: "showTranslationAfterFlip",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between space-x-2 border p-4 rounded-lg"
          >
            <div className="space-y-0.5">
              <Label className="text-base">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={(localSettings as any)[item.key]}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
