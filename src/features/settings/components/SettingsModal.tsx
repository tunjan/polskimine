import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut, Skull } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useSettings } from '@/contexts/SettingsContext';
import { useDeck } from '@/contexts/DeckContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Language } from '@/types';
import { ttsService, VoiceOption } from '@/services/tts';
import {
    deleteCardsByLanguage,
    saveAllCards,
    getCardSignatures,
    getCards,
} from '@/services/db/repositories/cardRepository';
import { getDB } from '@/services/db/client';
import { getHistory } from '@/services/db/repositories/historyRepository';
import { POLISH_BEGINNER_DECK } from '@/features/deck/data/polishBeginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
import { SPANISH_BEGINNER_DECK } from '@/features/deck/data/spanishBeginnerDeck';
import { GeneralSettings } from './GeneralSettings';
import { AudioSettings } from './AudioSettings';
import { StudySettings } from './StudySettings';
import { AlgorithmSettings } from './AlgorithmSettings';
import { DataSettings } from './DataSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'audio' | 'study' | 'algorithm' | 'data' | 'danger';

const CLOUD_SYNC_FLAG = 'linguaflow_cloud_sync_complete';
const readCloudSyncFlag = () =>
    typeof window !== 'undefined' && localStorage.getItem(CLOUD_SYNC_FLAG) === '1';

type CsvRow = Record<string, string>;

const normalizeHeader = (header: string) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const detectDelimiter = (sample: string) => {
    if (sample.includes('\t')) return '\t';
    const commaCount = (sample.match(/,/g) || []).length;
    const semicolonCount = (sample.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
};

const parseCsvLine = (line: string, delimiter: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current);
    return cells;
};

const pickValue = (row: CsvRow, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = row[key];
        if (value && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
};

const isLanguage = (value?: string): value is Language =>
    value === 'polish' || value === 'norwegian' || value === 'japanese' || value === 'spanish';

const rowToCard = (row: CsvRow, fallbackLanguage: Language): Card | null => {
    const sentence = pickValue(row, ['target_sentence', 'sentence', 'text', 'front', 'prompt']);
    const translation = pickValue(row, ['native_translation', 'translation', 'back', 'answer']);

    if (!sentence || !translation) {
        return null;
    }

    const languageCandidate = pickValue(row, ['language', 'lang'])?.toLowerCase();
    const language = isLanguage(languageCandidate) ? languageCandidate : fallbackLanguage;
    const tagsRaw = pickValue(row, ['tags', 'tag_list', 'labels']);
    const notes = pickValue(row, ['notes', 'context', 'hint']) || '';
    const targetWord = pickValue(row, ['target_word', 'keyword', 'cloze']);
    const furigana = pickValue(row, ['furigana', 'reading', 'ruby']);

    return {
        id: uuidv4(),
        targetSentence: sentence,
        targetWord: targetWord || undefined,
        nativeTranslation: translation,
        notes,
        tags: tagsRaw
            ? tagsRaw
                    .split(/[|;,]/)
                    .map((tag) => tag.trim())
                    .filter(Boolean)
            : undefined,
        furigana: furigana || undefined,
        language,
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
    };
};

const parseCardsFromCsv = (payload: string, fallbackLanguage: Language): Card[] => {
    const sanitized = payload.replace(/\r\n/g, '\n').trim();
    if (!sanitized) return [];

    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];
        
        if (char === '"') {
            if (inQuotes && sanitized[i + 1] === '"') {
                current += '""';
                i++;
            } else {
                inQuotes = !inQuotes;
                current += char;
            }
        } else if (char === '\n' && !inQuotes) {
            if (current.trim().length > 0) {
                lines.push(current);
            }
            current = '';
        } else {
            current += char;
        }
    }
    
    if (current.trim().length > 0) {
        lines.push(current);
    }

    if (lines.length < 2) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const cards: Card[] = [];

    for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        const values = parseCsvLine(rawLine, delimiter);
        if (values.every((value) => !value.trim())) continue;

        const row: CsvRow = {};
        headers.forEach((header, index) => {
            if (!header) return;
            row[header] = values[index]?.trim() ?? '';
        });

        const card = rowToCard(row, fallbackLanguage);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};

const signatureForCard = (sentence: string, language: Language) =>
    `${language}::${sentence.trim().toLowerCase()}`;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, saveApiKeys } = useSettings();
    const { refreshDeckData } = useDeck();
    const { signOut, profile, updateUsername } = useAuth();
    const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState(settings);
  const [localUsername, setLocalUsername] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
  const [confirmResetAccount, setConfirmResetAccount] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);
    const [hasSyncedToCloud, setHasSyncedToCloud] = useState(() => readCloudSyncFlag());
    const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
        const voices = await ttsService.getAvailableVoices(localSettings.language, localSettings.tts);
        setAvailableVoices(voices);
    };

    if (isOpen) {
        setLocalSettings(settings);
        setLocalUsername(profile?.username || '');
        setConfirmResetDeck(false);
        setConfirmResetAccount(false);
        setActiveTab('general');
        loadVoices();
        setHasSyncedToCloud(readCloudSyncFlag());
    }
  }, [isOpen, settings, profile]);

  useEffect(() => {
      const loadVoices = async () => {
          const voices = await ttsService.getAvailableVoices(localSettings.language, localSettings.tts);
          setAvailableVoices(voices);
      };

      const timer = setTimeout(() => {
          loadVoices();
      }, 1000);

      return () => clearTimeout(timer);
  }, [localSettings.language, localSettings.tts.provider, localSettings.tts.googleApiKey, localSettings.tts.azureApiKey]);

  const handleSave = async () => {
    const languageChanged = localSettings.language !== settings.language;
    updateSettings(localSettings);

    // Save API keys to database
    try {
        await saveApiKeys({
            geminiApiKey: localSettings.geminiApiKey,
            googleTtsApiKey: localSettings.tts.googleApiKey,
            azureTtsApiKey: localSettings.tts.azureApiKey,
            azureRegion: localSettings.tts.azureRegion,
        });
    } catch (error) {
        console.error('Failed to save API keys:', error);
        // Don't return - continue with other saves
    }

    if (localUsername !== profile?.username) {
        try {
            await updateUsername(localUsername);
        } catch (error) {
            return;
        }
    }

    toast.success(languageChanged ? "Language switched." : "Preferences saved.");
    onClose();
  };

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
        setConfirmResetDeck(true);
        return;
    }
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('xp, points, level')
            .eq('id', user.id)
            .single();

        await deleteCardsByLanguage(localSettings.language);
        await supabase.from('study_history').delete().eq('user_id', user.id).eq('language', localSettings.language);
        await supabase.from('activity_log').delete().eq('user_id', user.id).eq('language', localSettings.language);

        const { error: recalcError } = await supabase.rpc('recalculate_user_xp', {
            target_user_id: user.id
        });

        if (recalcError) {
            console.error('Error recalculating XP:', recalcError);
            toast.error('Failed to recalculate XP');
            return;
        }

        const rawDeck = 
            localSettings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK : 
            (localSettings.language === 'japanese' ? JAPANESE_BEGINNER_DECK : 
            (localSettings.language === 'spanish' ? SPANISH_BEGINNER_DECK : POLISH_BEGINNER_DECK));
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
             toast.error("User not found");
             return;
        }

        await supabase.from('cards').delete().eq('user_id', user.id);
        await supabase.from('study_history').delete().eq('user_id', user.id);
        await supabase.from('activity_log').delete().eq('user_id', user.id);
        await supabase.from('profiles').update({ xp: 0, points: 0, level: 1 }).eq('id', user.id);

        localStorage.removeItem('language_mining_settings');
        localStorage.removeItem(CLOUD_SYNC_FLAG);

        toast.success("Account reset successfully. Restarting...");
        queryClient.clear();
        setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
        console.error("Account reset failed", error);
        toast.error(`Reset failed: ${error.message}`);
    }
  };

  const handleTestAudio = () => {
      const testText = {
          polish: "Cześć, to jest test.",
          norwegian: "Hei, dette er en test.",
          japanese: "こんにちは、テストです。"
      };
      ttsService.speak(testText[localSettings.language], localSettings.language, localSettings.tts);
  };

    const handleSyncToCloud = async () => {
        if (hasSyncedToCloud || isSyncingToCloud) {
            if (hasSyncedToCloud) {
                toast.info('Cloud sync already completed.');
            }
            return;
        }

        setIsSyncingToCloud(true);
        try {
            const db = await getDB();
            const cards = await db.getAll('cards');
            const historyEntries = await db.getAll('history');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            if (!cards.length && !historyEntries.length) {
                localStorage.setItem(CLOUD_SYNC_FLAG, '1');
                setHasSyncedToCloud(true);
                toast.success('No local data found. You are already in sync.');
                return;
            }

            if (cards.length > 0) {
                const normalizedCards = cards.map((card) => ({
                    id: card.id,
                    user_id: user.id,
                    target_sentence: card.targetSentence,
                    target_word: card.targetWord ?? null,
                    native_translation: card.nativeTranslation,
                    furigana: card.furigana ?? null,
                    notes: card.notes ?? '',
                    language: card.language || 'polish',
                    status: card.status,
                    interval: card.interval ?? 0,
                    ease_factor: card.easeFactor ?? 2.5,
                    due_date: card.dueDate,
                    stability: card.stability ?? 0,
                    difficulty: card.difficulty ?? 0,
                    elapsed_days: card.elapsed_days ?? 0,
                    scheduled_days: card.scheduled_days ?? 0,
                    reps: card.reps ?? 0,
                    lapses: card.lapses ?? 0,
                    state: card.state ?? null,
                    last_review: card.last_review ?? null,
                    learning_step: card.learningStep ?? null,
                    leech_count: card.leechCount ?? 0,
                    is_leech: card.isLeech ?? false,
                    tags: card.tags ?? null,
                }));
                
                const { error: cardError } = await supabase.from('cards').upsert(normalizedCards);
                if (cardError) throw cardError;
            }

            if (historyEntries.length > 0) {
                const normalizedHistory = historyEntries.map(entry => ({
                    user_id: user.id,
                    date: entry.date,
                    language: settings.language || 'polish', 
                    count: entry.count
                }));

                const { error: historyError } = await supabase
                    .from('study_history')
                    .upsert(normalizedHistory, { onConflict: 'user_id, date, language' });
                
                if (historyError) throw historyError;
            }

            localStorage.setItem(CLOUD_SYNC_FLAG, '1');
            setHasSyncedToCloud(true);
            refreshDeckData();
            toast.success(`Synced cards and history to the cloud.`);
        } catch (error: any) {
            console.error('Cloud sync failed', error);
            toast.error(`Cloud sync failed: ${error.message}`);
        } finally {
            setIsSyncingToCloud(false);
        }
    };

    const handleExport = async () => {
        try {
            const cards = await getCards();
            const history = await getHistory();
            
            const safeSettings = {
                ...localSettings,
                tts: {
                    ...localSettings.tts,
                    googleApiKey: '',
                    azureApiKey: ''
                }
            };

            const exportData = { 
                version: 1, 
                date: new Date().toISOString(), 
                cards, 
                history, 
                settings: safeSettings 
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Export complete.");
        } catch (e) {
            toast.error("Export failed.");
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsedCards = parseCardsFromCsv(text, localSettings.language);

            if (parsedCards.length === 0) {
                toast.error('No valid rows found. Ensure the CSV includes "sentence" and "translation" headers.');
                return;
            }

            const existingSignatures = await getCardSignatures(localSettings.language);
            const seen = new Set(
                existingSignatures.map((card) =>
                    signatureForCard(card.target_sentence, localSettings.language)
                )
            );

            const newCards = parsedCards.filter((card) => {
                const signature = signatureForCard(
                    card.targetSentence,
                    (card.language || localSettings.language) as Language
                );
                if (seen.has(signature)) {
                    return false;
                }
                seen.add(signature);
                return true;
            });

            if (!newCards.length) {
                toast.info('All rows already exist in your deck.');
                return;
            }

            await saveAllCards(newCards);
            refreshDeckData();
            toast.success(`Imported ${newCards.length} card${newCards.length === 1 ? '' : 's'}.`);
        } catch (error) {
            console.error('CSV import failed', error);
            toast.error('Import failed. Double-check the CSV format.');
        } finally {
            event.target.value = '';
        }
    };

  // ...existing code...
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'audio', label: 'Audio' },
    { id: 'study', label: 'Limits' },
    { id: 'algorithm', label: 'FSRS' },
    { id: 'data', label: 'Data' },
    { id: 'danger', label: 'Danger' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[92vh] md:h-[85vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-cream dark:bg-background border-0 [0_8px_40px_rgba(0,0,0,0.08)] dark:[0_8px_40px_rgba(0,0,0,0.4)] rounded-2xl">
        
        {/* Refined Sidebar with warm tones */}
        <div className="w-full md:w-72 bg-linear-to-b from-background/40 to-background/20 dark:from-background/60 dark:to-background/30 backdrop-blur-sm border-b md:border-b-0 md:border-r border-border/30 p-6 md:p-8 flex flex-col justify-between shrink-0">
            <div className="space-y-8">
                <DialogTitle className="font-serif text-2xl font-light tracking-tight text-foreground/90 mb-10 flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-terracotta"></span>
                    Preferences
                </DialogTitle>
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "text-left px-4 py-3 transition-all duration-200 whitespace-nowrap group relative",
                                activeTab === item.id 
                                    ? "text-foreground" 
                                    : "text-muted-foreground/70 hover:text-foreground"
                            )}
                        >
                            <span className="font-serif text-[15px] font-light tracking-wide relative z-10">
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-terracotta/8 dark:bg-terracotta/12 -mx-2 rounded-sm" />
                            )}
                            <div className={clsx(
                                "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-terracotta transition-all duration-200",
                                activeTab === item.id ? "h-8" : "h-0 group-hover:h-4"
                            )} />
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="hidden md:block">
                <div className="h-px bg-linear-to-r from-transparent via-border/50 to-transparent mb-4" />
                <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/40">
                    Deck: {settings.language}
                </div>
            </div>
        </div>

        {/* Spacious Content Area with generous margins */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background/30 dark:bg-background/10">
            <div className="flex-1 px-6 py-8 md:px-16 md:py-12 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <GeneralSettings 
                        localSettings={localSettings} 
                        setLocalSettings={setLocalSettings}
                        username={localUsername}
                        setUsername={setLocalUsername}
                    />
                )}

                {activeTab === 'audio' && (
                    <AudioSettings
                        localSettings={localSettings}
                        setLocalSettings={setLocalSettings}
                        availableVoices={availableVoices}
                        onTestAudio={handleTestAudio}
                    />
                )}

                {activeTab === 'study' && (
                    <StudySettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
                )}

                {activeTab === 'algorithm' && (
                    <AlgorithmSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
                )}

                {activeTab === 'data' && (
                    <DataSettings
                        onExport={handleExport}
                        onImport={handleImport}
                        csvInputRef={csvInputRef}
                        onSyncToCloud={handleSyncToCloud}
                        isSyncingToCloud={isSyncingToCloud}
                        syncComplete={hasSyncedToCloud}
                    />
                )}

                {activeTab === 'danger' && (
                    <div className="space-y-12 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Reset Deck - Warm, editorial warning */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 pb-6 border-b border-border/30">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                        <AlertCircle className="text-orange-600 dark:text-orange-400" size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <h4 className="font-serif text-lg font-normal tracking-tight text-foreground/90">Reset Current Deck</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground/80 font-light">
                                        This will delete all cards, history, experience, and progress for <em className="text-foreground font-normal">{localSettings.language}</em>, restoring the beginner course.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetDeck}
                                className={clsx(
                                    "w-full py-4 text-sm font-serif tracking-wide transition-all duration-200",
                                    confirmResetDeck 
                                        ? "bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-800 " 
                                        : "bg-background/60 border border-border/40 hover:border-orange-400/60 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-foreground/70 hover:text-foreground"
                                )}
                            >
                                {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
                            </button>
                        </div>

                        {/* Hard Reset - Refined, serious tone */}
                        <div className="space-y-6 pt-8">
                            <div className="flex items-start gap-4 pb-6 border-b border-destructive/20">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                                        <Skull className="text-red-700 dark:text-red-400" size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <h4 className="font-serif text-lg font-normal tracking-tight text-destructive">Complete Account Reset</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground/80 font-light">
                                        This permanently removes all data: cards across all languages, study history, experience points, and settings. Your username remains unchanged. <strong className="text-foreground/90">This cannot be undone.</strong>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetAccount}
                                className={clsx(
                                    "w-full py-4 text-sm font-serif tracking-wide transition-all duration-200",
                                    confirmResetAccount 
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 " 
                                        : "bg-background/60 border border-destructive/30 text-destructive/80 hover:bg-red-50/50 dark:hover:bg-red-950/20 hover:border-destructive/60 hover:text-destructive"
                                )}
                            >
                                {confirmResetAccount ? "Confirm Complete Reset" : "Reset Everything"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Refined Footer */}
            <div className="px-6 py-5 md:px-16 md:py-6 border-t border-border/30 bg-linear-to-t from-background/40 to-transparent flex justify-between items-center gap-4 shrink-0 flex-wrap backdrop-blur-sm">
                <button 
                    onClick={() => {
                        onClose();
                        signOut();
                    }}
                    className="text-xs font-serif tracking-wide text-red-600/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 transition-colors flex items-center gap-2 group"
                >
                    <LogOut size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
                <div className="flex gap-3 ml-auto">
                    <button 
                        onClick={onClose} 
                        className="text-sm font-serif tracking-wide text-muted-foreground/70 hover:text-foreground px-5 py-2.5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-terracotta/90 hover:bg-terracotta text-white px-8 py-2.5 text-sm rounded-sm font-light tracking-wide transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};