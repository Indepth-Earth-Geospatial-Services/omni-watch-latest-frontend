'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
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

interface AreaChartProps {
  data: DataPoint[];
  xKey: string;
  yKeys: Array<{ key: string; color: string; name?: string }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  gradient?: boolean;
}

export function AreaChart({
  data,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  gradient = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width='100%' height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {gradient &&
            yKeys.map((yk) => (
              <linearGradient key={yk.key} id={`gradient-${yk.key}`} x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor={yk.color} stopOpacity={0.3} />
                <stop offset='95%' stopColor={yk.color} stopOpacity={0} />
              </linearGradient>
            ))}
        </defs>
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
        {yKeys.map((yk) => (
          <Area
            key={yk.key}
            type='monotone'
            dataKey={yk.key}
            name={yk.name ?? yk.key}
            stroke={yk.color}
            fill={gradient ? `url(#gradient-${yk.key})` : yk.color}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
