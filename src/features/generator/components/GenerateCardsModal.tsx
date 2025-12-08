import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Sparkles, 
    Check, 
    BookOpen, 
    Loader2, 
    RotateCcw, 
    Languages, 
    GraduationCap, 
    ListFilter, 
    Type,
    Wand2,
    Settings2,
    Save
} from 'lucide-react';
import { aiService, WordType } from '@/lib/ai';
import { useSettingsStore, SettingsState } from '@/stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getLearnedWords } from '@/db/repositories/cardRepository';
import { Card as CardType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Constants ---

const WORD_TYPES: { value: WordType; label: string }[] = [
    { value: 'noun', label: 'Noun' },
    { value: 'verb', label: 'Verb' },
    { value: 'adjective', label: 'Adjective' },
    { value: 'adverb', label: 'Adverb' },
    { value: 'pronoun', label: 'Pronoun' },
    { value: 'preposition', label: 'Preposition' },
    { value: 'conjunction', label: 'Conj' },
];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Int.',
    'C1': 'Advanced',
    'C2': 'Proficient'
};

const SUGGESTED_TOPICS = [
    "Travel & Directions",
    "Ordering Food",
    "Business Meeting",
    "Daily Routine",
    "Medical Emergency",
    "Job Interview"
];

interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: CardType[]) => void;
}

// --- Sub-Components ---

const WordTypeBadge = ({ 
    type, 
    selected, 
    onClick 
}: { 
    type: { value: WordType; label: string }; 
    selected: boolean; 
    onClick: () => void;
}) => (
    <Badge
        variant={selected ? "default" : "outline"}
        className={cn(
            "cursor-pointer transition-all hover:scale-105 active:scale-95 select-none px-3 py-1",
            !selected && "text-muted-foreground hover:text-foreground hover:border-primary/50",
            selected && "bg-primary text-primary-foreground border-primary"
        )}
        onClick={onClick}
    >
        {type.label}
    </Badge>
);

const ResultCard = ({ 
    card, 
    selected, 
    onToggle 
}: { 
    card: any; 
    selected: boolean; 
    onToggle: () => void;
}) => {
    return (
        <div
            onClick={onToggle}
            className={cn(
                "group relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
                selected 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-xs"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                    <p className="font-medium text-lg leading-snug">{card.targetSentence}</p>
                    <p className="text-sm text-muted-foreground">{card.nativeTranslation}</p>
                </div>
                <div
                    className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors shrink-0",
                        selected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 group-hover:border-primary/50"
                    )}
                >
                    {selected && <Check className="w-3.5 h-3.5 stroke-3" />}
                </div>
            </div>
            
            <Separator className="my-1 bg-border/50" />
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary" className="font-mono text-primary bg-primary/10 hover:bg-primary/15 border-0">
                    {card.targetWord}
                </Badge>
                <span className="text-muted-foreground italic">
                    {card.targetWordTranslation}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                    {card.targetWordPartOfSpeech}
                </span>
            </div>
        </div>
    );
};

// --- Main Component ---

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const { language, geminiApiKey } = useSettingsStore(useShallow((s: SettingsState) => ({
        language: s.settings.language,
        geminiApiKey: s.settings.geminiApiKey
    })));
    const { profile } = useProfile();

    
    // State
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(true);
    const [difficultyMode, setDifficultyMode] = useState<'beginner' | 'immersive'>('immersive');
    const [selectedLevel, setSelectedLevel] = useState<string>(profile?.language_level || 'A1');
    const [selectedWordTypes, setSelectedWordTypes] = useState<WordType[]>([]);
    
    const [generatedData, setGeneratedData] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Reset functionality
    const resetAndClose = () => {
        onClose();
        // Small timeout to allow animation to finish before resetting state
        setTimeout(() => {
            setStep('config');
            setInstructions('');
            setGeneratedData([]);
            setSelectedWordTypes([]);
            setLoading(false);
        }, 200);
    };

    // Logic
    const toggleWordType = (type: WordType) => {
        setSelectedWordTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleTopicClick = (topic: string) => {
        setInstructions(prev => prev ? `${prev} ${topic}` : topic);
    };

    const generateCards = async (customInstructions?: string) => {
        const finalInstructions = customInstructions || instructions;

        if (!finalInstructions) {
            toast.error("Please enter specific topic or instructions");
            return;
        }
        if (!geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings");
            return;
        }

        setLoading(true);
        try {
            let learnedWords: string[] = [];
            try {
                if (useLearnedWords) {
                    learnedWords = await getLearnedWords(language);
                }
            } catch (e) {
                console.warn("Failed to fetch learned words", e);
            }

            const results = await aiService.generateBatchCards({
                instructions: finalInstructions,
                count: count[0],
                language: language,
                apiKey: geminiApiKey,
                learnedWords: useLearnedWords ? learnedWords : undefined,
                proficiencyLevel: selectedLevel,
                difficultyMode,
                wordTypeFilters: selectedWordTypes.length > 0 ? selectedWordTypes : undefined
            });

            // De-duplicate against learned words locally for extra safety
            const existingWordSet = new Set(learnedWords.map(w => w.toLowerCase()));
            const uniqueResults = results.filter((card: any) => {
                return card.targetWord && !existingWordSet.has(card.targetWord.toLowerCase());
            });

            if (uniqueResults.length === 0 && results.length > 0) {
                 toast.warning("All generated words were duplicates. Try a harder difficulty or different topic.");
                 return;
            }

            if (uniqueResults.length < results.length) {
                toast.info(`Filtered ${results.length - uniqueResults.length} known duplicates.`);
            }

            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_: any, i: number) => i)));
            setStep('preview');
        } catch (e: any) {
            console.error("Generation error:", e);
            toast.error(e.message || "Failed to generate cards");
        } finally {
            setLoading(false);
        }
    };

    const handleSmartLesson = async () => {
        setLoading(true);
        try {
            const learnedWords = await getLearnedWords(language).catch(() => []);
            
            let prompt = "";
            let mode: 'beginner' | 'immersive' = difficultyMode;

            if (learnedWords.length === 0) {
                prompt = "Basic intro conversation for a complete beginner. Greetings and simple questions.";
                mode = 'beginner';
            } else {
                // Pick random words to review
                const reviewWords = learnedWords.sort(() => 0.5 - Math.random()).slice(0, 15);
                prompt = `Create a lesson reviewing these words: ${reviewWords.join(', ')}. Create new sentences using these in different contexts.`;
            }
            
            // Override local state for this generation
            setInstructions(prompt); // for visibility
            setDifficultyMode(mode);
            
            await generateCards(prompt);
        } catch (e) {
            setLoading(false);
            console.error("Smart lesson failed", e);
        }
    };

    const handleSave = () => {
        const now = Date.now();
        const cardsToSave: CardType[] = generatedData
            .filter((_, i) => selectedIndices.has(i))
            .map((item, index) => ({
                id: uuidv4(),
                targetSentence: item.targetSentence,
                nativeTranslation: item.nativeTranslation,
                targetWord: item.targetWord,
                targetWordTranslation: item.targetWordTranslation,
                targetWordPartOfSpeech: item.targetWordPartOfSpeech,
                notes: item.notes,
                furigana: item.furigana,
                language: language,
                status: 'new',
                interval: 0,
                easeFactor: 2.5,
                dueDate: new Date(now + index * 1000).toISOString(),
                reps: 0,
                lapses: 0,
                tags: ['AI-Gen', 'Custom', instructions.slice(0, 15).trim()]
            } as CardType));

        onAddCards(cardsToSave);
        toast.success(`Saved ${cardsToSave.length} new cards!`);
        resetAndClose();
    };

    const toggleSelection = (idx: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setSelectedIndices(newSet);
    };

    // --- Render ---

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className={cn(
                "p-0 gap-0 overflow-hidden flex flex-col transition-all duration-300",
                "w-[95vw] h-[95vh] sm:max-w-5xl sm:h-[85vh]", // Responsive fixed sizing
            )}>
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">AI Card Generator</DialogTitle>
                                <DialogDescription className="text-sm mt-0.5">
                                    {step === 'config' 
                                        ? "Create custom flashcards instantly" 
                                        : "Review and save your cards"}
                                </DialogDescription>
                            </div>
                        </div>
                        {step === 'preview' && (
                            <Button variant="outline" size="sm" onClick={() => setStep('config')} className="gap-2 hidden sm:flex">
                                <Settings2 className="w-4 h-4" />
                                Adjust Settings
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {step === 'config' ? (
                            <motion.div 
                                key="config"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col sm:flex-row"
                            >
                                {/* Sidebar: Settings */}
                                <div className="w-full sm:w-[320px] bg-muted/20 border-r flex flex-col h-full overflow-hidden">
                                     <ScrollArea className="flex-1">
                                        <div className="p-6 space-y-8">
                                            {/* Quantity */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2 text-muted-foreground">
                                                        <ListFilter className="w-4 h-4" />
                                                        Quantity
                                                    </Label>
                                                    <Badge variant="secondary" className="font-mono">{count[0]}</Badge>
                                                </div>
                                                <Slider
                                                    value={count}
                                                    onValueChange={setCount}
                                                    min={3}
                                                    max={50}
                                                    step={1}
                                                    className="py-2"
                                                />
                                            </div>

                                            {/* Proficiency */}
                                            <div className="space-y-3">
                                                <Label className="flex items-center gap-2 text-muted-foreground">
                                                    <GraduationCap className="w-4 h-4" />
                                                    Proficiency Level
                                                </Label>
                                                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(LEVEL_DESCRIPTIONS).map(([lvl, desc]) => (
                                                            <SelectItem key={lvl} value={lvl}>
                                                                <span className="font-bold mr-2 text-primary">{lvl}</span>
                                                                <span className="text-muted-foreground">{desc}</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Mode */}
                                            <div className="space-y-3">
                                                 <Label className="flex items-center gap-2 text-muted-foreground">
                                                    <Languages className="w-4 h-4" />
                                                    Learning Approach
                                                </Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setDifficultyMode('beginner')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                                                            difficultyMode === 'beginner' 
                                                                ? "border-primary bg-primary/5 text-primary" 
                                                                : "border-transparent bg-background hover:bg-muted"
                                                        )}
                                                    >
                                                        <span className="text-sm font-semibold mb-1">Zero to Hero</span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight">Single words building up</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDifficultyMode('immersive')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                                                            difficultyMode === 'immersive' 
                                                                ? "border-primary bg-primary/5 text-primary" 
                                                                : "border-transparent bg-background hover:bg-muted"
                                                        )}
                                                    >
                                                        <span className="text-sm font-semibold mb-1">Immersive</span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight">Full natural sentences</span>
                                                    </button>
                                                </div>
                                            </div>

                                             <Separator />

                                            {/* Word Types */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2 text-muted-foreground">
                                                        <Type className="w-4 h-4" />
                                                        Word Types
                                                    </Label>
                                                    {selectedWordTypes.length > 0 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => setSelectedWordTypes([])}
                                                            className="h-6 text-[10px]"
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {WORD_TYPES.map(type => (
                                                        <WordTypeBadge
                                                            key={type.value}
                                                            type={type}
                                                            selected={selectedWordTypes.includes(type.value)}
                                                            onClick={() => toggleWordType(type.value)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <Label htmlFor="learned-words" className="text-sm text-foreground">
                                                    Include Learned Words
                                                </Label>
                                                <Switch
                                                    id="learned-words"
                                                    checked={useLearnedWords}
                                                    onCheckedChange={setUseLearnedWords}
                                                />
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Main Area: Prompt */}
                                <div className="flex-1 flex flex-col h-full bg-background">
                                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">What do you want to learn?</Label>
                                            <Textarea
                                                value={instructions}
                                                onChange={(e) => setInstructions(e.target.value)}
                                                placeholder="e.g. I want to learn 20 cooking verbs, or how to ask for directions proficiently..."
                                                className="min-h-[160px] text-base p-4 resize-none shadow-sm focus-visible:ring-primary/20"
                                            />
                                            <p className="text-xs text-muted-foreground text-right">
                                                {instructions.length} chars
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm text-muted-foreground">Suggested Topics</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {SUGGESTED_TOPICS.map(topic => (
                                                    <Button
                                                        key={topic}
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleTopicClick(topic)}
                                                        className="h-8 text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                                                    >
                                                        {topic}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Footer for Config */}
                                    <div className="p-6 border-t bg-muted/10 flex flex-col sm:flex-row gap-3">
                                        <Button 
                                            size="lg" 
                                            className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => generateCards()}
                                            disabled={loading || !instructions}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Thinking...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="w-5 h-5 mr-2" />
                                                    Generate Cards
                                                </>
                                            )}
                                        </Button>
                                        
                                        <div className="relative flex items-center justify-center sm:hidden py-1">
                                            <span className="text-xs text-muted-foreground bg-background px-2 z-10">OR</span>
                                            <Separator className="absolute w-full" />
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="sm:w-auto"
                                            onClick={handleSmartLesson}
                                            disabled={loading}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Smart Lesson
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="preview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full flex flex-col"
                            >
                                {/* Results Actions */}
                                <div className="px-6 py-3 border-b bg-muted/10 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-primary" />
                                            <span className="font-semibold">{selectedIndices.size}</span>
                                            <span className="text-muted-foreground">selected</span>
                                        </div>
                                        <Separator orientation="vertical" className="h-4" />
                                         <span className="text-sm text-muted-foreground hidden sm:inline">
                                            {generatedData.length} generated
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => setSelectedIndices(new Set(generatedData.map((_, i) => i)))}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs hover:text-destructive"
                                            onClick={() => setSelectedIndices(new Set())}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <ScrollArea className="flex-1 bg-muted/5 p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                                        {generatedData.map((card, idx) => (
                                            <ResultCard
                                                key={idx}
                                                card={card}
                                                selected={selectedIndices.has(idx)}
                                                onToggle={() => toggleSelection(idx)}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Floating Footer (or fixed at bottom) */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-background via-background to-transparent pointer-events-none">
                                    <div className="flex justify-center sm:justify-end gap-3 pointer-events-auto">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            onClick={() => setStep('config')}
                                            className="shadow-sm bg-background/80 backdrop-blur"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Start Over
                                        </Button>
                                        <Button 
                                            size="lg" 
                                            onClick={handleSave} 
                                            disabled={selectedIndices.size === 0}
                                            className="shadow-lg min-w-[160px]"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Add to Deck
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};
