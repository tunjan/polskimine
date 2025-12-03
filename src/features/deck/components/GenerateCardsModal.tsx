import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, X as XIcon, ArrowRight, BookOpen } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { getLearnedWords } from '@/services/db/repositories/cardRepository';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana, cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Inline mini loader for buttons
const ButtonLoader = () => (
  <span className="relative w-4 h-4 inline-block">
    <span className="absolute inset-0 border border-primary-foreground/40 rotate-45 animate-pulse" />
    <span className="absolute inset-0.5 border border-primary-foreground/60 rotate-45 animate-pulse" style={{ animationDelay: '150ms' }} />
    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary-foreground rotate-45" />
  </span>
);

interface GenerateCardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCards: (cards: Card[]) => void;
}

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
    const { settings } = useSettings();
    const [step, setStep] = useState<'config' | 'preview'>('config');
    const [loading, setLoading] = useState(false);

    const [instructions, setInstructions] = useState('');
    const [count, setCount] = useState([5]);
    const [useLearnedWords, setUseLearnedWords] = useState(false);

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
            if (useLearnedWords) {
                try {
                    learnedWords = await getLearnedWords(settings.language);
                } catch (e) {
                    console.error("Failed to fetch learned words", e);
                }
            }

            const results = await aiService.generateBatchCards({
                instructions,
                count: count[0],
                language: settings.language,
                apiKey: settings.geminiApiKey,
                learnedWords
            });

            console.log('AI Generated Cards:', results);
            console.log('First card sample:', results[0]);

            setGeneratedData(results);
            setSelectedIndices(new Set(results.map((_, i) => i)));
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
        const cardsToSave: Card[] = generatedData
            .filter((_, i) => selectedIndices.has(i))
            .map(item => {
                let targetSentence = item.targetSentence;

                if (settings.language === 'japanese' && item.furigana) {
                    targetSentence = parseFurigana(item.furigana).map(s => s.text).join("");
                }

                return {
                    id: uuidv4(),
                    targetSentence: targetSentence,
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
                    dueDate: new Date().toISOString(),
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

    const resetAndClose = () => {
        setStep('config');
        setInstructions('');
        setGeneratedData([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-4xl p-0 bg-card border border-border overflow-hidden gap-0 [&>button]:hidden">
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute top-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
                </span>
                <span className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none z-10">
                    <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
                    <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
                </span>

                <div className="flex h-[600px]">
                    {/* Sidebar / Info Panel */}
                    <div className="w-1/3 bg-muted/10 p-8 flex flex-col justify-between border-r border-border/50 relative">
                        {/* Sidebar decorative elements */}
                        <span className="absolute top-4 right-0 w-px h-12 bg-gradient-to-b from-primary/30 to-transparent" />
                        
                        <div>
                            <div className="flex items-center gap-2.5 text-primary mb-10">
                                <div className="relative w-10 h-10 flex items-center justify-center">
                                    <span className="absolute inset-0 border border-primary/30 rotate-45" />
                                    <BookOpen size={18} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground block">Powered by</span>
                                    <span className="text-lg font-light tracking-tight">AI Studio</span>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="relative">
                                    <span className="absolute -left-3 top-0 bottom-0 w-0.5 bg-primary/30" />
                                    <h3 className="text-[10px] font-ui font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2">Target Language</h3>
                                    <p className="text-2xl font-light capitalize text-foreground tracking-tight">{settings.language}</p>
                                </div>

                                {step === 'config' && (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 relative">
                                        <span className="absolute -left-3 top-0 bottom-0 w-0.5 bg-primary/30" />
                                        <h3 className="text-[10px] font-ui font-medium uppercase tracking-[0.15em] text-muted-foreground mb-4">Quantity</h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-5xl font-light text-foreground tabular-nums">{count[0]}</span>
                                            <span className="text-sm text-muted-foreground font-ui">cards</span>
                                        </div>
                                        <Slider
                                            value={count}
                                            onValueChange={setCount}
                                            min={3}
                                            max={100}
                                            step={1}
                                            className="py-2"
                                        />
                                        
                                        <div className="mt-6 flex items-center space-x-2">
                                            <Switch 
                                                id="learned-words" 
                                                checked={useLearnedWords}
                                                onCheckedChange={setUseLearnedWords}
                                            />
                                            <Label htmlFor="learned-words" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                                                Use Learned Words (i+1)
                                            </Label>
                                        </div>
                                    </div>
                                )}

                                {step === 'preview' && (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-500 relative">
                                        <span className="absolute -left-3 top-0 bottom-0 w-0.5 bg-emerald-500/50" />
                                        <h3 className="text-[10px] font-ui font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2">Selected</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-light text-foreground tabular-nums">{selectedIndices.size}</span>
                                            <span className="text-sm text-muted-foreground font-ui">of {generatedData.length}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-ui">
                            <Sparkles size={10} />
                            <span>Gemini AI</span>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-8 flex flex-col bg-card relative">
                        <div className="absolute top-4 right-4">
                            <button 
                                onClick={resetAndClose} 
                                className="relative w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group"
                            >
                                <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                                    <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                                </span>
                                <XIcon size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                        {step === 'config' ? (
                            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
                                        <span className="text-[10px] font-ui uppercase tracking-[0.15em] text-muted-foreground">Instructions</span>
                                    </div>
                                    <h2 className="text-3xl font-light text-foreground mb-3 tracking-tight">What would you like to learn?</h2>
                                    <p className="text-muted-foreground/70 font-light text-sm">Describe the topic, scenario, or specific vocabulary you want to practice.</p>
                                </div>

                                <div className="relative group">
                                    <Textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                                        className="h-40 max-h-40 text-lg p-6 bg-muted/10 border border-border/50 resize-none focus-visible:ring-0 focus-visible:border-primary/50 placeholder:text-muted-foreground/30 font-light leading-relaxed"
                                        autoFocus
                                    />
                                    {/* Input corner accents on focus */}
                                    <span className="absolute -top-px -left-px w-2.5 h-2.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/60" />
                                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/60" />
                                    </span>
                                    <span className="absolute -bottom-px -right-px w-2.5 h-2.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary/60" />
                                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary/60" />
                                    </span>
                                </div>

                                <div className="mt-8 flex justify-end shrink-0">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !instructions}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3 px-8 py-4 text-xs font-ui uppercase tracking-[0.15em] transition-all duration-200",
                                            "border border-primary bg-primary text-primary-foreground",
                                            "hover:bg-primary/90",
                                            "disabled:opacity-40 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                            <span className="absolute top-0 left-0 w-full h-0.5 bg-primary-foreground/50" />
                                            <span className="absolute top-0 left-0 h-full w-0.5 bg-primary-foreground/50" />
                                        </span>
                                        <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary-foreground/50" />
                                            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary-foreground/50" />
                                        </span>
                                        {loading ? (
                                            <><ButtonLoader /> Crafting...</>
                                        ) : (
                                            <><Sparkles size={16} /> Generate Cards</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rotate-45 bg-primary/60" />
                                        <h2 className="text-2xl font-light text-foreground tracking-tight">Review Cards</h2>
                                    </div>
                                    <button 
                                        onClick={() => setStep('config')} 
                                        className="text-xs font-ui uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Edit Instructions
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 -mr-4 pr-4">
                                    {generatedData.map((card, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => toggleSelection(idx)}
                                            className={cn(
                                                "relative p-5 border transition-all duration-200 cursor-pointer group",
                                                selectedIndices.has(idx)
                                                    ? "bg-card border-primary/40"
                                                    : "bg-card/50 border-border/40 hover:bg-card hover:border-border opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            {/* Card corner accents when selected */}
                                            {selectedIndices.has(idx) && (
                                                <>
                                                    <span className="absolute -top-px -left-px w-2 h-2 pointer-events-none">
                                                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                                                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
                                                    </span>
                                                    <span className="absolute -bottom-px -right-px w-2 h-2 pointer-events-none">
                                                        <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
                                                        <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
                                                    </span>
                                                </>
                                            )}
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="font-light text-lg text-foreground">{card.targetSentence}</div>
                                                    <div className="text-sm text-muted-foreground/70 font-light">{card.nativeTranslation}</div>
                                                </div>
                                                <div className={cn(
                                                    "relative w-5 h-5 border flex items-center justify-center transition-all shrink-0",
                                                    selectedIndices.has(idx) 
                                                        ? "bg-primary border-primary text-primary-foreground" 
                                                        : "border-border/60 group-hover:border-primary/50"
                                                )}>
                                                    {selectedIndices.has(idx) && <span className="w-1.5 h-1.5 bg-primary-foreground rotate-45" />}
                                                    <span className={cn(
                                                        "absolute -top-px -left-px w-1 h-1 transition-opacity pointer-events-none",
                                                        selectedIndices.has(idx) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                    )}>
                                                        <span className="absolute top-0 left-0 w-full h-0.5 bg-primary/50" />
                                                        <span className="absolute top-0 left-0 h-full w-0.5 bg-primary/50" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 mt-4 border-t border-border/50 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={selectedIndices.size === 0}
                                        className={cn(
                                            "relative group/btn inline-flex items-center gap-3 px-8 py-4 text-xs font-ui uppercase tracking-[0.15em] transition-all duration-200",
                                            "border border-primary bg-primary text-primary-foreground",
                                            "hover:bg-primary/90",
                                            "disabled:opacity-40 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        {/* Button corner accents */}
                                        <span className="absolute -top-px -left-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                            <span className="absolute top-0 left-0 w-full h-0.5 bg-primary-foreground/50" />
                                            <span className="absolute top-0 left-0 h-full w-0.5 bg-primary-foreground/50" />
                                        </span>
                                        <span className="absolute -bottom-px -right-px w-2 h-2 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                                            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary-foreground/50" />
                                            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary-foreground/50" />
                                        </span>
                                        Save to Deck <ArrowRight size={16} />
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