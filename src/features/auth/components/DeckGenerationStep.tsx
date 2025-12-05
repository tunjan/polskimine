import React, { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from "framer-motion";
import { Difficulty, Language, LanguageId } from '@/types';
import { cn } from '@/lib/utils';
import { GameButton, GameInput, GameLoader } from '@/components/ui/game-ui';

interface DeckGenerationStepProps {
    language: Language;
    proficiencyLevel: Difficulty;
    onComplete: (useAI: boolean, apiKey?: string) => Promise<void>;
}

type DeckOption = 'ai' | 'default' | null;

export const DeckGenerationStep: React.FC<DeckGenerationStepProps> = ({
    language,
    proficiencyLevel,
    onComplete,
}) => {
    const [selectedOption, setSelectedOption] = useState<DeckOption>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (selectedOption === 'ai' && !apiKey.trim()) {
            setError('Please enter your Gemini API key');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onComplete(selectedOption === 'ai', selectedOption === 'ai' ? apiKey : undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to complete setup');
            setLoading(false);
        }
    };

    const getLanguagePrompt = (lang: Language) => {
        switch (lang) {
            case LanguageId.Polish:
                return "Generate a starter deck for learning Polish (A1 level). Include basic greetings, numbers, and essential verbs.";
            case LanguageId.Norwegian:
                return "Generate a starter deck for learning Norwegian (Bokmål). Include common phrases and daily vocabulary.";
            case LanguageId.Japanese:
                return "Generate a starter deck for learning Japanese (N5 level). Include hiragana/katakana basics and simple kanji.";
            case LanguageId.Spanish:
                return "Generate a starter deck for learning Spanish (A1 level). Include essential travel phrases and core vocabulary.";
            default:
                return "Generate a starter deck for learning this language.";
        }
    };
    const languageName = language === LanguageId.Norwegian ? 'Norwegian' :
        (language === LanguageId.Japanese ? 'Japanese' :
            (language === LanguageId.Spanish ? 'Spanish' : 'Polish'));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs font-ui text-muted-foreground uppercase tracking-wider">
                    Choose how to start learning {languageName} at {proficiencyLevel} level.
                </p>
            </div>

            {/* Options */}
            <div className="grid gap-3">
                {/* AI Generated Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('ai')}
                    disabled={loading}
                    className={cn(
                        'group relative w-full text-left p-4 border-2 transition-all duration-200',
                        'hover:bg-amber-400/5 hover:border-amber-400/30 disabled:opacity-50',
                        selectedOption === 'ai'
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-border/40 bg-card'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-amber-400/10 border border-amber-400/20 rotate-45 flex items-center justify-center">
                            <Sparkles size={16} className="text-amber-400 -rotate-45" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-ui font-bold uppercase tracking-wider",
                                selectedOption === 'ai' ? "text-amber-400" : "text-foreground"
                            )}>
                                AI-Generated Deck
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                Generate 50 personalized flashcards using Gemini AI, tailored to {proficiencyLevel} level.
                                Requires your API key.
                            </p>
                        </div>
                    </div>

                    {selectedOption === 'ai' && (
                        <>
                            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                        </>
                    )}
                </button>

                {/* Default Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('default')}
                    disabled={loading}
                    className={cn(
                        'group relative w-full text-left p-4 border-2 transition-all duration-200',
                        'hover:bg-amber-400/5 hover:border-amber-400/30 disabled:opacity-50',
                        selectedOption === 'default'
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-border/40 bg-card'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-amber-400/10 border border-amber-400/20 rotate-45 flex items-center justify-center">
                            <BookOpen size={16} className="text-amber-400 -rotate-45" />
                        </div>
                        <div className="flex-1 space-y-1 ml-2">
                            <div className={cn(
                                "text-sm font-ui font-bold uppercase tracking-wider",
                                selectedOption === 'default' ? "text-amber-400" : "text-foreground"
                            )}>
                                Standard Course
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                Start with our curated beginner deck. Best for getting started quickly.
                            </p>
                        </div>
                    </div>

                    {selectedOption === 'default' && (
                        <>
                            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
                            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
                            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
                        </>
                    )}
                </button>
            </div>

            {/* API Key Input */}
            {selectedOption === 'ai' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <GameInput
                        label="Gemini API Key"
                        type="password"
                        placeholder="Enter your API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        error={error}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Your key is stored locally and only used for deck generation.
                    </p>
                </div>
            )}

            {/* Action Button */}
            {selectedOption && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <GameButton
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <GameLoader size="sm" />
                        ) : (
                            selectedOption === 'ai' ? 'Generate Deck' : 'Start Learning'
                        )}
                    </GameButton>
                </div>
            )}
        </div>
    );
};

