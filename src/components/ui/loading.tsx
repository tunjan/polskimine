import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const LOADING_TIPS = [
    "Reviewing daily keeps the streak alive!",
    "Use mnemonics to remember difficult words.",
    "Consistency is key to language mastery.",
    "Take breaks to let your brain absorb the material.",
    "Say the words out loud for better retention."
];

export interface LoaderProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Loader({ size = 'md', className }: LoaderProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    }

    return (
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
    )
}

export interface LoadingScreenProps {
    title?: string
    subtitle?: string
    showTip?: boolean
    className?: string
}

export function LoadingScreen({
    title = "Loading",
    subtitle,
    showTip = true,
    className
}: LoadingScreenProps) {
    const [tipIndex] = React.useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
    const tip = LOADING_TIPS[tipIndex]

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background",
            className
        )}>
            <div className="flex flex-col items-center gap-6 px-6">
                <Loader size="lg" />

                <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-xl font-semibold text-foreground">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {showTip && (
                <div className="absolute bottom-12 left-0 right-0 px-8">
                    <div className="max-w-md mx-auto text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tip</p>
                        <p className="text-sm text-muted-foreground italic">
                            "{tip}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export function ButtonLoader({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
    )
}
