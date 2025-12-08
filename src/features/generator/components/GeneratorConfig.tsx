import React from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ListFilter,
  GraduationCap,
  Languages,
  Type,
  Loader2,
  Wand2,
  BookOpen,
} from "lucide-react";
import { WordType } from "@/lib/ai";
import { cn } from "@/lib/utils";

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "pronoun", label: "Pronoun" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conj" },
];

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Int.",
  C1: "Advanced",
  C2: "Proficient",
};

const SUGGESTED_TOPICS = [
  "Travel & Directions",
  "Ordering Food",
  "Business Meeting",
  "Daily Routine",
  "Medical Emergency",
  "Job Interview",
];

interface GeneratorConfigProps {
  count: number[];
  setCount: (value: number[]) => void;
  selectedLevel: string;
  setSelectedLevel: (value: string) => void;
  difficultyMode: "beginner" | "immersive";
  setDifficultyMode: (mode: "beginner" | "immersive") => void;
  selectedWordTypes: WordType[];
  toggleWordType: (type: WordType) => void;
  setSelectedWordTypes: (types: WordType[]) => void;
  useLearnedWords: boolean;
  setUseLearnedWords: (value: boolean) => void;
  instructions: string;
  setInstructions: (value: string) => void;
  handleTopicClick: (topic: string) => void;
  generateCards: () => void;
  handleSmartLesson: () => void;
  loading: boolean;
}

const WordTypeBadge = ({
  type,
  selected,
  onClick,
}: {
  type: { value: WordType; label: string };
  selected: boolean;
  onClick: () => void;
}) => (
  <Badge
    variant={selected ? "default" : "outline"}
    className={cn(
      "cursor-pointer transition-all hover:scale-105 active:scale-95 select-none px-3 py-1",
      !selected &&
        "text-muted-foreground hover:text-foreground hover:border-primary/50",
      selected && "bg-primary text-primary-foreground border-primary",
    )}
    onClick={onClick}
  >
    {type.label}
  </Badge>
);

export const GeneratorConfig: React.FC<GeneratorConfigProps> = ({
  count,
  setCount,
  selectedLevel,
  setSelectedLevel,
  difficultyMode,
  setDifficultyMode,
  selectedWordTypes,
  toggleWordType,
  setSelectedWordTypes,
  useLearnedWords,
  setUseLearnedWords,
  instructions,
  setInstructions,
  handleTopicClick,
  generateCards,
  handleSmartLesson,
  loading,
}) => {
  return (
    <div className="h-full flex flex-col sm:flex-row">
      <div className="w-full sm:w-[320px] bg-muted/20 border-r flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <ListFilter className="w-4 h-4" />
                  Quantity
                </Label>
                <Badge variant="secondary" className="font-mono">
                  {count[0]}
                </Badge>
              </div>
              <Slider
                value={count}
                onValueChange={setCount}
                min={3}
                max={50}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                Proficiency Level
              </Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_DESCRIPTIONS).map(([lvl, desc]) => (
                    <SelectItem key={lvl} value={lvl}>
                      <span className="font-bold mr-2 text-primary">{lvl}</span>
                      <span className="text-muted-foreground">{desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-4 h-4" />
                Learning Approach
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDifficultyMode("beginner")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                    difficultyMode === "beginner"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-background hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-semibold mb-1">
                    Zero to Hero
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Single words building up
                  </span>
                </button>
                <button
                  onClick={() => setDifficultyMode("immersive")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all",
                    difficultyMode === "immersive"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-background hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-semibold mb-1">Immersive</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Full natural sentences
                  </span>
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Type className="w-4 h-4" />
                  Word Types
                </Label>
                {selectedWordTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWordTypes([])}
                    className="h-6 text-[10px]"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {WORD_TYPES.map((type) => (
                  <WordTypeBadge
                    key={type.value}
                    type={type}
                    selected={selectedWordTypes.includes(type.value as any)}
                    onClick={() => toggleWordType(type.value as any)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label
                htmlFor="learned-words"
                className="text-sm text-foreground"
              >
                Include Learned Words
              </Label>
              <Switch
                id="learned-words"
                checked={useLearnedWords}
                onCheckedChange={setUseLearnedWords}
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col h-full bg-background">
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              What do you want to learn?
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. I want to learn 20 cooking verbs, or how to ask for directions proficiently..."
              className="min-h-[160px] text-base p-4 resize-none shadow-sm focus-visible:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground text-right">
              {instructions.length} chars
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Suggested Topics
            </Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map((topic) => (
                <Button
                  key={topic}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTopicClick(topic)}
                  className="h-8 text-xs bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/10 flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            className="flex-1 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
            onClick={generateCards}
            disabled={loading || !instructions}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Cards
              </>
            )}
          </Button>

          <div className="relative flex items-center justify-center sm:hidden py-1">
            <span className="text-xs text-muted-foreground bg-background px-2 z-10">
              OR
            </span>
            <Separator className="absolute w-full" />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="sm:w-auto"
            onClick={handleSmartLesson}
            disabled={loading}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Smart Lesson
          </Button>
        </div>
      </div>
    </div>
  );
};
