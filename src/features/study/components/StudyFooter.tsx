import React, { useState } from 'react';
import clsx from 'clsx';
import { Grade } from '@/types';

interface StudyFooterProps {
    isFlipped: boolean;
    setIsFlipped: (flipped: boolean) => void;
    isProcessing: boolean;
    binaryRatingMode: boolean;
    onGrade: (grade: Grade) => void;
}

export const StudyFooter: React.FC<StudyFooterProps> = React.memo(({
    isFlipped,
    setIsFlipped,
    isProcessing,
    binaryRatingMode,
    onGrade,
}) => {
    return (
        <footer className="relative shrink-0 pb-[env(safe-area-inset-bottom)] border-t border-border/10">
            <div className="h-24 md:h-28 w-full max-w-4xl mx-auto px-8 md:px-16">
                {!isFlipped ? (
                    <button
                        onClick={() => setIsFlipped(true)}
                        disabled={isProcessing}
                        className="group relative w-full h-full flex items-center justify-center border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300"
                    >
                        {/* Corner accents on hover */}
                        <span className="absolute -top-px -left-px w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute top-0 left-0 w-full h-px bg-primary/50" />
                            <span className="absolute top-0 left-0 h-full w-px bg-primary/50" />
                        </span>
                        <span className="absolute -bottom-px -right-px w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="absolute bottom-0 right-0 w-full h-px bg-primary/50" />
                            <span className="absolute bottom-0 right-0 h-full w-px bg-primary/50" />
                        </span>

                        <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/60 transition-colors mr-3" />
                        <span className="text-[11px] font-ui uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-primary/80 transition-colors duration-300">
                            Show Answer
                        </span>
                        <span className="w-1.5 h-1.5 rotate-45 bg-muted-foreground/20 group-hover:bg-primary/60 transition-colors ml-3" />

                        {/* Subtle keyboard hint */}
                        <span className="absolute bottom-3 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-300 tracking-wider">
                            SPACE
                        </span>
                    </button>
                ) : (
                    binaryRatingMode ? (
                        <div className="grid grid-cols-2 h-full w-full gap-4 md:gap-8 items-center py-3">
                            <GameAnswerButton
                                label="Again"
                                shortcut="1"
                                intent="danger"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Good"
                                shortcut="Space"
                                intent="success"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 h-full w-full gap-2 md:gap-4 items-center py-3">
                            <GameAnswerButton
                                label="Again"
                                shortcut="1"
                                intent="danger"
                                onClick={() => onGrade('Again')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Hard"
                                shortcut="2"
                                intent="warning"
                                onClick={() => onGrade('Hard')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Good"
                                shortcut="3"
                                intent="success"
                                onClick={() => onGrade('Good')}
                                disabled={isProcessing}
                            />
                            <GameAnswerButton
                                label="Easy"
                                shortcut="4"
                                intent="info"
                                onClick={() => onGrade('Easy')}
                                disabled={isProcessing}
                            />
                        </div>
                    )
                )}
            </div>
        </footer>
    );
});

const GameAnswerButton = React.memo(({ label, shortcut, intent, onClick, disabled }: {
    label: string;
    shortcut: string;
    intent: 'danger' | 'warning' | 'success' | 'info';
    onClick: () => void;
    disabled: boolean;
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const colorMap = {
        danger: {
            text: 'text-red-500/70',
            hover: 'hover:text-red-500',
            border: 'hover:border-red-500/40',
            bg: 'hover:bg-red-500/5',
            accent: 'bg-red-500',
            glow: 'shadow-red-500/20',
            gradient: 'from-red-500/10 to-transparent'
        },
        warning: {
            text: 'text-amber-500/70',
            hover: 'hover:text-amber-500',
            border: 'hover:border-amber-500/40',
            bg: 'hover:bg-amber-500/5',
            accent: 'bg-amber-500',
            glow: 'shadow-amber-500/20',
            gradient: 'from-amber-500/10 to-transparent'
        },
        success: {
            text: 'text-pine-500/70',
            hover: 'hover:text-pine-500',
            border: 'hover:border-pine-500/40',
            bg: 'hover:bg-pine-500/5',
            accent: 'bg-pine-500',
            glow: 'shadow-pine-500/20',
            gradient: 'from-pine-500/10 to-transparent'
        },
        info: {
            text: 'text-blue-500/70',
            hover: 'hover:text-blue-500',
            border: 'hover:border-blue-500/40',
            bg: 'hover:bg-blue-500/5',
            accent: 'bg-blue-500',
            glow: 'shadow-blue-500/20',
            gradient: 'from-blue-500/10 to-transparent'
        }
    };
    const colors = colorMap[intent];

    const handleClick = () => {
        if (disabled) return;
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={clsx(
                "group relative flex flex-col items-center justify-center h-full w-full outline-none select-none overflow-hidden",
                "border border-border/20 bg-card/30 transition-all duration-200",
                colors.border, colors.bg,
                "hover:shadow-lg",
                colors.glow,
                isPressed && "scale-95",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {/* Gradient background on hover */}
            <div className={clsx(
                "absolute inset-0 bg-linear-to-t opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                colors.gradient
            )} />

            {/* Corner accents on hover */}
            <span className={clsx("absolute -top-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute top-0 left-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute top-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -top-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute top-0 right-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute top-0 right-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -left-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute bottom-0 left-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute bottom-0 left-0 h-full w-px", colors.accent)} />
            </span>
            <span className={clsx("absolute -bottom-px -right-px w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity")}>
                <span className={clsx("absolute bottom-0 right-0 w-full h-px", colors.accent)} />
                <span className={clsx("absolute bottom-0 right-0 h-full w-px", colors.accent)} />
            </span>

            {/* Diamond accent with glow */}
            <div className="relative mb-2">
                <span className={clsx(
                    "w-1.5 h-1.5 rotate-45 opacity-40 group-hover:opacity-100 transition-all duration-200 block",
                    colors.accent
                )} />
                <span className={clsx(
                    "absolute inset-0 w-1.5 h-1.5 rotate-45 opacity-0 group-hover:opacity-60 blur-sm transition-opacity",
                    colors.accent
                )} />
            </div>

            {/* Label */}
            <span className={clsx(
                "relative text-sm font-ui uppercase tracking-[0.15em] transition-all duration-200",
                colors.text, colors.hover
            )}>
                {label}
            </span>

            {/* Shortcut hint */}
            <span className="absolute bottom-2 text-[8px] font-ui text-muted-foreground/20 opacity-0 group-hover:opacity-60 transition-all duration-200 tracking-wider">
                {shortcut}
            </span>
        </button>
    );
});
