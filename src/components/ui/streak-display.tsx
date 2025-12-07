import * as React from "react"
import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"

export interface StreakDisplayProps {
    currentStreak: number
    lastSevenDays: { date: Date; active: boolean; count: number }[]
    isAtRisk?: boolean
    className?: string
}

export function StreakDisplay({
    currentStreak,
    lastSevenDays,
    isAtRisk = false,
    className
}: StreakDisplayProps) {
    return (
        <div className={cn("flex items-center gap-4", className)}>
            <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                currentStreak > 0 ? "bg-primary/10" : "bg-muted"
            )}>
                <Flame className={cn(
                    "h-6 w-6",
                    currentStreak > 0 ? "text-primary" : "text-muted-foreground"
                )} />
            </div>

            <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                        {currentStreak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        day{currentStreak === 1 ? '' : 's'}
                    </span>
                    {isAtRisk && currentStreak > 0 && (
                        <span className="text-xs text-destructive font-medium ml-2">
                            At Risk
                        </span>
                    )}
                </div>

                <div className="flex gap-1">
                    {lastSevenDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                            </span>
                            <div className={cn(
                                "w-6 h-6 rounded-sm flex items-center justify-center",
                                day.active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            )}>
                                {day.active && (
                                    <span className="text-xs">✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
