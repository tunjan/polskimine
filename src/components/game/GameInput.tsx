import * as React from "react"
import { cn } from "@/lib/utils"

export interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
}

export function GameInput({
    label,
    error,
    icon,
    className,
    ...props
}: GameInputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-medium text-muted-foreground font-ui uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group/input">
                <input
                    className={cn(
                        "w-full h-11 bg-card border-2 border-border/50 text-foreground px-4",
                        "font-ui text-sm placeholder:text-muted-foreground/50",
                        "transition-all duration-200",
                        "focus:border-amber-600/50 focus:bg-amber-600/5 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        icon && "pl-11",
                        error && "border-rose-500/50 focus:border-rose-500/50 bg-rose-500/5",
                        className
                    )}
                    {...props}
                />

                {/* Icon */}
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-amber-500 transition-colors">
                        {icon}
                    </div>
                )}

                {/* Corner accents on focus */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-200">
                    <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-amber-500" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-amber-500" />
                    <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-amber-500" />
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-amber-500" />
                </div>
            </div>
            {error && (
                <p className="text-[10px] text-rose-500 font-medium ml-1">{error}</p>
            )}
        </div>
    )
}
