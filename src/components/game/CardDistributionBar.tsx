import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardDistributionBarProps {
    segments: { label: string; value: number; color: string }[]
    total: number
    className?: string
}

export function CardDistributionBar({ segments, total, className }: CardDistributionBarProps) {
    if (total === 0) return null

    return (
        <div className={cn("space-y-3", className)}>
            {/* Bar */}
            <div className="relative h-2.5 bg-muted/30 border border-border/30 overflow-hidden flex">
                {segments.map((segment, i) => {
                    const width = (segment.value / total) * 100
                    if (width === 0) return null
                    return (
                        <div
                            key={i}
                            className={cn("h-full transition-all duration-500", segment.color)}
                            style={{ width: `${width}%` }}
                        />
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {segments.map((segment, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rotate-45", segment.color)} />
                        <span className="text-[10px] text-muted-foreground font-semibold font-ui uppercase tracking-wide">
                            {segment.label}
                        </span>
                        <span className="text-[11px] text-foreground/80 tabular-nums font-semibold font-ui">
                            {segment.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
