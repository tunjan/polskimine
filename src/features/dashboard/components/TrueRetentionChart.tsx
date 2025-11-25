import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useChartColors } from '@/hooks/useChartColors';

interface TrueRetentionChartProps {
  data: { date: string; rate: number | null }[];
  targetRetention: number;
}

export const TrueRetentionChart: React.FC<TrueRetentionChartProps> = ({ data, targetRetention }) => {
  const colors = useChartColors();
  const targetPercent = targetRetention * 100;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 mb-1">{label}</div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-normal tabular-nums">{payload[0].value.toFixed(1)}%</span>
             <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">Pass Rate</span>
          </div>
        </div>
      );
    }
    return null;
  };

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
        <ResponsiveContainer width="100%" height="100%">
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
                domain={[60, 100]} 
                tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.foreground, strokeWidth: 1, opacity: 0.1 }} />
            <ReferenceLine y={targetPercent} stroke={colors.mutedForeground} strokeDasharray="4 4" opacity={0.3} strokeWidth={1} />
            <Line 
                type="monotone" 
                dataKey="rate" 
                stroke={colors.foreground} 
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 4, fill: colors.foreground, strokeWidth: 0 }}
                connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
