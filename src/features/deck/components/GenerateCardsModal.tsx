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
            <DialogContent>
                <div>
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

                            <div className="flex-1 overflow-auto">
                                <div className="grid md:grid-cols-3 h-full">
                                    {/* Sidebar Config */}
                                    <div className="bg-muted/10 p-6 space-y-6 border-r md:col-span-1">
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Quantity: {count[0]}</Label>
                                                </div>
                                                <Slider
                                                    value={count}
                                                    onValueChange={setCount}
                                                    min={3}
                                                    max={50}
                                                    step={1}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Proficiency Level</Label>
                                                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                                    <SelectTrigger>
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

                                            <div className="space-y-2">
                                                <Label>Learning Path</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant={difficultyMode === 'beginner' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setDifficultyMode('beginner')}
                                                        className="h-auto flex-col py-2 gap-1"
                                                    >
                                                        <span className="text-xs font-semibold">Zero to Hero</span>
                                                        <span className="text-[10px] opacity-70">Single words</span>
                                                    </Button>
                                                    <Button
                                                        variant={difficultyMode === 'immersive' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setDifficultyMode('immersive')}
                                                        className="h-auto flex-col py-2 gap-1"
                                                    >
                                                        <span className="text-xs font-semibold">Immersive</span>
                                                        <span className="text-[10px] opacity-70">Full sentences</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 pt-2">
                                                <Switch
                                                    id="learned-words"
                                                    checked={useLearnedWords}
                                                    onCheckedChange={setUseLearnedWords}
                                                />
                                                <Label htmlFor="learned-words" className="text-sm font-normal">
                                                    Include Learned Words (i+1)
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Input Area */}
                                    <div className="p-6 md:col-span-2 flex flex-col gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="instructions" className="text-base font-semibold">
                                                Topic or Scenario
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Describe what you want to learn. Be specific about context and vocabulary.
                                            </p>
                                            <Textarea
                                                id="instructions"
                                                value={instructions}
                                                onChange={(e) => setInstructions(e.target.value)}
                                                placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                                className="h-40 resize-none text-base p-4"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
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

                                            <div className="relative">
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
                                                Create Smart Lesson from Progress
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
                                <div>
                                    <DialogTitle>Review Generated Cards</DialogTitle>
                                    <DialogDescription>
                                        Select the cards you want to add to your deck.
                                    </DialogDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setStep('config')} className="gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Edit Params
                                </Button>
                            </DialogHeader>

                            <ScrollArea className="h-80">
                                <div className="space-y-3 pr-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            Selected: <span className="text-foreground font-medium">{selectedIndices.size}</span>
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedIndices(new Set(generatedData.map((_, i) => i)))}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedIndices(new Set())}
                                            >
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>

                                    {generatedData.map((card, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleSelection(idx)}
                                            className={cn(
                                                "p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-4",
                                                selectedIndices.has(idx)
                                                    ? "bg-primary/5 border-primary"
                                                    : "bg-card border-border hover:border-primary/50"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 mt-1",
                                                    selectedIndices.has(idx)
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-muted-foreground"
                                                )}
                                            >
                                                {selectedIndices.has(idx) && <Check className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-foreground">{card.targetSentence}</p>
                                                <p className="text-sm text-muted-foreground">{card.nativeTranslation}</p>
                                                <div className="text-xs text-muted-foreground/70 mt-2 flex gap-2">
                                                    <span className="bg-muted px-1.5 py-0.5 rounded">{card.targetWord}</span>
                                                    <span>•</span>
                                                    <span className="italic">{card.targetWordTranslation}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <DialogFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
                                <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                                <Button onClick={handleSave} disabled={selectedIndices.size === 0}>
                                    Save {selectedIndices.size} Cards to Deck
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
