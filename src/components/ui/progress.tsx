import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden border border-amber-700/20 dark:border-amber-600/15 bg-muted/30",
        className
      )}
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
        className="h-full w-full flex-1 bg-amber-600 transition-all duration-500"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
