import * as React from "react"
import { cn } from "@/lib/utils"

interface GameMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
  children: React.ReactNode
}

/**
 * A game-styled menu item with corner arrows that appear on hover.
 * Inspired by Genshin Impact's menu UI.
 */
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
      {/* Corner Arrows - appear on hover */}
      {/* Top Left */}
      <span 
        className={cn(
          "absolute -top-0.5 -left-0.5 w-2 h-2 pointer-events-none transition-all duration-200 ease-out",
          "opacity-0 scale-75 group-hover/game-item:opacity-100 group-hover/game-item:scale-100",
          "border-l-2 border-t-2",
          isActive ? "border-terracotta opacity-100 scale-100" : "border-foreground/60"
        )}
      />
      {/* Top Right */}
      <span 
        className={cn(
          "absolute -top-0.5 -right-0.5 w-2 h-2 pointer-events-none transition-all duration-200 ease-out delay-[25ms]",
          "opacity-0 scale-75 group-hover/game-item:opacity-100 group-hover/game-item:scale-100",
          "border-r-2 border-t-2",
          isActive ? "border-terracotta opacity-100 scale-100" : "border-foreground/60"
        )}
      />
      {/* Bottom Left */}
      <span 
        className={cn(
          "absolute -bottom-0.5 -left-0.5 w-2 h-2 pointer-events-none transition-all duration-200 ease-out delay-[50ms]",
          "opacity-0 scale-75 group-hover/game-item:opacity-100 group-hover/game-item:scale-100",
          "border-l-2 border-b-2",
          isActive ? "border-terracotta opacity-100 scale-100" : "border-foreground/60"
        )}
      />
      {/* Bottom Right */}
      <span 
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2 h-2 pointer-events-none transition-all duration-200 ease-out delay-[75ms]",
          "opacity-0 scale-75 group-hover/game-item:opacity-100 group-hover/game-item:scale-100",
          "border-r-2 border-b-2",
          isActive ? "border-terracotta opacity-100 scale-100" : "border-foreground/60"
        )}
      />
      
      {children}
    </div>
  )
}

/**
 * Variant with diamond/rhombus style arrows pointing inward
 */
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
      {/* Corner Diamonds - appear on hover */}
      {/* Top Left */}
      <span 
        className={cn(
          "absolute top-1 left-1 w-1.5 h-1.5 pointer-events-none transition-all duration-200 ease-out rotate-45",
          "opacity-0 -translate-x-1 -translate-y-1 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "bg-terracotta opacity-100 translate-x-0 translate-y-0" : "bg-foreground/60"
        )}
      />
      {/* Top Right */}
      <span 
        className={cn(
          "absolute top-1 right-1 w-1.5 h-1.5 pointer-events-none transition-all duration-200 ease-out delay-[25ms] rotate-45",
          "opacity-0 translate-x-1 -translate-y-1 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "bg-terracotta opacity-100 translate-x-0 translate-y-0" : "bg-foreground/60"
        )}
      />
      {/* Bottom Left */}
      <span 
        className={cn(
          "absolute bottom-1 left-1 w-1.5 h-1.5 pointer-events-none transition-all duration-200 ease-out delay-[50ms] rotate-45",
          "opacity-0 -translate-x-1 translate-y-1 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "bg-terracotta opacity-100 translate-x-0 translate-y-0" : "bg-foreground/60"
        )}
      />
      {/* Bottom Right */}
      <span 
        className={cn(
          "absolute bottom-1 right-1 w-1.5 h-1.5 pointer-events-none transition-all duration-200 ease-out delay-[75ms] rotate-45",
          "opacity-0 translate-x-1 translate-y-1 group-hover/game-item:opacity-100 group-hover/game-item:translate-x-0 group-hover/game-item:translate-y-0",
          isActive ? "bg-terracotta opacity-100 translate-x-0 translate-y-0" : "bg-foreground/60"
        )}
      />
      
      {children}
    </div>
  )
}

/**
 * Chevron/Arrow variant pointing inward from corners
 */
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
            isActive ? "fill-terracotta" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
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
            isActive ? "fill-terracotta" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
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
            isActive ? "fill-terracotta" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
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
            isActive ? "fill-terracotta" : "fill-foreground/60 group-hover/game-item:fill-foreground/80"
          )}
        />
      </svg>
      
      {children}
    </div>
  )
}
