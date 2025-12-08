import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)} {...props}>
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {title}
      </h2>

      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
