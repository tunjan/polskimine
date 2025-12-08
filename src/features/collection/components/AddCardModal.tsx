import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, LanguageId } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { aiService } from "@/lib/ai";
import { escapeRegExp, parseFurigana } from "@/lib/utils";
import { useSettingsStore, SettingsState } from "@/stores/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
  initialCard?: Card;
}

const formSchema = z
  .object({
    sentence: z.string().min(1, "Sentence is required"),
    targetWord: z.string().optional(),
    targetWordTranslation: z.string().optional(),
    targetWordPartOfSpeech: z.string().optional(),
    translation: z.string().min(1, "Translation is required"),
    notes: z.string().optional(),
    furigana: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetWord && data.sentence) {
      try {
        if (
          !data.sentence.toLowerCase().includes(data.targetWord.toLowerCase())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Target word provided but not found in sentence",
            path: ["targetWord"],
          });
        }
      } catch (e) {}
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialCard,
}) => {
  const { language, geminiApiKey } = useSettingsStore(
    useShallow((s: SettingsState) => ({
      language: s.language,
      geminiApiKey: s.geminiApiKey,
    })),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const isMounted = React.useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sentence: "",
      targetWord: "",
      targetWordTranslation: "",
      targetWordPartOfSpeech: "",
      translation: "",
      notes: "",
      furigana: "",
    },
  });

  const watchedSentence = form.watch("sentence");
  const watchedTargetWord = form.watch("targetWord");

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      if (initialCard) {
        form.reset({
          sentence: initialCard.targetSentence,
          targetWord: initialCard.targetWord || "",
          targetWordTranslation: initialCard.targetWordTranslation || "",
          targetWordPartOfSpeech: initialCard.targetWordPartOfSpeech || "",
          translation: initialCard.nativeTranslation,
          notes: initialCard.notes,
          furigana: initialCard.furigana || "",
        });
      } else {
        form.reset({
          sentence: "",
          targetWord: "",
          targetWordTranslation: "",
          targetWordPartOfSpeech: "",
          translation: "",
          notes: "",
          furigana: "",
        });
      }

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length,
          );
        }
      }, 100);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialCard, language, form.reset]);

  const handleAutoFill = async () => {
    const currentSentence = form.watch("sentence");
    if (!currentSentence) return;
    if (!geminiApiKey) {
      toast.error("Please add your Gemini API Key in Settings > General");
      return;
    }
    setIsGenerating(true);
    try {
      const targetLanguage = initialCard?.language || language;
      const result = await aiService.generateCardContent(
        currentSentence,
        targetLanguage,
        geminiApiKey,
      );

      if (isMounted.current) {
        if (targetLanguage === LanguageId.Japanese && result.furigana) {
          form.setValue("sentence", result.furigana);
        }

        form.setValue("translation", result.translation);
        if (result.targetWord) form.setValue("targetWord", result.targetWord);
        if (result.targetWordTranslation)
          form.setValue("targetWordTranslation", result.targetWordTranslation);
        if (result.targetWordPartOfSpeech)
          form.setValue(
            "targetWordPartOfSpeech",
            result.targetWordPartOfSpeech,
          );
        form.setValue("notes", result.notes);
        if (result.furigana) form.setValue("furigana", result.furigana);

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
    const cardBase =
      initialCard ||
      ({
        id: uuidv4(),
        status: "new",
        interval: 0,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        reps: 0,
        lapses: 0,
      } as Card);

    const targetLanguage = initialCard?.language || language;
    let targetSentence = data.sentence;
    let furigana = data.furigana || undefined;

    if (targetLanguage === LanguageId.Japanese) {
      furigana = data.sentence;
      targetSentence = parseFurigana(data.sentence)
        .map((s) => s.text)
        .join("");
    }

    const newCard: Card = {
      ...cardBase,
      targetSentence: targetSentence,
      targetWord: data.targetWord || undefined,
      targetWordTranslation: data.targetWordTranslation || undefined,
      targetWordPartOfSpeech: data.targetWordPartOfSpeech || undefined,
      nativeTranslation: data.translation,
      notes: data.notes || "",
      furigana: furigana,
      language: targetLanguage,
    };
    onAdd(newCard);
    form.reset({
      sentence: "",
      targetWord: "",
      targetWordTranslation: "",
      targetWordPartOfSpeech: "",
      translation: "",
      notes: "",
      furigana: "",
    });
    onClose();
  };

  const HighlightedPreview = useMemo(() => {
    if (!watchedSentence) return null;

    const targetLanguage = initialCard?.language || language;

    if (targetLanguage === LanguageId.Japanese) {
      const segments = parseFurigana(watchedSentence);
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {segments.map((segment, i) => {
            const isTarget =
              watchedTargetWord && segment.text === watchedTargetWord;
            if (segment.furigana) {
              return (
                <ruby key={i} className="mr-1" style={{ rubyAlign: "center" }}>
                  <span
                    className={
                      isTarget
                        ? "text-primary border-b border-primary/50"
                        : "text-foreground"
                    }
                  >
                    {segment.text}
                  </span>
                  <rt
                    className="text-xs text-muted-foreground select-none text-center"
                    style={{ textAlign: "center" }}
                  >
                    {segment.furigana}
                  </rt>
                </ruby>
              );
            }
            return (
              <span
                key={i}
                className={
                  isTarget ? "text-primary border-b border-primary/50" : ""
                }
              >
                {segment.text}
              </span>
            );
          })}
        </div>
      );
    }

    if (!watchedTargetWord) return null;
    try {
      const parts = watchedSentence.split(
        new RegExp(`(${escapeRegExp(watchedTargetWord)})`, "gi"),
      );
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {parts.map((part, i) =>
            part.toLowerCase() === watchedTargetWord.toLowerCase() ? (
              <span key={i} className="text-primary border-b border-primary/50">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-2 text-lg font-normal text-muted-foreground select-none">
          {watchedSentence}
        </div>
      );
    }
  }, [watchedSentence, watchedTargetWord, language, initialCard]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialCard ? "Edit Card" : "Add New Card"}
          </DialogTitle>
          <DialogDescription>
            Create or modify your flashcard details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-semibold">
                  Native Sentence
                </FormLabel>
                <Button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isGenerating || !watchedSentence}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span className="text-xs">Auto-Fill with AI</span>
                </Button>
              </div>

              <FormField
                control={form.control}
                name="sentence"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Type the sentence in target language..."
                        className="resize-none text-lg min-h-[100px]"
                        ref={(e) => {
                          field.ref(e);
                          textareaRef.current = e as HTMLTextAreaElement;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {HighlightedPreview}
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="translation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Translation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sentence translation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Word</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Word to highlight" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetWordTranslation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Word Definition</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Definition of target word"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetWordPartOfSpeech"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part of Speech</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="noun">Noun</SelectItem>
                        <SelectItem value="verb">Verb</SelectItem>
                        <SelectItem value="adjective">Adjective</SelectItem>
                        <SelectItem value="adverb">Adverb</SelectItem>
                        <SelectItem value="pronoun">Pronoun</SelectItem>
                        <SelectItem value="expression">Expression</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Usage notes, context, or grammar rules"
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Card</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
