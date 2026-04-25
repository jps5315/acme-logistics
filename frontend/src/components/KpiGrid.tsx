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
        label="Avg Agreed Rate"
        value={formatDollar(summary?.avg_agreed_rate ?? 0)}
        loading={loading}
      />
      <KpiCard
        label="Rate vs Loadboard"
        value={formatPercent(summary?.price_vs_loadboard_pct ?? 0)}
        loading={loading}
      />
      <KpiCard
        label="Avg Call Duration"
        value={`${summary?.avg_call_duration_secs ?? 0}s`}
        loading={loading}
      />
      <KpiCard
        label="Gross Profit"
        value={formatDollar(summary?.total_gross_profit ?? 0)}
        loading={loading}
        accentColor="#16a34a"
      />
      <KpiCard
        label="Gross Profit Margin"
        value={formatPercent(summary?.avg_gross_profit_margin ?? 0)}
        loading={loading}
        accentColor="#16a34a"
      />
    </div>
  );
}

export default KpiGrid;
