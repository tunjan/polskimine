import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, LogOut, Skull, Settings, Volume2, Target, Sliders, Database, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GamePanel, GameButton, GameDivider } from '@/components/ui/game-ui';
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
    // Strip BOM (Byte Order Mark) that Excel and other tools may add to CSV files
    const sanitized = payload.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
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
    const { signOut, profile, updateUsername, updateLanguageLevel } = useAuth();
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

    
    try {
        await saveApiKeys({
            geminiApiKey: localSettings.geminiApiKey,
            googleTtsApiKey: localSettings.tts.googleApiKey,
            azureTtsApiKey: localSettings.tts.azureApiKey,
            azureRegion: localSettings.tts.azureRegion,
        });
    } catch (error) {
        console.error('Failed to save API keys:', error);
        
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

  
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'audio', label: 'Audio' },
    { id: 'study', label: 'Limits' },
    { id: 'algorithm', label: 'FSRS' },
    { id: 'data', label: 'Data' },
    { id: 'danger', label: 'Danger' },
  ];

  const tabIcons: Record<SettingsTab, React.ReactNode> = {
    general: <Settings className="w-4 h-4" strokeWidth={1.5} />,
    audio: <Volume2 className="w-4 h-4" strokeWidth={1.5} />,
    study: <Target className="w-4 h-4" strokeWidth={1.5} />,
    algorithm: <Sliders className="w-4 h-4" strokeWidth={1.5} />,
    data: <Database className="w-4 h-4" strokeWidth={1.5} />,
    danger: <Skull className="w-4 h-4" strokeWidth={1.5} />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[92vh] md:h-[85vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row bg-card border border-border rounded-none">
        
        {/* Game-styled Sidebar */}
        <div className="relative w-full md:w-72 bg-card border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-col justify-between shrink-0">
            {/* Corner decorations */}
            <span className="absolute -top-px -left-px w-4 h-4 pointer-events-none">
              <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
              <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
            </span>
            <span className="absolute -bottom-px -left-px w-4 h-4 pointer-events-none hidden md:block">
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
              <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
            </span>

            <div className="space-y-6">
                <DialogTitle className="flex items-center gap-3 mb-8">
                    <span className="w-2 h-2 rotate-45 bg-primary/60" />
                    <span className="text-lg md:text-xl font-medium text-foreground tracking-tight font-ui">Settings</span>
                </DialogTitle>
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "relative group flex items-center gap-3 text-left px-3 py-3 transition-all duration-200 whitespace-nowrap",
                                activeTab === item.id 
                                    ? "text-foreground bg-card/80" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                            )}
                        >
                            {/* Left accent line */}
                            <span className={clsx(
                                "absolute left-0 top-1/4 bottom-1/4 w-[2px] transition-all duration-200",
                                activeTab === item.id ? "bg-primary" : "bg-transparent group-hover:bg-primary/40"
                            )} />
                            
                            <span className={clsx(
                                "transition-colors",
                                activeTab === item.id ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary/70"
                            )}>
                                {tabIcons[item.id]}
                            </span>
                            <span className="text-sm font-light font-ui tracking-wide relative z-10">
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <ChevronRight className="w-3 h-3 ml-auto text-primary/60 hidden md:block" strokeWidth={2} />
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="hidden md:block">
                <GameDivider className="my-4" />
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rotate-45 bg-primary/40" />
                    <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground/50">
                        Deck: {settings.language}
                    </span>
                </div>
            </div>
        </div>

        {/* Game-styled Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
            <div className="flex-1 px-6 py-6 md:px-12 md:py-8 overflow-y-auto">
                
                {activeTab === 'general' && (
                    <GeneralSettings 
                        localSettings={localSettings} 
                        setLocalSettings={setLocalSettings}
                        username={localUsername}
                        setUsername={setLocalUsername}
                        languageLevel={profile?.language_level || 'A1'}
                        onUpdateLevel={updateLanguageLevel}
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
                    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 rotate-45 bg-destructive/60" />
                            <h2 className="text-lg font-medium text-foreground tracking-tight font-ui">Danger Zone</h2>
                            <span className="flex-1 h-px bg-gradient-to-r from-destructive/30 via-border/30 to-transparent" />
                        </div>

                        {/* Reset Deck - Game Panel Style */}
                        <GamePanel variant="default" size="md" className="border-orange-500/30 hover:border-orange-500/50 transition-colors">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-orange-500/10 flex items-center justify-center">
                                        <AlertCircle className="text-orange-500" size={18} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h4 className="text-sm font-medium text-foreground font-ui tracking-wide">Reset Current Deck</h4>
                                        <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                            Delete all cards, history, and progress for <span className="text-foreground">{localSettings.language}</span>. Restores beginner course.
                                        </p>
                                    </div>
                                </div>
                                <GameButton
                                    onClick={handleResetDeck}
                                    variant={confirmResetDeck ? 'primary' : 'secondary'}
                                    className={clsx(
                                        "w-full",
                                        confirmResetDeck && "bg-orange-500 hover:bg-orange-600"
                                    )}
                                >
                                    {confirmResetDeck ? "Confirm Reset" : "Reset Deck"}
                                </GameButton>
                            </div>
                        </GamePanel>

                        <GameDivider />

                        {/* Hard Reset - Game Panel Style */}
                        <GamePanel variant="default" size="md" className="border-destructive/30 hover:border-destructive/50 transition-colors">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-destructive/10 flex items-center justify-center">
                                        <Skull className="text-destructive" size={18} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h4 className="text-sm font-medium text-destructive font-ui tracking-wide">Complete Account Reset</h4>
                                        <p className="text-xs text-muted-foreground font-light leading-relaxed">
                                            Permanently removes all data across all languages. <span className="text-foreground font-medium">This cannot be undone.</span>
                                        </p>
                                    </div>
                                </div>
                                <GameButton
                                    onClick={handleResetAccount}
                                    variant={confirmResetAccount ? 'primary' : 'secondary'}
                                    className={clsx(
                                        "w-full",
                                        confirmResetAccount && "bg-destructive hover:bg-destructive/90"
                                    )}
                                >
                                    {confirmResetAccount ? "Confirm Complete Reset" : "Reset Everything"}
                                </GameButton>
                            </div>
                        </GamePanel>
                    </div>
                )}
            </div>

            {/* Game-styled Footer */}
            <div className="relative px-6 py-4 md:px-12 md:py-5 border-t border-border bg-card/50 flex justify-between items-center gap-4 shrink-0 flex-wrap">
                {/* Corner accents */}
                <span className="absolute -bottom-px -right-px w-4 h-4 pointer-events-none hidden md:block">
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
                  <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
                </span>
                
                <button 
                    onClick={() => {
                        onClose();
                        signOut();
                    }}
                    className="group flex items-center gap-2 text-xs font-ui uppercase tracking-[0.1em] text-destructive/70 hover:text-destructive px-3 py-2 transition-colors"
                >
                    <LogOut size={14} strokeWidth={1.5} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
                <div className="flex gap-3 ml-auto">
                    <GameButton 
                        onClick={onClose} 
                        variant="ghost"
                        size="md"
                    >
                        Cancel
                    </GameButton>
                    <GameButton 
                        onClick={handleSave}
                        variant="primary"
                        size="md"
                    >
                        Save Changes
                    </GameButton>
                </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};