import * as React from "react"
import { cn } from "@/lib/utils"
import { GamePanel } from "./GamePanel"
import { GameButton } from "./GameButton"

export interface GameEmptyStateProps {
    icon: React.ElementType
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function GameEmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: GameEmptyStateProps) {
    return (
        <GamePanel className={cn("relative overflow-hidden", className)}>
            {/* Subtle diamond pattern background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L22 2L20 4L18 2Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative p-10 md:p-14 flex flex-col items-center justify-center text-center">
                {/* Icon container with ornate frame */}
                <div className="relative mb-6">
                    {/* Outer rotating frame */}
                    <div className="w-24 h-24 border-2 border-amber-700/20 rotate-45 flex items-center justify-center">
                        {/* Inner frame */}
                        <div className="w-16 h-16 border border-border/60 -rotate-45 flex items-center justify-center bg-card">
                            <Icon className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Corner accents */}
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                    <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2.5 font-ui tracking-wide uppercase">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground/70 font-medium max-w-64 mb-6">
                    {description}
                </p>

                {action && (
                    <GameButton
                        variant="secondary"
                        size="sm"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </GameButton>
                )}
            </div>
        </GamePanel>
    )
}
