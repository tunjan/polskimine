"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group/slider",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden bg-muted/50 border border-border/30">
      {/* Corner accents on track */}
      <span className="absolute -top-px -left-px w-1 h-1 pointer-events-none">
        <span className="absolute top-0 left-0 w-full h-px bg-primary/30" />
        <span className="absolute top-0 left-0 h-full w-px bg-primary/30" />
      </span>
      <span className="absolute -bottom-px -right-px w-1 h-1 pointer-events-none">
        <span className="absolute bottom-0 right-0 w-full h-px bg-primary/30" />
        <span className="absolute bottom-0 right-0 h-full w-px bg-primary/30" />
      </span>
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary/80 to-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "relative block h-4 w-4 border border-primary/50 bg-card transition-all duration-200",
        "hover:border-primary hover:bg-primary/10 hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "after:absolute after:inset-1 after:bg-primary after:transition-colors",
        "group-hover/slider:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.4)]"
      )} 
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }