import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import clsx from 'clsx';

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
                <h2 className="text-xl font-light tracking-tight text-foreground">
                    Select your proficiency level.
                </h2>
                <p className="text-xs font-mono text-muted-foreground">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <div className="grid gap-3">
                {LEVELS.map(({ level, name, description }) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onSelectLevel(level)}
                        className={clsx(
                            'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                            'hover:bg-secondary/30',
                            selectedLevel === level
                                ? 'border-foreground bg-secondary/20'
                                : 'border-border/40'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={clsx(
                                    'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                    selectedLevel === level
                                        ? 'border-foreground bg-foreground'
                                        : 'border-border group-hover:border-foreground/50'
                                )}
                            >
                                {selectedLevel === level && (
                                    <Check size={12} className="text-background" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-mono font-medium text-foreground">
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
