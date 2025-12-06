import * as React from "react"
import { cn } from "@/lib/utils"

export const RANK_CONFIG = [
    { maxLevel: 5, title: 'Novice', color: 'text-zinc-400', bgColor: 'bg-zinc-500/30', borderColor: 'border-zinc-500/60', accentColor: 'bg-zinc-600' },
    { maxLevel: 10, title: 'Apprentice', color: 'text-pine-400', bgColor: 'bg-pine-500/10', borderColor: 'border-pine-500/30', accentColor: 'bg-pine-400' },
    { maxLevel: 20, title: 'Scholar', color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30', accentColor: 'bg-sky-400' },
    { maxLevel: 35, title: 'Adept', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30', accentColor: 'bg-violet-400' },
    { maxLevel: 50, title: 'Expert', color: 'text-amber-400', bgColor: 'bg-amber-600/10', borderColor: 'border-amber-700/30', accentColor: 'bg-amber-400' },
    { maxLevel: 75, title: 'Master', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', accentColor: 'bg-orange-400' },
    { maxLevel: 100, title: 'Grandmaster', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', accentColor: 'bg-rose-400' },
    { maxLevel: Infinity, title: 'Legend', color: 'text-amber-300', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30', accentColor: 'bg-amber-300' },
] as const

export function getRankForLevel(level: number) {
    return RANK_CONFIG.find(r => level <= r.maxLevel) || RANK_CONFIG[RANK_CONFIG.length - 1]
}

export interface LevelBadgeProps {
    level: number
    xp: number
    progressPercent: number
    xpToNextLevel: number
    showDetails?: boolean
    className?: string
}

export function LevelBadge({
    level,
    xp,
    progressPercent,
    xpToNextLevel,
    showDetails = true,
    className
}: LevelBadgeProps) {
    const rank = getRankForLevel(level)

    return (
        <div className={cn("relative", className)}>
            <div className="flex items-center gap-5">
                {/* Level emblem - Genshin-style geometric frame */}
                <div className="relative w-20 h-20">
                    {/* Background circle with progress */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
                        {/* Background ring */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-border/40"
                        />

                        {/* Progress arc */}
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="square"
                            strokeDasharray={`${(progressPercent / 100) * 226} 226`}
                            className={cn(rank.color, "transition-all duration-500")}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />

                        {/* Decorative tick marks */}
                        {[0, 90, 180, 270].map((angle) => (
                            <rect
                                key={angle}
                                x="39"
                                y="2"
                                width="2"
                                height="4"
                                fill="currentColor"
                                className={rank.color}
                                opacity="0.5"
                                transform={`rotate(${angle} 40 40)`}
                            />
                        ))}
                    </svg>

                    {/* Inner diamond frame */}
                    <div className="absolute inset-3">
                        <div className={cn(
                            "w-full h-full rotate-45",
                            "border-2 bg-card",
                            rank.borderColor
                        )}>
                            {/* Inner corner accents */}
                            <span className={cn("absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2", rank.borderColor)} />
                            <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2", rank.borderColor)} />
                            <span className={cn("absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2", rank.borderColor)} />
                            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2", rank.borderColor)} />
                        </div>
                    </div>

                    {/* Level number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn(
                            "text-2xl font-bold tabular-nums",
                            rank.color
                        )}>
                            {level}
                        </span>
                    </div>

                    {/* Cardinal diamonds */}
                    <span className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                    <span className={cn("absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
                </div>

                {/* Level details */}
                {showDetails && (
                    <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className={cn("text-xs font-bold uppercase tracking-[0.2em] font-ui", rank.color)}>
                                {rank.title}
                            </span>
                            <span className={cn("w-1.5 h-1.5 rotate-45", rank.accentColor, "opacity-60")} />
                            <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold font-ui">
                                Lv. {level}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold text-foreground tabular-nums">
                                {xp.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">XP</span>
                        </div>

                        <p className="text-[13px] text-muted-foreground/60 mt-1.5 font-medium">
                            {xpToNextLevel.toLocaleString()} XP to next level
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
