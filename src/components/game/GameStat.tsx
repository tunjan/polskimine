import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameStatProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string
    value: string | number
    sublabel?: string
    icon?: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
    size?: 'sm' | 'md' | 'lg'
    color?: 'default' | 'amber' | 'blue' | 'green' | 'rose' | 'purple' | 'sky' | 'pine' | 'violet'
}

const statColorConfig: Record<NonNullable<GameStatProps['color']>, {
    accent: string
    text: string
    bg: string
    border: string
}> = {
    default: {
        accent: "bg-amber-600",
        text: "text-amber-500",
        bg: "bg-amber-600/10",
        border: "border-amber-700/30"
    },
    amber: {
        accent: "bg-amber-600",
        text: "text-amber-500",
        bg: "bg-amber-600/10",
        border: "border-amber-700/30"
    },
    blue: {
        accent: "bg-blue-500",
        text: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30"
    },
    sky: {
        accent: "bg-sky-500",
        text: "text-sky-500",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30"
    },
    green: {
        accent: "bg-pine-500",
        text: "text-pine-500",
        bg: "bg-pine-500/10",
        border: "border-pine-500/30"
    },
    pine: {
        accent: "bg-pine-500",
        text: "text-pine-500",
        bg: "bg-pine-500/10",
        border: "border-pine-500/30"
    },
    rose: {
        accent: "bg-rose-500",
        text: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30"
    },
    purple: {
        accent: "bg-purple-500",
        text: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30"
    },
    violet: {
        accent: "bg-violet-500",
        text: "text-violet-500",
        bg: "bg-violet-500/10",
        border: "border-violet-500/30"
    }
}

export function GameStat({
    label,
    value,
    sublabel,
    icon,
    trend,
    size = 'md',
    className,
    color = 'default',
    ...props
}: GameStatProps) {
    const colors = statColorConfig[color]

    return (
        <div
            className={cn(
                "relative group/stat",
                "bg-card border border-border/50",
                "p-4 transition-colors duration-200",
                "hover:border-border",
                className
            )}
            {...props}
        >
            {/* Top accent bar - simple line */}
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent, "opacity-80")} />

            {/* Content */}
            <div className="relative">
                {/* Label with icon */}
                <div className="flex items-center gap-2 mb-2">
                    {icon && (
                        <span className={cn(colors.text, "opacity-80")}>
                            {icon}
                        </span>
                    )}
                    <p className={cn(
                        "uppercase tracking-[0.15em] text-muted-foreground font-medium font-ui",
                        size === 'sm' && "text-[9px]",
                        size === 'md' && "text-[10px]",
                        size === 'lg' && "text-[11px]"
                    )}>
                        {label}
                    </p>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2">
                    <p className={cn(
                        "font-medium text-foreground tabular-nums tracking-tight",
                        size === 'sm' && "text-2xl",
                        size === 'md' && "text-3xl md:text-4xl",
                        size === 'lg' && "text-4xl md:text-5xl"
                    )}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>

                    {/* Trend indicator */}
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium",
                            trend === 'up' && "text-pine-500",
                            trend === 'down' && "text-rose-500",
                            trend === 'neutral' && "text-muted-foreground"
                        )}>
                            {trend === 'up' && '↑'}
                            {trend === 'down' && '↓'}
                            {trend === 'neutral' && '→'}
                        </span>
                    )}
                </div>

                {/* Sublabel */}
                {sublabel && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium font-ui">
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}
