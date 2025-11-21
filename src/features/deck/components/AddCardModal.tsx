import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { EditorialInput } from "@/components/form/EditorialInput";
import { EditorialTextarea } from "@/components/form/EditorialTextarea";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
  const { settings } = useSettings();
  const [form, setForm] = useState({
    sentence: "",
    targetWord: "",
    translation: "",
    notes: "",
    furigana: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialCard) {
            const isJapanese = initialCard.language === 'japanese' || (!initialCard.language && settings.language === 'japanese');
            setForm({
                sentence: (isJapanese && initialCard.furigana) ? initialCard.furigana : initialCard.targetSentence,
                targetWord: initialCard.targetWord || "",
                translation: initialCard.nativeTranslation,
                notes: initialCard.notes,
                furigana: initialCard.furigana || ""
            });
        } else {
            setForm({ sentence: "", targetWord: "", translation: "", notes: "", furigana: "" });
        }
    }
  }, [isOpen, initialCard, settings.language]);

  const handleAutoFill = async () => {
    if (!form.sentence) return;
    setIsGenerating(true);
    try {
        const targetLanguage = initialCard?.language || settings.language;
        const result = await aiService.generateCardContent(form.sentence, targetLanguage);
        
        setForm(prev => ({ 
            ...prev, 
            sentence: (targetLanguage === 'japanese' && result.furigana) ? result.furigana : prev.sentence,
            translation: result.translation, 
            notes: result.notes,
            furigana: result.furigana || prev.furigana 
        }));
        toast.success("Content generated");
    } catch (e) {
        toast.error("Generation failed");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sentence || !form.translation) {
      toast.error("Sentence and translation required");
      return;
    }
    
    if (form.targetWord && !form.sentence.toLowerCase().includes(form.targetWord.toLowerCase())) {
        toast.error("Target word provided but not found in sentence");
        return;
    }

    const cardBase = initialCard || { id: uuidv4(), status: "new", interval: 0, easeFactor: 2.5, dueDate: new Date().toISOString(), reps: 0, lapses: 0 } as Card;
    
    const targetLanguage = initialCard?.language || settings.language;
    let targetSentence = form.sentence;
    let furigana = form.furigana || undefined;

    if (targetLanguage === 'japanese') {
        // If Japanese, the input sentence might contain furigana brackets.
        // We treat the input as the source of truth for furigana.
        furigana = form.sentence;
        // Strip brackets for the clean target sentence
        targetSentence = parseFurigana(form.sentence).map(s => s.text).join("");
    }

    const newCard: Card = {
      ...cardBase,
      targetSentence: targetSentence,
      targetWord: form.targetWord || undefined,
      nativeTranslation: form.translation,
      notes: form.notes,
      furigana: furigana,
      language: targetLanguage
    };
    onAdd(newCard);
    setForm({ sentence: "", targetWord: "", translation: "", notes: "", furigana: "" });
    onClose();
  };

  // Subtle highlight preview
  const HighlightedPreview = useMemo(() => {
      if (!form.sentence) return null;
      
      const targetLanguage = initialCard?.language || settings.language;

      if (targetLanguage === 'japanese') {
          const segments = parseFurigana(form.sentence);
          return (
            <div className="mt-6 text-2xl font-light text-muted-foreground select-none">
                {segments.map((segment, i) => {
                    const isTarget = form.targetWord && segment.text === form.targetWord;
                    if (segment.furigana) {
                        return (
                            <ruby key={i} className="group mr-1">
                                <span className={isTarget ? "text-foreground font-normal border-b border-foreground pb-0.5" : "text-foreground"}>{segment.text}</span>
                                <rt className="text-sm text-muted-foreground font-normal select-none">{segment.furigana}</rt>
                            </ruby>
                        );
                    }
                    return <span key={i} className={isTarget ? "text-foreground font-normal border-b border-foreground pb-0.5" : ""}>{segment.text}</span>;
                })}
            </div>
          );
      }

      if (!form.targetWord) return null;
      const parts = form.sentence.split(new RegExp(`(${escapeRegExp(form.targetWord)})`, "gi"));
      return (
        <div className="mt-6 text-2xl font-light text-muted-foreground select-none">
            {parts.map((part, i) => part.toLowerCase() === form.targetWord.toLowerCase() ? <span key={i} className="text-foreground font-normal border-b border-foreground pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
        </div>
      );
  }, [form.sentence, form.targetWord, settings.language, initialCard]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-12 bg-white dark:bg-black border border-border shadow-2xl sm:rounded-xl gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <DialogTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {initialCard ? "Edit" : "New"} Entry
                </DialogTitle>
                <button 
                    type="button"
                    onClick={handleAutoFill}
                    disabled={isGenerating || !form.sentence}
                    className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline disabled:opacity-30"
                >
                    {isGenerating ? "Analyzing..." : "AI Auto-Fill"}
                </button>
            </div>

            {/* Hero Input */}
            <div className="space-y-2">
                <textarea
                    placeholder="Enter target sentence..."
                    className="w-full text-3xl md:text-4xl font-light bg-transparent border-none outline-none placeholder:text-muted-foreground/20 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground"
                    value={form.sentence}
                    onChange={e => setForm({...form, sentence: e.target.value})}
                    rows={2}
                    autoFocus
                />
                {HighlightedPreview}
            </div>

            {/* Grid inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Translation</label>
                    <EditorialInput 
                        value={form.translation}
                        onChange={e => setForm({...form, translation: e.target.value})}
                        placeholder="e.g., This is a house."
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Target Word (Match)</label>
                    <EditorialInput 
                        value={form.targetWord}
                        onChange={e => setForm({...form, targetWord: e.target.value})}
                        placeholder="e.g., house"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Context Notes</label>
                <EditorialTextarea 
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                />
            </div>

            <div className="flex justify-end pt-6">
                <button 
                    type="submit" 
                    className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Save <ArrowRight size={16} />
                </button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};