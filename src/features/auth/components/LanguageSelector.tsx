import React from 'react';
import { Check } from 'lucide-react';
import { Language } from '@/types';
import { cn } from '@/lib/utils';
import { LANGUAGE_NAMES } from '@/constants';

interface LanguageSelectorProps {
    selectedLanguage: Language | null;
    onSelectLanguage: (language: Language) => void;
}

const LANGUAGES: { language: Language; name: string; description: string }[] = [
    { language: 'polish', name: LANGUAGE_NAMES.polish, description: 'Learn the language of Poland.' },
    { language: 'norwegian', name: LANGUAGE_NAMES.norwegian, description: 'Learn the language of Norway.' },
    { language: 'spanish', name: LANGUAGE_NAMES.spanish, description: 'Learn the language of Spain and Latin America.' },
    { language: 'japanese', name: LANGUAGE_NAMES.japanese, description: 'Learn the language of Japan.' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    selectedLanguage,
    onSelectLanguage,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    Select the language you want to learn.
                </p>
            </div>

            <div className="grid gap-3">
                {LANGUAGES.map(({ language, name, description }) => (
                    <button
                        key={language}
                        type="button"
                        onClick={() => onSelectLanguage(language)}
                        className={cn(
                            'group relative w-full text-left p-4 border-2 transition-all duration-200',
                            'hover:bg-amber-400/5 hover:border-amber-400/30',
                            selectedLanguage === language
                                ? 'border-amber-400 bg-amber-400/10'
                                : 'border-border/40 bg-card'
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'mt-0.5 w-5 h-5 flex items-center justify-center transition-colors rotate-45 border',
                                    selectedLanguage === language
                                        ? 'border-amber-400 bg-amber-400'
                                        : 'border-muted-foreground/30 group-hover:border-amber-400/50'
                                )}
                            >
                                {selectedLanguage === language && (
                                    <Check size={12} className="text-background -rotate-45" strokeWidth={3} />
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        "text-sm font-ui font-bold uppercase tracking-wider",
                                        selectedLanguage === language ? "text-amber-400" : "text-foreground"
                                    )}>
                                        {name}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Corner accents for selected item */}
                        {selectedLanguage === language && (
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
