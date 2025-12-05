import * as React from "react"
import { cn } from "@/lib/utils"

export function GameDivider({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 my-6", className)}>
            <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
            <span className="flex-1 h-px bg-border/50" />
            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
            <span className="flex-1 h-px bg-border/50" />
            <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
        </div>
    )
}
