import * as React from "react"
import { cn } from "@/lib/utils"
import { GenshinCorner, GenshinCorners } from "./decorative"

// Re-export decorative components for backwards compatibility
export { GenshinCorner, GenshinCorners } from "./decorative"
export { DiamondDivider, CornerAccents, DiamondMarker, InnerFrame } from "./decorative"

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
            {showCorners && <GenshinCorners />}

            {/* Ornate variant has additional inner frame */}
            {variant === 'ornate' && (
                <div className="absolute inset-2 border border-amber-700/20 pointer-events-none" />
            )}

            {children}
        </div>
    )
}
