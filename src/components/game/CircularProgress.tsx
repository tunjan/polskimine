import * as React from "react"
import { cn } from "@/lib/utils"

export interface CircularProgressProps {
    value: number
    max: number
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    label?: string
    className?: string
}

export function CircularProgress({
    value,
    max,
    size = 'lg',
    showLabel = true,
    label,
    className
}: CircularProgressProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0
    const isComplete = value === 0 && max === 0

    const sizeConfig = {
        sm: { size: 80, stroke: 4, textSize: 'text-xl', innerOffset: 8 },
        md: { size: 120, stroke: 5, textSize: 'text-3xl', innerOffset: 12 },
        lg: { size: 160, stroke: 6, textSize: 'text-5xl', innerOffset: 16 }
    }

    const config = sizeConfig[size]
    const radius = (config.size - config.stroke * 2) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg
                width={config.size}
                height={config.size}
                className="-rotate-90"
            >
                {/* Background ring */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    className="text-border/30"
                />

                {/* Progress ring */}
                <circle
                    cx={config.size / 2}
                    cy={config.size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={config.stroke}
                    strokeLinecap="square"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                        "transition-all duration-500",
                        isComplete ? "text-pine-500" : "text-amber-500"
                    )}
                />

                {/* Cardinal point markers */}
                {[0, 90, 180, 270].map((angle) => {
                    const radian = (angle * Math.PI) / 180
                    const x = config.size / 2 + (radius + 8) * Math.cos(radian - Math.PI / 2)
                    const y = config.size / 2 + (radius + 8) * Math.sin(radian - Math.PI / 2)
                    return (
                        <rect
                            key={angle}
                            x={x - 2}
                            y={y - 2}
                            width={4}
                            height={4}
                            fill="currentColor"
                            className="text-amber-500/40"
                            transform={`rotate(45 ${x} ${y})`}
                        />
                    )
                })}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(config.textSize, "font-bold text-foreground tabular-nums")}>
                    {value}
                </span>
                {showLabel && (
                    <span className="text-xs text-muted-foreground font-medium mt-1">
                        {label || (isComplete ? 'Complete' : `of ${max}`)}
                    </span>
                )}
            </div>
        </div>
    )
}
