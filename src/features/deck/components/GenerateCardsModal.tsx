import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Sparkles, Check, ArrowRight, BookOpen, Info, Scroll, Loader2, RotateCcw } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getLearnedWords } from '@/services/db/repositories/cardRepository';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';


interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: Card[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const settings = useSettingsStore(s => s.settings);
    const { profile } = useProfile();
    const isMobile = useIsMobile();
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);

    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(false);
    const [difficultyMode, setDifficultyMode] = useState<'beginner' | 'immersive'>('immersive');
    const [selectedLevel, setSelectedLevel] = useState<string>(profile?.language_level || 'A1');

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


            setGeneratedData(uniqueResults);
            setSelectedIndices(new Set(uniqueResults.map((_, i) => i)));
            setStep('preview');
        } catch (e: any) {
            console.error("Generation error:", e);
            toast.error(e.message || "Failed to generate cards. Try again.");
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

            setInstructions(topicInstructions);
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

        } catch (e: any) {
            console.error("Smart lesson error:", e);
            toast.error(e.message || "Failed to generate smart lesson. Try again.");
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
            <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
                {step === 'config' ? (
                    <>
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Card Generator
                            </DialogTitle>
                            <DialogDescription>
                                Generate AI-powered flashcards for <strong>{settings.language}</strong> learning.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto">
                            <div className={cn(
                                "grid h-full",
                                isMobile ? "grid-cols-1" : "grid-cols-[280px_1fr]"
                            )}>
                                {/* Sidebar Config */}
                                <div className={cn(
                                    "bg-muted/30 p-5 space-y-5",
                                    !isMobile && "border-r"
                                )}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Quantity</Label>
                                            <span className="text-sm font-semibold text-primary">{count[0]}</span>
                                        </div>
                                        <Slider
                                            value={count}
                                            onValueChange={setCount}
                                            min={3}
                                            max={50}
                                            step={1}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Proficiency Level</Label>
                                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(levelDescriptions).map(([lvl, desc]) => (
                                                    <SelectItem key={lvl} value={lvl}>
                                                        <span className="font-medium mr-2">{lvl}</span>
                                                        <span className="text-muted-foreground text-xs">{desc}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Learning Path</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={difficultyMode === 'beginner' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDifficultyMode('beginner')}
                                                className="h-auto flex-col py-3 gap-1"
                                            >
                                                <span className="text-xs font-semibold">Zero to Hero</span>
                                                <span className="text-[10px] opacity-70">Single words</span>
                                            </Button>
                                            <Button
                                                variant={difficultyMode === 'immersive' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDifficultyMode('immersive')}
                                                className="h-auto flex-col py-3 gap-1"
                                            >
                                                <span className="text-xs font-semibold">Immersive</span>
                                                <span className="text-[10px] opacity-70">Full sentences</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between gap-3">
                                        <Label htmlFor="learned-words" className="text-sm font-normal leading-tight">
                                            Include Learned Words (i+1)
                                        </Label>
                                        <Switch
                                            id="learned-words"
                                            checked={useLearnedWords}
                                            onCheckedChange={setUseLearnedWords}
                                        />
                                    </div>
                                </div>

                                {/* Main Input Area */}
                                <div className="p-5 flex flex-col gap-5">
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <Label htmlFor="instructions" className="text-sm font-semibold">
                                                Topic or Scenario
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Describe what you want to learn. Be specific about context and vocabulary.
                                            </p>
                                        </div>
                                        <Textarea
                                            id="instructions"
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                            placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                            className={cn(
                                                "resize-none text-sm",
                                                isMobile ? "h-24" : "h-32"
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={loading || !instructions}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Cards
                                                </>
                                            )}
                                        </Button>

                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSmartLesson}
                                            disabled={loading}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Smart Lesson from Progress
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle>Review Generated Cards</DialogTitle>
                                    <DialogDescription>
                                        Select the cards you want to add to your deck.
                                    </DialogDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setStep('config')} className="gap-2 shrink-0">
                                    <RotateCcw className="h-4 w-4" />
                                    {!isMobile && "Edit Params"}
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Selected: <span className="text-foreground font-semibold">{selectedIndices.size}</span> of {generatedData.length}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIndices(new Set(generatedData.map((_, i) => i)))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIndices(new Set())}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 space-y-3">
                                {generatedData.map((card, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => toggleSelection(idx)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3",
                                            selectedIndices.has(idx)
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card border-transparent hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                selectedIndices.has(idx)
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/50"
                                            )}
                                        >
                                            {selectedIndices.has(idx) && <Check className="h-3 w-3" strokeWidth={3} />}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <p className="font-medium text-foreground leading-snug">{card.targetSentence}</p>
                                            <p className="text-sm text-muted-foreground">{card.nativeTranslation}</p>
                                            <div className="text-xs text-muted-foreground/70 mt-2 flex flex-wrap gap-2 items-center">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{card.targetWord}</span>
                                                <span className="italic">{card.targetWordTranslation}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0 gap-2 sm:gap-2">
                            <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                            <Button onClick={handleSave} disabled={selectedIndices.size === 0}>
                                <Check className="mr-2 h-4 w-4" />
                                Save {selectedIndices.size} Cards
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
