import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  format,
  eachDayOfInterval,
  endOfYear,
  startOfYear,
  getDay,
} from "date-fns";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  year?: number;
  className?: string;
}

export function ActivityHeatmap({
  data,
  year = new Date().getFullYear(),
  className,
}: ActivityHeatmapProps) {
  const days = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    return eachDayOfInterval({ start, end });
  }, [year]);

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [data]);

  const weeks = useMemo(() => {
    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    const firstDay = days[0];
    const startDayOfWeek = getDay(firstDay);

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(new Date(0));
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(new Date(0));
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [days]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-heatmap-empty";
    if (count < 5) return "bg-heatmap-level-1";
    if (count < 10) return "bg-heatmap-level-2";
    if (count < 20) return "bg-heatmap-level-3";
    return "bg-heatmap-level-4";
  };

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[600px] px-6">
          <div className="flex gap-1 text-xs text-muted-foreground mb-2">
            {/* We'll simplify month labels to just be distributed, or we can try to align them better. 
                For now, distributing them evenly with flex-1 is a decent approximation if weeks are even. 
                However, months have different lengths. 
                Let's keep the existing distribution but make it w-full. 
            */}
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((month) => (
              <div key={month} className="flex-1 text-center">
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex-1 flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (day.getTime() === new Date(0).getTime()) {
                      return (
                        <div key={dayIndex} className="w-full aspect-square" />
                      );
                    }

                    const dateStr = format(day, "yyyy-MM-dd");
                    const count = dataMap.get(dateStr) || 0;

                    return (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "w-full aspect-square rounded-[2px] transition-colors cursor-pointer hover:ring-1 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background",
                              getColor(count),
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <span className="font-semibold">
                              {count} activities
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              on {format(day, "MMM d, yyyy")}
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-[2px] bg-heatmap-empty" />
              <div className="w-3 h-3 rounded-[2px] bg-heatmap-level-1" />
              <div className="w-3 h-3 rounded-[2px] bg-heatmap-level-2" />
              <div className="w-3 h-3 rounded-[2px] bg-heatmap-level-3" />
              <div className="w-3 h-3 rounded-[2px] bg-heatmap-level-4" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
