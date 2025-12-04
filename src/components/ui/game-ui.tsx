import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Genshin Impact-inspired flat UI components
 * Features: geometric shapes, diamond motifs, ornate frames, flat colors
 */

// ============================================================================
// DECORATIVE SVG ELEMENTS
// ============================================================================

/** Ornate corner accent - elegant Genshin-style frame */
const GenshinCorner = ({ className, ...props }: React.ComponentProps<"svg">) => (
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
    

    
    {/* Main Corner Diamond */}
    
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

// ============================================================================
// GAME PANEL - Primary container component
// ============================================================================

interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
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
        
        // Border styles based on variant
        variant === 'default' && "border-2 bborder-amber-700/20 dark:border-amber-700/25",
        variant === 'highlight' && "border-2 border-amber-700/40 dark:border-amber-400/35",
        variant === 'stat' && "border bborder-amber-700/15 dark:border-amber-700/20",
        variant === 'ornate' && "border-2 border-amber-700/50 dark:border-amber-400/40",
        
        // Padding based on size
        size === 'sm' && "p-3",
        size === 'md' && "p-4 md:p-5",
        size === 'lg' && "p-5 md:p-6",
        
        // Hover glow effect (flat - just border color change)
        glowOnHover && "transition-colors duration-200 ",
        
        className
      )}
      {...props}
    >
      {/* Ornate corner decorations */}
      {showCorners && (
        <>
          <GenshinCorner className="absolute -top-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none" />
          <GenshinCorner className="absolute -top-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none rotate-90" />
          <GenshinCorner className="absolute -bottom-px -left-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none -rotate-90" />
          <GenshinCorner className="absolute -bottom-px -right-px text-amber-500/80 dark:text-amber-400/70 pointer-events-none rotate-180" />
        </>
      )}
      
      {/* Ornate variant has additional inner frame */}
      {variant === 'ornate' && (
        <div className="absolute inset-2 border border-amber-700/20 pointer-events-none" />
      )}
      
      {children}
    </div>
  )
}

// ============================================================================
// GAME STAT - Statistic display card
// ============================================================================

interface GameStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  sublabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'amber' | 'blue' | 'green' | 'rose' | 'purple' | 'sky' | 'pine' | 'violet'
}

const statColorConfig: Record<NonNullable<GameStatProps['color']>, {
  accent: string
  text: string
  bg: string
  border: string
}> = {
  default: {
    accent: "bg-amber-600",
    text: "text-amber-500",
    bg: "bg-amber-600/10",
    border: "border-amber-700/30"
  },
  amber: {
    accent: "bg-amber-600",
    text: "text-amber-500",
    bg: "bg-amber-600/10",
    border: "border-amber-700/30"
  },
  blue: {
    accent: "bg-blue-500",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30"
  },
  sky: {
    accent: "bg-sky-500",
    text: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30"
  },
  green: {
    accent: "bg-pine-500",
    text: "text-pine-500",
    bg: "bg-pine-500/10",
    border: "border-pine-500/30"
  },
  pine: {
    accent: "bg-pine-500",
    text: "text-pine-500",
    bg: "bg-pine-500/10",
    border: "border-pine-500/30"
  },
  rose: {
    accent: "bg-rose-500",
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30"
  },
  purple: {
    accent: "bg-purple-500",
    text: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30"
  },
  violet: {
    accent: "bg-violet-500",
    text: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30"
  }
}

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
  const colors = statColorConfig[color]

  return (
    <div 
      className={cn(
        "relative group/stat",
        "bg-card border border-border/50",
        "p-4 transition-colors duration-200",
        "hover:border-border",
        className
      )}
      {...props}
    >
      {/* Top accent bar - simple line */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.accent, "opacity-80")} />
      
      {/* Content */}
      <div className="relative">
        {/* Label with icon */}
        <div className="flex items-center gap-2 mb-2">
          {icon && (
            <span className={cn(colors.text, "opacity-80")}>
              {icon}
            </span>
          )}
          <p className={cn(
            "uppercase tracking-[0.15em] text-muted-foreground font-medium font-ui",
            size === 'sm' && "text-[9px]",
            size === 'md' && "text-[10px]",
            size === 'lg' && "text-[11px]"
          )}>
            {label}
          </p>
        </div>
        
        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p className={cn(
            "font-medium text-foreground tabular-nums tracking-tight",
            size === 'sm' && "text-2xl",
            size === 'md' && "text-3xl md:text-4xl",
            size === 'lg' && "text-4xl md:text-5xl"
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {/* Trend indicator */}
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' && "text-pine-500",
              trend === 'down' && "text-rose-500",
              trend === 'neutral' && "text-muted-foreground"
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
            </span>
          )}
        </div>
        
        {/* Sublabel */}
        {sublabel && (
          <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium font-ui">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME SECTION HEADER - Section title with ornate line
// ============================================================================

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
      <div className="flex items-center gap-4 mb-1.5">
        {/* Left ornate element */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rotate-45 border-2 border-amber-700/60" />
          <span className="w-6 h-0.5 bg-amber-600/40" />
        </div>
        
        {/* Title */}
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-wide font-ui flex items-center gap-2.5">
          {icon && <span className="text-amber-500/80">{icon}</span>}
          {title}
        </h2>
        
        {/* Right ornate line */}
        <div className="flex-1 flex items-center gap-2">
          <span className="flex-1 h-px bg-border/60" />
          <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
          <span className="w-8 h-px bg-border/40" />
        </div>
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground/70 font-medium pl-12">
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// GAME PROGRESS BAR - Flat progress indicator
// ============================================================================

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
    <div className={cn("space-y-2", className)} {...props}>
      {/* Label row */}
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-xs text-muted-foreground font-medium font-ui uppercase tracking-wider">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs text-foreground font-semibold tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress bar container */}
      <div className={cn(
        "relative w-full overflow-hidden",
        "bg-muted/40 border border-border/40",
        size === 'sm' && "h-2",
        size === 'md' && "h-3",
        size === 'lg' && "h-4"
      )}>
        {/* End cap decorations */}
        <span className="absolute top-0 bottom-0 left-0 w-1 bg-amber-600/20 z-10" />
        <span className="absolute top-0 bottom-0 right-0 w-1 bg-amber-600/20 z-10" />
        
        {/* Fill bar - flat color */}
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out",
            variant === 'default' && "bg-amber-600",
            variant === 'xp' && "bg-blue-500",
            variant === 'health' && "bg-pine-500"
          )}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Progress marker at end */}
        {percentage > 0 && percentage < 100 && (
          <span 
            className={cn(
              "absolute top-0 bottom-0 w-0.5 bg-white/60",
              "transition-all duration-700"
            )}
            style={{ left: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME BUTTON - Action button with corner accents
// ============================================================================

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
        "relative group/btn inline-flex items-center justify-center gap-2",
        "font-ui font-semibold uppercase tracking-[0.15em]",
        "transition-all duration-150",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        
        // Size variants
        size === 'sm' && "h-9 px-5 text-[10px]",
        size === 'md' && "h-11 px-7 text-xs",
        size === 'lg' && "h-13 px-9 text-sm",
        
        // Style variants - flat design
        variant === 'primary' && [
          "bg-amber-600/10 text-amber-950",
          "hover:bg-amber-600/20 active:bg-amber-600",
          "border-2 border-amber-700/50",
        ],
        variant === 'secondary' && [
          "bg-card text-foreground",
          "hover:bg-muted/50 active:bg-muted",
          "border border-border",
        ],
        variant === 'ghost' && [
          "bg-transparent text-muted-foreground",
          "hover:text-foreground hover:bg-muted/30",
          "border border-transparent hover:border-border/50"
        ],
        
        className
      )}
      disabled={disabled}
      {...props}
    >
      
      
      {children}
    </button>
  )
}

// ============================================================================
// GAME METRIC ROW - Horizontal stat display
// ============================================================================

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
        "group/metric relative",
        "bg-card/60 border border-border/40 p-4",
        "flex items-center justify-between",
        "hover:border-amber-700/30 transition-colors duration-150",
        className
      )}
      {...props}
    >
      {/* Left accent line */}
      <span className={cn(
        "absolute left-0 top-2 bottom-2 w-0.5",
        "bg-amber-600/30 group-hover/metric:bg-amber-600/60",
        "transition-colors duration-150"
      )} />
      
      {/* Label side */}
      <div className="flex items-center gap-3 pl-3">
        <span className="text-amber-500/70">{icon}</span>
        <span className="text-sm text-muted-foreground font-medium font-ui">
          {label}
        </span>
      </div>
      
      {/* Value side */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-foreground tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground/70 font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME DIVIDER - Ornate horizontal separator
// ============================================================================

export function GameDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 my-6", className)}>
      <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
      <span className="flex-1 h-px bg-border/50" />
      <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
      <span className="flex-1 h-px bg-border/50" />
      <span className="w-2.5 h-2.5 rotate-45 border border-amber-700/40" />
    </div>
  )
}

// ============================================================================
// GAME LOADER - Spinning geometric loader
// ============================================================================

interface GameLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function GameLoader({ size = 'md', text, className }: GameLoaderProps) {
  const sizeConfig = {
    sm: { container: 'w-12 h-12', inner: 'inset-1.5', diamond: 'w-1.5 h-1.5' },
    md: { container: 'w-20 h-20', inner: 'inset-3', diamond: 'w-2 h-2' },
    lg: { container: 'w-28 h-28', inner: 'inset-4', diamond: 'w-3 h-3' }
  }

  const config = sizeConfig[size]

  return (
    <div className={cn("flex flex-col items-center justify-center gap-5", className)}>
      <div className={cn("relative", config.container)}>
        {/* Outer rotating square */}
        <div 
          className="absolute inset-0 border-2 border-amber-700/30 rotate-45 animate-spin"
          style={{ animationDuration: '4s' }}
        />
        
        {/* Inner counter-rotating square */}
        <div 
          className={cn("absolute border-2 border-amber-700/50 rotate-45", config.inner)}
          style={{ animation: 'spin 3s linear infinite reverse' }}
        />
        
        {/* Center diamond - pulsing */}
        <span 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-amber-600 rotate-45 animate-pulse",
            config.diamond
          )} 
        />
        
        {/* Cardinal point markers */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s' }}>
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-600/60 rotate-45" />
        </div>
      </div>
      
      {text && (
        <div className="flex items-center gap-3">
          <span className="w-8 h-px bg-border" />
          <span className="text-xs font-medium text-muted-foreground/70 tracking-[0.2em] uppercase font-ui">
            {text}
          </span>
          <span className="w-8 h-px bg-border" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// GAME LOADING SCREEN - Full-screen loading state
// ============================================================================

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

/** Large corner ornament for loading screen */
function CornerOrnament() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main L-frame */}
      <path d="M0 0H50V2H2V50H0V0Z" fill="currentColor" />
      <path d="M0 0H60V1H1V60H0V0Z" fill="currentColor" opacity="0.5" />
      
      {/* Inner geometric details */}
      <rect x="8" y="8" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M11 11L13 13L11 15L9 13Z" fill="currentColor" opacity="0.6" />
      
      {/* Extended accents */}
      <rect x="20" y="8" width="12" height="2" fill="currentColor" opacity="0.4" />
      <rect x="8" y="20" width="2" height="12" fill="currentColor" opacity="0.4" />
      
      {/* Diamond markers */}
      <path d="M40 2L42 4L40 6L38 4Z" fill="currentColor" opacity="0.5" />
      <path d="M2 40L4 38L6 40L4 42Z" fill="currentColor" opacity="0.5" />
      
      {/* Additional line details */}
      <rect x="50" y="0" width="8" height="1" fill="currentColor" opacity="0.3" />
      <rect x="0" y="50" width="1" height="8" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

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
      {/* Corner ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-6 left-6 text-amber-500/10">
          <CornerOrnament />
        </div>
        <div className="absolute top-6 right-6 text-amber-500/10 rotate-90">
          <CornerOrnament />
        </div>
        <div className="absolute bottom-6 left-6 text-amber-500/10 -rotate-90">
          <CornerOrnament />
        </div>
        <div className="absolute bottom-6 right-6 text-amber-500/10 rotate-180">
          <CornerOrnament />
        </div>
        
        {/* Subtle floating diamonds */}
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-600/15 rotate-45 animate-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + i * 0.4}s`
            }}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="relative flex flex-col items-center gap-10 px-6">
        {/* Central geometric loader */}
        <div className="relative w-36 h-36">
          {/* Outer square - slow rotation */}
          <div 
            className="absolute inset-0 border-2 border-amber-700/20 rotate-45"
            style={{ animation: 'spin 10s linear infinite' }}
          />
          
          {/* Second square with corner dots */}
          <div 
            className="absolute inset-4 rotate-45"
            style={{ animation: 'spin 7s linear infinite reverse' }}
          >
            <div className="absolute inset-0 border-2 border-amber-700/30" />
            <span className="absolute -top-1 -left-1 w-2 h-2 bg-amber-600/40" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600/40" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-600/40" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-600/40" />
          </div>
          
          {/* Third square */}
          <div 
            className="absolute inset-8 border-2 border-amber-700/40 rotate-45"
            style={{ animation: 'spin 5s linear infinite' }}
          />
          
          {/* Fourth square */}
          <div 
            className="absolute inset-12 border-2 border-amber-700/60 rotate-45"
            style={{ animation: 'spin 4s linear infinite reverse' }}
          />
          
          {/* Inner diamond */}
          <div className="absolute inset-[56px] bg-amber-600/20 rotate-45" />
          
          {/* Center point */}
          <span 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-600 rotate-45 animate-pulse"
          />
          
          {/* Orbiting accent */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 bg-amber-600/70 rotate-45" />
          </div>
        </div>
        
        {/* Title section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
              <span className="w-16 h-px bg-amber-600/30" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground tracking-[0.25em] uppercase font-ui">
              {title}
            </h2>
            
            <div className="flex items-center gap-1">
              <span className="w-16 h-px bg-amber-600/30" />
              <span className="w-2 h-2 rotate-45 border border-amber-700/40" />
            </div>
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground/70 font-medium">
              {subtitle}
            </p>
          )}
          
          {/* Loading dots */}
          <div className="flex items-center gap-2 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-amber-600/60 rotate-45 animate-pulse"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom tip section */}
      {showTip && (
        <div className="absolute bottom-14 left-0 right-0 px-8">
          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="w-4 h-px bg-amber-600/30" />
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
              <span className="text-[10px] text-amber-500/60 uppercase tracking-[0.25em] font-semibold font-ui">
                Tip
              </span>
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-600/40" />
              <span className="w-4 h-px bg-amber-600/30" />
            </div>
            <p className="text-sm text-muted-foreground/50 text-center font-medium italic font-editorial">
              "{tip}"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BUTTON LOADER - Inline loading spinner
// ============================================================================

export function ButtonLoader({ className }: { className?: string }) {
  return (
    <span 
      className={cn("inline-flex items-center justify-center w-4 h-4 animate-spin", className)}
      style={{ animationDuration: '0.7s' }}
    >
      <span className="w-2 h-2 bg-current rotate-45 opacity-80" />
    </span>
  )
}

// ============================================================================
// RANK SYSTEM - Level and rank configuration
// ============================================================================

const RANK_CONFIG = [
  { maxLevel: 5, title: 'Novice', color: 'text-zinc-400', bgColor: 'bg-zinc-500/30', borderColor: 'border-zinc-500/60', accentColor: 'bg-zinc-600' },
  { maxLevel: 10, title: 'Apprentice', color: 'text-pine-400', bgColor: 'bg-pine-500/10', borderColor: 'border-pine-500/30', accentColor: 'bg-pine-400' },
  { maxLevel: 20, title: 'Scholar', color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30', accentColor: 'bg-sky-400' },
  { maxLevel: 35, title: 'Adept', color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30', accentColor: 'bg-violet-400' },
  { maxLevel: 50, title: 'Expert', color: 'text-amber-400', bgColor: 'bg-amber-600/10', borderColor: 'border-amber-700/30', accentColor: 'bg-amber-400' },
  { maxLevel: 75, title: 'Master', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', accentColor: 'bg-orange-400' },
  { maxLevel: 100, title: 'Grandmaster', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', accentColor: 'bg-rose-400' },
  { maxLevel: Infinity, title: 'Legend', color: 'text-amber-300', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30', accentColor: 'bg-amber-300' },
] as const

export function getRankForLevel(level: number) {
  return RANK_CONFIG.find(r => level <= r.maxLevel) || RANK_CONFIG[RANK_CONFIG.length - 1]
}

// ============================================================================
// LEVEL BADGE - Ornate level display with rank
// ============================================================================

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
      <div className="flex items-center gap-5">
        {/* Level emblem - Genshin-style geometric frame */}
        <div className="relative w-20 h-20">
          {/* Background circle with progress */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
            {/* Background ring */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border/40"
            />
            
            {/* Progress arc */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="square"
              strokeDasharray={`${(progressPercent / 100) * 226} 226`}
              className={cn(rank.color, "transition-all duration-500")}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
            
            {/* Decorative tick marks */}
            {[0, 90, 180, 270].map((angle) => (
              <rect
                key={angle}
                x="39"
                y="2"
                width="2"
                height="4"
                fill="currentColor"
                className={rank.color}
                opacity="0.5"
                transform={`rotate(${angle} 40 40)`}
              />
            ))}
          </svg>
          
          {/* Inner diamond frame */}
          <div className="absolute inset-3">
            <div className={cn(
              "w-full h-full rotate-45",
              "border-2 bg-card",
              rank.borderColor
            )}>
              {/* Inner corner accents */}
              <span className={cn("absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2", rank.borderColor)} />
              <span className={cn("absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2", rank.borderColor)} />
              <span className={cn("absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2", rank.borderColor)} />
              <span className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2", rank.borderColor)} />
            </div>
          </div>
          
          {/* Level number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              rank.color
            )}>
              {level}
            </span>
          </div>
          
          {/* Cardinal diamonds */}
          <span className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
          <span className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
          <span className={cn("absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
          <span className={cn("absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45", rank.bgColor, "border", rank.borderColor)} />
        </div>
        
        {/* Level details */}
        {showDetails && (
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={cn("text-xs font-bold uppercase tracking-[0.2em] font-ui", rank.color)}>
                {rank.title}
              </span>
              <span className={cn("w-1.5 h-1.5 rotate-45", rank.accentColor, "opacity-60")} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold font-ui">
                Lv. {level}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {xp.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-medium">XP</span>
            </div>
            
            <p className="text-[13px] text-muted-foreground/60 mt-1.5 font-medium">
              {xpToNextLevel.toLocaleString()} XP to next level
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
// ============================================================================
// STREAK DISPLAY - Daily streak with calendar
// ============================================================================

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
      <div className="flex items-center gap-6">
        {/* Flame icon with simple frame */}
        <div className="relative w-14 h-14">
          {/* Simple square frame */}
          <div className={cn(
            "absolute inset-0 border-2 transition-colors duration-200",
            currentStreak > 0 
              ? "border-orange-500/40" 
              : "border-border/30"
          )} />
          
          {/* Small corner accents */}
          {currentStreak > 0 && (
            <>
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-orange-500/60" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-orange-500/60" />
              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-orange-500/60" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-orange-500/60" />
            </>
          )}
          
          {/* Inner content */}
          <div className={cn(
            "absolute inset-1 flex items-center justify-center",
            currentStreak > 0 
              ? "bg-orange-500/10" 
              : "bg-muted/10"
          )}>
            {/* Flame icon */}
            <svg 
              className={cn(
                "w-6 h-6 transition-colors",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground/30"
              )}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          
          {/* At risk indicator */}
          {isAtRisk && currentStreak > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-amber-600 rotate-45 animate-pulse" />
          )}
        </div>
        
        {/* Streak info */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2.5 mb-3">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              {currentStreak}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              day{currentStreak === 1 ? '' : 's'}
            </span>
            {isAtRisk && currentStreak > 0 && (
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold font-ui animate-pulse ml-2">
                At Risk
              </span>
            )}
          </div>
          
          {/* Weekly calendar */}
          <div className="flex gap-1.5">
            {lastSevenDays.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground/50 font-semibold font-ui uppercase">
                  {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                </span>
                <div className={cn(
                  "w-6 h-6 flex items-center justify-center",
                  "border transition-colors",
                  day.active 
                    ? "bg-orange-500/15 border-orange-500/40" 
                    : "bg-muted/10 border-border/20"
                )}>
                  {day.active && (
                    <span className="w-2 h-2 rotate-45 bg-orange-500" />
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

// ============================================================================
// CIRCULAR PROGRESS - Ring-style progress indicator
// ============================================================================

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
    sm: { size: 80, stroke: 4, textSize: 'text-xl', innerOffset: 8 },
    md: { size: 120, stroke: 5, textSize: 'text-3xl', innerOffset: 12 },
    lg: { size: 160, stroke: 6, textSize: 'text-5xl', innerOffset: 16 }
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
        {/* Background ring */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-border/30"
        />
        
        {/* Progress ring */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-500",
            isComplete ? "text-pine-500" : "text-amber-500"
          )}
        />
        
        {/* Cardinal point markers */}
        {[0, 90, 180, 270].map((angle) => {
          const radian = (angle * Math.PI) / 180
          const x = config.size / 2 + (radius + 8) * Math.cos(radian - Math.PI / 2)
          const y = config.size / 2 + (radius + 8) * Math.sin(radian - Math.PI / 2)
          return (
            <rect
              key={angle}
              x={x - 2}
              y={y - 2}
              width={4}
              height={4}
              fill="currentColor"
              className="text-amber-500/40"
              transform={`rotate(45 ${x} ${y})`}
            />
          )
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(config.textSize, "font-bold text-foreground tabular-nums")}>
          {value}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground font-medium mt-1">
            {label || (isComplete ? 'Complete' : `of ${max}`)}
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// GAME EMPTY STATE - Empty state with decorative frame
// ============================================================================

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
      {/* Subtle diamond pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L22 2L20 4L18 2Z' fill='%23f59e0b'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="relative p-10 md:p-14 flex flex-col items-center justify-center text-center">
        {/* Icon container with ornate frame */}
        <div className="relative mb-6">
          {/* Outer rotating frame */}
          <div className="w-24 h-24 border-2 border-amber-700/20 rotate-45 flex items-center justify-center">
            {/* Inner frame */}
            <div className="w-16 h-16 border border-border/60 -rotate-45 flex items-center justify-center bg-card">
              <Icon className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Corner accents */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-amber-600/20 border border-amber-700/30" />
        </div>
        
        <h3 className="text-sm font-semibold text-foreground mb-2.5 font-ui tracking-wide uppercase">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground/70 font-medium max-w-64 mb-6">
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

// ============================================================================
// CARD DISTRIBUTION BAR - Mini visualization
// ============================================================================

interface CardDistributionBarProps {
  segments: { label: string; value: number; color: string }[]
  total: number
  className?: string
}

export function CardDistributionBar({ segments, total, className }: CardDistributionBarProps) {
  if (total === 0) return null
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Bar */}
      <div className="relative h-2.5 bg-muted/30 border border-border/30 overflow-hidden flex">
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
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rotate-45", segment.color)} />
            <span className="text-[10px] text-muted-foreground font-semibold font-ui uppercase tracking-wide">
              {segment.label}
            </span>
            <span className="text-[11px] text-foreground/80 tabular-nums font-semibold font-ui">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// GAME INPUT - Styled input field
// ============================================================================

interface GameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function GameInput({
  label,
  error,
  icon,
  className,
  ...props
}: GameInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-foreground font-ui uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group/input">
        <input
          className={cn(
            "w-full h-11 bg-card border-2 border-border/50 text-foreground px-4",
            "font-ui text-sm placeholder:text-muted-foreground/50",
            "transition-all duration-200",
            "focus:border-amber-600/50 focus:bg-amber-600/5 outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-11",
            error && "border-rose-500/50 focus:border-rose-500/50 bg-rose-500/5",
            className
          )}
          {...props}
        />
        
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-amber-500 transition-colors">
            {icon}
          </div>
        )}
        
        {/* Corner accents on focus */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-200">
          <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-amber-500" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-amber-500" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-amber-500" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-amber-500" />
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-rose-500 font-medium ml-1">{error}</p>
      )}
    </div>
  )
}
