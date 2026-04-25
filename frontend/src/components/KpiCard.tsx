export interface KpiCardProps {
  label: string;
  value: string | number | null;
  loading: boolean;
  accentColor?: string;
  subtext?: string;
}

export function formatDollar(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function KpiCard({ label, value, loading, accentColor, subtext }: KpiCardProps) {
  if (loading) {
    return (
      <div style={{ padding: "16px", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ height: "14px", width: "60%", background: "#e0e0e0", borderRadius: "4px", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "28px", width: "80%", background: "#e0e0e0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  const displayValue = value === null || value === undefined ? "—" : value;

  return (
    <div style={{ padding: "16px", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 600, color: accentColor ?? "#111" }}>{displayValue}</div>
      {subtext && <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{subtext}</div>}
    </div>
  );
}

export default KpiCard;
