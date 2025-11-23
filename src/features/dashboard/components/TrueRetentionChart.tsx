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
        <div className="bg-background border border-border px-3 py-2 shadow-xl">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium font-mono">{payload[0].value.toFixed(1)}%</span>
             <span className="text-[10px] text-muted-foreground">Pass Rate</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">True Retention (30d)</h3>
        <div className="flex items-center gap-2">
            <div className="w-2 h-px bg-muted-foreground/50" />
            <span className="text-[9px] font-mono uppercase text-muted-foreground">Target: {targetPercent}%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }} 
              axisLine={false}
              tickLine={false}
              interval={4}
              dy={10}
            />
            <YAxis 
                domain={[60, 100]} 
                tick={{ fontSize: 9, fill: colors.mutedForeground, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.muted, strokeWidth: 1 }} />
            <ReferenceLine y={targetPercent} stroke={colors.mutedForeground} strokeDasharray="3 3" opacity={0.5} />
            <Line 
                type="monotone" 
                dataKey="rate" 
                stroke={colors.foreground} 
                strokeWidth={1.5}
                dot={{ r: 2, fill: colors.background, strokeWidth: 1.5 }}
                activeDot={{ r: 4, fill: colors.primary }}
                connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
