import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#14b8a6", "#f97316"];

export interface SentimentDataPoint {
  name: string;
  value: number;
}

export function sentimentsToChartData(sentiments: Record<string, number>): SentimentDataPoint[] {
  return Object.entries(sentiments).map(([name, value]) => ({ name, value }));
}

interface SentimentChartProps {
  sentiments: Record<string, number>;
}

export function SentimentChart({ sentiments }: SentimentChartProps) {
  const data = sentimentsToChartData(sentiments);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart layout="vertical" data={data} margin={{ left: 16, right: 16 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip />
        <Bar dataKey="value">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SentimentChart;
