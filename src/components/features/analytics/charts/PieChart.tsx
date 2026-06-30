'use client';

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface PieChartProps {
  data: DataPoint[];
  colors: string[];
  height?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  centerText?: string;
}

export function PieChart({
  data,
  colors,
  height = 300,
  showTooltip = true,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90,
  centerText,
}: PieChartProps) {
  return (
    <ResponsiveContainer width='100%' height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey='value'
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
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
        {centerText && (
          <text x='50%' y='50%' textAnchor='middle' dominantBaseline='middle' className='fill-foreground text-lg font-bold'>
            {centerText}
          </text>
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
