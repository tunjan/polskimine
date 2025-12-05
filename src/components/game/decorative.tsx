import * as React from "react"
import { cn } from "@/lib/utils"

/* =============================================================================
   GENSHIN-STYLE DECORATIVE COMPONENTS
   Reusable ornamental elements for consistent UI styling
   ============================================================================= */

/**
 * GenshinCorner SVG - Ornate corner bracket decoration
 * Used individually or via GenshinCorners for all 4 corners
 */
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

interface GenshinCornersProps {
    /** Color classes for the corners (e.g., "text-amber-600/80 dark:text-amber-400/70") */
    className?: string
    /** Additional z-index class if needed */
    zIndex?: string
}

/**
 * GenshinCorners - Renders all 4 ornate corner decorations at once
 * Place inside a relative-positioned container
 */
export const GenshinCorners = ({ className = "text-amber-600/80 dark:text-amber-400/70", zIndex = "z-20" }: GenshinCornersProps) => (
    <>
        <GenshinCorner className={cn("absolute -top-px -left-px pointer-events-none", zIndex, className)} />
        <GenshinCorner className={cn("absolute -top-px -right-px pointer-events-none rotate-90", zIndex, className)} />
        <GenshinCorner className={cn("absolute -bottom-px -left-px pointer-events-none -rotate-90", zIndex, className)} />
        <GenshinCorner className={cn("absolute -bottom-px -right-px pointer-events-none rotate-180", zIndex, className)} />
    </>
)

interface DiamondDividerProps {
    className?: string
    /** Visual variant of the divider */
    variant?: 'default' | 'subtle'
}

/**
 * DiamondDivider - Horizontal divider with diamond ornaments
 * Common separator element in Genshin-style UI
 */
export const DiamondDivider = ({ className, variant = 'default' }: DiamondDividerProps) => (
    <div className={cn("flex items-center gap-3", className)}>
        <span className={cn(
            "flex-1 h-px",
            variant === 'default' ? "bg-amber-600/30" : "bg-amber-600/20"
        )} />
        <span className={cn(
            "w-2 h-2 rotate-45 border",
            variant === 'default' ? "border-amber-600/60" : "border-amber-600/40"
        )} />
        <span className={cn(
            "w-1.5 h-1.5 rotate-45",
            variant === 'default' ? "bg-amber-600/50" : "bg-amber-600/40"
        )} />
        <span className={cn(
            "w-2 h-2 rotate-45 border",
            variant === 'default' ? "border-amber-600/60" : "border-amber-600/40"
        )} />
        <span className={cn(
            "flex-1 h-px",
            variant === 'default' ? "bg-amber-600/30" : "bg-amber-600/20"
        )} />
    </div>
)

interface CornerAccentsProps {
    /** Which corners to show */
    position?: 'all' | 'top-left-bottom-right' | 'top-left' | 'bottom-right'
    /** Size of the corner accent */
    size?: 'sm' | 'md' | 'lg'
    /** Color classes */
    className?: string
    /** Whether accents are visible (useful for conditional styling) */
    visible?: boolean
}

/**
 * CornerAccents - L-shaped corner decorations for buttons and cards
 * Creates the characteristic Genshin button corner style
 */
export const CornerAccents = ({
    position = 'top-left-bottom-right',
    size = 'sm',
    className = "bg-amber-500",
    visible = true
}: CornerAccentsProps) => {
    if (!visible) return null

    const sizeClasses = {
        sm: { corner: "w-2 h-2", bar: "0.5" },
        md: { corner: "w-3 h-3", bar: "0.5" },
        lg: { corner: "w-4 h-4", bar: "px" }
    }
    const s = sizeClasses[size]
    const barHeight = size === 'lg' ? 'h-px' : 'h-0.5'
    const barWidth = size === 'lg' ? 'w-px' : 'w-0.5'

    const TopLeft = () => (
        <span className={cn("absolute -top-px -left-px", s.corner)}>
            <span className={cn("absolute top-0 left-0 w-full", barHeight, className)} />
            <span className={cn("absolute top-0 left-0 h-full", barWidth, className)} />
        </span>
    )

    const TopRight = () => (
        <span className={cn("absolute -top-px -right-px", s.corner)}>
            <span className={cn("absolute top-0 right-0 w-full", barHeight, className)} />
            <span className={cn("absolute top-0 right-0 h-full", barWidth, className)} />
        </span>
    )

    const BottomLeft = () => (
        <span className={cn("absolute -bottom-px -left-px", s.corner)}>
            <span className={cn("absolute bottom-0 left-0 w-full", barHeight, className)} />
            <span className={cn("absolute bottom-0 left-0 h-full", barWidth, className)} />
        </span>
    )

    const BottomRight = () => (
        <span className={cn("absolute -bottom-px -right-px", s.corner)}>
            <span className={cn("absolute bottom-0 right-0 w-full", barHeight, className)} />
            <span className={cn("absolute bottom-0 right-0 h-full", barWidth, className)} />
        </span>
    )

    if (position === 'top-left') return <TopLeft />
    if (position === 'bottom-right') return <BottomRight />
    if (position === 'top-left-bottom-right') {
        return (
            <>
                <TopLeft />
                <BottomRight />
            </>
        )
    }
    // position === 'all'
    return (
        <>
            <TopLeft />
            <TopRight />
            <BottomLeft />
            <BottomRight />
        </>
    )
}

interface DiamondMarkerProps {
    /** Size of the diamond */
    size?: 'xs' | 'sm' | 'md' | 'lg'
    /** Visual style */
    variant?: 'filled' | 'outline'
    /** Color classes (without rotate-45, added automatically) */
    className?: string
}

/**
 * DiamondMarker - Simple rotated square diamond element
 * Used as bullet points, accents, and decorative markers
 */
export const DiamondMarker = ({
    size = 'sm',
    variant = 'filled',
    className
}: DiamondMarkerProps) => {
    const sizeClasses = {
        xs: "w-1 h-1",
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-3 h-3"
    }

    const variantClasses = {
        filled: "bg-amber-600/50",
        outline: "border border-amber-600/60"
    }

    return (
        <span className={cn(
            "rotate-45 shrink-0",
            sizeClasses[size],
            variantClasses[variant],
            className
        )} />
    )
}

/**
 * InnerFrame - Decorative inner border frame for modals and panels
 */
export const InnerFrame = ({ className }: { className?: string }) => (
    <div className={cn(
        "absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10",
        className
    )} />
)
