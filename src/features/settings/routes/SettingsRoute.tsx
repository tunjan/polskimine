
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDeckActions } from '@/contexts/DeckActionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { UserSettings, Language } from '@/types';
import { ttsService, VoiceOption } from '@/lib/tts';
import {
    saveAllCards,
    getCardSignatures,
    getCards,
    clearAllCards,
} from '@/db/repositories/cardRepository';
import { getHistory, saveFullHistory, clearHistory } from '@/db/repositories/historyRepository';
import { db } from '@/db/dexie';
import { parseCardsFromCsv, signatureForCard } from '@/features/generator/services/csvImport';
import { useCloudSync } from '@/features/settings/hooks/useCloudSync';
import { useAccountManagement } from '@/features/settings/hooks/useAccountManagement';
import { useSyncthingSync } from '@/features/settings/hooks/useSyncthingSync';

import { SettingsLayout } from '../components/SettingsLayout';
import { GeneralSettings } from '../components/GeneralSettings';
import { AudioSettings } from '../components/AudioSettings';
import { StudySettings } from '../components/StudySettings';
import { AlgorithmSettings } from '../components/AlgorithmSettings';
import { DataSettings } from '../components/DataSettings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertCircle, Trash2 } from 'lucide-react';



const useDebouncedUsername = (localUsername: string, updateUsername: (name: string) => Promise<void>, currentUsername?: string) => {
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localUsername && localUsername !== currentUsername) {
                updateUsername(localUsername).then(() => toast.success("Username updated", { id: 'username-update' }));
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [localUsername, updateUsername, currentUsername]);
};


const GeneralSettingsFinal = () => {
    const { settings, setSettings } = useSettingsStore();
    const { profile, updateUsername, updateLanguageLevel } = useProfile();
    const [localUsername, setLocalUsername] = useState(profile?.username || '');

    useEffect(() => {
        if (profile?.username) setLocalUsername(profile.username);
    }, [profile?.username]);

    useDebouncedUsername(localUsername, async (name) => { await updateUsername(name); }, profile?.username);

    return (
        <GeneralSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            username={localUsername}
            setUsername={setLocalUsername}
            languageLevel={profile?.language_level || 'A1'}
            onUpdateLevel={updateLanguageLevel}
        />
    );
};


const AudioSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);

    useEffect(() => {
        const loadVoices = async () => {
            const voices = await ttsService.getAvailableVoices(settings.language, settings.tts);
            setAvailableVoices(voices);
        };
        loadVoices();
    }, [settings.language, settings.tts.provider, settings.tts.googleApiKey, settings.tts.azureApiKey]);

    const handleTestAudio = () => {
        const testText = {
            polish: "Cześć, to jest test.",
            norwegian: "Hei, dette er en test.",
            japanese: "こんにちは、テストです。",
            spanish: "Hola, esto es una prueba.",
            german: "Hallo, das ist ein Test."
        };
        ttsService.speak(testText[settings.language] || "Test audio", settings.language, settings.tts);
    };

    return (
        <AudioSettings
            localSettings={settings}
            setLocalSettings={setSettings}
            availableVoices={availableVoices}
            onTestAudio={handleTestAudio}
        />
    );
};

const StudySettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    return <StudySettings localSettings={settings} setLocalSettings={setSettings} />;
};

const AlgorithmSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    return <AlgorithmSettings localSettings={settings} setLocalSettings={setSettings} />;
};

const DataSettingsPage = () => {
    const { settings, setSettings } = useSettingsStore();
    const { user } = useAuth();
    const { refreshDeckData } = useDeckActions();

    const csvInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [includeApiKeys, setIncludeApiKeys] = useState(false);
    const [importApiKeys, setImportApiKeys] = useState(false);

    const { handleSyncToCloud, isSyncingToCloud, syncComplete } = useCloudSync();
    const {
        saveToSyncFile,
        loadFromSyncFile,
        isSaving: isSyncthingSaving,
        isLoading: isSyncthingLoading,
        lastSync: lastSyncthingSync
    } = useSyncthingSync();

    const handleExport = async () => {
        try {
            const cards = await getCards();
            const history = await getHistory();
            const revlog = await db.revlog.toArray();

            const safeSettings = {
                ...settings,
                tts: {
                    ...settings.tts,
                    googleApiKey: includeApiKeys ? settings.tts.googleApiKey : '',
                    azureApiKey: includeApiKeys ? settings.tts.azureApiKey : ''
                },
                geminiApiKey: includeApiKeys ? settings.geminiApiKey : ''
            };

            // Remove user_id from export data to avoid conflicts on import
            const cleanCards = cards.map(({ user_id, ...rest }) => rest);
            const cleanRevlog = revlog.map(({ user_id, ...rest }) => rest);

            const exportData = {
                version: 2,
                date: new Date().toISOString(),
                cards: cleanCards,
                history,
                revlog: cleanRevlog,
                settings: safeSettings
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup - ${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Export complete.");
        } catch (e) {
            toast.error("Export failed.");
        }
    };

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

            if (!confirm(`Replace current data with backup from ${data.date}?\nCards: ${data.cards.length} `)) {
                return;
            }

            await clearAllCards();
            await clearHistory();
            await db.revlog.clear();
            await db.aggregated_stats.clear();

            const currentUserId = user?.id || 'local-user';

            if (data.cards.length > 0) {
                const cardsWithUser = data.cards.map((c: any) => ({
                    ...c,
                    user_id: currentUserId
                }));
                await saveAllCards(cardsWithUser);
            }

            if (data.history && typeof data.history === 'object') {
                const languages = new Set(data.cards.map((c: any) => c.language).filter(Boolean));
                const primaryLanguage = languages.size > 0 ? Array.from(languages)[0] as Language : settings.language;
                await saveFullHistory(data.history, primaryLanguage);
            }

            if (data.revlog) {
                const revlogWithUser = data.revlog.map((r: any) => ({
                    ...r,
                    user_id: currentUserId
                }));
                await db.revlog.bulkPut(revlogWithUser);
            }

            if (data.settings) {
                const restoredSettings: Partial<UserSettings> = {
                    ...data.settings,
                    geminiApiKey: importApiKeys && data.settings.geminiApiKey ? data.settings.geminiApiKey : settings.geminiApiKey,
                    tts: {
                        ...data.settings.tts,
                        googleApiKey: importApiKeys && data.settings.tts?.googleApiKey ? data.settings.tts.googleApiKey : settings.tts.googleApiKey,
                        azureApiKey: importApiKeys && data.settings.tts?.azureApiKey ? data.settings.tts.azureApiKey : settings.tts.azureApiKey,
                    } as UserSettings['tts'],
                };


                setSettings((prev) => ({
                    ...prev,
                    ...restoredSettings,
                    tts: { ...prev.tts, ...(restoredSettings.tts || {}) },
                    fsrs: { ...prev.fsrs, ...(restoredSettings.fsrs || {}) },
                }));
            }

            const { recalculateAllStats } = await import('@/db/repositories/aggregatedStatsRepository');
            await recalculateAllStats();

            refreshDeckData();
            toast.success(`Restored ${data.cards.length} cards.`);
        } catch (error) {
            console.error('Backup restore failed:', error);
            toast.error("Failed to restore backup.");
        } finally {
            setIsRestoring(false);
            event.target.value = '';
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsedCards = parseCardsFromCsv(text, settings.language);

            if (parsedCards.length === 0) {
                toast.error('No valid rows found.');
                return;
            }

            const existingSignatures = await getCardSignatures(settings.language);
            const seen = new Set(existingSignatures.map((card) => signatureForCard(card.target_sentence, settings.language)));

            const newCards = parsedCards.filter((card) => {
                const signature = signatureForCard(card.targetSentence, (card.language || settings.language) as Language);
                if (seen.has(signature)) return false;
                seen.add(signature);
                return true;
            });

            if (!newCards.length) {
                toast.info('All rows already exist.');
                return;
            }

            await saveAllCards(newCards);
            refreshDeckData();
            toast.success(`Imported ${newCards.length} cards.`);
        } catch (error) {
            console.error('CSV import failed', error);
            toast.error('Import failed.');
        } finally {
            event.target.value = '';
        }
    };

    return (
        <DataSettings
            onExport={handleExport}
            onImport={handleImport}
            csvInputRef={csvInputRef as React.RefObject<HTMLInputElement>}
            onRestoreBackup={handleRestoreBackup}
            jsonInputRef={jsonInputRef as React.RefObject<HTMLInputElement>}
            isRestoring={isRestoring}
            onSyncToCloud={handleSyncToCloud}
            isSyncingToCloud={isSyncingToCloud}
            syncComplete={syncComplete}
            onSyncthingSave={saveToSyncFile}
            onSyncthingLoad={loadFromSyncFile}
            isSyncthingSaving={isSyncthingSaving}
            isSyncthingLoading={isSyncthingLoading}
            lastSyncthingSync={lastSyncthingSync}
            includeApiKeys={includeApiKeys}
            onIncludeApiKeysChange={setIncludeApiKeys}
            importApiKeys={importApiKeys}
            onImportApiKeysChange={setImportApiKeys}
        />
    );
};

const DangerSettingsPage = () => {
    const { settings } = useSettingsStore();
    const { handleResetDeck, handleResetAccount, confirmResetDeck, confirmResetAccount } = useAccountManagement();

    return (
        <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-medium text-foreground tracking-tight ">Danger Zone</h2>
                <span className="flex-1 h-px bg-linear-to-r from-destructive/30 via-border/30 to-transparent" />
            </div>

            <Card className="border-primary/30 hover:border-primary/50 transition-colors p-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-full">
                            <AlertCircle className="text-primary" size={18} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h4 className="text-sm font-medium text-foreground  tracking-wide">Reset Current Deck</h4>
                            <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                Delete all cards, history, and progress for <span className="text-foreground">{settings.language}</span>. Restores beginner course.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleResetDeck}
                        variant={confirmResetDeck ? 'default' : 'secondary'}
                        className={cn("w-full",
                            confirmResetDeck && "bg-primary hover:bg-orange-600"
                        )}
                    >
                        {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
                    </Button>
                </div>
            </Card>

            <Separator className="my-8" />

            <Card className="border-destructive/30 hover:border-destructive/50 transition-colors p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                            <Trash2 className="w-5 h-5 text-destructive" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className=" font-medium text-foreground">Delete Account</h3>
                            <p className="text-xs text-muted-foreground/60 font-light max-w-[280px]">Permanently remove all data</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleResetAccount}
                        variant={confirmResetAccount ? 'destructive' : 'secondary'}
                        className={cn("w-full",
                            confirmResetAccount && "bg-destructive hover:bg-destructive/90"
                        )}
                    >
                        {confirmResetAccount ? "Confirm Complete Reset" : "Reset Everything"}
                    </Button>
                </div>
            </Card >
        </div >
    );
};

export const SettingsRoute: React.FC = () => {
    return (
        <Routes>
            <Route element={<SettingsLayout />}>
                <Route index element={<Navigate to="general" replace />} />
                <Route path="general" element={<GeneralSettingsFinal />} />
                <Route path="audio" element={<AudioSettingsPage />} />
                <Route path="study" element={<StudySettingsPage />} />
                <Route path="fsrs" element={<AlgorithmSettingsPage />} />
                <Route path="data" element={<DataSettingsPage />} />
                <Route path="danger" element={<DangerSettingsPage />} />
            </Route>
        </Routes>
    );
};
