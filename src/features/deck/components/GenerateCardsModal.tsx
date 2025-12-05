import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Sparkles, Check, X as XIcon, ArrowRight, BookOpen, Info, ChevronDown, Star, Scroll } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { getLearnedWords } from '@/services/db/repositories/cardRepository';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana, cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Genshin-style ornate corner SVG
const GenshinCorner = ({ className }: { className?: string }) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path d="M0 0H36V2H2V36H0V0Z" fill="currentColor" />
        <path d="M5 5H24V6.5H6.5V24H5V5Z" fill="currentColor" opacity="0.6" />
        <rect x="28" y="5" width="4" height="1.5" fill="currentColor" opacity="0.5" />
        <rect x="34" y="5" width="1.5" height="1.5" fill="currentColor" opacity="0.5" />
        <rect x="5" y="28" width="1.5" height="4" fill="currentColor" opacity="0.5" />
        <rect x="5" y="34" width="1.5" height="1.5" fill="currentColor" opacity="0.5" />
        <rect x="40" y="0" width="6" height="2" fill="currentColor" opacity="0.4" />
        <rect x="0" y="40" width="2" height="6" fill="currentColor" opacity="0.4" />
        <path d="M46 1L47 2L46 3L45 2Z" fill="currentColor" opacity="0.6" />
        <path d="M1 46L2 47L3 46L2 45Z" fill="currentColor" opacity="0.6" />
    </svg>
);

// Genshin-style animated loader
const GenshinLoader = () => (
    <div className="relative w-10 h-10">
        <div
            className="absolute inset-0 border-2 border-amber-500/30 rotate-45"
            style={{ animation: 'spin 4s linear infinite' }}
        />
        <div
            className="absolute inset-1.5 border-2 border-amber-500/50 rotate-45"
            style={{ animation: 'spin 3s linear infinite reverse' }}
        />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rotate-45 animate-pulse" />
    </div>
);

// Diamond divider component
const DiamondDivider = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-3", className)}>
        <span className="flex-1 h-px bg-amber-600/20" />
        <span className="w-2 h-2 rotate-45 border border-amber-600/40" />
        <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/50" />
        <span className="w-2 h-2 rotate-45 border border-amber-600/40" />
        <span className="flex-1 h-px bg-amber-600/20" />
    </div>
);

interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: Card[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const { settings } = useSettings();
    const { profile } = useAuth();
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);

    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(false);
    const [difficultyMode, setDifficultyMode] = useState<'beginner' | 'immersive'>('immersive');
    const [selectedLevel, setSelectedLevel] = useState<string>(profile?.language_level || 'A1');
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelDescriptions: Record<string, string> = {
        'A1': 'Beginner',
        'A2': 'Elementary',
        'B1': 'Intermediate',
        'B2': 'Upper Intermediate',
        'C1': 'Advanced',
        'C2': 'Proficient'
    };

    const [generatedData, setGeneratedData] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const handleGenerate = async () => {
        if (!instructions) {
            toast.error("Please enter instructions");
            return;
        }
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }

        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            const results = await aiService.generateBatchCards({
                instructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: selectedLevel,
                difficultyMode
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter(card => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }

            console.log('AI Generated Cards:', uniqueResults);
            console.log('First card sample:', uniqueResults[0]);

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_, i) => i)));
            setStep('preview');
        } catch (e) {
            toast.error("Failed to generate cards. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const handleSave = () => {
        const now = Date.now();
        const cardsToSave: Card[] = generatedData
            .filter((_, i) => selectedIndices.has(i))
            .map((item, index) => {
                return {
                    id: uuidv4(),
                    targetSentence: item.targetSentence,
                    nativeTranslation: item.nativeTranslation,
                    targetWord: item.targetWord,
                    targetWordTranslation: item.targetWordTranslation,
                    targetWordPartOfSpeech: item.targetWordPartOfSpeech,
                    notes: item.notes,
                    furigana: item.furigana,
                    language: settings.language,
                    status: 'new',
                    interval: 0,
                    easeFactor: 2.5,
                    dueDate: new Date(now + index * 1000).toISOString(),
                    reps: 0,
                    lapses: 0,
                    tags: ['AI-Gen', 'Custom']
                } as Card;
            });

        console.log('Cards being saved:', cardsToSave);
        console.log('First card to save:', cardsToSave[0]);

        onAddCards(cardsToSave);
        toast.success(`Added ${cardsToSave.length} cards to deck`);
        resetAndClose();
    };

    const handleSmartLesson = async () => {
        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                learnedWords = await getLearnedWords(settings.language);
            } catch (e) {
                console.error("Failed to fetch learned words", e);
            }

            let topicInstructions = "";
            let derivedLevel = selectedLevel;

            if (learnedWords.length === 0) {
                // Fallback for absolute beginners
                const starters = [
                    "Basic Greetings & Introductions",
                    "Ordering Food & Drink",
                    "Numbers & Shopping",
                    "Family & Friends"
                ];
                topicInstructions = starters[Math.floor(Math.random() * starters.length)];
                setDifficultyMode('beginner');
            } else {
                const shuffled = [...learnedWords].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 100);

                topicInstructions = `Create a structured lesson that reviews and expands upon these known words: ${selected.join(', ')}. Create sentences that place these words in new contexts or combine them.`;
            }

            setInstructions(topicInstructions); // Visual feedback

            const results = await aiService.generateBatchCards({
                instructions: topicInstructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: derivedLevel,
                difficultyMode
            });

            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));

            const uniqueResults = results.filter(card => {
                if (!card.targetWord) return true;
                return !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered out ${results.length - uniqueResults.length} duplicate words.`);
            }

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_, i) => i)));
            setStep('preview');

        } catch (e) {
            toast.error("Failed to generate smart lesson. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setStep('config');
        setInstructions('');
        setGeneratedData([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-4xl p-0 bg-gradient-to-b from-background via-background to-card border-2 border-amber-700/30 dark:border-amber-600/25 overflow-hidden gap-0 [&>button]:hidden">
                {/* Ornate Genshin corners */}
                <GenshinCorner className="absolute -top-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none z-20" />
                <GenshinCorner className="absolute -top-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none z-20 rotate-90" />
                <GenshinCorner className="absolute -bottom-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none z-20 -rotate-90" />
                <GenshinCorner className="absolute -bottom-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none z-20 rotate-180" />

                {/* Inner decorative frame */}
                <div className="absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10" />

                {/* Floating diamond decorations */}
                <span className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse" />
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500/20 pointer-events-none z-10 animate-pulse" style={{ animationDelay: '0.5s' }} />

                <div className="flex h-[620px]">
                    {/* Sidebar / Info Panel - Genshin Menu Style */}
                    <div className="w-1/3 bg-gradient-to-b from-card/50 to-muted/20 p-6 flex flex-col justify-between border-r border-amber-700/20 dark:border-amber-600/15 relative overflow-hidden">
                        {/* Decorative sidebar pattern */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <span
                                    key={i}
                                    className="absolute w-1 h-1 bg-amber-500/10 rotate-45"
                                    style={{
                                        left: `${20 + i * 15}%`,
                                        top: `${10 + i * 18}%`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Header with Genshin-style ornament */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="relative">
                                    <div className="w-12 h-12 flex items-center justify-center border-2 border-amber-600/40 bg-amber-600/10 rotate-45">
                                        <Scroll size={20} className="text-amber-500 -rotate-45" strokeWidth={1.5} />
                                    </div>
                                    {/* Corner accents on icon */}
                                    <span className="absolute -top-1 -left-1 w-2 h-0.5 bg-amber-500/60" />
                                    <span className="absolute -top-1 -left-1 w-0.5 h-2 bg-amber-500/60" />
                                    <span className="absolute -bottom-1 -right-1 w-2 h-0.5 bg-amber-500/60" />
                                    <span className="absolute -bottom-1 -right-1 w-0.5 h-2 bg-amber-500/60" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-500/60 block">Arcane Forge</span>
                                    <span className="text-lg font-serif tracking-wide text-foreground">Card Synthesis</span>
                                </div>
                            </div>

                            <DiamondDivider className="mb-6" />

                            <div className="space-y-6">
                                {/* Target Language Display */}
                                <div className="genshin-attr-row flex-col items-start gap-1 border-l-2 border-amber-600/30 pl-4">
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Target Language</span>
                                    <span className="text-2xl font-serif capitalize text-foreground tracking-wide">{settings.language}</span>
                                </div>

                                {step === 'config' && (
                                    <div className="space-y-5 animate-genshin-fade-in">
                                        {/* Card Quantity */}
                                        <div className="border-l-2 border-amber-600/30 pl-4">
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Quantity
                                            </h3>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-4xl font-serif text-amber-600 dark:text-amber-500 tabular-nums">{count[0]}</span>
                                                <span className="text-sm text-muted-foreground">cards</span>
                                            </div>
                                            <Slider
                                                value={count}
                                                onValueChange={setCount}
                                                min={3}
                                                max={100}
                                                step={1}
                                                className="py-2"
                                            />
                                        </div>

                                        {/* i+1 Toggle */}
                                        <div className="flex items-center gap-3 pl-4 py-2">
                                            <Switch
                                                id="learned-words"
                                                checked={useLearnedWords}
                                                onCheckedChange={setUseLearnedWords}
                                            />
                                            <Label htmlFor="learned-words" className="text-sm text-muted-foreground cursor-pointer">
                                                Use Learned Words (i+1)
                                            </Label>
                                        </div>

                                        {/* Level Selector - Genshin dropdown style */}
                                        <div className="relative pl-4">
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Mastery Level
                                            </h3>
                                            <button
                                                onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                                                className="w-full flex items-center justify-between py-2.5 px-4 text-sm border border-amber-700/30 dark:border-amber-600/20 bg-card/50 hover:border-amber-600/50 transition-all group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 flex items-center justify-center border border-amber-600/40 bg-amber-600/10 rotate-45">
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 -rotate-45">{selectedLevel}</span>
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">{levelDescriptions[selectedLevel]}</span>
                                                </span>
                                                <ChevronDown size={14} className={cn(
                                                    "text-amber-500/60 transition-transform",
                                                    showLevelDropdown && "rotate-180"
                                                )} />
                                            </button>
                                            {showLevelDropdown && (
                                                <div className="absolute bottom-full left-4 right-0 mb-1 border border-amber-700/30 dark:border-amber-600/20 bg-card z-50 shadow-lg">
                                                    {levels.map((level) => (
                                                        <button
                                                            key={level}
                                                            onClick={() => {
                                                                setSelectedLevel(level);
                                                                setShowLevelDropdown(false);
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 py-2.5 px-4 text-sm text-left hover:bg-amber-600/10 transition-colors",
                                                                selectedLevel === level && "bg-amber-600/15 border-l-2 border-amber-500"
                                                            )}
                                                        >
                                                            <span className="w-5 h-5 flex items-center justify-center border border-amber-600/40 rotate-45">
                                                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 -rotate-45">{level}</span>
                                                            </span>
                                                            <span className="text-muted-foreground text-xs">{levelDescriptions[level]}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Progression Mode */}
                                        <div className="pl-4">
                                            <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3 font-medium flex items-center gap-2">
                                                <Star size={10} className="text-amber-500/60" />
                                                Learning Path
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setDifficultyMode('beginner')}
                                                            className={cn(
                                                                "relative py-3 px-2 text-xs uppercase tracking-wider border transition-all flex flex-col items-center gap-1",
                                                                difficultyMode === 'beginner'
                                                                    ? "bg-amber-600/15 border-amber-600/50 text-amber-600 dark:text-amber-500"
                                                                    : "bg-card/30 border-amber-700/20 dark:border-amber-600/15 text-muted-foreground hover:border-amber-600/40"
                                                            )}
                                                        >
                                                            {difficultyMode === 'beginner' && (
                                                                <>
                                                                    <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500" />
                                                                </>
                                                            )}
                                                            <span className="font-serif text-[10px]">Zero to Hero</span>
                                                            <Info size={10} className="opacity-50" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="font-medium mb-1">Zero to Hero Path</p>
                                                        <p className="text-xs opacity-80">Starts with single words, then short phrases, building up to complete sentences.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setDifficultyMode('immersive')}
                                                            className={cn(
                                                                "relative py-3 px-2 text-xs uppercase tracking-wider border transition-all flex flex-col items-center gap-1",
                                                                difficultyMode === 'immersive'
                                                                    ? "bg-amber-600/15 border-amber-600/50 text-amber-600 dark:text-amber-500"
                                                                    : "bg-card/30 border-amber-700/20 dark:border-amber-600/15 text-muted-foreground hover:border-amber-600/40"
                                                            )}
                                                        >
                                                            {difficultyMode === 'immersive' && (
                                                                <>
                                                                    <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500" />
                                                                    <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500" />
                                                                </>
                                                            )}
                                                            <span className="font-serif text-[10px]">Immersive</span>
                                                            <Info size={10} className="opacity-50" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="font-medium mb-1">Immersive Path</p>
                                                        <p className="text-xs opacity-80">Every card contains a complete, natural sentence for context-rich learning.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 'preview' && (
                                    <div className="animate-genshin-fade-in border-l-2 border-amber-600/30 pl-4">
                                        <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                            <Star size={10} className="text-amber-500/60" />
                                            Selected
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-serif text-amber-600 dark:text-amber-500 tabular-nums">{selectedIndices.size}</span>
                                            <span className="text-sm text-muted-foreground">of {generatedData.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-8 flex flex-col bg-gradient-to-br from-card/30 via-transparent to-amber-600/5 relative">
                        {/* Close button with Genshin styling */}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={resetAndClose}
                                className="relative w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 border border-transparent hover:border-amber-600/30 bg-card/50 hover:bg-amber-600/10 transition-all group"
                            >
                                <span className="absolute -top-px -left-px w-2 h-0.5 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -top-px -left-px w-0.5 h-2 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -bottom-px -right-px w-2 h-0.5 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <span className="absolute -bottom-px -right-px w-0.5 h-2 bg-amber-500/0 group-hover:bg-amber-500/60 transition-all" />
                                <XIcon size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        {step === 'config' ? (
                            <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full animate-genshin-fade-in">
                                {/* Header section */}
                                <div className="mb-8 text-center">
                                    <div className="flex items-center justify-center gap-4 mb-4">
                                        <span className="w-12 h-px bg-amber-600/30" />
                                        <span className="w-2.5 h-2.5 rotate-45 border border-amber-600/50" />
                                        <span className="w-12 h-px bg-amber-600/30" />
                                    </div>
                                    <h2 className="text-2xl font-serif text-foreground mb-2 tracking-wide">What would you like to learn?</h2>
                                    <p className="text-muted-foreground/70 text-sm">Describe the topic, scenario, or vocabulary you wish to master</p>
                                </div>

                                {/* Textarea with Genshin styling */}
                                <div className="relative group">
                                    {/* Genshin corner accents */}
                                    <span className="absolute -top-px -left-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -left-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -right-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -top-px -right-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -left-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -left-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -right-px w-4 h-0.5 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />
                                    <span className="absolute -bottom-px -right-px w-0.5 h-4 bg-amber-500/40 group-focus-within:bg-amber-500/80 transition-colors z-10" />

                                    <Textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                        className="h-40 max-h-40 text-base p-6 bg-card/50 border border-amber-700/20 dark:border-amber-600/15 resize-none focus-visible:ring-0 focus-visible:border-amber-600/40 placeholder:text-muted-foreground/30 leading-relaxed"
                                        autoFocus
                                    />
                                </div>

                                {/* Generate Button - Genshin style */}
                                <div className="mt-8 flex justify-center gap-4">
                                    <button
                                        onClick={handleSmartLesson}
                                        disabled={loading}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3 px-6 py-4",
                                            "bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-100",
                                            "border border-indigo-400/30 hover:border-indigo-400/60",
                                            "uppercase tracking-[0.1em] text-xs font-serif font-medium",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                        )}
                                    >
                                        <Sparkles size={16} className="text-indigo-300" />
                                        <span>Smart Lesson</span>
                                    </button>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !instructions}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3 px-10 py-4",
                                            "bg-amber-600/90 hover:bg-amber-600 text-white dark:text-amber-950",
                                            "border-2 border-amber-500",
                                            "uppercase tracking-[0.2em] text-sm font-serif font-semibold",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            "hover:shadow-[0_0_20px_-5px] hover:shadow-amber-500/40"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-1 -left-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -top-1 -left-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                                        {loading ? (
                                            <>
                                                <GenshinLoader />
                                                <span>Forging...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                <span>Generate</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full animate-genshin-fade-in">
                                {/* Preview Header */}
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rotate-45 bg-amber-500/60" />
                                        <h2 className="text-xl font-serif text-foreground tracking-wide">Review Cards</h2>
                                    </div>
                                    <button
                                        onClick={() => setStep('config')}
                                        className="text-xs uppercase tracking-[0.1em] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-2"
                                    >
                                        <span className="w-1 h-1 rotate-45 bg-current" />
                                        Edit Instructions
                                    </button>
                                </div>

                                <DiamondDivider className="mb-4" />

                                {/* Cards List - Genshin menu item style */}
                                <div className="flex-1 overflow-y-auto space-y-2 -mr-4 pr-4">
                                    {generatedData.map((card, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleSelection(idx)}
                                            className={cn(
                                                "relative p-5 border transition-all duration-200 cursor-pointer group",
                                                selectedIndices.has(idx)
                                                    ? "bg-amber-600/10 border-amber-600/40 dark:border-amber-500/30"
                                                    : "bg-card/30 border-amber-700/15 dark:border-amber-600/10 hover:bg-card/50 hover:border-amber-700/30 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            {/* Selected corner accents */}
                                            {selectedIndices.has(idx) && (
                                                <>
                                                    <span className="absolute -top-px -left-px w-3 h-0.5 bg-amber-500" />
                                                    <span className="absolute -top-px -left-px w-0.5 h-3 bg-amber-500" />
                                                    <span className="absolute -bottom-px -right-px w-3 h-0.5 bg-amber-500" />
                                                    <span className="absolute -bottom-px -right-px w-0.5 h-3 bg-amber-500" />
                                                </>
                                            )}

                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="text-base text-foreground">{card.targetSentence}</div>
                                                    <div className="text-sm text-muted-foreground/70">{card.nativeTranslation}</div>
                                                </div>

                                                {/* Genshin-style checkbox */}
                                                <div className={cn(
                                                    "relative w-6 h-6 border flex items-center justify-center transition-all shrink-0 rotate-45",
                                                    selectedIndices.has(idx)
                                                        ? "bg-amber-600 border-amber-500"
                                                        : "border-amber-700/30 dark:border-amber-600/20 group-hover:border-amber-600/50"
                                                )}>
                                                    {selectedIndices.has(idx) && (
                                                        <span className="w-2 h-2 bg-white dark:bg-amber-950" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Save Button */}
                                <div className="pt-6 mt-4 border-t border-amber-700/20 dark:border-amber-600/15 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={selectedIndices.size === 0}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3 px-10 py-4",
                                            "bg-amber-600/90 hover:bg-amber-600 text-white dark:text-amber-950",
                                            "border-2 border-amber-500",
                                            "uppercase tracking-[0.2em] text-sm font-serif font-semibold",
                                            "transition-all duration-200",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            "hover:shadow-[0_0_20px_-5px] hover:shadow-amber-500/40"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-1 -left-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -top-1 -left-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-3 h-0.5 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                        <span className="absolute -bottom-1 -right-1 w-0.5 h-3 bg-white/50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />

                                        <span>Save to Deck</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
