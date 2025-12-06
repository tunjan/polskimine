import React from 'react';
import { BarChart, Bar, XAxis, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useChartColors } from '@/hooks/useChartColors';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const colors = useChartColors();

  const chartConfig = {
    count: {
      label: "Reviews",
      color: "hsl(var(--foreground))",
    },
  } satisfies ChartConfig

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground/50">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              interval={2}
              dy={12}
            />
            <ChartTooltip
              cursor={{ fill: colors.foreground, opacity: 0.05 }}
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
            <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="var(--color-count)"
                  fillOpacity={entry.count === 0 ? 0.05 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
};

