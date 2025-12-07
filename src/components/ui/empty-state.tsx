import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
    icon: React.ElementType
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <Card className={cn("p-8", className)}>
            <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>

                {action && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </Card>
    )
}
