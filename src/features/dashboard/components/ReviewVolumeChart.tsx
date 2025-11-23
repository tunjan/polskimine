import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface ReviewVolumeChartProps {
  data: { date: string; count: number; label: string }[];
}

export const ReviewVolumeChart: React.FC<ReviewVolumeChartProps> = ({ data }) => {
  const colors = useChartColors();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border px-3 py-2 shadow-xl">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.date}</div>
          <div className="text-sm font-medium">
            <span className="font-mono">{payload[0].value}</span> reviews
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">30 Day Volume</h3>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
              axisLine={false}
              tickLine={false}
              interval={2}
              dy={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.2 }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors.foreground} 
                  fillOpacity={entry.count === 0 ? 0.1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
