import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Check, X as XIcon, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { Card } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

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
      const results = await aiService.generateBatchCards({
        instructions,
        count: count[0],
        language: settings.language,
        apiKey: settings.geminiApiKey
      });
      
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
      <DialogContent className="sm:max-w-4xl p-0 bg-background border-none  sm:rounded-3xl overflow-hidden gap-0 [&>button]:hidden">
        <div className="flex h-[600px]">
            {/* Sidebar / Info Panel */}
            <div className="w-1/3 bg-secondary/30 p-8 flex flex-col justify-between border-r border-border/40">
                <div>
                    <div className="flex items-center gap-2 text-primary mb-8">
                        <BookOpen size={24} strokeWidth={1.5} />
                        <span className="font-serif text-xl italic">AI Studio</span>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Target Language</h3>
                            <p className="font-serif text-2xl capitalize text-foreground">{settings.language}</p>
                        </div>
                        
                        {step === 'config' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Quantity</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="font-serif text-4xl text-foreground">{count[0]}</span>
                                    <span className="text-muted-foreground">cards</span>
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
                        )}

                        {step === 'preview' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Selected</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-serif text-4xl text-foreground">{selectedIndices.size}</span>
                                    <span className="text-muted-foreground">of {generatedData.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-xs text-muted-foreground/60 font-mono leading-relaxed">
                    Powered by Gemini AI. <br/>
                    Designed for focused learning.
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 flex flex-col bg-background relative">
                <div className="absolute top-4 right-4">
                    <button onClick={resetAndClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
                        <XIcon size={20} />
                    </button>
                </div>

                {step === 'config' ? (
                    <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                        <div className="mb-8">
                            <h2 className="font-serif text-3xl text-foreground mb-3">What would you like to learn?</h2>
                            <p className="text-muted-foreground font-light">Describe the topic, scenario, or specific vocabulary you want to practice.</p>
                        </div>

                        <Textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. I want to learn how to order coffee in a busy cafe, focusing on polite expressions..."
                            className="h-40 max-h-40 text-lg p-6 bg-secondary/20 border-none resize-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-2xl placeholder:text-muted-foreground/40 font-serif leading-relaxed"
                            autoFocus
                        />

                        <div className="mt-8 flex justify-end shrink-0">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={loading || !instructions} 
                                className="h-14 px-8 rounded-sm font-black text-lg border border-terracotta bg-transparent hover:bg-terracotta/10 text-foreground transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:border-muted"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin mr-2" /> Crafting...</>
                                ) : (
                                    <><Sparkles className="mr-2" size={18} /> Generate Cards</>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-serif text-2xl text-foreground">Review Cards</h2>
                            <Button variant="ghost" onClick={() => setStep('config')} className="text-muted-foreground hover:text-foreground">
                                Edit Instructions
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar -mr-4 pr-6">
                            {generatedData.map((card, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => toggleSelection(idx)}
                                    className={`
                                        p-5 rounded-xl border transition-all duration-300 cursor-pointer group relative
                                        ${selectedIndices.has(idx) 
                                            ? 'bg-card border-primary/30 ' 
                                            : 'bg-card/50 border-transparent hover:bg-card hover:border-border/50 opacity-60 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="font-medium text-lg text-foreground/90">{card.targetSentence}</div>
                                            <div className="text-sm text-muted-foreground font-light italic">{card.nativeTranslation}</div>
                                        </div>
                                        <div className={`
                                            w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                            ${selectedIndices.has(idx) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
                                        `}>
                                            {selectedIndices.has(idx) && <Check size={14} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 mt-4 border-t border-border/40 flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                disabled={selectedIndices.size === 0} 
                                className="h-12 px-8 rounded-sm border border-terracotta bg-transparent hover:bg-terracotta/10 text-foreground transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:border-muted"
                            >
                                Save to Deck <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};