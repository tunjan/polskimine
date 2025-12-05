import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

export function GameButton({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}: GameButtonProps) {
    return (
        <button
            className={cn(
                "relative group/btn inline-flex items-center justify-center gap-2",
                "font-ui font-semibold uppercase tracking-[0.15em]",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",

                size === 'sm' && "h-9 px-5 text-[10px]",
                size === 'md' && "h-11 px-7 text-xs",
                size === 'lg' && "h-13 px-9 text-sm",

                variant === 'primary' && [
                    "bg-amber-600/10 text-amber-950",
                    "hover:bg-amber-600/20 active:bg-amber-600",
                    "border-2 border-amber-700/50",
                ],
                variant === 'secondary' && [
                    "bg-card text-foreground",
                    "hover:bg-muted/50 active:bg-muted",
                    "border border-border",
                ],
                variant === 'ghost' && [
                    "bg-transparent text-muted-foreground",
                    "hover:text-foreground hover:bg-muted/30",
                    "border border-transparent hover:border-border/50"
                ],

                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}
