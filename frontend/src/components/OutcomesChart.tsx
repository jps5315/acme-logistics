import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#14b8a6", "#f97316"];

export interface ChartDataPoint {
  name: string;
  value: number;
}

export function outcomesToChartData(outcomes: Record<string, number>): ChartDataPoint[] {
  return Object.entries(outcomes).map(([name, value]) => ({ name, value }));
}

interface OutcomesChartProps {
  outcomes: Record<string, number>;
}

export function OutcomesChart({ outcomes }: OutcomesChartProps) {
  const data = outcomesToChartData(outcomes);

  return (
    <PieChart width={340} height={260}>
      <Pie
        data={data}
        cx={160}
        cy={110}
        innerRadius={60}
        outerRadius={100}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}

export default OutcomesChart;
