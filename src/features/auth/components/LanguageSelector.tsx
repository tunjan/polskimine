import React from 'react';
import { Check } from 'lucide-react';
import { Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { LANGUAGE_NAMES } from '@/constants';

interface LanguageSelectorProps {
    selectedLanguage: Language | null;
    onSelect: (lang: Language) => void;
}

const LANGUAGES: { id: Language; name: string; flag: string }[] = [
    { id: LanguageId.Polish, name: "Polish", flag: "🇵🇱" },
    { id: LanguageId.Norwegian, name: "Norwegian", flag: "🇳🇴" },
    { id: LanguageId.Japanese, name: "Japanese", flag: "🇯🇵" },
    { id: LanguageId.Spanish, name: "Spanish", flag: "🇪🇸" },
    { id: LanguageId.German, name: "German", flag: "🇩🇪" },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onSelect,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    Select the language you want to learn.
                </p>
            </div>

            <div className="grid gap-3">
                {LANGUAGES.map(({ id, name, flag }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={cn(
                            'group relative w-full text-left p-4 border-2 transition-all duration-200',
                            'hover:bg-amber-400/5 hover:border-amber-400/30',
                            selectedLanguage === id
                                ? 'border-amber-400 bg-amber-400/10'
                                : 'border-border/40 bg-card'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 w-5 h-5 flex items-center justify-center transition-colors rotate-45 border',
                                    selectedLanguage === id
                                        ? 'border-amber-400 bg-amber-400'
                                        : 'border-muted-foreground/30 group-hover:border-amber-400/50'
                                )}
                            >
                                {selectedLanguage === id && (
                                    <Check size={12} className="text-background -rotate-45" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg">{flag}</span>
                                    <span className={cn(
                                        "text-sm font-ui font-bold uppercase tracking-wider",
                                        selectedLanguage === id ? "text-amber-400" : "text-foreground"
                                    )}>
                                        {name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Corner accents for selected item */}
                        {selectedLanguage === id && (
                            <>
                                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
