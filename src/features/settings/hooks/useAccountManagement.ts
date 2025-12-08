import { useState } from "react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { clearAllCards, saveAllCards } from "@/db/repositories/cardRepository";
import { clearHistory } from "@/db/repositories/historyRepository";
import { db } from "@/db/dexie";
import { useDeckActions } from "@/hooks/useDeckActions";
import { initialCards } from "@/data/initialCards";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";

export const useAccountManagement = () => {
  const language = useSettingsStore((s) => s.language);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const proficiency = useSettingsStore((s) => s.proficiency);
  const { refreshDeckData } = useDeckActions();
  const { user, deleteAccount } = useAuth();

  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
  const [confirmResetAccount, setConfirmResetAccount] = useState(false);

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
      setConfirmResetDeck(true);
      toast.warning(
        "Click again to confirm deck reset. This cannot be undone.",
      );
      setTimeout(() => setConfirmResetDeck(false), 3000);
      return;
    }

    try {
      await clearAllCards();
      await clearHistory();
      await db.revlog.clear();
      await db.aggregated_stats.clear();

      const beginnerCards = initialCards.map((c) => ({
        ...c,
        user_id: user?.id || "local-user",
        language,
      }));
      await saveAllCards(beginnerCards as any);
      updateSettings({
        proficiency: {
          ...proficiency,
          [language]: "A1",
        },
      });

      refreshDeckData();
      toast.success("Deck has been reset to beginner course.");
      setConfirmResetDeck(false);
    } catch (error) {
      console.error("Failed to reset deck", error);
      toast.error("Failed to reset deck.");
    }
  };

  const handleResetAccount = async () => {
    if (!confirmResetAccount) {
      setConfirmResetAccount(true);
      toast.error(
        "Click again to confirm account deletion. ALL DATA WILL BE LOST FOREVER.",
      );
      setTimeout(() => setConfirmResetAccount(false), 3000);
      return;
    }

    try {
      await deleteAccount();
      toast.success("Account deleted.");
    } catch (error) {
      console.error("Failed to delete account", error);
      toast.error("Failed to delete account.");
    }
  };

  return {
    handleResetDeck,
    handleResetAccount,
    confirmResetDeck,
    confirmResetAccount,
  };
};
