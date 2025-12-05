import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-xs font-ui font-medium uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-amber-600/50 bg-amber-600/15 text-amber-700 dark:text-amber-400",
        secondary:
          "border-border bg-secondary/50 text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive",
        outline:
          "border-amber-700/30 dark:border-amber-600/20 text-foreground bg-transparent",
        success:
          "border-pine-500/50 bg-pine-500/10 text-pine-600 dark:text-pine-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
