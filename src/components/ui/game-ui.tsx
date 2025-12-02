import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A game-styled panel with decorative corners, similar to Genshin Impact UI
 */
interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'stat'
  size?: 'sm' | 'md' | 'lg'
  showCorners?: boolean
  glowOnHover?: boolean
}

export function GamePanel({ 
  className, 
  variant = 'default',
  size = 'md',
  showCorners = true,
  glowOnHover = false,
  children,
  ...props 
}: GamePanelProps) {
  return (
    <div
      className={cn(
        "relative group/panel",
        // Base styling
        "bg-card",
        // Border styling
        "border border-border",
        // Size variants
        size === 'sm' && "p-3",
        size === 'md' && "p-4 md:p-5",
        size === 'lg' && "p-5 md:p-6",
        // Variant styling - highlight has a subtle accent background
        variant === 'highlight' && "border-primary/50 shadow-sm",
        variant === 'stat' && "border-border/70",
        // Hover glow effect
        glowOnHover && "transition-shadow duration-300 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    >
      {/* Corner decorations */}
      {showCorners && (
        <>
          {/* Top Left Corner */}
          <span className="absolute -top-px -left-px w-3 h-3 pointer-events-none">
            <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
            <span className="absolute top-0 left-0 h-full w-0.5 bg-primary" />
          </span>
          
          {/* Top Right Corner */}
          <span className="absolute -top-px -right-px w-3 h-3 pointer-events-none">
            <span className="absolute top-0 right-0 w-full h-0.5 bg-primary" />
            <span className="absolute top-0 right-0 h-full w-0.5 bg-primary" />
          </span>
          
          {/* Bottom Left Corner */}
          <span className="absolute -bottom-px -left-px w-3 h-3 pointer-events-none">
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
            <span className="absolute bottom-0 left-0 h-full w-0.5 bg-primary" />
          </span>
          
          {/* Bottom Right Corner */}
          <span className="absolute -bottom-px -right-px w-3 h-3 pointer-events-none">
            <span className="absolute bottom-0 right-0 w-full h-0.5 bg-primary" />
            <span className="absolute bottom-0 right-0 h-full w-0.5 bg-primary" />
          </span>
        </>
      )}
      
      {children}
    </div>
  )
}

/**
 * A stat display with game-style decorations
 */
interface GameStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
}

export function GameStat({ 
  label, 
  value, 
  sublabel,
  icon,
  trend,
  size = 'md',
  className,
  ...props 
}: GameStatProps) {
  return (
    <GamePanel 
      variant="stat" 
      size="sm" 
      className={cn(
        "group/stat transition-all duration-200",
        "hover:border-primary/40 hover:bg-card",
        className
      )}
      glowOnHover
      {...props}
    >
      <div className="relative">
        {/* Diamond accent */}
        <span className="absolute -top-1 -left-1 w-1.5 h-1.5 rotate-45 bg-primary/40 group-hover/stat:bg-primary/70 transition-colors" />
        
        {/* Label with optional icon */}
        <div className="flex items-center gap-1.5 mb-2">
          {icon && (
            <span className="text-muted-foreground/70 group-hover/stat:text-primary/70 transition-colors">
              {icon}
            </span>
          )}
          <p className={cn(
            "uppercase tracking-[0.15em] text-muted-foreground font-light font-ui",
            size === 'sm' && "text-[9px]",
            size === 'md' && "text-[10px]",
            size === 'lg' && "text-[11px]"
          )}>
            {label}
          </p>
        </div>
        
        {/* Value */}
        <p className={cn(
          "font-light text-foreground tabular-nums tracking-tight",
          size === 'sm' && "text-xl",
          size === 'md' && "text-2xl md:text-3xl",
          size === 'lg' && "text-3xl md:text-4xl"
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        
        {/* Sublabel */}
        {sublabel && (
          <p className="text-[10px] text-muted-foreground/60 mt-1 font-light font-ui">
            {sublabel}
          </p>
        )}
      </div>
    </GamePanel>
  )
}

/**
 * Game-style section header with decorative line
 */
interface GameSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

export function GameSectionHeader({ 
  title, 
  subtitle, 
  icon,
  className,
  ...props 
}: GameSectionHeaderProps) {
  return (
    <div className={cn("mb-5 md:mb-6", className)} {...props}>
      <div className="flex items-center gap-3 mb-1">
        {/* Decorative diamond */}
        <span className="w-2 h-2 rotate-45 bg-primary/60" />
        
        {/* Title */}
        <h2 className="text-lg md:text-xl font-medium text-foreground tracking-tight font-ui flex items-center gap-2">
          {icon && <span className="text-primary/70">{icon}</span>}
          {title}
        </h2>
        
        {/* Decorative line */}
        <span className="flex-1 h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent" />
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground font-light pl-5">
          {subtitle}
        </p>
      )}
    </div>
  )
}

/**
 * Game-style progress bar with decorative elements
 */
interface GameProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'xp' | 'health'
  size?: 'sm' | 'md' | 'lg'
}

export function GameProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: GameProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-xs text-muted-foreground font-light font-ui">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs text-foreground font-medium tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress bar container */}
      <div className={cn(
        "relative w-full bg-muted/50 overflow-hidden",
        "border border-border/30",
        size === 'sm' && "h-1.5",
        size === 'md' && "h-2",
        size === 'lg' && "h-3"
      )}>
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
        <span className="absolute top-0 right-0 w-1 h-full bg-primary/30" />
        
        {/* Fill bar */}
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out relative",
            variant === 'default' && "bg-white",
            variant === 'xp' && "bg-gradient-to-r from-foreground via-foreground to-primary",
            variant === 'health' && "bg-gradient-to-r from-green-500 to-green-400"
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          
          {/* Moving highlight */}
          <span className="absolute top-0 right-0 w-4 h-full bg-gradient-to-r from-transparent to-white/30" />
        </div>
      </div>
    </div>
  )
}

/**
 * Game-style button with corner accents
 */
interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function GameButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={cn(
        "relative group/btn inline-flex items-center justify-center gap-2 font-ui uppercase tracking-[0.1em] transition-all duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Size variants
        size === 'sm' && "h-8 px-4 text-[10px]",
        size === 'md' && "h-10 px-6 text-xs",
        size === 'lg' && "h-12 px-8 text-sm",
        // Variant styling
        variant === 'primary' && [
          "bg-primary text-foreground",
          "hover:bg-primary/90",
          "border-none"
        ],
        variant === 'secondary' && [
          "bg-card text-foreground",
          "hover:bg-card/80",
          "border border-border"
        ],
        variant === 'ghost' && [
          "bg-transparent text-muted-foreground",
          "hover:text-foreground hover:bg-card/50",
          "border border-transparent"
        ],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {/* Corner accents that appear on hover */}
      <span className={cn(
        "absolute -top-px -left-px w-2 h-2 border-l-2 border-t-2 transition-opacity duration-200",
        "opacity-0 group-hover/btn:opacity-100",
        variant === 'primary' && "border-foreground/50",
        variant === 'secondary' && "border-primary/50",
        variant === 'ghost' && "border-foreground/30"
      )} />
      <span className={cn(
        "absolute -top-px -right-px w-2 h-2 border-r-2 border-t-2 transition-opacity duration-200",
        "opacity-0 group-hover/btn:opacity-100",
        variant === 'primary' && "border-foreground/50",
        variant === 'secondary' && "border-primary/50",
        variant === 'ghost' && "border-foreground/30"
      )} />
      <span className={cn(
        "absolute -bottom-px -left-px w-2 h-2 border-l-2 border-b-2 transition-opacity duration-200",
        "opacity-0 group-hover/btn:opacity-100",
        variant === 'primary' && "border-foreground/50",
        variant === 'secondary' && "border-primary/50",
        variant === 'ghost' && "border-foreground/30"
      )} />
      <span className={cn(
        "absolute -bottom-px -right-px w-2 h-2 border-r-2 border-b-2 transition-opacity duration-200",
        "opacity-0 group-hover/btn:opacity-100",
        variant === 'primary' && "border-foreground/50",
        variant === 'secondary' && "border-primary/50",
        variant === 'ghost' && "border-foreground/30"
      )} />
      
      {children}
    </button>
  )
}

/**
 * Game-style metric row
 */
interface GameMetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
}

export function GameMetricRow({
  icon,
  label,
  value,
  unit,
  className,
  ...props
}: GameMetricRowProps) {
  return (
    <div 
      className={cn(
        "group/metric relative bg-card/60 border border-border/40 p-3 md:p-4",
        "flex items-center justify-between",
        "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
        className
      )}
      {...props}
    >
      {/* Left accent line */}
      <span className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-primary/40 group-hover/metric:bg-primary/70 transition-colors" />
      
      <div className="flex items-center gap-2.5 pl-2">
        <span className="text-muted-foreground/60 group-hover/metric:text-primary/70 transition-colors">
          {icon}
        </span>
        <span className="text-sm text-muted-foreground font-light font-ui">
          {label}
        </span>
      </div>
      
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg md:text-xl font-light text-foreground tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground font-light">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Animated divider with game styling
 */
export function GameDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 my-6", className)}>
      <span className="w-2 h-2 rotate-45 bg-border/80" />
      <span className="flex-1 h-px bg-linear-to-r from-border via-border/90 to-transparent" />
      <span className="w-1.5 h-1.5 rotate-45 bg-border/70" />
      <span className="flex-1 h-px bg-linear-to-l from-border via-border/90 to-transparent" />
      <span className="w-2 h-2 rotate-45 bg-border/80" />
    </div>
  )
}
