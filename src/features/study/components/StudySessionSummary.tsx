import React from 'react';
import { Target, Zap, Sparkles } from 'lucide-react';

interface StudySessionSummaryProps {
    cardsReviewed: number;
    sessionXp: number;
    sessionStreak: number;
    onComplete?: () => void;
    onExit: () => void;
}

export const StudySessionSummary: React.FC<StudySessionSummaryProps> = ({
    cardsReviewed,
    sessionXp,
    sessionStreak,
    onComplete,
    onExit,
}) => {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center animate-in fade-in duration-1000 overflow-hidden">
            {/* Decorative corner accents - Genshin style */}
            <span className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
                <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/40" />
                <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500/40" />
                <span className="absolute top-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
            </span>
            <span className="absolute top-4 right-4 w-10 h-10 pointer-events-none">
                <span className="absolute top-0 right-0 w-full h-0.5 bg-amber-500/40" />
                <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500/40" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
            </span>
            <span className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none">
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500/40" />
                <span className="absolute bottom-0 left-0 h-full w-0.5 bg-amber-500/40" />
                <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
            </span>
            <span className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none">
                <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500/40" />
                <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500/40" />
                <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rotate-45 bg-amber-500/30" />
            </span>

            <div className="text-center space-y-10 px-6 max-w-lg mx-auto">
                {/* Header */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="w-20 h-px bg-linear-to-r from-transparent to-amber-500/40" />
                        <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
                        <span className="w-2 h-2 rotate-45 bg-amber-500/60" />
                        <span className="w-1.5 h-1.5 rotate-45 border border-amber-500/50" />
                        <span className="w-20 h-px bg-linear-to-l from-transparent to-amber-500/40" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-light tracking-tight text-foreground">Session Complete</h2>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
                    <div className="relative p-4 border border-amber-600/20 bg-card/30">
                        <span className="absolute top-0 left-0 w-2 h-2">
                            <span className="absolute top-0 left-0 w-full h-px bg-amber-500/40" />
                            <span className="absolute top-0 left-0 h-full w-px bg-amber-500/40" />
                        </span>
                        <div className="flex flex-col items-center gap-1">
                            <Target size={16} className="text-amber-500/60" strokeWidth={1.5} />
                            <span className="text-2xl font-light text-foreground tabular-nums">{cardsReviewed}</span>
                            <span className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground/50">Cards</span>
                        </div>
                    </div>

                    <div className="relative p-4 border-2 border-amber-500/40 bg-amber-500/5">
                        <span className="absolute top-0 left-0 w-3 h-3">
                            <span className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />
                            <span className="absolute top-0 left-0 h-full w-0.5 bg-amber-500" />
                        </span>
                        <span className="absolute bottom-0 right-0 w-3 h-3">
                            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-amber-500" />
                            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-amber-500" />
                        </span>
                        <div className="flex flex-col items-center gap-1">
                            <Zap size={16} className="text-amber-500" strokeWidth={1.5} />
                            <span className="text-2xl font-light text-amber-500 tabular-nums">+{sessionXp}</span>
                            <span className="text-[10px] font-ui uppercase tracking-wider text-amber-500/60">XP Earned</span>
                        </div>
                    </div>

                    <div className="relative p-4 border border-amber-600/20 bg-card/30">
                        <span className="absolute top-0 right-0 w-2 h-2">
                            <span className="absolute top-0 right-0 w-full h-px bg-amber-500/40" />
                            <span className="absolute top-0 right-0 h-full w-px bg-amber-500/40" />
                        </span>
                        <div className="flex flex-col items-center gap-1">
                            <Sparkles size={16} className="text-amber-500/60" strokeWidth={1.5} />
                            <span className="text-2xl font-light text-foreground tabular-nums">{sessionStreak}</span>
                            <span className="text-[10px] font-ui uppercase tracking-wider text-muted-foreground/50">Best Streak</span>
                        </div>
                    </div>
                </div>

                {/* Continue button - Genshin style */}
                <button
                    onClick={() => onComplete ? onComplete() : onExit()}
                    className="group relative px-12 py-4 bg-card hover:bg-amber-500/5 border-2 border-amber-700/20 hover:border-amber-500/40 transition-all animate-in fade-in duration-700 delay-700"
                >
                    {/* Button corner accents */}
                    <span className="absolute -top-px -left-px w-3 h-3 border-l-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute -top-px -right-px w-3 h-3 border-r-2 border-t-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute -bottom-px -left-px w-3 h-3 border-l-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute -bottom-px -right-px w-3 h-3 border-r-2 border-b-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 text-sm font-ui uppercase tracking-[0.15em] text-foreground/70 group-hover:text-amber-500 transition-colors duration-300">Continue</span>
                </button>
            </div>
        </div>
    );
};
