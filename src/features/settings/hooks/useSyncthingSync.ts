import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  saveSyncFile,
  loadSyncFile,
  importSyncData,
  checkSyncFile,
  getLastSyncTime,
  setLastSyncTime,
} from "@/lib/sync/syncService";

export const useSyncthingSync = () => {
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getLastSyncTime().then(setLastSync);
  }, []);

  const saveToSyncFile = useCallback(async () => {
    setIsSaving(true);
    try {
      const state = useSettingsStore.getState();
      const settings = {
        language: state.language,
        languageColors: state.languageColors,
        dailyNewLimits: state.dailyNewLimits,
        dailyReviewLimits: state.dailyReviewLimits,
        autoPlayAudio: state.autoPlayAudio,
        blindMode: state.blindMode,
        showTranslationAfterFlip: state.showTranslationAfterFlip,
        showWholeSentenceOnFront: state.showWholeSentenceOnFront,
        ignoreLearningStepsWhenNoCards: state.ignoreLearningStepsWhenNoCards,
        binaryRatingMode: state.binaryRatingMode,
        cardOrder: state.cardOrder,
        learningSteps: state.learningSteps,
        geminiApiKey: state.geminiApiKey,
        tts: state.tts,
        fsrs: state.fsrs,
      };
      const result = await saveSyncFile(settings);

      if (result.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        setLastSync(now);
        toast.success("Changes saved to sync file");
        return true;
      } else {
        toast.error(result.error || "Failed to save sync file");
        return false;
      }
    } catch (error: any) {
      console.error("[Sync] Save error:", error);
      toast.error(`Save failed: ${error.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadFromSyncFile = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadSyncFile();

      if (!result.success) {
        toast.error(result.error || "Failed to load sync file");
        return false;
      }

      if (!result.data) {
        toast.error("No data found in sync file");
        return false;
      }

      const getSyncDetails = (data: any) => {
        if (data.formatName === "dexie" && data.data && Array.isArray(data.data.data)) {
           // Dexie format
           const rows = data.data.data.find((t: any) => t.tableName === "cards")?.rows || [];
           const deviceId = data.data.data.find((t: any) => t.tableName === "settings")?.rows?.[0]?.deviceId || "Unknown";
           // Last synced not explicitly standard in Dexie export, assume now or look for metadata if available
           return {
             count: rows.length,
             lastSynced: "Unknown (Import)",
             deviceId,
           }
        } else {
           // Legacy Format
           return {
             count: data.cards?.length || 0,
             lastSynced: data.lastSynced ? new Date(data.lastSynced).toLocaleString() : "Unknown",
             deviceId: data.deviceId,
           }
        }
      }

      const syncData = result.data;
      const details = getSyncDetails(syncData);

      const confirmed = window.confirm(
        `Load data from sync file?\n\n` +
          `Last synced: ${details.lastSynced}\n` +
          `Device: ${details.deviceId?.slice(0, 8)}...\n` +
          `Cards: ${details.count}\n\n` +
          `This will replace your current data. Continue?`,
      );

      if (!confirmed) {
        return false;
      }

      const importResult = await importSyncData(syncData, updateSettings);

      if (importResult.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        setLastSync(now);

        await queryClient.invalidateQueries({ queryKey: ["profile"] });

        toast.success("Data loaded from sync file");

        setTimeout(() => window.location.reload(), 1000);
        return true;
      } else {
        toast.error(importResult.error || "Failed to import sync data");
        return false;
      }
    } catch (error: any) {
      console.error("[Sync] Load error:", error);
      toast.error(`Load failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateSettings, queryClient]);

  const checkSyncStatus = useCallback(async () => {
    try {
      const result = await checkSyncFile();
      return result;
    } catch (error) {
      console.error("[Sync] Check error:", error);
      return { exists: false };
    }
  }, []);

  return {
    saveToSyncFile,
    loadFromSyncFile,
    checkSyncStatus,
    isSaving,
    isLoading,
    lastSync,
  };
};
