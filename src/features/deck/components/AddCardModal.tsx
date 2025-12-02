import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana, cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

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
        targetWordTranslation: "",
        targetWordPartOfSpeech: "",
        translation: "",
        notes: "",
        furigana: ""
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const isMounted = React.useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const wasOpen = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            if (initialCard) {
                const isJapanese = initialCard.language === 'japanese' || (!initialCard.language && settings.language === 'japanese');
                setForm({
                    sentence: (isJapanese && initialCard.furigana) ? initialCard.furigana : initialCard.targetSentence,
                    targetWord: initialCard.targetWord || "",
                    targetWordTranslation: initialCard.targetWordTranslation || "",
                    targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
                    translation: initialCard.nativeTranslation,
                    notes: initialCard.notes,
                    furigana: initialCard.furigana || ""
                });
            } else {
                setForm({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
            }
            // Auto-focus logic
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                }
            }, 100);
        }
        wasOpen.current = isOpen;
    }, [isOpen, initialCard, settings.language]);

    const handleAutoFill = async () => {
        if (!form.sentence) return;
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }
        setIsGenerating(true);
        try {
            const targetLanguage = initialCard?.language || settings.language;
            const result = await aiService.generateCardContent(form.sentence, targetLanguage, settings.geminiApiKey);

            if (isMounted.current) {
                setForm(prev => ({
                    ...prev,
                    sentence: (targetLanguage === 'japanese' && result.furigana) ? result.furigana : prev.sentence,
                    translation: result.translation,
                    targetWord: result.targetWord || prev.targetWord,
                    targetWordTranslation: result.targetWordTranslation || prev.targetWordTranslation,
                    targetWordPartOfSpeech: result.targetWordPartOfSpeech || prev.targetWordPartOfSpeech,
                    notes: result.notes,
                    furigana: result.furigana || prev.furigana
                }));
                toast.success("Content generated");
            }
        } catch (e) {
            if (isMounted.current) toast.error("Generation failed");
        } finally {
            if (isMounted.current) setIsGenerating(false);
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
            furigana = form.sentence;
            targetSentence = parseFurigana(form.sentence).map(s => s.text).join("");
        }

        const newCard: Card = {
            ...cardBase,
            targetSentence: targetSentence,
            targetWord: form.targetWord || undefined,
            targetWordTranslation: form.targetWordTranslation || undefined,
            targetWordPartOfSpeech: form.targetWordPartOfSpeech || undefined,
            nativeTranslation: form.translation,
            notes: form.notes,
            furigana: furigana,
            language: targetLanguage
        };
        onAdd(newCard);
        setForm({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
        onClose();
    };


    const HighlightedPreview = useMemo(() => {
        if (!form.sentence) return null;

        const targetLanguage = initialCard?.language || settings.language;

        if (targetLanguage === 'japanese') {
            const segments = parseFurigana(form.sentence);
            return (
                <div className="mt-4 text-xl font-light text-muted-foreground/60 select-none">
                    {segments.map((segment, i) => {
                        const isTarget = form.targetWord && segment.text === form.targetWord;
                        if (segment.furigana) {
                            return (
                                <ruby key={i} className="group mr-1" style={{ rubyAlign: 'center' }}>
                                    <span className={isTarget ? "text-primary/90 font-normal border-b border-primary/30 pb-0.5" : "text-foreground"}>{segment.text}</span>
                                    <rt className="text-xs text-muted-foreground/50 font-normal select-none font-ui tracking-wide text-center" style={{ textAlign: 'center' }}>{segment.furigana}</rt>
                                </ruby>
                            );
                        }
                        return <span key={i} className={isTarget ? "text-primary/90 font-normal border-b border-primary/30 pb-0.5" : ""}>{segment.text}</span>;
                    })}
                </div>
            );
        }

        if (!form.targetWord) return null;
        const parts = form.sentence.split(new RegExp(`(${escapeRegExp(form.targetWord)})`, "gi"));
        return (
            <div className="mt-4 text-xl font-light text-muted-foreground/60 select-none">
                {parts.map((part, i) => part.toLowerCase() === form.targetWord.toLowerCase() ? <span key={i} className="text-primary/90 font-normal border-b border-primary/30 pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
            </div>
        );
    }, [form.sentence, form.targetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 bg-card border border-border gap-0 overflow-hidden max-h-[85vh] overflow-y-auto">
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

                <DialogDescription className="sr-only">Form to add or edit a flashcard</DialogDescription>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">

                    {/* Top Section: Sentence Input */}
                    <div className="px-6 pt-8 pb-6 bg-muted/5 relative border-b border-border/30">
                        <div className="flex justify-between items-center mb-6">
                            <DialogTitle className="flex items-center gap-2 text-[11px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                                <span className="w-1.5 h-1.5 rotate-45 bg-primary/50" />
                                {initialCard ? "Edit Entry" : "New Entry"}
                            </DialogTitle>
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isGenerating || !form.sentence}
                                className={cn(
                                    "relative flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.15em] px-3 py-1.5 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-300",
                                    isGenerating ? "text-primary animate-pulse" : "text-primary/80 hover:text-primary"
                                )}
                            >
                                {/* Button corner accents */}
                                <span className="absolute -top-px -left-px w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="absolute top-0 left-0 w-full h-px bg-primary/60" />
                                    <span className="absolute top-0 left-0 h-full w-px bg-primary/60" />
                                </span>
                                <Sparkles size={12} strokeWidth={2} />
                                {isGenerating ? "Analyzing..." : "Auto-Fill"}
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                placeholder="Type your sentence here..."
                                className="w-full text-2xl md:text-3xl font-light bg-transparent border-none outline-none placeholder:text-muted-foreground/20 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground min-h-[80px]"
                                value={form.sentence}
                                onChange={e => setForm({ ...form, sentence: e.target.value })}
                                rows={1}
                                style={{ fieldSizing: 'content' } as any}
                            />
                            {HighlightedPreview}
                        </div>
                    </div>

                    {/* Bottom Section: Details */}
                    <div className="px-6 py-6 space-y-6 bg-card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
                                    <span className="w-1 h-1 rotate-45 bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                                    Translation
                                </label>
                                <input
                                    value={form.translation}
                                    onChange={e => setForm({ ...form, translation: e.target.value })}
                                    placeholder="e.g., This is a house."
                                    className="w-full bg-transparent border-b border-border/40 py-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
                                    <span className="w-1 h-1 rotate-45 bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                                    Target Word
                                </label>
                                <input
                                    value={form.targetWord}
                                    onChange={e => setForm({ ...form, targetWord: e.target.value })}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b border-border/40 py-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
                                    <span className="w-1 h-1 rotate-45 bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                                    Target Word Translation
                                </label>
                                <input
                                    value={form.targetWordTranslation}
                                    onChange={e => setForm({ ...form, targetWordTranslation: e.target.value })}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b border-border/40 py-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
                                    <span className="w-1 h-1 rotate-45 bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                                    Part of Speech
                                </label>
                                <select
                                    value={form.targetWordPartOfSpeech}
                                    onChange={e => setForm({ ...form, targetWordPartOfSpeech: e.target.value })}
                                    className="w-full bg-transparent border-b border-border/40 py-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
                                >
                                    <option value="" disabled>Select POS</option>
                                    <option value="noun">Noun</option>
                                    <option value="verb">Verb</option>
                                    <option value="adjective">Adjective</option>
                                    <option value="adverb">Adverb</option>
                                    <option value="pronoun">Pronoun</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 group">
                            <label className="flex items-center gap-2 text-[10px] font-ui font-medium uppercase tracking-[0.2em] text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
                                <span className="w-1 h-1 rotate-45 bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                                Context Notes
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Add any usage notes or context..."
                                className="w-full bg-transparent border-b border-border/40 py-2 text-base font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors resize-none min-h-[60px]"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="group relative inline-flex items-center gap-3 bg-primary/90 text-primary-foreground px-8 py-3.5 text-[11px] font-ui font-medium uppercase tracking-[0.2em] hover:bg-primary transition-all duration-300"
                            >
                                {/* Button corner accents */}
                                <span className="absolute -top-px -left-px w-2 h-2">
                                    <span className="absolute top-0 left-0 w-full h-px bg-primary-foreground/30" />
                                    <span className="absolute top-0 left-0 h-full w-px bg-primary-foreground/30" />
                                </span>
                                <span className="absolute -bottom-px -right-px w-2 h-2">
                                    <span className="absolute bottom-0 right-0 w-full h-px bg-primary-foreground/30" />
                                    <span className="absolute bottom-0 right-0 h-full w-px bg-primary-foreground/30" />
                                </span>
                                <span>Save Entry</span>
                                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};