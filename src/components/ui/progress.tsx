import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden border border-amber-700/20 dark:border-amber-600/15 bg-muted/30",
  {
    variants: {
      variant: {
        default: "[&>[data-slot=progress-indicator]]:bg-amber-600",
        xp: "[&>[data-slot=progress-indicator]]:bg-blue-500",
        health: "[&>[data-slot=progress-indicator]]:bg-pine-500",
      },
      size: {
        default: "h-2",
        sm: "h-2",
        md: "h-3",
        lg: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root>,
  VariantProps<typeof progressVariants> { }

function Progress({
  className,
  value,
  variant,
  size,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ variant, size, className }))}
      {...props}
    >
      {/* Corner accents */}
      <span className="absolute -top-px -left-px w-1 h-1 pointer-events-none z-10">
        <span className="absolute top-0 left-0 w-full h-px bg-amber-500/50" />
        <span className="absolute top-0 left-0 h-full w-px bg-amber-500/50" />
      </span>
      <span className="absolute -bottom-px -right-px w-1 h-1 pointer-events-none z-10">
        <span className="absolute bottom-0 right-0 w-full h-px bg-amber-500/50" />
        <span className="absolute bottom-0 right-0 h-full w-px bg-amber-500/50" />
      </span>

      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all duration-500"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
