import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface LanguageLevelSelectorProps {
    selectedLevel: Difficulty | null;
    onSelectLevel: (level: Difficulty) => void;
}

const LEVELS: { level: Difficulty; name: string; description: string }[] = [
    { level: 'A1', name: 'Beginner', description: 'Basic phrases, greetings, simple present tense' },
    { level: 'A2', name: 'Elementary', description: 'Everyday expressions, simple past, basic questions' },
    { level: 'B1', name: 'Intermediate', description: 'Connected text, express opinions, common idioms' },
    { level: 'B2', name: 'Upper Intermediate', description: 'Complex topics, abstract ideas, nuanced expressions' },
    { level: 'C1', name: 'Advanced', description: 'Sophisticated vocabulary, idiomatic expressions' },
    { level: 'C2', name: 'Mastery', description: 'Near-native fluency, literary expressions' },
];

export const LanguageLevelSelector: React.FC<LanguageLevelSelectorProps> = ({
    selectedLevel,
    onSelectLevel,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <RadioGroup
                value={selectedLevel || ""}
                onValueChange={(value) => onSelectLevel(value as Difficulty)}
                className="grid gap-3"
            >
                {LEVELS.map(({ level, name, description }) => (
                    <div key={level}>
                        <RadioGroupItem value={level} id={level} className="peer sr-only" />
                        <Label
                            htmlFor={level}
                            className={cn(
                                "flex items-start gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                selectedLevel === level && "border-primary bg-primary/5"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary",
                                selectedLevel === level ? "bg-primary text-primary-foreground" : "opacity-0"
                            )}>
                                <Check className="h-3 w-3" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed font-normal">
                                    {description}
                                </p>
                            </div>
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
};

