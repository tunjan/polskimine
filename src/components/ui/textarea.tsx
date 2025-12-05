import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full border-2 border-amber-700/20 dark:border-amber-600/15 bg-card px-4 py-3 text-base transition-all duration-200",
        "placeholder:text-muted-foreground/40",
        "hover:border-amber-700/30 dark:hover:border-amber-600/25",
        "focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:bg-amber-600/5",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
