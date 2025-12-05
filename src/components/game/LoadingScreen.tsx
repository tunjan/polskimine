import * as React from "react"
import { cn } from "@/lib/utils"
import { GameButton } from "./GameButton"

export interface GameLoaderProps {
    size?: 'sm' | 'md' | 'lg'
    text?: string
    className?: string
}

export function GameLoader({ size = 'md', text, className }: GameLoaderProps) {
    const sizeConfig = {
        sm: { container: 'w-12 h-12', inner: 'inset-1.5', diamond: 'w-1.5 h-1.5' },
        md: { container: 'w-20 h-20', inner: 'inset-3', diamond: 'w-2 h-2' },
        lg: { container: 'w-28 h-28', inner: 'inset-4', diamond: 'w-3 h-3' }
    }

    const config = sizeConfig[size]

    return (
        <div className={cn("flex flex-col items-center justify-center gap-5", className)}>
            <div className={cn("relative", config.container)}>
                {/* Outer rotating square */}
                <div
                    className="absolute inset-0 border-2 border-amber-700/30 rotate-45 animate-spin"
                    style={{ animationDuration: '4s' }}
                />

                {/* Inner counter-rotating square */}
                <div
                    className={cn("absolute border-2 border-amber-700/50 rotate-45", config.inner)}
                    style={{ animation: 'spin 3s linear infinite reverse' }}
                />

                {/* Center diamond - pulsing */}
                <span
                    className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                        "bg-amber-600 rotate-45 animate-pulse",
                        config.diamond
                    )}
                />

                {/* Cardinal point markers */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s' }}>
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
                </div>
            </div>

            {text && (
                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground/70 tracking-[0.2em] uppercase font-ui">
                        {text}
                    </span>
                    <span className="w-8 h-px bg-border" />
                </div>
            )}
        </div>
    )
}

const LOADING_TIPS = [
    "Consistent daily reviews build lasting memory",
    "Focus on context, not just translation",
    "Use spaced repetition to your advantage",
    "Speaking aloud strengthens recall",
    "Small daily progress beats cramming",
    "Create mental associations for new words",
    "Review cards when your mind is fresh",
    "Mistakes are opportunities to learn",
]

/** Large corner ornament for loading screen */
export function CornerOrnament() {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main L-frame */}
            <path d="M0 0H50V2H2V50H0V0Z" fill="currentColor" />
            <path d="M0 0H60V1H1V60H0V0Z" fill="currentColor" opacity="0.5" />

            {/* Inner geometric details */}
            <rect x="8" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M11 11L13 13L11 15L9 13Z" fill="currentColor" opacity="0.6" />

            {/* Extended accents */}
            <rect x="20" y="8" width="12" height="2" fill="currentColor" opacity="0.4" />
            <rect x="8" y="20" width="2" height="12" fill="currentColor" opacity="0.4" />

            {/* Diamond markers */}
            <path d="M40 2L42 4L40 6L38 4Z" fill="currentColor" opacity="0.5" />
            <path d="M2 40L4 38L6 40L4 42Z" fill="currentColor" opacity="0.5" />

            {/* Additional line details */}
            <rect x="50" y="0" width="8" height="1" fill="currentColor" opacity="0.3" />
            <rect x="0" y="50" width="1" height="8" fill="currentColor" opacity="0.3" />
        </svg>
    )
}

export interface GameLoadingScreenProps {
    title?: string
    subtitle?: string
    showTip?: boolean
    className?: string
}

export function GameLoadingScreen({
    title = "Loading",
    subtitle,
    showTip = true,
    className
}: GameLoadingScreenProps) {
    const [tipIndex] = React.useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
    const tip = LOADING_TIPS[tipIndex]

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center",
            "bg-background",
            className
        )}>
            {/* Corner ornaments */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-6 left-6 text-amber-500/10">
                    <CornerOrnament />
                </div>
                <div className="absolute top-6 right-6 text-amber-500/10 rotate-90">
                    <CornerOrnament />
                </div>
                <div className="absolute bottom-6 left-6 text-amber-500/10 -rotate-90">
                    <CornerOrnament />
                </div>
                <div className="absolute bottom-6 right-6 text-amber-500/10 rotate-180">
                    <CornerOrnament />
                </div>

                {/* Subtle floating diamonds */}
                {[...Array(8)].map((_, i) => (
                    <span
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-amber-600/15 rotate-45 animate-float"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.3}s`,
                            animationDuration: `${4 + i * 0.4}s`
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative flex flex-col items-center gap-10 px-6">
                {/* Central geometric loader */}
                <div className="relative w-36 h-36">
                    {/* Outer square - slow rotation */}
                    <div
                        className="absolute inset-0 border-2 border-amber-700/20 rotate-45"
                        style={{ animation: 'spin 10s linear infinite' }}
                    />

                    {/* Second square with corner dots */}
                    <div
                        className="absolute inset-4 rotate-45"
                        style={{ animation: 'spin 7s linear infinite reverse' }}
                    >
                        <div className="absolute inset-0 border-2 border-amber-700/30" />
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-600/40" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-600/40" />
                    </div>

                    {/* Third square */}
                    <div
                        className="absolute inset-8 border-2 border-amber-700/40 rotate-45"
                        style={{ animation: 'spin 5s linear infinite' }}
                    />

                    {/* Fourth square */}
                    <div
                        className="absolute inset-12 border-2 border-amber-700/60 rotate-45"
                        style={{ animation: 'spin 4s linear infinite reverse' }}
                    />

                    {/* Inner diamond */}
                    <div className="absolute inset-[56px] bg-amber-600/20 rotate-45" />

                    {/* Center point */}
                    <span
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-600 rotate-45 animate-pulse"
                    />

                    {/* Orbiting accent */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-amber-600/70 rotate-45" />
                    </div>
                </div>

                {/* Title section */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
                            <span className="w-16 h-px bg-amber-600/30" />
                        </div>

                        <h2 className="text-xl font-semibold text-foreground tracking-[0.25em] uppercase font-ui">
                            {title}
                        </h2>

                        <div className="flex items-center gap-1">
                            <span className="w-16 h-px bg-amber-600/30" />
                            <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
                        </div>
                    </div>

                    {subtitle && (
                        <p className="text-sm text-muted-foreground/70 font-medium">
                            {subtitle}
                        </p>
                    )}

                    {/* Loading dots */}
                    <div className="flex items-center gap-2 mt-2">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="w-1.5 h-1.5 bg-amber-600/60 rotate-45 animate-pulse"
                                style={{ animationDelay: `${i * 0.25}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom tip section */}
            {showTip && (
                <div className="absolute bottom-14 left-0 right-0 px-8">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-px bg-amber-600/30" />
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                            <span className="text-[10px] text-amber-500/60 uppercase tracking-[0.25em] font-semibold font-ui">
                                Tip
                            </span>
                            <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
                            <span className="w-4 h-px bg-amber-600/30" />
                        </div>
                        <p className="text-sm text-muted-foreground/50 text-center font-medium italic font-editorial">
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
        <span
            className={cn("inline-flex items-center justify-center w-4 h-4 animate-spin", className)}
            style={{ animationDuration: '0.7s' }}
        >
            <span className="w-2 h-2 bg-current rotate-45 opacity-80" />
        </span>
    )
}
