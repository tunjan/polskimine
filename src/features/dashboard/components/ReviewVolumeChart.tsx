import React from "react";
import { BarChart, Bar, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({
  data,
}) => {
  const chartConfig = {
    count: {
      label: "Reviews",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground/50">
          30 Day Volume
        </h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={2}
              className="text-[10px] font-mono uppercase opacity-50 text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index, payload) => (
                    <>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="text-sm font-normal tabular-nums text-foreground">
                        {value} reviews
                      </div>
                    </>
                  )}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};
