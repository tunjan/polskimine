import React from "react";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface SettingsItemProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  description,
  icon: Icon,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0",
        className,
      )}
    >
      <div className="flex items-start gap-3 flex-1">
        {Icon && (
          <div className="mt-0.5 text-muted-foreground/70">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </Label>
          {description && (
            <p className="text-[0.925rem] text-muted-foreground/80 leading-snug max-w-[400px]">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-[120px] justify-end">
        {children}
      </div>
    </div>
  );
};

interface SettingsLargeInputProps {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export const SettingsLargeInput: React.FC<SettingsLargeInputProps> = ({
  label,
  sublabel,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm hover:bg-accent/50 transition-colors",
        className,
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="text-2xl font-bold h-12 w-24 px-3 py-1 bg-background shadow-none border-input"
        />
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
};

interface SettingsSliderDisplayProps {
  label: string;
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSliderDisplay: React.FC<SettingsSliderDisplayProps> = ({
  label,
  value,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-3 py-4", className)}>
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">{label}</Label>
        <span className="text-xs font-mono font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">
          {value}
        </span>
      </div>
      <div className="pt-1 px-1">{children}</div>
    </div>
  );
};

interface SettingsSubSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const SettingsSubSection: React.FC<SettingsSubSectionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg my-4 overflow-hidden bg-card/50"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/40 transition-colors">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {title}
        </h4>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-background/80"
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="p-4 space-y-4 border-t bg-card">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
