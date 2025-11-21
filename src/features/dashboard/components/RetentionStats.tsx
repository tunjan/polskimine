import React, { useMemo } from 'react';
import { Card } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useChartColors } from '@/hooks/useChartColors';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const colors = useChartColors();

  const forecastData = useMemo(() => {
    const daysToShow = 14;
    const data = new Array(daysToShow).fill(0).map((_, i) => ({ day: i, count: 0, label: `+${i}d` }));
    const today = new Date();

    cards.forEach(card => {
      if (card.status === 'known' || card.status === 'new') return;
      
      const dueDate = parseISO(card.dueDate);
      const diff = differenceInCalendarDays(dueDate, today);
      
      if (diff >= 0 && diff < daysToShow) {
        data[diff].count++;
      }
    });
    
    data[0].label = 'Today';
    data[1].label = 'Tmrw';
    
    return data;
  }, [cards]);

  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '1-3d', min: 1, max: 3, count: 0 },
      { label: '3-7d', min: 3, max: 7, count: 0 },
      { label: '7-14d', min: 7, max: 14, count: 0 },
      { label: '14-30d', min: 14, max: 30, count: 0 },
      { label: '1-3m', min: 30, max: 90, count: 0 },
      { label: '3m+', min: 90, max: Infinity, count: 0 },
    ];

    cards.forEach(card => {
      if (!card.stability) return;
      const s = card.stability;
      const bucket = buckets.find(b => s >= b.min && s < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [cards]);

  const statusData = useMemo(() => {
    const counts = {
      new: 0,
      learning: 0,
      graduated: 0,
      known: 0
    };
    
    cards.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });

    return [
      { name: 'New', value: counts.new, color: colors.primary },
      { name: 'Learning', value: counts.learning, color: colors.muted },
      { name: 'Graduated', value: counts.graduated, color: colors.border },
      { name: 'Known', value: counts.known, color: colors.foreground },
    ];
  }, [cards, colors]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background text-xs p-2 rounded shadow-xl border-none">
          <p className="font-medium">{label}</p>
          <p>{payload[0].value} cards</p>
        </div>
      );
    }
    return null;
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-background p-8 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center h-64">
          <p className="text-muted-foreground text-sm">No cards available yet.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Add some cards to see your retention stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        {/* Status Distribution */}
        <div className="bg-background p-6 rounded-2xl border border-border/50 flex flex-col">
          <h3 className="text-sm font-medium mb-6">Card Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6">
             {statusData.map((entry) => (
                 <div key={entry.name} className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                     <span className="text-xs font-medium text-muted-foreground">{entry.name}</span>
                     <span className="text-xs text-foreground font-mono">{entry.value}</span>
                 </div>
             ))}
          </div>
        </div>

      {/* Stability Chart */}
        <div className="bg-background p-6 rounded-2xl border border-border/50 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-medium">Memory Stability</h3>
            <p className="text-xs text-muted-foreground mt-1">Retention strength distribution</p>
          </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: colors.muted }} 
                axisLine={false}
                tickLine={false}
                interval={0}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: colors.muted }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.muted, opacity: 0.2 }} />
              <Bar dataKey="count" fill={colors.foreground} radius={[4, 4, 4, 4]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};