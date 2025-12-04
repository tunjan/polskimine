import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A game-styled panel with decorative corners, similar to Genshin Impact UI
 */

const CornerSvg = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M0 0H12V1H1V12H0V0Z" fill="currentColor" />
    <rect x="2" y="2" width="2" height="2" fill="currentColor" />
    <rect x="5" y="2" width="3" height="1" fill="currentColor" className="opacity-50" />
    <rect x="2" y="5" width="1" height="3" fill="currentColor" className="opacity-50" />
    
    {/* Diagonal Rhombus */}
    <path d="M5 4L6 5L5 6L4 5Z" fill="currentColor" className="opacity-40" />
    
    {/* Horizontal Rhombus */}
    <path d="M13.5 0L14.5 1L13.5 2L12.5 1Z" fill="currentColor" className="opacity-60" />
    
    {/* Vertical Rhombus */}
    <path d="M0 13.5L1 12.5L2 13.5L1 14.5Z" fill="currentColor" className="opacity-60" />
  </svg>
)

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
        
        "border border-border",
        
        size === 'sm' && "p-3",
        size === 'md' && "p-4 md:p-5",
        size === 'lg' && "p-5 md:p-6",
        
        variant === 'highlight' && "border-primary/50 shadow-sm",
        variant === 'stat' && "border-border/70",
        
        glowOnHover && "transition-shadow duration-300 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    >
      {/* Corner decorations */}
      {showCorners && (
        <>
          {/* Top Left Corner */}
          <CornerSvg className="absolute -top-px -left-px text-primary pointer-events-none" />
          
          {/* Top Right Corner */}
          <CornerSvg className="absolute -top-px -right-px text-primary pointer-events-none rotate-90" />
          
          {/* Bottom Left Corner */}
          <CornerSvg className="absolute -bottom-px -left-px text-primary pointer-events-none -rotate-90" />
          
          {/* Bottom Right Corner */}
          <CornerSvg className="absolute -bottom-px -right-px text-primary pointer-events-none rotate-180" />
        </>
      )}
      
      {children}
    </div>
  )
}

/**
 * A stat display with game-style decorations
 * Uses CSS variables for theming compatibility with LanguageThemeManager
 */
interface GameStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'blue' | 'green' | 'amber' | 'rose' | 'purple' | 'sky' | 'emerald' | 'violet'
}

// Color styles using CSS custom properties for theme compatibility
// These map to semantic colors that can be overridden by the theme
const getStatColorStyles = (color: GameStatProps['color']) => {
  // Use CSS variables with fallbacks for theme integration
  const colorMap: Record<NonNullable<GameStatProps['color']>, { 
    bg: string; 
    text: string; 
    border: string;
    cssVar?: string;
  }> = {
    default: { 
      bg: "bg-primary/40", 
      text: "text-primary/70", 
      border: "hover:border-primary/40",
      cssVar: "hsl(var(--primary))"
    },
    blue: { 
      bg: "bg-[hsl(var(--stat-blue,217_91%_60%)/0.4)]", 
      text: "text-[hsl(var(--stat-blue,217_91%_60%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-blue,217_91%_60%)/0.4)]"
    },
    sky: { 
      bg: "bg-[hsl(var(--stat-sky,199_89%_48%)/0.4)]", 
      text: "text-[hsl(var(--stat-sky,199_89%_48%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-sky,199_89%_48%)/0.4)]"
    },
    green: { 
      bg: "bg-[hsl(var(--stat-green,142_71%_45%)/0.4)]", 
      text: "text-[hsl(var(--stat-green,142_71%_45%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-green,142_71%_45%)/0.4)]"
    },
    emerald: { 
      bg: "bg-[hsl(var(--stat-emerald,160_84%_39%)/0.4)]", 
      text: "text-[hsl(var(--stat-emerald,160_84%_39%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-emerald,160_84%_39%)/0.4)]"
    },
    amber: { 
      bg: "bg-[hsl(var(--stat-amber,38_92%_50%)/0.4)]", 
      text: "text-[hsl(var(--stat-amber,38_92%_50%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-amber,38_92%_50%)/0.4)]"
    },
    rose: { 
      bg: "bg-[hsl(var(--stat-rose,350_89%_60%)/0.4)]", 
      text: "text-[hsl(var(--stat-rose,350_89%_60%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-rose,350_89%_60%)/0.4)]"
    },
    purple: { 
      bg: "bg-[hsl(var(--stat-purple,270_91%_65%)/0.4)]", 
      text: "text-[hsl(var(--stat-purple,270_91%_65%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-purple,270_91%_65%)/0.4)]"
    },
    violet: { 
      bg: "bg-[hsl(var(--stat-violet,258_90%_66%)/0.4)]", 
      text: "text-[hsl(var(--stat-violet,258_90%_66%)/0.7)]", 
      border: "hover:border-[hsl(var(--stat-violet,258_90%_66%)/0.4)]"
    },
  };
  
  return colorMap[color || 'default'];
};

export function GameStat({ 
  label, 
  value, 
  sublabel,
  icon,
  trend,
  size = 'md',
  className,
  color = 'default',
  ...props 
}: GameStatProps) {
  const styles = getStatColorStyles(color);

  return (
    <GamePanel 
      variant="stat" 
      size="sm" 
      className={cn(
        "group/stat transition-all duration-200",
        "hover:bg-card",
        styles.border,
        className
      )}
      glowOnHover
      {...props}
    >
      <div className="relative">
        {/* Diamond accent */}
        <span className={cn(
          "absolute -top-1 -right-1 w-1.5 h-1.5 rotate-45 transition-colors",
          styles.bg,
          `group-hover/stat:${styles.bg.replace('/40', '/70')}`
        )} />
        
        {/* Label with optional icon */}
        <div className="flex items-center gap-1.5 mb-2">
          {icon && (
            <span className={cn(
              "transition-colors",
              styles.text
            )}>
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
        "relative group/btn inline-flex items-center  justify-center gap-2 font-ui uppercase tracking-[0.1em] transition-all duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        
        size === 'sm' && "h-8 px-4 text-[10px]",
        size === 'md' && "h-10 px-6 text-xs",
        size === 'lg' && "h-12 px-8 text-sm",
        
        variant === 'primary' && [
          "bg-primary/10 text-foreground",
          "hover:bg-primary/20",
          "border border-primary",
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
        <span className="text-primary/70 transition-colors">
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

/**
 * Game-style loading spinner with diamond animation
 */
interface GameLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function GameLoader({ size = 'md', text, className }: GameLoaderProps) {
  const sizeConfig = {
    sm: { container: 'w-10 h-10', inner: 'inset-1', innermost: 'inset-2', diamond: 'w-1 h-1' },
    md: { container: 'w-16 h-16', inner: 'inset-2', innermost: 'inset-4', diamond: 'w-2 h-2' },
    lg: { container: 'w-24 h-24', inner: 'inset-3', innermost: 'inset-6', diamond: 'w-3 h-3' }
  }

  const config = sizeConfig[size]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", config.container)}>
        {/* Outer rotating diamond - spins slowly clockwise */}
        <div 
          className="absolute inset-0 border border-border/50 rotate-45 animate-spin"
          style={{ animationDuration: '3s' }}
        />
        {/* Middle rotating diamond - spins counter-clockwise */}
        <div 
          className={cn("absolute border border-primary/40 rotate-45", config.inner)}
          style={{ animation: 'spin 2s linear infinite reverse' }}
        />
        {/* Inner rotating diamond - spins faster clockwise */}
        <div 
          className={cn("absolute border border-primary/60 rotate-45 animate-spin", config.innermost)}
          style={{ animationDuration: '1.5s' }}
        />
        {/* Center diamond dot - pulses */}
        <span 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary rotate-45 animate-pulse",
            config.diamond
          )} 
        />
        {/* Rotating accent lines */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-primary/60" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-primary/60" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-primary/60" />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-primary/60" />
        </div>
      </div>
      
      {text && (
        <div className="flex items-center justify-center gap-3">
          <span className="w-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-light text-muted-foreground/60 tracking-[0.15em] uppercase font-ui animate-pulse">
            {text}
          </span>
          <span className="w-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}
    </div>
  )
}

/**
 * Immersive full-screen loading state inspired by Genshin Impact
 * Features animated geometric patterns, subtle particles, and elegant typography
 */

const LOADING_TIPS = [
  "Consistent daily reviews build lasting memory",
  "Focus on context, not just translation",
  "Use spaced repetition to your advantage",
  "Speaking aloud strengthens recall",
  "Small daily progress beats cramming",
  "Create mental associations for new words",
  "Review cards when your mind is fresh",
  "Mistakes are opportunities to learn",
]

interface GameLoadingScreenProps {
  title?: string
  subtitle?: string
  showTip?: boolean
  className?: string
}

export function GameLoadingScreen({ 
  title = "Loading", 
  subtitle,
  showTip = true,
  className 
}: GameLoadingScreenProps) {
  const [tipIndex] = React.useState(() => Math.floor(Math.random() * LOADING_TIPS.length))
  const tip = LOADING_TIPS[tipIndex]

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center",
      "bg-background",
      className
    )}>
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Corner ornaments */}
        <div className="absolute top-8 left-8 opacity-[0.08]">
          <CornerOrnament />
        </div>
        <div className="absolute top-8 right-8 opacity-[0.08] rotate-90">
          <CornerOrnament />
        </div>
        <div className="absolute bottom-8 left-8 opacity-[0.08] -rotate-90">
          <CornerOrnament />
        </div>
        <div className="absolute bottom-8 right-8 opacity-[0.08] rotate-180">
          <CornerOrnament />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rotate-45 animate-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Horizontal accent lines */}
        <div className="absolute left-0 right-0 top-1/3 flex items-center justify-center opacity-[0.04]">
          <div className="flex-1 max-w-xs h-px bg-linear-to-r from-transparent via-foreground to-transparent" />
        </div>
        <div className="absolute left-0 right-0 bottom-1/3 flex items-center justify-center opacity-[0.04]">
          <div className="flex-1 max-w-xs h-px bg-linear-to-r from-transparent via-foreground to-transparent" />
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 px-6">
        {/* Central loader animation */}
        <div className="relative w-32 h-32">
          {/* Outermost ring - very slow rotation */}
          <div 
            className="absolute inset-0 border border-border/30 rotate-45"
            style={{ animation: 'spin 8s linear infinite' }}
          />
          
          {/* Second ring with dots at corners */}
          <div 
            className="absolute inset-3 rotate-45"
            style={{ animation: 'spin 6s linear infinite reverse' }}
          >
            <div className="absolute inset-0 border border-primary/20" />
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-primary/40 rotate-45" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-primary/40 rotate-45" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-primary/40 rotate-45" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-primary/40 rotate-45" />
          </div>
          
          {/* Third ring */}
          <div 
            className="absolute inset-6 border border-primary/30 rotate-45"
            style={{ animation: 'spin 4s linear infinite' }}
          />
          
          {/* Fourth ring with glow */}
          <div 
            className="absolute inset-9 border border-primary/50 rotate-45 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]"
            style={{ animation: 'spin 3s linear infinite reverse' }}
          />
          
          {/* Innermost diamond */}
          <div className="absolute inset-[52px] bg-primary/10 rotate-45 animate-pulse" />
          
          {/* Center point */}
          <span 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rotate-45"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
          
          {/* Orbiting accent dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-1.5 h-1.5 bg-primary/60 rotate-45" />
          </div>
          <div className="absolute inset-0" style={{ animation: 'spin 4s linear infinite reverse' }}>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-1.5 h-1.5 bg-primary/40 rotate-45" />
          </div>
        </div>
        
        {/* Title section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-4">
            <span className="w-12 h-px bg-linear-to-r from-transparent to-border" />
            <h2 className="text-lg font-light text-foreground tracking-[0.2em] uppercase font-ui">
              {title}
            </h2>
            <span className="w-12 h-px bg-linear-to-l from-transparent to-border" />
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground/70 font-light">
              {subtitle}
            </p>
          )}
          
          {/* Animated dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 bg-primary/60 rotate-45 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom tip section */}
      {showTip && (
        <div className="absolute bottom-12 left-0 right-0 px-8">
          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-primary/40 rotate-45" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] font-ui">
                Tip
              </span>
              <span className="w-1 h-1 bg-primary/40 rotate-45" />
            </div>
            <p className="text-sm text-muted-foreground/60 text-center font-light italic font-editorial">
              "{tip}"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Corner ornament for loading screen decoration */
function CornerOrnament() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main corner frame */}
      <path d="M0 0H40V2H2V40H0V0Z" fill="currentColor" />
      <path d="M0 0H50V1H1V50H0V0Z" fill="currentColor" opacity="0.5" />
      
      {/* Inner details */}
      <rect x="6" y="6" width="4" height="4" fill="currentColor" />
      <rect x="14" y="6" width="8" height="2" fill="currentColor" opacity="0.6" />
      <rect x="6" y="14" width="2" height="8" fill="currentColor" opacity="0.6" />
      
      {/* Diamond accents */}
      <path d="M12 10L14 12L12 14L10 12Z" fill="currentColor" opacity="0.4" />
      <path d="M30 2L32 4L30 6L28 4Z" fill="currentColor" opacity="0.5" />
      <path d="M2 30L4 28L6 30L4 32Z" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

/**
 * Compact inline button loader with spinning diamond
 */
export function ButtonLoader({ className }: { className?: string }) {
  return (
    <span 
      className={cn("inline-flex items-center justify-center w-4 h-4 animate-spin", className)}
      style={{ animationDuration: '0.8s' }}
    >
      <span className="w-2 h-2 bg-current rotate-45 opacity-70" />
    </span>
  )
}

/**
 * Rank system configuration - maps levels to rank titles and colors
 */
const RANK_CONFIG = [
  { maxLevel: 5, title: 'Novice', color: 'text-zinc-500', bgColor: 'bg-zinc-500/10', borderColor: 'border-zinc-500/30' },
  { maxLevel: 10, title: 'Apprentice', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { maxLevel: 20, title: 'Scholar', color: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  { maxLevel: 35, title: 'Adept', color: 'text-violet-500', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
  { maxLevel: 50, title: 'Expert', color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { maxLevel: 75, title: 'Master', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { maxLevel: 100, title: 'Grandmaster', color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
  { maxLevel: Infinity, title: 'Legend', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30' },
] as const

export function getRankForLevel(level: number) {
  return RANK_CONFIG.find(r => level <= r.maxLevel) || RANK_CONFIG[RANK_CONFIG.length - 1]
}

/**
 * Level badge with rank title - Genshin-inspired design
 */
interface LevelBadgeProps {
  level: number
  xp: number
  progressPercent: number
  xpToNextLevel: number
  showDetails?: boolean
  className?: string
}

export function LevelBadge({ 
  level, 
  xp, 
  progressPercent, 
  xpToNextLevel,
  showDetails = true,
  className 
}: LevelBadgeProps) {
  const rank = getRankForLevel(level)
  
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-4">
        {/* Level emblem */}
        <div className="relative w-16 h-16">
          {/* Outer decorative ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border/40"
            />
            {/* Progress arc */}
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${(progressPercent / 100) * 188.5} 188.5`}
              className={cn(rank.color, "transition-all duration-500")}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
          
          {/* Inner diamond frame */}
          <div className="absolute inset-2">
            <div className={cn(
              "w-full h-full border rotate-45",
              "bg-card",
              rank.borderColor
            )}>
              {/* Corner accents */}
              <span className={cn("absolute -top-px -left-px w-1.5 h-1.5 border-l border-t", rank.borderColor)} />
              <span className={cn("absolute -top-px -right-px w-1.5 h-1.5 border-r border-t", rank.borderColor)} />
              <span className={cn("absolute -bottom-px -left-px w-1.5 h-1.5 border-l border-b", rank.borderColor)} />
              <span className={cn("absolute -bottom-px -right-px w-1.5 h-1.5 border-r border-b", rank.borderColor)} />
            </div>
          </div>
          
          {/* Level number - centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-xl font-light tabular-nums",
              rank.color
            )}>
              {level}
            </span>
          </div>
          
          {/* Cardinal point diamonds */}
          <span className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border", rank.bgColor, rank.borderColor)} />
          <span className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rotate-45 border", rank.bgColor, rank.borderColor)} />
          <span className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border", rank.bgColor, rank.borderColor)} />
          <span className={cn("absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rotate-45 border", rank.bgColor, rank.borderColor)} />
        </div>
        
        {/* Level details */}
        {showDetails && (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-xs font-medium uppercase tracking-[0.15em] font-ui", rank.color)}>
                {rank.title}
              </span>
              <span className="w-1 h-1 rotate-45 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-ui">
                Level {level}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-light text-foreground tabular-nums">
                {xp.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-light">XP</span>
            </div>
            
            <p className="text-[10px] text-muted-foreground/70 mt-1 font-light">
              {xpToNextLevel.toLocaleString()} XP to next level
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Streak display with flame animation and weekly calendar
 */
interface StreakDisplayProps {
  currentStreak: number
  lastSevenDays: { date: Date; active: boolean; count: number }[]
  isAtRisk?: boolean
  className?: string
}

export function StreakDisplay({ 
  currentStreak, 
  lastSevenDays,
  isAtRisk = false,
  className 
}: StreakDisplayProps) {
  return (
    <div className={cn("relative group/streak", className)}>
      <div className="flex items-center gap-5">
        {/* Flame icon with geometric frame */}
        <div className="relative w-14 h-14">
          {/* Outer decorative ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className={currentStreak > 0 ? "text-orange-500/30" : "text-border/40"}
            />
            {/* Decorative dots at cardinal points */}
            {currentStreak > 0 && (
              <>
                <rect x="26" y="0" width="4" height="4" fill="currentColor" className="text-orange-500/40" transform="rotate(45 28 2)" />
                <rect x="26" y="52" width="4" height="4" fill="currentColor" className="text-orange-500/40" transform="rotate(45 28 54)" />
              </>
            )}
          </svg>
          
          {/* Inner content */}
          <div className={cn(
            "absolute inset-1.5 rounded-full flex items-center justify-center",
            "border transition-all duration-300",
            currentStreak > 0 
              ? "bg-orange-500/5 border-orange-500/20" 
              : "bg-muted/30 border-border/40"
          )}>
            {/* Flame icon using Lucide-style path */}
            <svg 
              className={cn(
                "w-5 h-5 transition-all",
                currentStreak > 0 ? "text-orange-500 group-hover/streak:animate-flame-flicker" : "text-muted-foreground/30"
              )}
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          
          {/* Streak at risk indicator */}
          {isAtRisk && currentStreak > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border-2 border-card" />
          )}
        </div>
        
        {/* Streak info */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-light text-foreground tabular-nums">
              {currentStreak}
            </span>
            <span className="text-sm text-muted-foreground font-light">
              day{currentStreak === 1 ? '' : 's'}
            </span>
            {isAtRisk && currentStreak > 0 && (
              <span className="text-[10px] text-amber-500 uppercase tracking-wider font-ui animate-pulse">
                At Risk
              </span>
            )}
          </div>
          
          {/* Weekly calendar - refined */}
          <div className="flex gap-1">
            {lastSevenDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground/50 font-ui">
                  {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                </span>
                <div className={cn(
                  "w-5 h-5 flex items-center justify-center transition-all",
                  "border",
                  day.active 
                    ? "bg-orange-500/15 border-orange-500/30" 
                    : "bg-muted/20 border-border/20"
                )}>
                  {day.active && (
                    <span className="w-1.5 h-1.5 rotate-45 bg-orange-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Circular progress indicator for the hero section
 */
interface CircularProgressProps {
  value: number
  max: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export function CircularProgress({
  value,
  max,
  size = 'lg',
  showLabel = true,
  label,
  className
}: CircularProgressProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const isComplete = value === 0 && max === 0
  
  const sizeConfig = {
    sm: { size: 80, stroke: 3, textSize: 'text-xl' },
    md: { size: 120, stroke: 4, textSize: 'text-3xl' },
    lg: { size: 160, stroke: 5, textSize: 'text-5xl' }
  }
  
  const config = sizeConfig[size]
  const radius = (config.size - config.stroke * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg 
        width={config.size} 
        height={config.size} 
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-border/30"
        />
        
        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-500",
            isComplete ? "text-emerald-500" : "text-primary"
          )}
        />
        
        {/* Decorative dots at cardinal points */}
        {[0, 90, 180, 270].map((angle) => {
          const radian = (angle * Math.PI) / 180
          const x = config.size / 2 + (radius + 6) * Math.cos(radian - Math.PI / 2)
          const y = config.size / 2 + (radius + 6) * Math.sin(radian - Math.PI / 2)
          return (
            <rect
              key={angle}
              x={x - 1.5}
              y={y - 1.5}
              width={3}
              height={3}
              fill="currentColor"
              className="text-primary/40"
              transform={`rotate(45 ${x} ${y})`}
            />
          )
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(config.textSize, "font-light text-foreground tabular-nums")}>
          {value}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground font-light mt-1">
            {label || (isComplete ? 'Complete' : `of ${max}`)}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Enhanced empty state with decorative pattern
 */
interface GameEmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function GameEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: GameEmptyStateProps) {
  return (
    <GamePanel className={cn("relative overflow-hidden", className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L32 2L30 4L28 2Z' fill='currentColor'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>
      
      <div className="relative p-8 md:p-12 flex flex-col items-center justify-center text-center">
        {/* Icon container */}
        <div className="relative mb-5">
          {/* Outer rotating ring */}
          <div className="w-20 h-20 border border-dashed border-border/40 rotate-45 flex items-center justify-center">
            <div className="w-14 h-14 border border-border/60 -rotate-45 flex items-center justify-center bg-card">
              <Icon className="w-6 h-6 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Corner diamonds */}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-primary/20 border border-primary/30" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-primary/20 border border-primary/30" />
          <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-primary/20 border border-primary/30" />
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-primary/20 border border-primary/30" />
        </div>
        
        <h3 className="text-sm font-medium text-foreground mb-2 font-ui tracking-wide">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground font-light max-w-60 mb-5">
          {description}
        </p>
        
        {action && (
          <GameButton 
            variant="secondary" 
            size="sm" 
            onClick={action.onClick}
          >
            {action.label}
          </GameButton>
        )}
      </div>
    </GamePanel>
  )
}

/**
 * Card distribution mini bar visualization
 */
interface CardDistributionBarProps {
  segments: { label: string; value: number; color: string }[]
  total: number
  className?: string
}

export function CardDistributionBar({ segments, total, className }: CardDistributionBarProps) {
  if (total === 0) return null
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Bar */}
      <div className="relative h-2 bg-muted/30 overflow-hidden flex">
        {segments.map((segment, i) => {
          const width = (segment.value / total) * 100
          if (width === 0) return null
          return (
            <div
              key={i}
              className={cn("h-full transition-all duration-500", segment.color)}
              style={{ width: `${width}%` }}
            />
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rotate-45", segment.color)} />
            <span className="text-[10px] text-muted-foreground font-ui">
              {segment.label}
            </span>
            <span className="text-[10px] text-foreground/80 tabular-nums font-ui">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
