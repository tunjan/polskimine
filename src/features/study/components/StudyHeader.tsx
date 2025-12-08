import React from 'react';
import { Zap, TrendingUp, Pencil, Trash2, Archive, Undo2, X, Bookmark, Sparkles, MoreVertical } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from 'clsx';
import { cn } from '@/lib/utils';

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

const QueueBadge = ({ label, count, color }: { label: string; count: number; color: 'blue' | 'amber' | 'red' | 'emerald' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };

    const dotClasses = {
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        emerald: 'bg-emerald-500',
    };

    return (
        <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1 border transition-all hover:scale-105", colorClasses[color])}>
            <span className={cn("size-1.5 rounded-full animate-pulse", dotClasses[color])} />
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            <span className="text-xs font-bold tabular-nums">{count}</span>
        </Badge>
    );
};

const ActionButton = ({ icon: Icon, label, onClick, disabled, variant = 'ghost', className }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'ghost' | 'outline';
    className?: string;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant={variant} size="icon" onClick={onClick} disabled={disabled} className={cn("size-8 rounded-lg", className)}>
                <Icon size={15} strokeWidth={1.5} />
            </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
            {label}
        </TooltipContent>
    </Tooltip>
);

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
        <TooltipProvider delayDuration={300}>
            <header className="relative h-14 md:h-16 px-3 md:px-5 flex justify-between items-center select-none shrink-0 pt-[env(safe-area-inset-top)] gap-3 bg-linear-to-b from-background to-background/80 backdrop-blur-sm border-b border-border/30">

                {/* Queue statistics */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <QueueBadge label="New" count={counts.unseen} color="blue" />
                    <QueueBadge label="Learn" count={counts.learning} color="amber" />
                    <QueueBadge label="Lapse" count={counts.lapse} color="red" />
                    <QueueBadge label="Review" count={counts.mature} color="emerald" />

                    {currentStatus && (
                        <>
                            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                            <Badge variant="outline" className={cn("px-2.5 py-1 border transition-all animate-in fade-in zoom-in duration-300", currentStatus.className)}>
                                <span className="text-[10px] font-bold tracking-wider">{currentStatus.label}</span>
                            </Badge>
                        </>
                    )}
                </div>

                {/* XP display - centered */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 ">
                        <div className="relative">
                            <Zap size={14} strokeWidth={2.5} className="text-primary fill-primary/20" />
                        </div>
                        <span className="text-sm font-semibold tracking-wide tabular-nums text-foreground">
                            {sessionXp.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/70">XP</span>

                        {multiplierInfo.value > 1.0 && (
                            <>
                                <Separator orientation="vertical" className="h-4 mx-1" />
                                <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                                    <span>×{multiplierInfo.value.toFixed(1)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-0.5">
                        <ActionButton
                            icon={Pencil}
                            label="Edit Card (E)"
                            onClick={onEdit}
                            disabled={isProcessing}
                        />
                        <ActionButton
                            icon={Trash2}
                            label="Delete Card"
                            onClick={onDelete}
                            disabled={isProcessing}
                            className="hover:text-destructive hover:bg-destructive/10"
                        />
                        <ActionButton
                            icon={Archive}
                            label="Mark as Known"
                            onClick={onArchive}
                            disabled={isProcessing}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Toggle
                                    pressed={isBookmarked}
                                    onPressedChange={onBookmark}
                                    aria-label="Toggle bookmark"
                                    size="sm"
                                    className="size-8 rounded-lg data-[state=on]:bg-amber-500/15 hover:data-[state=on]:bg-amber-500/25 data-[state=on]:text-amber-600 dark:data-[state=on]:text-amber-400"
                                >
                                    <Bookmark size={15} strokeWidth={isBookmarked ? 2.5 : 1.5} className={clsx("transition-all", isBookmarked && "fill-current")} />
                                </Toggle>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {isBookmarked ? 'Remove Bookmark' : 'Bookmark Card'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Mobile Dropdown */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                                    <MoreVertical size={15} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit} disabled={isProcessing}>
                                    <Pencil className="mr-2 size-4" />
                                    <span>Edit Card</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onBookmark(!isBookmarked)} disabled={isProcessing}>
                                    <Bookmark className={cn("mr-2 size-4", isBookmarked && "fill-current")} />
                                    <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Name'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onArchive} disabled={isProcessing}>
                                    <Archive className="mr-2 size-4" />
                                    <span>Mark as Known</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} disabled={isProcessing} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 size-4" />
                                    <span>Delete Card</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {canUndo && (
                        <ActionButton
                            icon={Undo2}
                            label="Undo (Z)"
                            onClick={onUndo}
                            className="text-muted-foreground hover:text-foreground"
                        />
                    )}

                    <Separator orientation="vertical" className="h-5 mx-1.5" />

                    <ActionButton
                        icon={X}
                        label="Exit Session (Esc)"
                        onClick={onExit}
                        className="hover:bg-destructive/10 hover:text-destructive"
                    />
                </div>
            </header>
        </TooltipProvider>
    );
});


