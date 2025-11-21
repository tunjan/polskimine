import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditorialInput } from '@/components/form/EditorialInput';
import { EditorialSelect } from '@/components/form/EditorialSelect';
import { MetaLabel } from '@/components/form/MetaLabel';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Check, X as XIcon, Loader2, ArrowRight } from 'lucide-react';
import { aiService } from '@/features/deck/services/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, Difficulty } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { parseFurigana } from '@/lib/utils';

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCards: (cards: Card[]) => void;
}

const DIFFICULTIES: Difficulty[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const GenerateCardsModal: React.FC<GenerateCardsModalProps> = ({ isOpen, onClose, onAddCards }) => {
  const { settings } = useSettings();
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [loading, setLoading] = useState(false);
  
  // Config State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('A1');
  const [count, setCount] = useState([5]);

  // Preview State
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const results = await aiService.generateBatchCards({
        difficulty,
        topic,
        count: count[0],
        language: settings.language
      });
      
      setGeneratedData(results);
      // Select all by default
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
        // Clean Japanese sentence if furigana is provided separately in the raw sentence
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
          tags: [`${difficulty}`, 'AI-Gen', topic.toLowerCase().replace(/\s+/g, '-')]
        } as Card;
      });

    onAddCards(cardsToSave);
    toast.success(`Added ${cardsToSave.length} cards to deck`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('config');
    setTopic('');
    setGeneratedData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-2xl p-8 bg-white dark:bg-black border border-border shadow-2xl sm:rounded-xl">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={20} />
          </div>
          <div>
             <DialogTitle className="text-xl font-bold tracking-tight">AI Deck Generator</DialogTitle>
             <DialogDescription className="text-xs text-muted-foreground">Generate content for {settings.language}</DialogDescription>
          </div>
        </div>

        {step === 'config' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <MetaLabel>Difficulty Level</MetaLabel>
                <EditorialSelect
                  value={difficulty}
                  onChange={(value) => setDifficulty(value as Difficulty)}
                  options={DIFFICULTIES.map(d => ({ value: d, label: `${d} Level` }))}
                />
              </div>
              <div>
                 <div className="flex justify-between mb-3">
                    <MetaLabel className="mb-0">Card Count</MetaLabel>
                    <span className="font-mono text-sm font-bold">{count[0]}</span>
                 </div>
                 <Slider
                    value={count}
                    onValueChange={setCount}
                    min={3}
                    max={10}
                    step={1}
                 />
              </div>
            </div>

            <div>
              <MetaLabel>Topic / Context</MetaLabel>
              <EditorialInput 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Business Meetings, Ordering Food, Harry Potter..."
                autoFocus
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-auto">
                {loading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2" size={16} /> Generate Cards</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
               {generatedData.map((card, idx) => (
                 <div 
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`
                        p-4 rounded-lg border cursor-pointer transition-all duration-200 relative group
                        ${selectedIndices.has(idx) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border opacity-60 hover:opacity-100'
                        }
                    `}
                 >
                    <div className="absolute top-3 right-3">
                        {selectedIndices.has(idx) ? <Check size={16} className="text-primary" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                    </div>
                    <div className="pr-8">
                        <div className="font-medium text-lg mb-1">{card.targetSentence}</div>
                        <div className="text-sm text-muted-foreground">{card.nativeTranslation}</div>
                        <div className="flex gap-2 mt-2">
                            {card.targetWord && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-foreground">{card.targetWord}</span>}
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">{difficulty}</span>
                        </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
                <button onClick={() => setStep('config')} className="text-sm text-muted-foreground hover:text-foreground">
                    Back to Config
                </button>
                <Button onClick={handleSave} disabled={selectedIndices.size === 0}>
                    Save {selectedIndices.size} Cards <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};