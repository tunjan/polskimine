import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Card as CardType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
} from 'recharts';
import { differenceInCalendarDays, parseISO, format, addDays, addMonths, eachMonthOfInterval } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RetentionStatsProps {
  cards: CardType[];
}

export const RetentionStats: React.FC<RetentionStatsProps> = React.memo(({ cards }) => {
  const [forecastRange, setForecastRange] = useState<'7d' | '1m' | '1y'>('7d');

  const forecastData = useMemo(() => {
    const today = new Date();
    let data: { label: string; count: number; fullDate?: Date }[] = [];

    if (forecastRange === '7d') {
      data = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'EEE'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1m') {
      data = Array.from({ length: 30 }).map((_, i) => {
        const date = addDays(today, i);
        return { label: format(date, 'd'), count: 0, fullDate: date };
      });
    } else if (forecastRange === '1y') {
      const months = eachMonthOfInterval({ start: today, end: addMonths(today, 11) });
      data = months.map(date => ({ label: format(date, 'MMM'), count: 0, fullDate: date }));
    }

    cards.forEach(card => {
      if (card.status === 'known' || !card.dueDate) return;
      const dueDate = parseISO(card.dueDate);
      const diffDays = differenceInCalendarDays(dueDate, today);

      if (diffDays < 0) return;

      if (forecastRange === '7d' && diffDays < 7) data[diffDays].count++;
      else if (forecastRange === '1m' && diffDays < 30) data[diffDays].count++;
      else if (forecastRange === '1y') {
        const monthIndex = data.findIndex(d => d.fullDate && d.fullDate.getMonth() === dueDate.getMonth() && d.fullDate.getFullYear() === dueDate.getFullYear());
        if (monthIndex !== -1) data[monthIndex].count++;
      }
    });
    return data;
  }, [cards, forecastRange]);

  const stabilityData = useMemo(() => {
    const buckets = [
      { label: '0-1d', min: 0, max: 1, count: 0 },
      { label: '3d', min: 1, max: 3, count: 0 },
      { label: '1w', min: 3, max: 7, count: 0 },
      { label: '2w', min: 7, max: 14, count: 0 },
      { label: '1m', min: 14, max: 30, count: 0 },
      { label: '3m', min: 30, max: 90, count: 0 },
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

  const forecastConfig = {
    count: {
      label: "Cards",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const stabilityConfig = {
    count: {
      label: "Cards",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-light ">
        No data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-base font-medium">Workload Forecast</CardTitle>
          <div className="flex gap-1">
            {(['7d', '1m', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={forecastRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setForecastRange(range)}
                className="h-7 px-2 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ChartContainer config={forecastConfig} className="h-full w-full">
              <BarChart data={forecastData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => value}
                  className="text-xs text-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

            <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-base font-medium">Memory Stability</CardTitle>
          <CardDescription className="text-xs">Retention Interval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ChartContainer config={stabilityConfig} className="h-full w-full">
              <BarChart data={stabilityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-xs text-muted-foreground"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
