import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { ButtonLoader } from '@/components/game';

interface SelectionMenuProps {
    top: number;
    left: number;
    onAnalyze: () => void;
    onGenerateCard?: () => void;
    isAnalyzing: boolean;
    isGeneratingCard: boolean;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
    top,
    left,
    onAnalyze,
    onGenerateCard,
    isAnalyzing,
    isGeneratingCard
}) => {
    return (
        <div
            className="fixed z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300 flex gap-1"
            style={{ top, left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button
                onClick={onAnalyze}
                disabled={isAnalyzing || isGeneratingCard}
                className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
            >
                {/* Corner accents */}
                <span className="absolute -top-px -left-px w-2 h-2">
                    <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                    <span className="absolute top-0 left-0 h-full w-px bg-primary" />
                </span>
                <span className="absolute -bottom-px -right-px w-2 h-2">
                    <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                    <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
                </span>
                {isAnalyzing ? <ButtonLoader /> : <Sparkles size={11} strokeWidth={2} className="text-primary" />}
                <span>Analyze</span>
            </button>

            {onGenerateCard && (
                <button
                    onClick={onGenerateCard}
                    disabled={isAnalyzing || isGeneratingCard}
                    className="relative bg-card text-foreground px-5 py-2.5 border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-[10px] font-ui font-medium uppercase tracking-[0.15em] flex items-center gap-2.5"
                >
                    {/* Corner accents */}
                    <span className="absolute -top-px -left-px w-2 h-2">
                        <span className="absolute top-0 left-0 w-full h-px bg-primary" />
                        <span className="absolute top-0 left-0 h-full w-px bg-primary" />
                    </span>
                    <span className="absolute -bottom-px -right-px w-2 h-2">
                        <span className="absolute bottom-0 right-0 w-full h-px bg-primary" />
                        <span className="absolute bottom-0 right-0 h-full w-px bg-primary" />
                    </span>
                    {isGeneratingCard ? <ButtonLoader /> : <Plus size={11} strokeWidth={2} className="text-primary" />}
                    <span>Create Card</span>
                </button>
            )}
        </div>
    );
};
