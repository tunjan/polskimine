import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon: Icon,
  title,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="relative p-6">
        <div className="flex items-center gap-4 mb-6 border-b pb-4 border-border/50">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary ring-1 ring-primary/20">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
};
