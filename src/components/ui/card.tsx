import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative bg-card text-card-foreground flex flex-col gap-6 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "border-2 border-amber-700/20 dark:border-amber-600/15",
        highlight: "border-2 border-amber-700/40 dark:border-amber-400/35",
        stat: "border border-amber-700/15 dark:border-amber-700/20",
        ornate: "border-2 border-amber-700/50 dark:border-amber-400/40",
      },
      size: {
        sm: "p-3",
        md: "p-4 md:p-5",
        lg: "p-5 md:p-6",
        none: "",
      },
      isInteractive: {
        true: "cursor-pointer hover:border-amber-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "none", // Default to none so existing usages without size (using padding classes) aren't broken, or check usage. 
      // Wait, existing Card doesn't have padding by default on the container, it's usually in CardHeader/Content.
      // GamePanel DOES have padding on the container.
      // To be safe for existing Card usages, let's default size to 'none' and let consumers add padding, 
      // BUT for GamePanel migration we'll need to specify size.
      isInteractive: false,
    },
  }
)

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean
}

function Card({ className, variant, size, isInteractive, ...props }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (props.onKeyDown) {
      props.onKeyDown(e)
    }

    if (!isInteractive) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      props.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
    }
  }

  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, size, isInteractive, className }))}
      role={isInteractive ? "button" : props.role}
      tabIndex={isInteractive ? (props.tabIndex ?? 0) : props.tabIndex}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {variant === 'ornate' && (
        <div className="absolute inset-2 border border-amber-700/20 pointer-events-none" />
      )}
      {props.children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-serif font-semibold text-amber-800 dark:text-amber-300 tracking-wide", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
