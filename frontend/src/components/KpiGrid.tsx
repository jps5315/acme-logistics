import { KpiCard, formatDollar, formatPercent } from "./KpiCard";
import type { MetricsSummary } from "../types/metrics";

interface KpiGridProps {
  summary: MetricsSummary | null;
  loading: boolean;
}

export function KpiGrid({ summary, loading }: KpiGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "16px",
      }}
    >
      <KpiCard
        label="Total Calls"
        value={summary?.total_calls ?? null}
        loading={loading}
      />
      <KpiCard
        label="Success Rate"
        value={formatPercent(summary?.success_rate_pct ?? 0)}
        loading={loading}
      />
      <KpiCard
        label="Total Gross Profit"
        value={formatDollar(summary?.total_gross_profit ?? 0)}
        loading={loading}
        accentColor="#16a34a"
      />
      <KpiCard
        label="Total Profit Margin"
        value={formatPercent(summary?.total_gross_profit_margin ?? 0)}
        loading={loading}
        accentColor="#16a34a"
      />
      <KpiCard
        label="Total Gross Loss"
        value={formatDollar(summary?.total_gross_loss ?? 0)}
        loading={loading}
        accentColor="#dc2626"
      />
      <KpiCard
        label="Total Loss Margin"
        value={formatPercent(summary?.total_gross_loss_margin ?? 0)}
        loading={loading}
        accentColor="#dc2626"
      />
    </div>
  );
}

export default KpiGrid;
