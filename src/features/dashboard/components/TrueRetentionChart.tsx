import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useChartColors } from '@/hooks/useChartColors';

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({ data, targetRetention }) => {
  const colors = useChartColors();
  const targetPercent = targetRetention * 100;

  const chartConfig = {
    rate: {
      label: "Pass Rate",
      color: "hsl(var(--foreground))",
    },
  } satisfies ChartConfig

  const hasData = data.some(d => d.rate !== null);

  if (!hasData) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
          <div className="flex items-center gap-3">
            <div className="w-3 h-px bg-muted-foreground/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
          </div>
        </div>
        <div className="flex-1 min-h-[150px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground font-medium">No retention data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">True Retention (30d)</h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-px bg-muted-foreground/30" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/40">Target: {targetPercent}%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              interval={4}
              dy={12}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              cursor={{ stroke: colors.foreground, strokeWidth: 1, opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[150px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1 text-muted-foreground">
                        {item.payload.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal tabular-nums text-foreground">
                          {Number(value).toFixed(1)}%
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 text-muted-foreground">
                          Pass Rate
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
            <ReferenceLine y={targetPercent} stroke={colors.mutedForeground} strokeDasharray="4 4" opacity={0.3} strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={{ r: 0 }}
              activeDot={{ r: 4, fill: "var(--color-rate)", strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};

