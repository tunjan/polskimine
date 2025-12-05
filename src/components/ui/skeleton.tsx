import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-amber-600/10 dark:bg-amber-400/10 animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
