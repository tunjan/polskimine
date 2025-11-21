import React, { useMemo } from 'react';
import { Card } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useChartColors } from '@/hooks/useChartColors';

interface RetentionStatsProps {
  cards: Card[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = ({ cards }) => {
  const colors = useChartColors();


  const forecastData = useMemo(() => {
    const daysToShow = 30;
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
      { label: '3-6m', min: 90, max: 180, count: 0 },
      { label: '6m-1y', min: 180, max: 365, count: 0 },
      { label: '1y+', min: 365, max: Infinity, count: 0 },
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
  }, [cards, colors.primary, colors.muted, colors.border, colors.foreground]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Reviews (30 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: colors.foreground }} 
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: colors.foreground }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{ fill: colors.muted }}
                />
                <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Card Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                     borderRadius: '8px',
                     border: `1px solid ${colors.border}`,
                     backgroundColor: colors.background,
                     color: colors.foreground,
                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                   }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stability Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Memory Stability (Retention Strength)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Shows how long cards are expected to be remembered (90% retention probability). Higher is better.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stabilityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: colors.foreground }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: colors.foreground }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                cursor={{ fill: colors.muted }}
              />
              <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};