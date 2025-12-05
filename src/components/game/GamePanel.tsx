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
    const isInteractive = !!props.onClick

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (props.onKeyDown) {
            props.onKeyDown(e)
        }

        if (!isInteractive) return

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            props.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
    }

    return (
        <div
            {...props}
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
                isInteractive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

                className
            )}
            role={isInteractive ? "button" : props.role}
            tabIndex={isInteractive ? (props.tabIndex ?? 0) : props.tabIndex}
            onKeyDown={handleKeyDown}
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
