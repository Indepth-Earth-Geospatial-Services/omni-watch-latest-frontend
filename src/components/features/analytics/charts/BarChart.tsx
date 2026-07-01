'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface BarChartProps {
  data: DataPoint[];
  xKey: string;
  bars: Array<{ key: string; color: string; name?: string; radius?: [number, number, number, number] }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  stacked = false,
  layout = 'horizontal',
}: BarChartProps) {
  const defaultRadius: [number, number, number, number] = [4, 4, 0, 0];

  return (
    <ResponsiveContainer width='100%' height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />}
        <XAxis
          type={layout === 'horizontal' ? 'category' : 'number'}
          dataKey={layout === 'horizontal' ? xKey : undefined}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
          type={layout === 'horizontal' ? 'number' : 'category'}
          dataKey={layout === 'vertical' ? xKey : undefined}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        )}
        {showLegend && <Legend />}
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name ?? b.key}
            fill={b.color}
            radius={b.radius ?? defaultRadius}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
