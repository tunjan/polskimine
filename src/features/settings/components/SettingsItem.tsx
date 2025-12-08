import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsItemProps {
  icon?: LucideIcon;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon: Icon,
  label,
  description,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 p-3 -mx-2 rounded-lg transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <Icon className="w-4 h-4 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
        )}
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground block">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground/70 block mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
};

// Specialized variant for large numeric inputs (like daily limits)
interface SettingsLargeInputProps {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (value: number) => void;
}

export const SettingsLargeInput: React.FC<SettingsLargeInputProps> = ({
  label,
  sublabel,
  value,
  onChange,
}) => {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/30 transition-colors">
      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium mb-2">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="text-4xl md:text-5xl font-light h-auto py-1 border-0 border-b border-border/30 rounded-none px-0 focus-visible:outline-none focus-visible:border-primary/60 tabular-nums bg-transparent transition-colors text-center w-24"
      />
      {sublabel && (
        <span className="text-[10px] text-muted-foreground/60 mt-2">{sublabel}</span>
      )}
    </div>
  );
};

// Specialized variant for slider controls
interface SettingsSliderDisplayProps {
  label: string;
  value: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsSliderDisplay: React.FC<SettingsSliderDisplayProps> = ({
  label,
  value,
  description,
  children,
}) => {
  return (
    <div className="space-y-3 p-3 -mx-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-lg font-light tabular-nums text-foreground">{value}</span>
      </div>
      {children}
      {description && (
        <div className="flex justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          <span>{description}</span>
        </div>
      )}
    </div>
  );
};

// Collapsible sub-section within a SettingsSection
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
    <div className="mt-3 pt-3 border-t border-border/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <span className={cn(
          "transition-transform duration-200",
          isOpen ? "rotate-90" : "rotate-0"
        )}>
          ▸
        </span>
        {title}
      </button>
      {isOpen && (
        <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
