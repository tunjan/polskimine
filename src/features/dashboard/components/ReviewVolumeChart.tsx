import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; count: number } }>;
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const colors = useChartColors();

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-4 py-3 rounded-md">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1">{payload[0].payload.date}</div>
          <div className="text-sm font-normal tabular-nums">
            {payload[0].value} reviews
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }} 
              axisLine={false}
              tickLine={false}
              interval={2}
              dy={12}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.foreground, opacity: 0.05 }} />
            <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors.foreground} 
                  fillOpacity={entry.count === 0 ? 0.05 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
