import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-amber-700/20 dark:bg-amber-600/15 shrink-0",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

export function OrnateSeparator({ className }: { className?: string }) {
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
