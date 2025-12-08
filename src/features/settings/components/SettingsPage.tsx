import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Globe,
  Volume2,
  BookOpen,
  Brain,
  Database,
  AlertTriangle,
  Sparkles,
  Settings,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  Check,
  Wand2,
  RefreshCw,
  Layers,
  Repeat,
} from "lucide-react";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { useDeckActions } from "@/hooks/useDeckActions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { UserSettings, Language } from "@/types";
import { ttsService, VoiceOption } from "@/lib/tts";
import { LANGUAGE_NAMES, FSRS_DEFAULTS } from "@/constants";
import {
  TTS_PROVIDER,
  CARD_ORDER,
  NEW_CARD_GATHER_ORDER,
  NEW_CARD_SORT_ORDER,
  NEW_REVIEW_ORDER,
  INTERDAY_LEARNING_ORDER,
  REVIEW_SORT_ORDER,
  LEECH_ACTION,
} from "@/constants/settings";
import {
  saveAllCards,
  getCardSignatures,
} from "@/db/repositories/cardRepository";

import { getAllReviewLogs } from "@/db/repositories/revlogRepository";
import { db } from "@/db/dexie";
import {
  parseCardsFromCsv,
  signatureForCard,
} from "@/features/generator/services/csvImport";
import { useCloudSync } from "@/features/settings/hooks/useCloudSync";
import { useAccountManagement } from "@/features/settings/hooks/useAccountManagement";
import { useSyncthingSync } from "@/features/settings/hooks/useSyncthingSync";
import { exportRevlogToCSV } from "@/features/settings/logic/optimizer";
import {
  exportSyncData,
  importSyncData,
  SyncData,
} from "@/lib/sync/syncService";

import { SettingsSection } from "./SettingsSection";
import {
  SettingsItem,
  SettingsLargeInput,
  SettingsSliderDisplay,
  SettingsSubSection,
} from "./SettingsItem";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const useDebouncedUsername = (
  localUsername: string,
  updateUsername: (name: string) => Promise<void>,
  currentUsername?: string,
) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localUsername && localUsername !== currentUsername) {
        updateUsername(localUsername).then(() =>
          toast.success("Username updated", { id: "username-update" }),
        );
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [localUsername, updateUsername, currentUsername]);
};

export const SettingsPage: React.FC = () => {
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.setFullSettings);
  const { user } = useAuth();
  const { profile, updateUsername, refreshProfile } = useProfile();
  const { refreshDeckData } = useDeckActions();

  const [localUsername, setLocalUsername] = useState(profile?.username || "");
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [stepsInput, setStepsInput] = useState(
    settings.learningSteps?.join(" ") || "1 10",
  );

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [includeApiKeys, setIncludeApiKeys] = useState(false);
  const [importApiKeys, setImportApiKeys] = useState(false);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ reviews: number } | null>(null);
  const [manualWeights, setManualWeights] = useState(
    (settings.fsrs.w || FSRS_DEFAULTS.w).join(", "),
  );
  const [showManual, setShowManual] = useState(false);

  const { handleSyncToCloud, isSyncingToCloud, syncComplete } = useCloudSync();
  const {
    saveToSyncFile,
    loadFromSyncFile,
    isSaving: isSyncthingSaving,
    isLoading: isSyncthingLoading,
    lastSync: lastSyncthingSync,
  } = useSyncthingSync();
  const {
    handleResetDeck,
    handleResetAccount,
    confirmResetDeck,
    confirmResetAccount,
  } = useAccountManagement();

  useEffect(() => {
    if (profile?.username) setLocalUsername(profile.username);
  }, [profile?.username]);

  useDebouncedUsername(
    localUsername,
    async (name) => {
      await updateUsername(name);
    },
    profile?.username,
  );

  useEffect(() => {
    const loadVoices = async () => {
      const voices = await ttsService.getAvailableVoices(
        settings.language,
        settings.tts,
      );
      setAvailableVoices(voices);
    };
    loadVoices();
  }, [
    settings.language,
    settings.tts.provider,
    settings.tts.googleApiKey,
    settings.tts.azureApiKey,
  ]);

  const updateTts = (partial: Partial<UserSettings["tts"]>) =>
    setSettings((prev) => ({ ...prev, tts: { ...prev.tts, ...partial } }));

  const handleTestAudio = () => {
    const testText: Record<string, string> = {
      polish: "Cześć, to jest test.",
      norwegian: "Hei, dette er en test.",
      japanese: "こんにちは、テストです。",
      spanish: "Hola, esto es una prueba.",
      german: "Hallo, das ist ein Test.",
    };
    ttsService.speak(
      testText[settings.language] || "Test audio",
      settings.language,
      settings.tts,
    );
  };

  const handleStepsChange = (val: string) => {
    setStepsInput(val);
    const steps = val
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    if (steps.length > 0) {
      setSettings((prev) => ({ ...prev, learningSteps: steps }));
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await exportSyncData(settings, {
        includeApiKeys,
        keepUsername: true,
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup - ${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Export complete.");
    } catch (e) {
      console.error(e);
      toast.error("Export failed.");
    }
  };

  const handleRestoreBackup = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        toast.error("Invalid backup file.");
        return;
      }

      if (!data.cards || !Array.isArray(data.cards)) {
        toast.error("Invalid backup: missing cards.");
        return;
      }

      if (
        !confirm(
          `Replace current data with backup from ${data.date || data.lastSynced}?\nCards: ${data.cards.length}`,
        )
      ) {
        return;
      }

      let syncData: SyncData = data as SyncData;

      if (Array.isArray(data.profile)) {
        syncData = {
          ...data,
          profile: data.profile.length > 0 ? data.profile[0] : null,
        } as SyncData;
      }

      const result = await importSyncData(syncData, settings.updateSettings, {
        importApiKeys,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const { recalculateAllStats } =
        await import("@/db/repositories/aggregatedStatsRepository");
      await recalculateAllStats();

      refreshDeckData();
      refreshProfile();
      toast.success(`Restored ${data.cards.length} cards.`);
    } catch (error) {
      console.error("Backup restore failed:", error);
      toast.error("Failed to restore backup.");
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedCards = parseCardsFromCsv(text, settings.language);

      if (parsedCards.length === 0) {
        toast.error("No valid rows found.");
        return;
      }

      const existingSignatures = await getCardSignatures(settings.language);
      const seen = new Set(
        existingSignatures.map((card) =>
          signatureForCard(card.target_sentence, settings.language),
        ),
      );

      const newCards = parsedCards.filter((card) => {
        const signature = signatureForCard(
          card.targetSentence,
          (card.language || settings.language) as Language,
        );
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      });

      if (!newCards.length) {
        toast.info("All rows already exist.");
        return;
      }

      await saveAllCards(newCards);
      refreshDeckData();
      toast.success(`Imported ${newCards.length} cards.`);
    } catch (error) {
      console.error("CSV import failed", error);
      toast.error("Import failed.");
    } finally {
      event.target.value = "";
    }
  };

  const handleWeightsChange = (val: string) => {
    setManualWeights(val);
    const weights = val
      .split(/[\s,]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    if (weights.length === 19) {
      setSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, w: weights } }));
    }
  };

  const handleExportRevlog = async () => {
    try {
      await exportRevlogToCSV(db);
      toast.success("RevLog exported to CSV");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const handleOptimize = async () => {
    if (!user) return;
    setIsOptimizing(true);
    setProgress(0);
    try {
      const logs = await getAllReviewLogs(settings.language);
      if (logs.length < 50) {
        toast.error("Insufficient data (50+ reviews required).");
        setIsOptimizing(false);
        return;
      }
      const currentW = settings.fsrs.w || FSRS_DEFAULTS.w;

      const worker = new Worker(
        new URL("../../../workers/fsrs.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );

      worker.onmessage = (e) => {
        const { type, progress: prog, w, error } = e.data;
        if (type === "progress") {
          setProgress(prog);
        } else if (type === "result") {
          setSettings((prev) => ({ ...prev, fsrs: { ...prev.fsrs, w } }));
          setReport({ reviews: logs.length });
          toast.success("Optimization complete");
          worker.terminate();
          setIsOptimizing(false);
        } else if (type === "error") {
          toast.error(`Optimization failed: ${error}`);
          worker.terminate();
          setIsOptimizing(false);
        }
      };

      worker.postMessage({ logs, currentW });
    } catch {
      toast.error("Optimization failed to start");
      setIsOptimizing(false);
    }
  };

  const currentLangName = LANGUAGE_NAMES[settings.language];
  const currentDailyNew = settings.dailyNewLimits?.[settings.language] ?? 0;
  const currentDailyReview =
    settings.dailyReviewLimits?.[settings.language] ?? 0;

  return (
    <div className="container max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your learning experience
        </p>
      </div>

      <SettingsSection
        icon={User}
        title="Profile"
        description="Your identity and preferences"
      >
        <SettingsItem
          label="Display Name"
          description="Shown on leaderboards and achievements"
        >
          <Input
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-40 h-8 text-sm"
          />
        </SettingsItem>

        <SettingsItem
          label="Proficiency Level"
          description="Controls AI content complexity"
        >
          <Select
            value={settings.proficiency?.[settings.language] || "A1"}
            onValueChange={(val) => {
              setSettings((prev) => ({
                ...prev,
                proficiency: {
                  ...prev.proficiency,
                  [prev.language]: val as any,
                },
              }));
            }}
          >
            <SelectTrigger className="w-36 md:w-48 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "A1", label: "A1 - Beginner" },
                { value: "A2", label: "A2 - Elementary" },
                { value: "B1", label: "B1 - Intermediate" },
                { value: "B2", label: "B2 - Upper Intermediate" },
                { value: "C1", label: "C1 - Advanced" },
                { value: "C2", label: "C2 - Mastery" },
              ].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsItem>
      </SettingsSection>

      <SettingsSection
        icon={Globe}
        title="Language"
        description="Active course configuration"
      >
        <SettingsItem
          label="Active Course"
          description="The language you are currently learning"
        >
          <Select
            value={settings.language}
            onValueChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                language: value as UserSettings["language"],
              }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_NAMES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="Theme Color"
          description="Accent color for this language"
        >
          <ColorPicker
            label=""
            value={settings.languageColors?.[settings.language] || "0 0% 0%"}
            onChange={(newColor) =>
              setSettings((prev) => ({
                ...prev,
                languageColors: {
                  ...(prev.languageColors || {}),
                  [prev.language]: newColor,
                } as any,
              }))
            }
          />
        </SettingsItem>

        <SettingsSubSection title="AI Integration">
          <SettingsItem
            icon={Sparkles}
            label="Gemini API Key"
            description="For AI sentence generation"
          >
            <Input
              type="password"
              value={settings.geminiApiKey || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  geminiApiKey: e.target.value,
                }))
              }
              placeholder="Enter key"
              className="w-40 h-8 text-sm font-mono"
            />
          </SettingsItem>
        </SettingsSubSection>
      </SettingsSection>

      <SettingsSection
        icon={Volume2}
        title="Audio"
        description="Text-to-speech configuration"
      >
        <SettingsItem label="Speech Provider">
          <Select
            value={settings.tts.provider}
            onValueChange={(value) =>
              updateTts({ provider: value as any, voiceURI: null })
            }
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TTS_PROVIDER.BROWSER}>
                Browser Native
              </SelectItem>
              <SelectItem value={TTS_PROVIDER.GOOGLE}>Google Cloud</SelectItem>
              <SelectItem value={TTS_PROVIDER.AZURE}>
                Microsoft Azure
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem label="Voice">
          <div className="flex items-center gap-2">
            <Select
              value={settings.tts.voiceURI || "default"}
              onValueChange={(value) =>
                updateTts({ voiceURI: value === "default" ? null : value })
              }
            >
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {availableVoices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestAudio}
              className="h-8 px-2"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </SettingsItem>

        <SettingsSliderDisplay
          label="Speed"
          value={`${settings.tts.rate.toFixed(1)}x`}
        >
          <Slider
            min={0.5}
            max={2}
            step={0.1}
            value={[settings.tts.rate]}
            onValueChange={([v]) => updateTts({ rate: v })}
          />
        </SettingsSliderDisplay>

        <SettingsSliderDisplay
          label="Volume"
          value={`${Math.round(settings.tts.volume * 100)}%`}
        >
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[settings.tts.volume]}
            onValueChange={([v]) => updateTts({ volume: v })}
          />
        </SettingsSliderDisplay>

        {settings.tts.provider !== TTS_PROVIDER.BROWSER && (
          <SettingsSubSection title="API Configuration" defaultOpen>
            <SettingsItem
              label={
                settings.tts.provider === TTS_PROVIDER.GOOGLE
                  ? "Google API Key"
                  : "Azure API Key"
              }
            >
              <Input
                type="password"
                value={
                  settings.tts.provider === TTS_PROVIDER.GOOGLE
                    ? settings.tts.googleApiKey
                    : settings.tts.azureApiKey
                }
                onChange={(e) =>
                  updateTts(
                    settings.tts.provider === TTS_PROVIDER.GOOGLE
                      ? { googleApiKey: e.target.value }
                      : { azureApiKey: e.target.value },
                  )
                }
                placeholder="Enter key"
                className="w-40 h-8 text-sm font-mono"
              />
            </SettingsItem>
            {settings.tts.provider === TTS_PROVIDER.AZURE && (
              <SettingsItem label="Azure Region">
                <Input
                  value={settings.tts.azureRegion}
                  onChange={(e) => updateTts({ azureRegion: e.target.value })}
                  placeholder="e.g., eastus"
                  className="w-32 h-8 text-sm font-mono"
                />
              </SettingsItem>
            )}
          </SettingsSubSection>
        )}

        <SettingsSubSection title="Playback Behavior">
          <SettingsItem
            label="Auto-play Audio"
            description="Play pronunciation on card flip"
          >
            <Switch
              checked={settings.autoPlayAudio}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoPlayAudio: checked }))
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Play Target Word First"
            description="Play target word audio before sentence audio"
          >
            <Switch
              checked={settings.playTargetWordAudioBeforeSentence}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  playTargetWordAudioBeforeSentence: checked,
                }))
              }
            />
          </SettingsItem>
          <SettingsItem
            label="Listening Mode"
            description="Hide text until audio completes"
          >
            <Switch
              checked={settings.blindMode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, blindMode: checked }))
              }
            />
          </SettingsItem>
        </SettingsSubSection>
      </SettingsSection>

      <SettingsSection
        icon={BookOpen}
        title="Study Session"
        description={`Configuration for ${currentLangName}`}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SettingsLargeInput
            label="New Cards"
            sublabel="Per day"
            value={currentDailyNew}
            onChange={(val) =>
              setSettings((prev) => ({
                ...prev,
                dailyNewLimits: {
                  ...prev.dailyNewLimits,
                  [prev.language]: val,
                },
              }))
            }
          />
          <SettingsLargeInput
            label="Reviews"
            sublabel="Per day"
            value={currentDailyReview}
            onChange={(val) =>
              setSettings((prev) => ({
                ...prev,
                dailyReviewLimits: {
                  ...prev.dailyReviewLimits,
                  [prev.language]: val,
                },
              }))
            }
          />
        </div>

        <SettingsItem
          label="Learning Steps"
          description="Minutes between reviews (e.g., '1 10')"
        >
          <Input
            type="text"
            value={stepsInput}
            onChange={(e) => handleStepsChange(e.target.value)}
            placeholder="1 10"
            className="w-24 h-8 text-sm text-right"
          />
        </SettingsItem>

        <SettingsItem label="Card Order" description="Presentation priority">
          <Select
            value={settings.cardOrder || CARD_ORDER.NEW_FIRST}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, cardOrder: value as any }))
            }
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CARD_ORDER.NEW_FIRST}>New First</SelectItem>
              <SelectItem value={CARD_ORDER.REVIEW_FIRST}>
                Review First
              </SelectItem>
              <SelectItem value={CARD_ORDER.MIXED}>Mixed</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="Binary Rating"
          description="Simplified pass/fail grading"
        >
          <Switch
            checked={settings.binaryRatingMode}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, binaryRatingMode: checked }))
            }
          />
        </SettingsItem>

        <SettingsItem
          label="Full Sentence Front"
          description="Show full sentence instead of target word"
        >
          <Switch
            checked={settings.showWholeSentenceOnFront}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                showWholeSentenceOnFront: checked,
              }))
            }
          />
        </SettingsItem>

        <SettingsItem
          label="Show Translation"
          description="Display native language meaning after flip"
        >
          <Switch
            checked={settings.showTranslationAfterFlip}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                showTranslationAfterFlip: checked,
              }))
            }
          />
        </SettingsItem>

        <SettingsItem
          label="Skip Learning Wait"
          description="Continue reviewing instead of waiting for steps"
        >
          <Switch
            checked={settings.ignoreLearningStepsWhenNoCards}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({
                ...prev,
                ignoreLearningStepsWhenNoCards: checked,
              }))
            }
          />
        </SettingsItem>
      </SettingsSection>

      <SettingsSection
        icon={Layers}
        title="Display Order"
        description="Card presentation and sorting"
      >
        <SettingsItem
          label="New Card Gather Order"
          description="Order to collect new cards from deck"
        >
          <Select
            value={settings.newCardGatherOrder || NEW_CARD_GATHER_ORDER.ADDED}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, newCardGatherOrder: value as any }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_CARD_GATHER_ORDER.ADDED}>Added First</SelectItem>
              <SelectItem value={NEW_CARD_GATHER_ORDER.RANDOM}>Random</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="New Card Sort Order"
          description="How to sort new cards in queue"
        >
          <Select
            value={settings.newCardSortOrder || NEW_CARD_SORT_ORDER.DUE}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, newCardSortOrder: value as any }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_CARD_SORT_ORDER.DUE}>Due Date</SelectItem>
              <SelectItem value={NEW_CARD_SORT_ORDER.RANDOM}>Random</SelectItem>
              <SelectItem value={NEW_CARD_SORT_ORDER.CARD_TYPE}>Card Type</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="New/Review Order"
          description="Which cards to show first"
        >
          <Select
            value={settings.newReviewOrder || NEW_REVIEW_ORDER.NEW_FIRST}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, newReviewOrder: value as any }))
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_REVIEW_ORDER.NEW_FIRST}>New First</SelectItem>
              <SelectItem value={NEW_REVIEW_ORDER.REVIEW_FIRST}>Review First</SelectItem>
              <SelectItem value={NEW_REVIEW_ORDER.MIXED}>Mixed</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="Interday Learning/Review"
          description="When to show learning cards"
        >
          <Select
            value={settings.interdayLearningOrder || INTERDAY_LEARNING_ORDER.MIXED}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, interdayLearningOrder: value as any }))
            }
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INTERDAY_LEARNING_ORDER.MIXED}>Mixed with Reviews</SelectItem>
              <SelectItem value={INTERDAY_LEARNING_ORDER.BEFORE_REVIEWS}>Before Reviews</SelectItem>
              <SelectItem value={INTERDAY_LEARNING_ORDER.AFTER_REVIEWS}>After Reviews</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>

        <SettingsItem
          label="Review Sort Order"
          description="How to sort review cards"
        >
          <Select
            value={settings.reviewSortOrder || REVIEW_SORT_ORDER.DUE}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, reviewSortOrder: value as any }))
            }
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={REVIEW_SORT_ORDER.DUE}>Due Date</SelectItem>
              <SelectItem value={REVIEW_SORT_ORDER.DUE_RANDOM}>Due Date + Random</SelectItem>
              <SelectItem value={REVIEW_SORT_ORDER.OVERDUENESS}>Relative Overdueness</SelectItem>
              <SelectItem value={REVIEW_SORT_ORDER.RANDOM}>Random</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>
      </SettingsSection>

      <SettingsSection
        icon={Repeat}
        title="Lapses"
        description="Handling forgotten cards"
      >
        <SettingsItem
          label="Relearning Steps"
          description="Minutes for relearning (e.g., '10')"
        >
          <Input
            type="text"
            value={settings.relearnSteps?.join(" ") || "10"}
            onChange={(e) => {
              const steps = e.target.value
                .split(/[\s,]+/)
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n) && n > 0);
              if (steps.length > 0) {
                setSettings((prev) => ({ ...prev, relearnSteps: steps }));
              }
            }}
            placeholder="10"
            className="w-24 h-8 text-sm text-right"
          />
        </SettingsItem>

        <SettingsItem
          label="Leech Threshold"
          description="Failures before marking as leech"
        >
          <Input
            type="number"
            min={1}
            value={settings.leechThreshold ?? 8}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                leechThreshold: parseInt(e.target.value) || 8,
              }))
            }
            className="w-20 h-8 text-sm text-right"
          />
        </SettingsItem>

        <SettingsItem
          label="Leech Action"
          description="What to do when card becomes leech"
        >
          <Select
            value={settings.leechAction || LEECH_ACTION.TAG}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, leechAction: value as any }))
            }
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LEECH_ACTION.TAG}>Tag Only</SelectItem>
              <SelectItem value={LEECH_ACTION.SUSPEND}>Suspend</SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>
      </SettingsSection>

      <SettingsSection
        icon={Brain}
        title="Algorithm (FSRS)"
        description="Spaced repetition parameters"
      >
        <div className="bg-muted/30 rounded-lg p-4 mb-4 text-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium block mb-1">
            Target Retention
          </span>
          <span className="text-5xl font-light tabular-nums">
            {Math.round(settings.fsrs.request_retention * 100)}
            <span className="text-xl text-muted-foreground/40">%</span>
          </span>
          <Slider
            min={0.7}
            max={0.99}
            step={0.01}
            value={[settings.fsrs.request_retention]}
            onValueChange={([value]) =>
              setSettings((prev) => ({
                ...prev,
                fsrs: { ...prev.fsrs, request_retention: value },
              }))
            }
            className="mt-4"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-2">
            <span>Faster Reviews</span>
            <span>Higher Accuracy</span>
          </div>
        </div>

        <div className="space-y-2">
          {isOptimizing ? (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">
                Processing review data...
              </span>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <>
              <Button
                onClick={handleOptimize}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Optimize Parameters
                {report && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({report.reviews} reviews)
                  </span>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleExportRevlog}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Data
                </Button>
                <Button
                  onClick={() => setShowManual(!showManual)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Manual
                </Button>
              </div>
            </>
          )}
        </div>

        {showManual && (
          <div className="mt-3 pt-3 border-t border-border/30 animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">
              Parameters (w)
            </span>
            <Textarea
              value={manualWeights}
              onChange={(e) => handleWeightsChange(e.target.value)}
              className="font-mono text-xs min-h-[60px]"
              placeholder="0.4, 0.6, 2.4, ..."
            />
            <span className="text-[10px] text-muted-foreground/60 block mt-1">
              Paste 19 comma-separated weights from FSRS optimizer
            </span>
          </div>
        )}

        <SettingsSubSection title="Advanced">
          <SettingsItem
            label="Maximum Interval"
            description="Days before card is retired"
          >
            <Input
              type="number"
              value={settings.fsrs.maximum_interval}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  fsrs: {
                    ...prev.fsrs,
                    maximum_interval: parseInt(e.target.value) || 36500,
                  },
                }))
              }
              className="w-24 h-8 text-sm font-mono text-right"
            />
          </SettingsItem>

          <SettingsItem
            label="Enable Fuzzing"
            description="Randomize due dates to prevent clustering"
          >
            <Switch
              checked={settings.fsrs.enable_fuzzing}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  fsrs: { ...prev.fsrs, enable_fuzzing: checked },
                }))
              }
            />
          </SettingsItem>

          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                fsrs: { ...prev.fsrs, w: FSRS_DEFAULTS.w },
              }))
            }
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors mt-2 uppercase tracking-widest"
          >
            <RefreshCw className="w-3 h-3" />
            Reset to Defaults
          </button>
        </SettingsSubSection>
      </SettingsSection>

      <SettingsSection
        icon={Database}
        title="Data"
        description="Backup and synchronization"
      >
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-auto flex flex-col py-4"
          >
            <Download className="w-5 h-5 mb-1 text-muted-foreground" />
            <span className="text-sm font-medium">Export</span>
            <span className="text-[10px] text-muted-foreground">
              Download backup
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => jsonInputRef.current?.click()}
            disabled={isRestoring}
            className="h-auto flex flex-col py-4"
          >
            <RotateCcw
              className={cn(
                "w-5 h-5 mb-1 text-muted-foreground",
                isRestoring && "animate-spin",
              )}
            />
            <span className="text-sm font-medium">
              {isRestoring ? "Restoring..." : "Restore"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              From JSON backup
            </span>
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => csvInputRef.current?.click()}
          className="w-full justify-start h-auto py-3"
        >
          <Upload className="w-4 h-4 mr-3 text-muted-foreground" />
          <div className="text-left">
            <div className="text-sm font-medium">Import Cards</div>
            <div className="text-[10px] text-muted-foreground">
              Add from CSV (without replacing)
            </div>
          </div>
        </Button>

        <input
          type="file"
          ref={csvInputRef}
          accept=".csv,.txt"
          className="hidden"
          onChange={handleImport}
        />
        <input
          type="file"
          ref={jsonInputRef}
          accept=".json"
          className="hidden"
          onChange={handleRestoreBackup}
        />

        <SettingsSubSection title="Cloud & Sync">
          <div className="flex items-center justify-between p-3 -mx-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              {syncComplete ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Cloud className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <span className="text-sm font-medium block">
                  {syncComplete ? "Synchronized" : "Sync to Cloud"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isSyncingToCloud
                    ? "Uploading..."
                    : syncComplete
                      ? "Data is backed up"
                      : "Migrate to cloud"}
                </span>
              </div>
            </div>
            {!syncComplete && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSyncToCloud}
                disabled={isSyncingToCloud}
              >
                {isSyncingToCloud ? "Syncing..." : "Sync"}
              </Button>
            )}
          </div>

          {saveToSyncFile && loadFromSyncFile && (
            <div className="flex items-center justify-between p-3 -mx-2 rounded-lg">
              <div>
                <span className="text-sm font-medium block">Syncthing</span>
                <span className="text-[10px] text-muted-foreground">
                  {lastSyncthingSync
                    ? `Last: ${lastSyncthingSync}`
                    : "Not synced"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveToSyncFile}
                  disabled={isSyncthingSaving}
                >
                  {isSyncthingSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFromSyncFile}
                  disabled={isSyncthingLoading}
                >
                  {isSyncthingLoading ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>
          )}
        </SettingsSubSection>

        <SettingsSubSection title="API Key Options">
          <SettingsItem
            label="Include in Export"
            description="Include API keys in backup files"
          >
            <Switch
              checked={includeApiKeys}
              onCheckedChange={setIncludeApiKeys}
            />
          </SettingsItem>
          <SettingsItem
            label="Import from Backup"
            description="Restore API keys when importing"
          >
            <Switch
              checked={importApiKeys}
              onCheckedChange={setImportApiKeys}
            />
          </SettingsItem>
        </SettingsSubSection>
      </SettingsSection>

      <SettingsSection
        icon={AlertTriangle}
        title="Danger Zone"
        description="Irreversible actions"
        variant="danger"
      >
        <div className="flex items-center justify-between p-3 -mx-2 rounded-lg">
          <div>
            <span className="text-sm font-medium block">
              Reset {currentLangName} Deck
            </span>
            <span className="text-[10px] text-muted-foreground">
              Delete all cards, history, and progress
            </span>
          </div>
          <Button
            onClick={handleResetDeck}
            variant={confirmResetDeck ? "default" : "outline"}
            size="sm"
            className={confirmResetDeck ? "bg-primary hover:bg-orange-600" : ""}
          >
            {confirmResetDeck ? "Confirm" : "Reset"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 -mx-2 rounded-lg border border-destructive/20">
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-destructive" />
            <div>
              <span className="text-sm font-medium block">Delete Account</span>
              <span className="text-[10px] text-muted-foreground">
                Permanently remove all data
              </span>
            </div>
          </div>
          <Button
            onClick={handleResetAccount}
            variant={confirmResetAccount ? "destructive" : "outline"}
            size="sm"
          >
            {confirmResetAccount ? "Confirm Delete" : "Delete"}
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
};
