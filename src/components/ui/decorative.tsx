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
        {className ?: string
        zIndex?: string
}

        export const GenshinCorners = ({className = "text-amber-600/80 dark:text-amber-400/70", zIndex = "z-20"}: GenshinCornersProps) => (
        <>
            <GenshinCornerOptimized className={cn("absolute -top-px -left-px pointer-events-none", zIndex, className)} />
            <GenshinCornerOptimized className={cn("absolute -top-px -right-px pointer-events-none rotate-90", zIndex, className)} />
            <GenshinCornerOptimized className={cn("absolute -bottom-px -left-px pointer-events-none -rotate-90", zIndex, className)} />
            <GenshinCornerOptimized className={cn("absolute -bottom-px -right-px pointer-events-none rotate-180", zIndex, className)} />
        </>
        )

        interface DiamondDividerProps {
            className ?: string
        variant?: 'default' | 'subtle'
}

        export const DiamondDivider = ({className, variant = 'default'}: DiamondDividerProps) => {
    const isDefault = variant === 'default';
        const borderColor = isDefault ? "border-amber-600/60" : "border-amber-600/40";
        const bgColor = isDefault ? "bg-amber-600/50" : "bg-amber-600/40";
        const lineColor = isDefault ? "from-amber-600/30" : "from-amber-600/20";

        return (
        <div className={cn("relative flex items-center justify-center w-full gap-3 py-1", className)}>
            {position ?: 'all' | 'top-left-bottom-right' | 'top-left' | 'bottom-right'
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
                sm: "w-2 h-2 border-[1.5px]",         md: "w-3 h-3 border-2",
            lg: "w-4 h-4 border-2"
    }

            const s = sizeClasses[size]

            const Corner = ({pos, borders}: {pos: string, borders: string }) => (
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
                size ?: 'xs' | 'sm' | 'md' | 'lg'
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

            export const InnerFrame = ({className}: {className ?: string}) => (
            <div className={cn(
                "absolute inset-3 border border-amber-700/15 dark:border-amber-600/10 pointer-events-none z-10",
                className
            )} />
            )
