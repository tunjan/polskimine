import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative h-5 w-5 shrink-0 border-1 border-amber-700/80 dark:border-amber-600/25 bg-card transition-all duration-200",
      "hover:border-amber-600/50",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    {/* Corner accents */}
    <span className="absolute -top-px -left-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute top-0 left-0 w-full h-px bg-amber-500/40" />
      <span className="absolute top-0 left-0 h-full w-px bg-amber-500/40" />
    </span>
    <span className="absolute -bottom-px -right-px w-1.5 h-1.5 pointer-events-none">
      <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/40" />
      <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/40" />
    </span>

    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
