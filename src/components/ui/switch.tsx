import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"
import { LCorners } from "@/components/ui/decorative"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border border-border/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",

      "data-[state=unchecked]:bg-card data-[state=unchecked]:border-border/50",

      "data-[state=checked]:bg-primary/20 data-[state=checked]:border-primary/50",
      className
    )}
    {...props}
    ref={ref}
  >
    <LCorners positions="diagonal" size="xs" className="bg-primary/40" />

    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 bg-foreground/70 ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1",
        "data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

