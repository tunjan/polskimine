import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
    getCards,
} from '@/services/db/repositories/cardRepository';
import { getDB } from '@/services/db/client';
import { getHistory } from '@/services/db/repositories/historyRepository';
import { BEGINNER_DECK } from '@/features/deck/data/beginnerDeck';
import { NORWEGIAN_BEGINNER_DECK } from '@/features/deck/data/norwegianBeginnerDeck';
import { JAPANESE_BEGINNER_DECK } from '@/features/deck/data/japaneseBeginnerDeck';
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
            if (inQuotes && line[i + 1] === '"') {
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
    value === 'polish' || value === 'norwegian' || value === 'japanese';

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

    const lines = sanitized
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

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

// --- Main Component ---

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
    const { refreshDeckData } = useDeck();
    const { signOut } = useAuth();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [confirmResetDeck, setConfirmResetDeck] = useState(false);
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
        setConfirmResetDeck(false);
        setActiveTab('general');
        loadVoices();
        setHasSyncedToCloud(readCloudSyncFlag());
    }
  }, [isOpen, settings]);

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

  const handleSave = () => {
    const languageChanged = localSettings.language !== settings.language;
    updateSettings(localSettings);
    toast.success(languageChanged ? "Language switched." : "Preferences saved.");
    onClose();
  };

  const handleResetDeck = async () => {
    if (!confirmResetDeck) {
        setConfirmResetDeck(true);
        return;
    }
    try {
        await deleteCardsByLanguage(localSettings.language);
        const rawDeck = localSettings.language === 'norwegian' ? NORWEGIAN_BEGINNER_DECK : (localSettings.language === 'japanese' ? JAPANESE_BEGINNER_DECK : BEGINNER_DECK);
        const deck = rawDeck.map(c => ({ ...c, id: uuidv4(), dueDate: new Date().toISOString() }));
        await saveAllCards(deck);
        window.location.reload();
    } catch (e) {
        toast.error("Failed to reset deck");
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

            // Sync Cards
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

            // Sync History
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
            
            // Create a safe copy of settings excluding secrets
            const safeSettings = {
                ...localSettings,
                tts: {
                    ...localSettings.tts,
                    googleApiKey: '', // Strip sensitive data
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

            const existingCards = await getCards();
            const seen = new Set(
                existingCards.map((card) =>
                    signatureForCard(card.targetSentence, (card.language || 'polish') as Language)
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

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'audio', label: 'Audio & TTS' },
    { id: 'study', label: 'Limits' },
    { id: 'algorithm', label: 'FSRS v5' },
    { id: 'data', label: 'Data Management' },
    { id: 'danger', label: 'Danger Zone' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] md:h-[600px] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-background border border-border shadow-2xl sm:rounded-xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-secondary border-b md:border-b-0 md:border-r border-border p-6 flex flex-col justify-between shrink-0">
            <div>
                <DialogTitle className="font-bold tracking-tight text-lg mb-8 flex items-center gap-2">
                    Settings
                </DialogTitle>
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-md text-sm transition-all whitespace-nowrap",
                                activeTab === item.id 
                                    ? "bg-secondary text-foreground font-medium" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Mobile Hide / Desktop Show Footer */}
            <div className="hidden md:block text-[10px] font-mono text-muted-foreground/60">
                ID: {settings.language.toUpperCase()}_V1
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-8 md:p-10 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <GeneralSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-destructive shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-bold text-destructive uppercase tracking-wide">Reset Deck</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        This will permanently delete all cards for <strong>{localSettings.language}</strong> and reload the beginner course. Review history will be preserved where possible, but card-specific metrics will be lost.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetDeck}
                                className={clsx(
                                    "w-full py-3 text-xs font-mono uppercase tracking-widest transition-all rounded",
                                    confirmResetDeck 
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                                        : "bg-background border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                )}
                            >
                                {confirmResetDeck ? "Are you sure? Click to confirm." : "Reset Deck Data"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-background flex justify-between items-center gap-4 shrink-0 flex-wrap">
                <button 
                    onClick={() => {
                        onClose();
                        signOut();
                    }}
                    className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-md transition-colors flex items-center gap-2"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Log Out</span>
                </button>
                <div className="flex gap-4 ml-auto">
                    <button 
                        onClick={onClose} 
                        className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="bg-primary text-primary-foreground px-8 py-2 text-sm font-medium rounded-full hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <Check size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};