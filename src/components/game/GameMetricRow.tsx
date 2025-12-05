import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameMetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
    icon: React.ReactNode
    label: string
    value: string | number
    unit?: string
}

export function GameMetricRow({
    icon,
    label,
    value,
    unit,
    className,
    ...props
}: GameMetricRowProps) {
    return (
        <div
            className={cn(
                "group/metric relative",
                "bg-card/60 border border-border/40 p-4",
                "flex items-center justify-between",
                "hover:border-amber-700/30 transition-colors duration-150",
                className
            )}
            {...props}
        >
            {/* Left accent line */}
            <span className={cn(
                "absolute left-0 top-2 bottom-2 w-0.5",
                "bg-amber-600/30 group-hover/metric:bg-amber-600/60",
                "transition-colors duration-150"
            )} />

            {/* Label side */}
            <div className="flex items-center gap-3 pl-3">
                <span className="text-amber-500/70">{icon}</span>
                <span className="text-sm text-muted-foreground font-medium font-ui">
                    {label}
                </span>
            </div>

            {/* Value side */}
            <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold text-foreground tabular-nums">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {unit && (
                    <span className="text-xs text-muted-foreground/70 font-medium">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}
