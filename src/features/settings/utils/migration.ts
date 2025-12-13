
import { getCards, saveCard } from "@/db/repositories/cardRepository";
import { toast } from "sonner";

export const migrateCardsToAnkiMetadata = async () => {
  try {
    const cards = await getCards();
    let migratedCount = 0;

    for (const card of cards) {
                        await saveCard({ ...card });
      migratedCount++;
    }

    toast.success(`Successfully migrated ${migratedCount} cards to new metadata format.`);
    return migratedCount;
  } catch (error) {
    console.error("Migration failed:", error);
    toast.error("Failed to migrate cards. Check console for details.");
    throw error;
  }
};
