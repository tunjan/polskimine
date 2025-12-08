import React from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface GradeDistributionChartProps {
  data: { name: string; value: number; color: string }[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      };
    });
    return config;
  }, [data]);

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] font-mono uppercase text-muted-foreground/40">
        No Data
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Answer Distribution</h3>
      </div>
      
      <div className="flex-1 flex items-center gap-8">
        <div className="h-[160px] w-[160px] shrink-0 relative">
            <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                data={data}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-light tracking-tighter"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 16}
                              className="fill-muted-foreground text-[9px] font-mono uppercase"
                            >
                              Reviews
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
            </PieChart>
            </ChartContainer>
        </div>

                <div className="flex flex-col gap-2 flex-1">
            {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                    </div>
                    <span className="text-xs font-mono">
                        {Math.round((item.value / total) * 100)}%
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

