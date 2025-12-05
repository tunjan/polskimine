import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/services/db/dexie';
import { useSettings } from '@/contexts/SettingsContext';
import { LanguageId } from '@/types';
import {
    deleteCardsByLanguage,
    saveAllCards,
} from '@/services/db/repositories/cardRepository';
import { clearHistory } from '@/services/db/repositories/historyRepository';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';

export const useAccountManagement = () => {
    const { settings } = useSettings();
    const queryClient = useQueryClient();
    const [confirmResetDeck, setConfirmResetDeck] = useState(false);
    const [confirmResetAccount, setConfirmResetAccount] = useState(false);

    const handleResetDeck = async () => {
        if (!confirmResetDeck) {
            setConfirmResetDeck(true);
            return;
        }
        try {
            await deleteCardsByLanguage(settings.language);

            await clearHistory(settings.language);

            const rawDeck =
                settings.language === LanguageId.Norwegian ? NORWEGIAN_BEGINNER_DECK :
                    (settings.language === LanguageId.Japanese ? JAPANESE_BEGINNER_DECK :
                        (settings.language === LanguageId.Spanish ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
            const deck = rawDeck.map(c => ({ ...c, id: uuidv4(), dueDate: new Date().toISOString() }));
            await saveAllCards(deck);

            toast.success("Deck reset successfully");
            queryClient.clear();
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            console.error(e);
            toast.error("Failed to reset deck");
        }
    };

    const handleResetAccount = async () => {
        if (!confirmResetAccount) {
            setConfirmResetAccount(true);
            return;
        }

        try {
            await db.cards.clear();
            await db.revlog.clear();
            await db.history.clear();
            await db.profile.clear();

            localStorage.removeItem('language_mining_settings');
            localStorage.removeItem('linguaflow_api_keys');

            toast.success("Account reset successfully. Restarting...");
            queryClient.clear();
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Account reset failed", error);
            toast.error(`Reset failed: ${error.message}`);
        }
    };

    return {
        handleResetDeck,
        handleResetAccount,
        confirmResetDeck,
        setConfirmResetDeck,
        confirmResetAccount,
        setConfirmResetAccount
    };
};
