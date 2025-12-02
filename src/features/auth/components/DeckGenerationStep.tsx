import React, { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { ButtonLoader } from '@/components/ui/game-ui';
import { Difficulty, Language } from '@/types';
import clsx from 'clsx';

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

    const languageName = language === 'norwegian' ? 'Norwegian' :
        (language === 'japanese' ? 'Japanese' :
            (language === 'spanish' ? 'Spanish' : 'Polish'));

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-light tracking-tight text-foreground">
                    Initialize your deck.
                </h2>
                <p className="text-xs font-mono text-muted-foreground">
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
                    className={clsx(
                        'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                        'hover:bg-secondary/30 disabled:opacity-50',
                        selectedOption === 'ai'
                            ? 'border-foreground bg-secondary/20'
                            : 'border-border/40'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-foreground/10 rounded-[2px] flex items-center justify-center">
                            <Sparkles size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-sm font-mono font-medium text-foreground">
                                AI-Generated Deck
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Generate 50 personalized flashcards using Gemini AI, tailored to {proficiencyLevel} level.
                                Requires your API key.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Default Deck */}
                <button
                    type="button"
                    onClick={() => setSelectedOption('default')}
                    disabled={loading}
                    className={clsx(
                        'group relative w-full text-left p-4 border rounded-[2px] transition-all',
                        'hover:bg-secondary/30 disabled:opacity-50',
                        selectedOption === 'default'
                            ? 'border-foreground bg-secondary/20'
                            : 'border-border/40'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 bg-foreground/10 rounded-[2px] flex items-center justify-center">
                            <BookOpen size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-sm font-mono font-medium text-foreground">
                                Default Beginner Course
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Start with our curated beginner deck. No API key needed. You can generate custom cards later.
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* API Key Input (shown only if AI option selected) */}
            {selectedOption === 'ai' && (
                <div className="group relative animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="absolute -top-3 left-0 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-foreground">
                        Gemini API Key
                    </label>
                    <input
                        className="w-full bg-transparent border-b border-border py-2 text-sm outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none font-mono"
                        placeholder="AIza..."
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setError('');
                        }}
                        disabled={loading}
                    />
                    <p className="mt-2 text-[10px] text-muted-foreground font-mono">
                        Your API key will be saved securely and synced across all your devices.
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-[2px]">
                    <p className="text-xs text-destructive font-mono">{error}</p>
                </div>
            )}

            {/* Continue Button */}
            <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedOption || loading}
                className="w-full h-11 bg-foreground text-background text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3 rounded-[2px]"
            >
                {loading ? (
                    <>
                        <ButtonLoader />
                        {selectedOption === 'ai' ? 'Generating...' : 'Setting up...'}
                    </>
                ) : (
                    'Continue'
                )}
            </button>

            {loading && selectedOption === 'ai' && (
                <p className="text-center text-[10px] text-muted-foreground font-mono animate-pulse">
                    This may take 20-30 seconds...
                </p>
            )}
        </div>
    );
};
