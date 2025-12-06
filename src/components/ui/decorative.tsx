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
        {/* Combined Path for all elements */}
        <path
            d="M0 0H36V2H2V36H0V0ZM5 5H24V6.5H6.5V24H5V5ZM28 5H32V6.5H28V5ZM34 5H35.5V6.5H34V5ZM5 28H6.5V32H5V28ZM5 34H6.5V35.5H5V34ZM40 0H46V2H40V0ZM0 40H2V46H0V40ZM46 1L47 2L46 3L45 2L46 1ZM2 45L3 46L2 47L1 46L2 45Z"
            fill="currentColor"
        />
    </svg>
)

// Re-implementing with split paths to preserve opacity levels
export const GenshinCornerOptimized = ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        {/* Main Corner - Opacity 1 */}
        <path d="M0 0H36V2H2V36H0V0Z" fill="currentColor" />

        {/* Inner Elements - Opacity 0.6 */}
        <path
            d="M5 5H24V6.5H6.5V24H5V5ZM46 1L47 2L46 3L45 2Z M1 46L2 47L3 46L2 45Z"
            fill="currentColor"
            opacity="0.6"
        />

        {/* Accents - Opacity 0.5 */}
        <path
            d="M28 5H32V6.5H28V5ZM34 5H35.5V6.5H34V5ZM5 28H6.5V32H5V28ZM5 34H6.5V35.5H5V34ZM40 0H46V2H40V0ZM0 40H2V46H0V40"
            fill="currentColor"
            opacity="0.5"
        />
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
        <GenshinCornerOptimized className={cn("absolute -top-px -left-px pointer-events-none", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -top-px -right-px pointer-events-none rotate-90", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -bottom-px -left-px pointer-events-none -rotate-90", zIndex, className)} />
        <GenshinCornerOptimized className={cn("absolute -bottom-px -right-px pointer-events-none rotate-180", zIndex, className)} />
    </>
)

interface DiamondDividerProps {
    className?: string
    /** Visual variant of the divider */
    variant?: 'default' | 'subtle'
}

/**
 * DiamondDivider - Horizontal divider with diamond ornaments
 * Optimized to use CSS pseudo-elements instead of multiple DOM nodes
 */
export const DiamondDivider = ({ className, variant = 'default' }: DiamondDividerProps) => {
    const isDefault = variant === 'default';
    const borderColor = isDefault ? "border-amber-600/60" : "border-amber-600/40";
    const bgColor = isDefault ? "bg-amber-600/50" : "bg-amber-600/40";
    const lineColor = isDefault ? "from-amber-600/30" : "from-amber-600/20";

    return (
        <div className={cn("relative flex items-center justify-center w-full gap-3 py-1", className)}>
            {/* Left Line */}
            <div className={cn("flex-1 h-px bg-linear-to-l to-transparent", lineColor)} />

            {/* Center Diamonds Container */}
            <div className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rotate-45 border", borderColor)} />
                <span className={cn("w-1.5 h-1.5 rotate-45", bgColor)} />
                <span className={cn("w-2 h-2 rotate-45 border", borderColor)} />
            </div>

            {/* Right Line */}
            <div className={cn("flex-1 h-px bg-linear-to-r to-transparent", lineColor)} />
        </div>
    )
}

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
 * Optimized to use CSS borders instead of nested elements
 */
export const CornerAccents = ({
    position = 'top-left-bottom-right',
    size = 'sm',
    className = "border-amber-500",
    visible = true
}: CornerAccentsProps) => {
    if (!visible) return null

    const sizeClasses = {
        sm: "w-2 h-2 border-[1.5px]", // Reduced thickness for small size
        md: "w-3 h-3 border-2",
        lg: "w-4 h-4 border-2"
    }

    const s = sizeClasses[size]

    // Helper for corner elements
    const Corner = ({ pos, borders }: { pos: string, borders: string }) => (
        <span className={cn(
            "absolute pointer-events-none",
            s,
            borders,
            pos,
            className
        )} />
    )

    const TopLeft = () => <Corner pos="-top-px -left-px" borders="border-t border-l border-r-0 border-b-0" />
    const TopRight = () => <Corner pos="-top-px -right-px" borders="border-t border-r border-l-0 border-b-0" />
    const BottomLeft = () => <Corner pos="-bottom-px -left-px" borders="border-b border-l border-r-0 border-t-0" />
    const BottomRight = () => <Corner pos="-bottom-px -right-px" borders="border-b border-r border-l-0 border-t-0" />

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
