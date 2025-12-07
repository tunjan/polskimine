import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export const RANK_CONFIG = [
    { maxLevel: 5, title: 'Novice' },
    { maxLevel: 10, title: 'Apprentice' },
    { maxLevel: 20, title: 'Scholar' },
    { maxLevel: 35, title: 'Adept' },
    { maxLevel: 50, title: 'Expert' },
    { maxLevel: 75, title: 'Master' },
    { maxLevel: 100, title: 'Grandmaster' },
    { maxLevel: Infinity, title: 'Legend' },
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
        <div className={cn("flex items-center gap-4", className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {level}
            </div>

            {showDetails && (
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                            {rank.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Lv. {level}
                        </span>
                    </div>

                    <Progress value={progressPercent} className="h-2 mb-1" />

                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                            {xp.toLocaleString()} XP
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({xpToNextLevel.toLocaleString()} to next)
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
