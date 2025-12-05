import * as React from "react"
import { cn } from "@/lib/utils"

interface GameMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
  children: React.ReactNode
}

export function GameMenuItem({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GameMenuItemDiamond({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GameMenuItemChevron({
  isActive = false,
  className,
  children,
  ...props
}: GameMenuItemProps) {
  return (
    <div
      className={cn(
        "relative group/game-item overflow-visible",
        className
      )}
      {...props}
    >
      {/* Corner Chevrons - appear on hover */}
      {/* Top Left - pointing down-right */}
      <svg
        className={cn(
          "absolute -top-1 -left-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out",
          "opacity-0 -translate-x-0.5 -translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2 2 L2 6 L3 6 L3 3 L6 3 L6 2 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Top Right - pointing down-left */}
      <svg
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[25ms]",
          "opacity-0 translate-x-0.5 -translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M10 2 L10 6 L9 6 L9 3 L6 3 L6 2 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Bottom Left - pointing up-right */}
      <svg
        className={cn(
          "absolute -bottom-1 -left-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[50ms]",
          "opacity-0 -translate-x-0.5 translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2 10 L2 6 L3 6 L3 9 L6 9 L6 10 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {/* Bottom Right - pointing up-left */}
      <svg
        className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 pointer-events-none transition-all duration-200 ease-out delay-[75ms]",
          "opacity-0 translate-x-0.5 translate-y-0.5 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "opacity-100 translate-x-0 translate-y-0" : ""
        )}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M10 10 L10 6 L9 6 L9 9 L6 9 L6 10 Z"
          className={cn(
            "transition-colors",
            isActive ? "fill-amber-500" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>

      {children}
    </div>
  )
}
