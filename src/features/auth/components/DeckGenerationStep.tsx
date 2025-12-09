import React, { useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Difficulty, Language, LanguageId, LANGUAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { ButtonLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeckGenerationStepProps {
  languages: Language[];
  proficiencyLevel: Difficulty;
  onComplete: (
    languages: Language[],
    useAI: boolean,
    apiKey?: string,
  ) => Promise<void>;
}

type DeckOption = "ai" | "default" | null;

export const DeckGenerationStep: React.FC<DeckGenerationStepProps> = ({
  languages,
  proficiencyLevel,
  onComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<DeckOption>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (selectedOption === "ai" && !apiKey.trim()) {
      setError("Please enter your Gemini API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onComplete(
        languages,
        selectedOption === "ai",
        selectedOption === "ai" ? apiKey : undefined,
      );
    } catch (err: any) {
      setError(err.message || "Failed to complete setup");
      setLoading(false);
    }
  };

  const languageNames = languages
    .map((lang) => LANGUAGE_LABELS[lang] || lang)
    .join(", ");
  const languageCount = languages.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs  text-muted-foreground uppercase tracking-wider">
          Choose how to start learning{" "}
          {languageCount > 1 ? `${languageCount} languages` : languageNames} at{" "}
          {proficiencyLevel} level.
        </p>
        {languageCount > 1 && (
          <p className="text-xs text-muted-foreground/70">
            Selected: {languageNames}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSelectedOption("ai")}
          disabled={loading}
          className={cn(
            "group relative w-full h-auto flex justify-start items-start p-4 text-left",
            selectedOption === "ai"
              ? "border-primary bg-primary/10 hover:bg-primary/20"
              : "",
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div className="flex-1 space-y-1 ml-2">
              <div
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  selectedOption === "ai" ? "text-primary" : "text-foreground",
                )}
              >
                AI-Generated Decks
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                Generate 50 personalized flashcards per language using Gemini
                AI, tailored to {proficiencyLevel} level. Requires your API key.
              </p>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSelectedOption("default")}
          disabled={loading}
          className={cn(
            "group relative w-full h-auto flex justify-start items-start p-4 text-left",
            selectedOption === "default"
              ? "border-primary bg-primary/10 hover:bg-primary/20"
              : "",
          )}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="mt-1 w-8 h-8 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div className="flex-1 space-y-1 ml-2">
              <div
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  selectedOption === "default"
                    ? "text-primary"
                    : "text-foreground",
                )}
              >
                Standard Courses
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal whitespace-normal">
                Start with our curated beginner decks for{" "}
                {languageCount > 1 ? "each language" : "this language"}. Best
                for getting started quickly.
              </p>
            </div>
          </div>
        </Button>
      </div>

      {selectedOption === "ai" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <Label
              htmlFor="apiKey"
              className="text-xs font-medium text-muted-foreground  uppercase tracking-wider ml-1"
            >
              Gemini API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {error && <p className="text-destructive text-xs ml-1">{error}</p>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Your key is stored locally and only used for deck generation.
          </p>
        </div>
      )}

      {selectedOption && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <ButtonLoader />
            ) : selectedOption === "ai" ? (
              `Generate ${languageCount} Deck${languageCount > 1 ? "s" : ""}`
            ) : (
              "Start Learning"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
