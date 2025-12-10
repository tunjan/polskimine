import React from "react";
import { Difficulty, Language, LANGUAGE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageLevelSelectorProps {
  selectedLanguages: Language[];
  selectedLevels: Record<Language, Difficulty>;
  onSelectLevel: (language: Language, level: Difficulty) => void;
}

const LEVELS: { level: Difficulty; name: string }[] = [
  { level: "A1", name: "Beginner" },
  { level: "A2", name: "Elementary" },
  { level: "B1", name: "Intermediate" },
  { level: "B2", name: "Upper Int." },
  { level: "C1", name: "Advanced" },
  { level: "C2", name: "Mastery" },
];

export const LanguageLevelSelector: React.FC<LanguageLevelSelectorProps> = ({
  selectedLanguages,
  selectedLevels,
  onSelectLevel,
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Select your proficiency for each language.
        </p>
      </div>

      <div className="grid gap-4">
        {selectedLanguages.map((language) => (
          <div
            key={language}
            className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium leading-none">
                {LANGUAGE_LABELS[language]}
              </span>
            </div>
            <div className="">
              <Select
                value={selectedLevels[language]}
                onValueChange={(value) =>
                  onSelectLevel(language, value as Difficulty)
                }
              >
                <SelectTrigger id={`level-${language}`}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(({ level, name }) => (
                    <SelectItem key={level} value={level}>
                      <span className="font-medium mr-2">{level}</span>
                      <span className="text-muted-foreground text-xs">
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
