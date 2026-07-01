'use client';

import {
  LineChart as RechartsLineChart,
  Line,
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

interface LineChartProps {
  data: DataPoint[];
  xKey: string;
  lines: Array<{ key: string; color: string; name?: string; dashed?: boolean }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  smooth?: boolean;
}

export function LineChart({
  data,
  xKey,
  lines,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  smooth = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width='100%' height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
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
        {lines.map((l) => (
          <Line
            key={l.key}
            type={smooth ? 'monotone' : 'linear'}
            dataKey={l.key}
            name={l.name ?? l.key}
            stroke={l.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            strokeDasharray={l.dashed ? '5 5' : undefined}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
