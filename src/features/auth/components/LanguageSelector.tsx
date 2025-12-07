import React from 'react';
import { Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LanguageSelectorProps {
    selectedLanguages: Language[];
    onToggle: (lang: Language) => void;
    onContinue: () => void;
}

const LANGUAGES: { id: Language; name: string; flag: string }[] = [
    { id: LanguageId.Polish, name: "Polish", flag: "🇵🇱" },
    { id: LanguageId.Norwegian, name: "Norwegian", flag: "🇳🇴" },
    { id: LanguageId.Japanese, name: "Japanese", flag: "🇯🇵" },
    { id: LanguageId.Spanish, name: "Spanish", flag: "🇪🇸" },
    { id: LanguageId.German, name: "German", flag: "🇩🇪" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguages,
    onToggle,
    onContinue,
}) => {
    const isSelected = (id: Language) => selectedLanguages.includes(id);
    const canContinue = selectedLanguages.length > 0;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                    Select the languages you want to learn.
                </p>
            </div>

            <div className="grid gap-3">
                {LANGUAGES.map(({ id, name, flag }) => (
                    <div key={id}>
                        <Label
                            htmlFor={id}
                            className={cn(
                                'flex items-center justify-between w-full p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50',
                                isSelected(id)
                                    ? 'border-primary bg-primary/10'
                                    : 'border-input bg-card'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{flag}</span>
                                <span className="font-medium text-foreground">
                                    {name}
                                </span>
                            </div>

                            <Checkbox
                                id={id}
                                checked={isSelected(id)}
                                onCheckedChange={() => onToggle(id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                        </Label>
                    </div>
                ))}
            </div>

            {canContinue && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Button onClick={onContinue} className="w-full">
                        Continue ({selectedLanguages.length} selected)
                    </Button>
                </div>
            )}
        </div>
    );
};
