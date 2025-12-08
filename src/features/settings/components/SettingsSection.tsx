import React, { useState } from "react";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  variant?: "default" | "danger";
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const headerContent = (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg",
          variant === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="w-4 h-4" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <h3
          className={cn(
            "text-sm font-medium tracking-wide",
            variant === "danger" ? "text-destructive" : "text-foreground",
          )}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {collapsible && (
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      )}
    </div>
  );

  const content = <div className="mt-4 space-y-1">{children}</div>;

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "rounded-xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-200",
            variant === "danger"
              ? "border-destructive/20 hover:border-destructive/40"
              : "border-border/50 hover:border-border",
          )}
        >
          <CollapsibleTrigger className="w-full text-left">
            {headerContent}
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {content}
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-200",
        variant === "danger"
          ? "border-destructive/20 hover:border-destructive/40"
          : "border-border/50 hover:border-border",
      )}
    >
      {headerContent}
      {content}
    </div>
  );
};
