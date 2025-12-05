import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowRight, Sparkles, Scroll, BookOpen, PenLine, Languages, Tag, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana, cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { GenshinCorner } from "@/components/game/GamePanel";

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (card: Card) => void;
    initialCard?: Card;
}



const DiamondDivider = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-2", className)}>
        <span className="flex-1 h-px bg-amber-600/30" />
        <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/50" />
        <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
        <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/50" />
        <span className="flex-1 h-px bg-amber-600/30" />
    </div>
);

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
                setForm({
                    sentence: initialCard.targetSentence,
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
                    sentence: (targetLanguage === LanguageId.Japanese && result.furigana) ? result.furigana : prev.sentence,
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

        if (targetLanguage === LanguageId.Japanese) {
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

        if (targetLanguage === LanguageId.Japanese) {
            const segments = parseFurigana(form.sentence);
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {segments.map((segment, i) => {
                        const isTarget = form.targetWord && segment.text === form.targetWord;
                        if (segment.furigana) {
                            return (
                                <ruby key={i} className="group mr-1" style={{ rubyAlign: 'center' }}>
                                    <span className={isTarget ? "text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5" : "text-foreground"}>{segment.text}</span>
                                    <rt className="text-xs text-amber-400/50 font-normal select-none font-ui tracking-wide text-center" style={{ textAlign: 'center' }}>{segment.furigana}</rt>
                                </ruby>
                            );
                        }
                        return <span key={i} className={isTarget ? "text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5" : ""}>{segment.text}</span>;
                    })}
                </div>
            );
        }

        if (!form.targetWord) return null;
        const parts = form.sentence.split(new RegExp(`(${escapeRegExp(form.targetWord)})`, "gi"));
        return (
            <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                {parts.map((part, i) => part.toLowerCase() === form.targetWord.toLowerCase() ? <span key={i} className="text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
            </div>
        );
    }, [form.sentence, form.targetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 bg-card border-2 border-amber-700/30 dark:border-amber-600/25 gap-0 overflow-hidden animate-genshin-fade-in [&>button]:z-30 [&>button]:right-5 [&>button]:top-5">

                {/* Ornate Corner Decorations */}
                <GenshinCorner className="absolute -top-px -left-px text-amber-500/70 dark:text-amber-400/60 pointer-events-none z-20" />
                <GenshinCorner className="absolute -top-px -right-px text-amber-500/70 dark:text-amber-400/60 pointer-events-none z-20 rotate-90" />
                <GenshinCorner className="absolute -bottom-px -left-px text-amber-500/70 dark:text-amber-400/60 pointer-events-none z-20 -rotate-90" />
                <GenshinCorner className="absolute -bottom-px -right-px text-amber-500/70 dark:text-amber-400/60 pointer-events-none z-20 rotate-180" />

                {/* Inner decorative frame */}
                <div className="absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10" />

                <DialogDescription className="sr-only">Form to add or edit a flashcard</DialogDescription>

                <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-0">

                    {/* Top Section: Header with ornate styling - pr-12 gives space for close button */}
                    <div className="px-8 pr-14 pt-8 pb-6 bg-gradient-to-b from-amber-600/5 to-transparent dark:from-amber-400/5 relative border-b border-amber-700/20 dark:border-amber-600/15">

                        {/* Header Row */}
                        <div className="flex justify-between items-center mb-6">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                                    <span className="w-4 h-px bg-amber-600/40" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Scroll size={16} className="text-amber-500/70" />
                                    <span className="font-serif text-base tracking-[0.15em] text-amber-700 dark:text-amber-400/90 uppercase">
                                        {initialCard ? "Edit Entry" : "New Entry"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-px bg-amber-600/40" />
                                    <span className="w-2 h-2 rotate-45 border border-amber-600/60" />
                                </div>
                            </DialogTitle>

                            {/* Auto-Fill Button - Genshin Style */}
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isGenerating || !form.sentence}
                                className={cn(
                                    "group relative flex items-center gap-2.5 px-4 py-2",
                                    "border border-amber-600/40 hover:border-amber-500/60",
                                    "bg-amber-600/5 hover:bg-amber-600/15",
                                    "transition-all duration-200",
                                    "disabled:opacity-40 disabled:cursor-not-allowed",
                                    isGenerating && "animate-border-flow"
                                )}
                            >
                                {/* Button corner accents */}
                                <span className="absolute -top-px -left-px w-2 h-2">
                                    <span className="absolute top-0 left-0 w-full h-px bg-amber-500/60" />
                                    <span className="absolute top-0 left-0 h-full w-px bg-amber-500/60" />
                                </span>
                                <span className="absolute -bottom-px -right-px w-2 h-2">
                                    <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/60" />
                                    <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/60" />
                                </span>

                                <Sparkles size={14} className={cn(
                                    "transition-all duration-200",
                                    isGenerating ? "text-amber-400 animate-pulse" : "text-amber-500/80 group-hover:text-amber-500"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-ui font-semibold uppercase tracking-[0.15em]",
                                    isGenerating ? "text-amber-400" : "text-amber-600 dark:text-amber-400/80 group-hover:text-amber-500"
                                )}>
                                    {isGenerating ? "Analyzing..." : "Auto-Fill"}
                                </span>
                            </button>
                        </div>

                        {/* Sentence Input Area */}
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                placeholder="Type your sentence here..."
                                className="w-full text-2xl md:text-3xl font-light bg-transparent border-none outline-none placeholder:text-amber-700/20 dark:placeholder:text-amber-400/15 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground min-h-[80px]"
                                value={form.sentence}
                                onChange={e => setForm({ ...form, sentence: e.target.value })}
                                rows={1}
                                style={{ fieldSizing: 'content' } as any}
                            />
                            {HighlightedPreview}
                        </div>
                    </div>

                    {/* Ornate Divider */}
                    <DiamondDivider className="mx-8 my-1" />

                    {/* Bottom Section: Form Fields with Genshin styling */}
                    <div className="px-8 py-6 space-y-6 bg-card">

                        {/* Translation & Target Word Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Translation Field */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <Languages size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Translation
                                </label>
                                <input
                                    value={form.translation}
                                    onChange={e => setForm({ ...form, translation: e.target.value })}
                                    placeholder="e.g., This is a house."
                                    className="w-full bg-transparent border-b-2 border-amber-700/20 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>

                            {/* Target Word Field */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <BookOpen size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Target Word
                                </label>
                                <input
                                    value={form.targetWord}
                                    onChange={e => setForm({ ...form, targetWord: e.target.value })}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/20 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Target Word Translation & Part of Speech Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Target Word Translation */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <PenLine size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Word Translation
                                </label>
                                <input
                                    value={form.targetWordTranslation}
                                    onChange={e => setForm({ ...form, targetWordTranslation: e.target.value })}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/20 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                                />
                            </div>

                            {/* Part of Speech */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <Tag size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Part of Speech
                                </label>
                                <select
                                    value={form.targetWordPartOfSpeech}
                                    onChange={e => setForm({ ...form, targetWordPartOfSpeech: e.target.value })}
                                    className="w-full bg-card border-b-2 border-amber-700/20 dark:border-amber-600/15 p-2 text-lg font-light text-foreground focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
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

                        {/* Context Notes */}
                        <div className="space-y-3 group">
                            <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                <FileText size={12} className="opacity-70" />
                                <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                Context Notes
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Add any usage notes or context..."
                                className="w-full bg-transparent border-b-2 border-amber-700/20 dark:border-amber-600/15 p-2 text-base font-light text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-amber-500/50 transition-colors resize-none min-h-[60px]"
                            />
                        </div>

                        {/* Submit Button - Genshin Primary Button Style */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="group relative inline-flex items-center gap-3 bg-amber-600/15 hover:bg-amber-600/25 active:bg-amber-600/35 text-amber-700 dark:text-amber-400 border-2 border-amber-600/50 hover:border-amber-500/70 px-8 py-3.5 transition-all duration-200"
                            >
                                {/* Button corner accents */}
                                <span className="absolute -top-0.5 -left-0.5 w-3 h-3">
                                    <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />
                                    <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500" />
                                </span>
                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3">
                                    <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500" />
                                    <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500" />
                                </span>
                                <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3">
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500" />
                                    <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500" />
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
                                    <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500" />
                                    <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500" />
                                </span>

                                {/* Diamond accent */}
                                <span className="w-1.5 h-1.5 rotate-45 bg-amber-500/70 group-hover:bg-amber-500 transition-colors" />

                                <span className="text-[11px] font-serif font-semibold uppercase tracking-[0.2em]">
                                    Save Entry
                                </span>
                                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
