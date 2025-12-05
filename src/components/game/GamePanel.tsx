import * as React from "react"
import { cn } from "@/lib/utils"

export const GenshinCorner = ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Primary Corner Bracket */}
        <path d="M0 0H36V2H2V36H0V0Z" fill="currentColor" />

        {/* Secondary Inner Bracket */}
        <path d="M5 5H24V6.5H6.5V24H5V5Z" fill="currentColor" opacity="0.6" />

        {/* Small Accents along top */}
        <rect x="28" y="5" width="4" height="1.5" fill="currentColor" opacity="0.5" />
        <rect x="34" y="5" width="1.5" height="1.5" fill="currentColor" opacity="0.5" />

        {/* Small Accents along side */}
        <rect x="5" y="28" width="1.5" height="4" fill="currentColor" opacity="0.5" />
        <rect x="5" y="34" width="1.5" height="1.5" fill="currentColor" opacity="0.5" />

        {/* Distant decorative elements */}
        <rect x="40" y="0" width="6" height="2" fill="currentColor" opacity="0.4" />
        <rect x="0" y="40" width="2" height="6" fill="currentColor" opacity="0.4" />

        {/* Floating diamonds at ends */}
        <path d="M46 1L47 2L46 3L45 2Z" fill="currentColor" opacity="0.6" />
        <path d="M1 46L2 47L3 46L2 45Z" fill="currentColor" opacity="0.6" />
    </svg>
)

export interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'highlight' | 'stat' | 'ornate'
    size?: 'sm' | 'md' | 'lg'
    showCorners?: boolean
    glowOnHover?: boolean
}

export function GamePanel({
    className,
    variant = 'default',
    size = 'md',
    showCorners = false,
    glowOnHover = false,
    children,
    ...props
}: GamePanelProps) {
    return (
        <div
            className={cn(
                "relative group/panel",
                "bg-card",

                variant === 'default' && "border-2 border-amber-700/20 dark:border-amber-700/25",
                variant === 'highlight' && "border-2 border-amber-700/40 dark:border-amber-400/35",
                variant === 'stat' && "border border-amber-700/15 dark:border-amber-700/20",
                variant === 'ornate' && "border-2 border-amber-700/50 dark:border-amber-400/40",

                size === 'sm' && "p-3",
                size === 'md' && "p-4 md:p-5",
                size === 'lg' && "p-5 md:p-6",

                glowOnHover && "transition-colors duration-200 ",

                className
            )}
            {...props}
        >
            {/* Ornate corner decorations */}
            {showCorners && (
                <>
                    <GenshinCorner className="absolute -top-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none" />
                    <GenshinCorner className="absolute -top-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none rotate-90" />
                    <GenshinCorner className="absolute -bottom-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none -rotate-90" />
                    <GenshinCorner className="absolute -bottom-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none rotate-180" />
                </>
            )}

            {/* Ornate variant has additional inner frame */}
            {variant === 'ornate' && (
                <div className="absolute inset-2 border border-amber-700/20 pointer-events-none" />
            )}

            {children}
        </div>
    )
}
