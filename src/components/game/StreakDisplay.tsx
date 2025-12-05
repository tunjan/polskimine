import * as React from "react"
import { cn } from "@/lib/utils"

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
        <div className={cn("relative group/streak", className)}>
            <div className="flex items-center gap-6">
                {/* Flame icon with simple frame */}
                <div className="relative w-14 h-14">
                    {/* Simple square frame */}
                    <div className={cn(
                        "absolute inset-0 border-2 transition-colors duration-200",
                        currentStreak > 0
                            ? "border-orange-500/40"
                            : "border-border/30"
                    )} />

                    {/* Small corner accents */}
                    {currentStreak > 0 && (
                        <>
                            <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-orange-500/60" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-orange-500/60" />
                            <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-orange-500/60" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-orange-500/60" />
                        </>
                    )}

                    {/* Inner content */}
                    <div className={cn(
                        "absolute inset-1 flex items-center justify-center",
                        currentStreak > 0
                            ? "bg-orange-500/10"
                            : "bg-muted/10"
                    )}>
                        {/* Flame icon */}
                        <svg
                            className={cn(
                                "w-6 h-6 transition-colors",
                                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/30"
                            )}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                        </svg>
                    </div>

                    {/* At risk indicator */}
                    {isAtRisk && currentStreak > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-600 rotate-45 animate-pulse" />
                    )}
                </div>

                {/* Streak info */}
                <div className="flex-1">
                    <div className="flex items-baseline gap-2.5 mb-3">
                        <span className="text-4xl font-bold text-foreground tabular-nums">
                            {currentStreak}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                            day{currentStreak === 1 ? '' : 's'}
                        </span>
                        {isAtRisk && currentStreak > 0 && (
                            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold font-ui animate-pulse ml-2">
                                At Risk
                            </span>
                        )}
                    </div>

                    {/* Weekly calendar */}
                    <div className="flex gap-1.5">
                        {lastSevenDays.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground/50 font-semibold font-ui uppercase">
                                    {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                                </span>
                                <div className={cn(
                                    "w-6 h-6 flex items-center justify-center",
                                    "border transition-colors",
                                    day.active
                                        ? "bg-orange-500/15 border-orange-500/40"
                                        : "bg-muted/10 border-border/20"
                                )}>
                                    {day.active && (
                                        <span className="w-2 h-2 rotate-45 bg-orange-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
