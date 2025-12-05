import React from 'react';
import { Zap, TrendingUp, Pencil, Trash2, Archive, Undo2, X, Bookmark } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import clsx from 'clsx';
import { Card } from '@/types';

interface StudyHeaderProps {
    counts: { unseen: number; learning: number; lapse: number; mature: number };
    currentStatus: { label: string; className: string } | null;
    sessionXp: number;
    multiplierInfo: { value: number; label: string };
    isProcessing: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onUndo: () => void;
    onExit: () => void;
    canUndo: boolean;
    isBookmarked?: boolean;
    onBookmark: (pressed: boolean) => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = React.memo(({
    counts,
    currentStatus,
    sessionXp,
    multiplierInfo,
    isProcessing,
    onEdit,
    onDelete,
    onArchive,
    onUndo,
    onExit,
    canUndo,
    isBookmarked,
    onBookmark,
}) => {
    return (
        <header className="relative h-16 md:h-20 px-4 md:px-6 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-2 border-b border-amber-600/15">
            {/* Bottom decorative accent */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-2 z-10">
                <span className="w-6 h-px bg-amber-500/20" />
                <span className="w-1 h-1 rotate-45 bg-amber-500/30" />
                <span className="w-6 h-px bg-amber-500/20" />
            </div>

            {/* Queue statistics - game UI style */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <GameQueueStat
                    label="New"
                    count={counts.unseen}
                    isActive={currentStatus?.label === 'NEW'}
                    color="blue"
                />
                <GameQueueStat
                    label="Learning"
                    count={counts.learning}
                    isActive={currentStatus?.label === 'LRN'}
                    color="orange"
                />
                <GameQueueStat
                    label="Lapse"
                    count={counts.lapse}
                    isActive={currentStatus?.label === 'LAPSE'}
                    color="red"
                />
                <GameQueueStat
                    label="Review"
                    count={counts.mature}
                    isActive={currentStatus?.label === 'REV'}
                    color="green"
                />

                {/* Enhanced XP display */}
                <div className="hidden sm:flex items-center gap-3 relative overflow-hidden group">
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0" />

                    {/* XP icon with glow */}
                    <div className="relative">
                        <Zap size={14} strokeWidth={2} className="text-primary fill-primary/20" />
                        <div className="absolute inset-0 blur-[2px] opacity-50">
                            <Zap size={14} strokeWidth={2} className="text-primary" />
                        </div>
                    </div>

                    {/* XP value */}
                    <span className="relative text-sm font-ui font-medium tracking-wide text-foreground tabular-nums">
                        {sessionXp}
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 ml-1">XP</span>
                    </span>

                    {/* Multiplier badge */}
                    {multiplierInfo.value > 1.0 && (
                        <div className="flex items-center gap-1 text-[10px] text-primary font-semibold px-2 py-0.5 animate-pulse">
                            <TrendingUp size={10} strokeWidth={2.5} />
                            <span>×{multiplierInfo.value.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Meta info and controls - game styled */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    <GameActionButton
                        icon={<Pencil size={14} strokeWidth={1.5} />}
                        onClick={onEdit}
                        disabled={isProcessing}
                        title="Edit Card"
                        aria-label="Edit Card"
                    />
                    <GameActionButton
                        icon={<Trash2 size={14} strokeWidth={1.5} />}
                        onClick={onDelete}
                        disabled={isProcessing}
                        title="Delete Card"
                        aria-label="Delete Card"
                        variant="danger"
                    />
                    <GameActionButton
                        icon={<Archive size={14} strokeWidth={1.5} />}
                        onClick={onArchive}
                        disabled={isProcessing}
                        title="Archive"
                        aria-label="Archive"
                    />
                    <Toggle
                        pressed={isBookmarked}
                        onPressedChange={onBookmark}
                        aria-label="Toggle bookmark"
                        className="h-9 w-9 p-0 data-[state=on]:*:[svg]:fill-primary  data-[state=on]:text-primary hover:bg-card/50 hover:text-foreground border border-transparent hover:border-border/40 transition-all duration-200"
                    >
                        <Bookmark size={14} strokeWidth={isBookmarked ? 2 : 1.5} className={clsx("transition-all", isBookmarked && "fill-current")} />
                    </Toggle>
                    {canUndo && (
                        <GameActionButton
                            icon={<Undo2 size={14} strokeWidth={1.5} />}
                            onClick={onUndo}
                            title="Undo (Z)"
                            aria-label="Undo"
                        />
                    )}
                    <GameActionButton
                        icon={<X size={14} strokeWidth={1.5} />}
                        onClick={onExit}
                        title="Exit (Esc)"
                        aria-label="Exit"
                        variant="danger"
                    />
                </div>
            </div>
        </header>
    );
});

const GameQueueStat = React.memo(({ label, count, isActive, color }: {
    label: string;
    count: number;
    isActive: boolean;
    color: 'blue' | 'orange' | 'red' | 'green';
}) => {
    const colorMap = {
        blue: { active: 'text-blue-800 border-blue-500/30 bg-blue-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
        orange: { active: 'text-amber-800 border-amber-500/30 bg-amber-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
        red: { active: 'text-red-800 border-red-500/30 bg-red-500/5', inactive: 'text-muted-foreground/60 border-border/30' },
        green: { active: 'text-green-800 border-green-700/30 bg-green-700/5', inactive: 'text-muted-foreground/60 border-border/30' },
    };
    const colors = colorMap[color];

    return (
        <div className={clsx(
            "relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 border transition-all duration-300",
            isActive ? colors.active : colors.inactive,
            count === 0 && !isActive && "opacity-40"
        )}>
            {/* Diamond indicator */}
            <span className={clsx(
                "w-1.5 h-1.5 rotate-45 transition-colors",
                isActive ? "bg-current animate-pulse" : "bg-current/40"
            )} />
            <span className="hidden sm:inline text-[9px] font-ui uppercase tracking-wider">{label}</span>
            <span className="text-xs font-ui font-medium tabular-nums">{count}</span>
        </div>
    );
});

const GameActionButton = React.memo(({ icon, onClick, disabled, title, variant = 'default' }: {
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    title: string;
    variant?: 'default' | 'danger';
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={clsx(
            "relative p-2 border border-transparent transition-all duration-200",
            "text-muted-foreground/50 hover:text-foreground",
            variant === 'danger' && "hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5",
            variant === 'default' && "hover:border-border/40 hover:bg-card/50",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {icon}
    </button>
));
