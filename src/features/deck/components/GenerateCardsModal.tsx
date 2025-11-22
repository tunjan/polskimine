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
    if (!settings.geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings > General");
      return;
    }

    setLoading(true);
    try {
      const results = await aiService.generateBatchCards({
        difficulty,
        topic,
        count: count[0],
        language: settings.language,
        apiKey: settings.geminiApiKey
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
      <DialogContent className="sm:max-w-3xl p-12 bg-white dark:bg-black border border-border shadow-2xl sm:rounded-xl gap-0">
        
        <div className="flex justify-between items-start mb-10">
          <div>
             <DialogTitle className="text-3xl font-light tracking-tight mb-2">AI Generator</DialogTitle>
             <DialogDescription className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Target Language: {settings.language}
             </DialogDescription>
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <Sparkles size={20} strokeWidth={1.5} />
          </div>
        </div>

        {step === 'config' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <MetaLabel>Difficulty Level</MetaLabel>
                <EditorialSelect
                  value={difficulty}
                  onChange={(value) => setDifficulty(value as Difficulty)}
                  options={DIFFICULTIES.map(d => ({ value: d, label: `${d} Level` }))}
                />
              </div>
              <div>
                 <div className="flex justify-between mb-4">
                    <MetaLabel className="mb-0">Quantity</MetaLabel>
                    <span className="font-mono text-xl font-light">{count[0]}</span>
                 </div>
                 <Slider
                    value={count}
                    onValueChange={setCount}
                    min={3}
                    max={300}
                    step={1}
                    className="py-2"
                 />
              </div>
            </div>

            <div>
              <MetaLabel>Topic / Context</MetaLabel>
              <EditorialInput 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Business Meetings, Ordering Food..."
                autoFocus
              />
            </div>

            <div className="flex justify-end pt-8">
              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full md:w-auto h-12 px-8">
                {loading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2" size={16} /> Generate Cards</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
            <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 custom-scrollbar">
               {generatedData.map((card, idx) => (
                 <div 
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`
                        p-6 rounded-xl border cursor-pointer transition-all duration-200 relative group
                        ${selectedIndices.has(idx) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/50 hover:border-border hover:bg-secondary/30'
                        }
                    `}
                 >
                    <div className="absolute top-6 right-6">
                        {selectedIndices.has(idx) ? <Check size={20} className="text-primary" /> : <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />}
                    </div>
                    <div className="pr-12">
                        <div className="font-medium text-xl mb-2 tracking-tight">{card.targetSentence}</div>
                        <div className="text-sm text-muted-foreground font-mono opacity-70">{card.nativeTranslation}</div>
                        <div className="flex gap-3 mt-4">
                            {card.targetWord && <span className="text-[10px] bg-secondary px-2 py-1 rounded font-mono text-foreground uppercase tracking-wider">{card.targetWord}</span>}
                            <span className="text-[10px] border border-border px-2 py-1 rounded font-mono text-muted-foreground uppercase tracking-wider">{difficulty}</span>
                        </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
                <button onClick={() => setStep('config')} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Back to Config
                </button>
                <Button onClick={handleSave} disabled={selectedIndices.size === 0} className="h-12 px-8">
                    Save {selectedIndices.size} Cards <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};