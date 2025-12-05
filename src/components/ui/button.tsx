import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 font-ui uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "bg-amber-600/15 text-amber-700 dark:text-amber-400 border-2 border-amber-600/50 hover:bg-amber-600/25 hover:border-amber-500/70 active:bg-amber-600/35",
        destructive:
          "bg-destructive/10 text-destructive border-2 border-destructive/50 hover:bg-destructive/20 hover:border-destructive/70 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-amber-700/30 dark:border-amber-600/25 bg-transparent hover:bg-amber-600/10 hover:border-amber-600/50 text-foreground",
        secondary:
          "bg-secondary/50 text-foreground border border-border hover:bg-secondary/70 hover:border-amber-700/30",
        ghost:
          "hover:bg-amber-600/10 hover:text-amber-700 dark:hover:text-amber-400 border border-transparent hover:border-amber-700/20",
        link: "text-amber-600 dark:text-amber-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 gap-1.5 px-4 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
