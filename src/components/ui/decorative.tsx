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
        {/* TODO: Restore SVG path if needed. This was empty/malformed in the source. */}
        <path d="M0 0L12 0L0 12Z" fill="currentColor" opacity="0.5" />
    </svg>
)

const GenshinCornerOptimized = GenshinCorner

interface GenshinCornersProps {
    className?: string
    zIndex?: string
}

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
    variant?: 'default' | 'subtle'
}

export const DiamondDivider = ({ className, variant = 'default' }: DiamondDividerProps) => {
    const isDefault = variant === 'default';
    const borderColor = isDefault ? "border-amber-600/60" : "border-amber-600/40";
    // const bgColor = isDefault ? "bg-amber-600/50" : "bg-amber-600/40"; // Unused
    const lineColor = isDefault ? "from-amber-600/30" : "from-amber-600/20";

    return (
        <div className={cn("relative flex items-center justify-center w-full gap-3 py-1", className)}>
            <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-amber-600/30 to-transparent flex-1", lineColor)} />
            <DiamondMarker size="sm" variant={isDefault ? 'filled' : 'outline'} className={borderColor} />
            <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-amber-600/30 to-transparent flex-1", lineColor)} />
        </div>
    )
}

interface CornerAccentsProps {
    position?: 'all' | 'top-left-bottom-right' | 'top-left' | 'bottom-right'
    size?: 'sm' | 'md' | 'lg'
    className?: string
    visible?: boolean
}

export const CornerAccents = ({
    position = 'top-left-bottom-right',
    size = 'sm',
    className = "border-amber-500",
    visible = true
}: CornerAccentsProps) => {
    if (!visible) return null

    const sizeClasses = {
        sm: "w-2 h-2 border-[1.5px]",
        md: "w-3 h-3 border-2",
        lg: "w-4 h-4 border-2"
    }

    const s = sizeClasses[size] || sizeClasses.sm

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
    size?: 'xs' | 'sm' | 'md' | 'lg'
    variant?: 'filled' | 'outline'
    className?: string
}

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

export const InnerFrame = ({ className }: { className?: string }) => (
    <div className={cn(
        "absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10",
        className
    )} />
)

// ============================================================================
// L-shaped Corner Accents
// ============================================================================

interface LCornerProps {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    thickness?: 'thin' | 'medium'
    className?: string
}

const sizeMap = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-4 h-4'
}

const thicknessMap = {
    thin: 'h-px w-px',      // for the lines
    medium: 'h-0.5 w-0.5'   // thicker lines
}

const positionConfig = {
    'top-left': {
        wrapper: '-top-px -left-px',
        line1: 'absolute top-0 left-0 w-full',
        line2: 'absolute top-0 left-0 h-full'
    },
    'top-right': {
        wrapper: '-top-px -right-px',
        line1: 'absolute top-0 right-0 w-full',
        line2: 'absolute top-0 right-0 h-full'
    },
    'bottom-left': {
        wrapper: '-bottom-px -left-px',
        line1: 'absolute bottom-0 left-0 w-full',
        line2: 'absolute bottom-0 left-0 h-full'
    },
    'bottom-right': {
        wrapper: '-bottom-px -right-px',
        line1: 'absolute bottom-0 right-0 w-full',
        line2: 'absolute bottom-0 right-0 h-full'
    }
}

export const LCorner = ({
    position,
    size = 'sm',
    thickness = 'thin',
    className = 'bg-amber-500/60'
}: LCornerProps) => {
    const config = positionConfig[position]
    const lineHeight = thickness === 'thin' ? 'h-px' : 'h-0.5'
    const lineWidth = thickness === 'thin' ? 'w-px' : 'w-0.5'

    return (
        <span className={cn("absolute pointer-events-none", sizeMap[size], config.wrapper)}>
            <span className={cn(config.line1, lineHeight, className)} />
            <span className={cn(config.line2, lineWidth, className)} />
        </span>
    )
}

interface LCornersProps {
    positions?: 'all' | 'diagonal' | 'top' | 'bottom'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    thickness?: 'thin' | 'medium'
    className?: string
}

export const LCorners = ({
    positions = 'diagonal',
    size = 'sm',
    thickness = 'thin',
    className
}: LCornersProps) => {
    const cornerProps = { size, thickness, className }

    if (positions === 'diagonal') {
        return (
            <>
                <LCorner position="top-left" {...cornerProps} />
                <LCorner position="bottom-right" {...cornerProps} />
            </>
        )
    }

    if (positions === 'top') {
        return (
            <>
                <LCorner position="top-left" {...cornerProps} />
                <LCorner position="top-right" {...cornerProps} />
            </>
        )
    }

    if (positions === 'bottom') {
        return (
            <>
                <LCorner position="bottom-left" {...cornerProps} />
                <LCorner position="bottom-right" {...cornerProps} />
            </>
        )
    }

    // 'all'
    return (
        <>
            <LCorner position="top-left" {...cornerProps} />
            <LCorner position="top-right" {...cornerProps} />
            <LCorner position="bottom-left" {...cornerProps} />
            <LCorner position="bottom-right" {...cornerProps} />
        </>
    )
}

// ============================================================================
// Corner Ornament (SVG decorative corner for loading screens)
// ============================================================================

export function CornerOrnament({ className }: { className?: string }) {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M0 0H50V2H2V50H0V0Z" fill="currentColor" />
            <path d="M0 0H60V1H1V60H0V0Z" fill="currentColor" opacity="0.5" />
            <rect x="8" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M11 11L13 13L11 15L9 13Z" fill="currentColor" opacity="0.6" />
            <rect x="20" y="8" width="12" height="2" fill="currentColor" opacity="0.4" />
            <rect x="8" y="20" width="2" height="12" fill="currentColor" opacity="0.4" />
            <path d="M40 2L42 4L40 6L38 4Z" fill="currentColor" opacity="0.5" />
            <path d="M2 40L4 38L6 40L4 42Z" fill="currentColor" opacity="0.5" />
            <rect x="50" y="0" width="8" height="1" fill="currentColor" opacity="0.3" />
            <rect x="0" y="50" width="1" height="8" fill="currentColor" opacity="0.3" />
        </svg>
    )
}

