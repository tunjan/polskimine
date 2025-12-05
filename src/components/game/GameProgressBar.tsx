import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
    max?: number
    label?: string
    showValue?: boolean
    variant?: 'default' | 'xp' | 'health'
    size?: 'sm' | 'md' | 'lg'
}

export function GameProgressBar({
    value,
    max = 100,
    label,
    showValue = true,
    variant = 'default',
    size = 'md',
    className,
    ...props
}: GameProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
        <div className={cn("space-y-2", className)} {...props}>
            {/* Label row */}
            {(label || showValue) && (
                <div className="flex justify-between items-center">
                    {label && (
                        <span className="text-xs text-muted-foreground font-medium font-ui uppercase tracking-wider">
                            {label}
                        </span>
                    )}
                    {showValue && (
                        <span className="text-xs text-foreground font-semibold tabular-nums">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            {/* Progress bar container */}
            <div className={cn(
                "relative w-full overflow-hidden",
                "bg-muted/40 border border-border/40",
                size === 'sm' && "h-2",
                size === 'md' && "h-3",
                size === 'lg' && "h-4"
            )}>
                {/* End cap decorations */}
                <span className="absolute top-0 bottom-0 left-0 w-1 bg-amber-600/20 z-10" />
                <span className="absolute top-0 bottom-0 right-0 w-1 bg-amber-600/20 z-10" />

                {/* Fill bar - flat color */}
                <div
                    className={cn(
                        "h-full transition-all duration-700 ease-out",
                        variant === 'default' && "bg-amber-600",
                        variant === 'xp' && "bg-blue-500",
                        variant === 'health' && "bg-pine-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />

                {/* Progress marker at end */}
                {percentage > 0 && percentage < 100 && (
                    <span
                        className={cn(
                            "absolute top-0 bottom-0 w-0.5 bg-white/60",
                            "transition-all duration-700"
                        )}
                        style={{ left: `${percentage}%` }}
                    />
                )}
            </div>
        </div>
    )
}
