import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "relative h-10 w-full min-w-0 border-2 border-amber-700/20 dark:border-amber-600/15 bg-card px-4 py-2 text-base transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground/40",
        "hover:border-amber-700/30 dark:hover:border-amber-600/25",
        "focus-visible:border-amber-500/50 focus-visible:bg-amber-600/5",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-destructive",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
