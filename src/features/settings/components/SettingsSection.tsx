import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-6 border-b border-border/50">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary ring-1 ring-primary/20">
          <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-1">{children}</CardContent>
    </Card>
  );
};
