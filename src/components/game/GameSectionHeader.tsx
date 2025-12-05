import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    subtitle?: string
    icon?: React.ReactNode
}

export function GameSectionHeader({
    title,
    subtitle,
    icon,
    className,
    ...props
}: GameSectionHeaderProps) {
    return (
        <div className={cn("mb-5 md:mb-6", className)} {...props}>
            <div className="flex items-center gap-4 mb-1.5">
                {/* Left ornate element */}
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rotate-45 border-2 border-amber-700/60" />
                    <span className="w-6 h-0.5 bg-amber-600/40" />
                </div>

                {/* Title */}
                <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-wide font-ui flex items-center gap-2.5">
                    {icon && <span className="text-amber-600/80">{icon}</span>}
                    {title}
                </h2>

                {/* Right ornate line */}
                <div className="flex-1 flex items-center gap-2">
                    <span className="flex-1 h-px bg-border/60" />
                    <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                    <span className="w-8 h-px bg-border/40" />
                </div>
            </div>

            {subtitle && (
                <p className="text-sm text-muted-foreground/70 font-medium pl-12">
                    {subtitle}
                </p>
            )}
        </div>
    )
}
