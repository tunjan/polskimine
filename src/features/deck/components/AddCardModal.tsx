import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles, Scroll, BookOpen, PenLine, Languages, Tag, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/features/deck/services/ai";
import { escapeRegExp, parseFurigana, cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Button } from "@/components/ui/button";
import { OrnateSeparator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (card: Card) => void;
    initialCard?: Card;
}

const formSchema = z.object({
    sentence: z.string().min(1, "Sentence is required"),
    targetWord: z.string().optional(),
    targetWordTranslation: z.string().optional(),
    targetWordPartOfSpeech: z.string().optional(),
    translation: z.string().min(1, "Translation is required"),
    notes: z.string().optional(),
    furigana: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.targetWord && data.sentence) {
        try {
            if (!data.sentence.toLowerCase().includes(data.targetWord.toLowerCase())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Target word provided but not found in sentence",
                    path: ["targetWord"],
                });
            }
        } catch (e) {
            // Fallback
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd, initialCard }) => {
    const settings = useSettingsStore(s => s.settings);
    const [isGenerating, setIsGenerating] = useState(false);
    const isMounted = React.useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasOpen = useRef(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sentence: "",
            targetWord: "",
            targetWordTranslation: "",
            targetWordPartOfSpeech: "",
            translation: "",
            notes: "",
            furigana: ""
        }
    });

    // Watch values for preview
    const watchedSentence = watch("sentence");
    const watchedTargetWord = watch("targetWord");

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            if (initialCard) {
                reset({
                    sentence: initialCard.targetSentence,
                    targetWord: initialCard.targetWord || "",
                    targetWordTranslation: initialCard.targetWordTranslation || "",
                    targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
                    translation: initialCard.nativeTranslation,
                    notes: initialCard.notes,
                    furigana: initialCard.furigana || ""
                });
            } else {
                reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
            }

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                }
            }, 100);
        }
        wasOpen.current = isOpen;
    }, [isOpen, initialCard, settings.language, reset]);

    const handleAutoFill = async () => {
        const currentSentence = watch("sentence");
        if (!currentSentence) return;
        if (!settings.geminiApiKey) {
            toast.error("Please add your Gemini API Key in Settings > General");
            return;
        }
        setIsGenerating(true);
        try {
            const targetLanguage = initialCard?.language || settings.language;
            const result = await aiService.generateCardContent(currentSentence, targetLanguage, settings.geminiApiKey);

            if (isMounted.current) {
                if (targetLanguage === LanguageId.Japanese && result.furigana) {
                    setValue("sentence", result.furigana);
                }

                setValue("translation", result.translation);
                if (result.targetWord) setValue("targetWord", result.targetWord);
                if (result.targetWordTranslation) setValue("targetWordTranslation", result.targetWordTranslation);
                if (result.targetWordPartOfSpeech) setValue("targetWordPartOfSpeech", result.targetWordPartOfSpeech);
                setValue("notes", result.notes);
                if (result.furigana) setValue("furigana", result.furigana);

                toast.success("Content generated");
            }
        } catch (e: any) {
            console.error("Auto-fill error:", e);
            if (isMounted.current) toast.error(e.message || "Generation failed");
        } finally {
            if (isMounted.current) setIsGenerating(false);
        }
    };

    const onSubmit = (data: FormValues) => {
        const cardBase = initialCard || { id: uuidv4(), status: "new", interval: 0, easeFactor: 2.5, dueDate: new Date().toISOString(), reps: 0, lapses: 0 } as Card;

        const targetLanguage = initialCard?.language || settings.language;
        let targetSentence = data.sentence;
        let furigana = data.furigana || undefined;

        if (targetLanguage === LanguageId.Japanese) {
            furigana = data.sentence;
            targetSentence = parseFurigana(data.sentence).map(s => s.text).join("");
        }

        const newCard: Card = {
            ...cardBase,
            targetSentence: targetSentence,
            targetWord: data.targetWord || undefined,
            targetWordTranslation: data.targetWordTranslation || undefined,
            targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
            nativeTranslation: data.translation,
            notes: data.notes,
            furigana: furigana,
            language: targetLanguage
        };
        onAdd(newCard);
        reset({ sentence: "", targetWord: "", targetWordTranslation: "", targetWordPartOfSpeech: "", translation: "", notes: "", furigana: "" });
        onClose();
    };


    const HighlightedPreview = useMemo(() => {
        if (!watchedSentence) return null;

        const targetLanguage = initialCard?.language || settings.language;

        if (targetLanguage === LanguageId.Japanese) {
            const segments = parseFurigana(watchedSentence);
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {segments.map((segment, i) => {
                        const isTarget = watchedTargetWord && segment.text === watchedTargetWord;
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

        if (!watchedTargetWord) return null;
        try {
            const parts = watchedSentence.split(new RegExp(`(${escapeRegExp(watchedTargetWord)})`, "gi"));
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {parts.map((part, i) => part.toLowerCase() === watchedTargetWord.toLowerCase() ? <span key={i} className="text-amber-500 font-normal border-b-2 border-amber-500/50 pb-0.5">{part}</span> : <span key={i}>{part}</span>)}
                </div>
            );
        } catch (e) {
            return (
                <div className="mt-4 text-xl font-light text-amber-600/60 dark:text-amber-200/50 select-none">
                    {watchedSentence}
                </div>
            );
        }
    }, [watchedSentence, watchedTargetWord, settings.language, initialCard]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 bg-card border-2 border-amber-700/30 dark:border-amber-600/25 gap-0 overflow-hidden animate-genshin-fade-in [&>button]:z-30 [&>button]:right-5 [&>button]:top-5">

                {/* Ornate Corner Decorations removed */}

                {/* Inner decorative frame removed */}

                <DialogDescription className="sr-only">Form to add or edit a flashcard</DialogDescription>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full relative z-0">

                    {/* Top Section: Header with ornate styling - pr-12 gives space for close button */}
                    <div className="px-8 pr-14 pt-8 pb-6 bg-linear-to-br from-amber-600/10 via-transparent to-transparent dark:from-amber-400/10">

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
                            <Button
                                type="button"
                                onClick={handleAutoFill}
                                disabled={isGenerating || !watchedSentence}
                                variant="secondary"
                                className={cn(
                                    "gap-2.5",
                                    isGenerating && "opacity-80"
                                )}
                            >
                                <Sparkles size={14} className={cn(
                                    "transition-all duration-200",
                                    isGenerating ? "animate-pulse" : ""
                                )} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider">
                                    {isGenerating ? "Analyzing..." : "Auto-Fill"}
                                </span>
                            </Button>
                        </div>

                        {/* Sentence Input Area */}
                        <div className="relative">
                            <textarea
                                {...register("sentence")}
                                ref={(e) => {
                                    register("sentence").ref(e);
                                    // @ts-ignore
                                    textareaRef.current = e;
                                }}
                                placeholder="Type your sentence here..."
                                className="w-full text-2xl md:text-3xl font-light bg-transparent border-none outline-none placeholder:text-amber-700/40 dark:placeholder:text-amber-400/15 resize-none overflow-hidden p-0 leading-tight tracking-tight text-foreground min-h-[80px]"
                                rows={1}
                                style={{ fieldSizing: 'content' } as any}
                            />
                            {errors.sentence && <span className="text-red-500 text-sm mt-1">{errors.sentence.message}</span>}
                            {HighlightedPreview}
                        </div>
                    </div>

                    {/* Ornate Divider */}
                    <OrnateSeparator className="mx-8 my-1" />

                    {/* Bottom Section: Form Fields with Genshin styling */}
                    <div className="px-8 py-6 space-y-6 bg-linear-to-tl from-amber-600/10 via-transparent to-transparent dark:from-amber-400/10">

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
                                    {...register("translation")}
                                    placeholder="e.g., This is a house."
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
                                />
                                {errors.translation && <span className="text-red-500 text-xs">{errors.translation.message}</span>}
                            </div>

                            {/* Target Word Field */}
                            <div className="space-y-3 group">
                                <label className="flex items-center gap-2.5 text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-amber-700/50 dark:text-amber-400/50 group-focus-within:text-amber-600 dark:group-focus-within:text-amber-400 transition-colors">
                                    <BookOpen size={12} className="opacity-70" />
                                    <span className="w-1 h-1 rotate-45 bg-amber-600/30 group-focus-within:bg-amber-500/60 transition-colors" />
                                    Target Word
                                </label>
                                <input
                                    {...register("targetWord")}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
                                />
                                {errors.targetWord && <span className="text-red-500 text-xs">{errors.targetWord.message}</span>}
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
                                    {...register("targetWordTranslation")}
                                    placeholder="e.g., house"
                                    className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-800/50 transition-colors"
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
                                    {...register("targetWordPartOfSpeech")}
                                    className="w-full bg-card border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-lg font-light text-foreground focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
                                >
                                    <option value="">Select POS</option>
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
                                {...register("notes")}
                                placeholder="Add any usage notes or context..."
                                className="w-full bg-transparent border-b-2 border-amber-700/50 dark:border-amber-600/15 p-2 text-base font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 transition-colors resize-none min-h-[60px]"
                            />
                        </div>

                        {/* Submit Button - Genshin Primary Button Style */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                variant="default"
                                className="gap-3"
                            >
                                <span>Save Entry</span>
                                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
