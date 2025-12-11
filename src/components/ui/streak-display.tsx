import * as React from "react";
import { Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DayActivity {
  date: Date;
  active: boolean;
  count: number;
}

export interface StreakDisplayProps {
  currentStreak: number;
  lastSevenDays: DayActivity[];
  className?: string;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function StreakDisplay({
  currentStreak,
  lastSevenDays,
  className,
}: StreakDisplayProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-12 hidden md:flex w-12 items-center justify-center rounded-full font-bold text-lg transition-colors",
            currentStreak > 0
              ? "bg-orange-100 text-orange-600"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Flame
            className={cn("h-6 w-6", currentStreak > 0 && "animate-pulse")}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums">
            {currentStreak}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentStreak === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider delayDuration={100}>
          {lastSevenDays.map((day, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {DAY_LABELS[day.date.getDay()]}
                  </span>
                  <div
                    className={cn(
                      "h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors cursor-default",
                      day.active
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-muted/50 text-muted-foreground border border-transparent",
                    )}
                  >
                    {day.active ? "✓" : ""}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{formatDate(day.date)}</p>
                <p className="text-muted-foreground">
                  {day.count > 0
                    ? `${day.count} card${day.count === 1 ? "" : "s"} studied`
                    : "No activity"}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
