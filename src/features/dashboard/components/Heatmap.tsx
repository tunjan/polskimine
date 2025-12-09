import React, { useMemo } from "react";
import { ReviewHistory } from "@/types";
import { addDays, subDays, startOfDay, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { clsx } from "clsx";

interface HeatmapProps {
  history: ReviewHistory;
}

export const Heatmap: React.FC<HeatmapProps> = React.memo(({ history }) => {
  const calendarData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = [];

    let startDate = subDays(today, 364);
    const dayOfWeek = startDate.getDay();
    startDate = subDays(startDate, dayOfWeek);

    const totalDays = 53 * 7;

    for (let i = 0; i < totalDays; i++) {
      const d = addDays(startDate, i);
      const dateKey = format(d, "yyyy-MM-dd");
      days.push({
        date: d,
        dateKey,
        count: history[dateKey] || 0,
        inFuture: d > today,
      });
    }
    return days;
  }, [history]);

  const getColorStyle = (count: number): string => {
    if (count === 0) return "bg-muted/30";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
    if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700";
    if (count <= 9) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      return history[dateKey] || 0;
    });

    const weekTotal = last7Days.reduce((sum, count) => sum + count, 0);
    const activeDays = last7Days.filter((count) => count > 0).length;

    return { weekTotal, activeDays, last7Days: last7Days.reverse() };
  }, [history]);

  return (
    <TooltipProvider>
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              This Week
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.weekTotal}{" "}
              <span className="text-sm text-muted-foreground">reviews</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-light ">
              Active Days
            </p>
            <p className="text-2xl font-light text-foreground tabular-nums">
              {stats.activeDays}
              <span className="text-sm text-muted-foreground">/7</span>
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 justify-between">
          {stats.last7Days.map((count, i) => {
            const date = subDays(new Date(), 6 - i);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground ">
                  {format(date, "EEE").charAt(0)}
                </span>
                <div
                  className={clsx(
                    "w-full aspect-square rounded-sm transition-colors",
                    getColorStyle(count),
                  )}
                />
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="hidden md:block w-full overflow-x-auto overflow-y-hidden lg:overflow-x-visible"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-block min-w-max py-2 lg:w-full">
          <div className="grid grid-rows-7 grid-flow-col gap-1 lg:gap-1">
            {calendarData.map((day) => (
              <Tooltip key={day.dateKey} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={clsx(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-3 lg:h-3 rounded-sm transition-all duration-200 hover:scale-110 hover:ring-1 hover:ring-pine-500/50",
                      day.inFuture
                        ? "opacity-0 pointer-events-none"
                        : getColorStyle(day.count),
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-card text-foreground px-4 py-2.5 rounded-xl border border-border">
                  <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 ">
                    {format(day.date, "MMM d, yyyy")}
                  </div>
                  <div className="text-sm font-light tabular-nums">
                    {day.count} review{day.count === 1 ? "" : "s"}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground ">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-200 dark:bg-pine-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-400 dark:bg-pine-700" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-500 dark:bg-pine-500" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pine-600 dark:bg-pine-400" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
});
