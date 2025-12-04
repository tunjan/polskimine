import React from 'react';
import { Check } from 'lucide-react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

// Component for selecting language proficiency level
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
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    This helps us create appropriate content for you.
                </p>
            </div>

            <div className="grid gap-3">
                {LEVELS.map(({ level, name, description }) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onSelectLevel(level)}
                        className={cn(
                            'group relative w-full text-left p-4 border-2 transition-all duration-200',
                            'hover:bg-amber-500/5 hover:border-amber-500/30',
                            selectedLevel === level
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-border/40 bg-card'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 w-5 h-5 flex items-center justify-center transition-colors rotate-45 border',
                                    selectedLevel === level
                                        ? 'border-amber-500 bg-amber-500'
                                        : 'border-muted-foreground/30 group-hover:border-amber-500/50'
                                )}
                            >
                                {selectedLevel === level && (
                                    <Check size={12} className="text-background -rotate-45" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        "text-sm font-ui font-bold uppercase tracking-wider",
                                        selectedLevel === level ? "text-amber-500" : "text-foreground"
                                    )}>
                                        {level}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>
                        
                        {/* Corner accents for selected item */}
                        {selectedLevel === level && (
                            <>
                                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-500" />
                                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-500" />
                                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-500" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-500" />
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

