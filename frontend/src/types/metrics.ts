export interface RecentCall {
  id: string;
  session_id: string | null;
  mc_number: string | null;
  carrier_name: string | null;
  load_id: string | null;
  agreed_price: number | null;
  loadboard_rate: number | null;
  deal_outcome: string | null;
  customer_sentiment: string | null;
  call_summary: string | null;
  gross_profit: number | null;
  gross_profit_margin: number | null;
  gross_loss: number | null;
  gross_loss_margin: number | null;
  timestamp: string | null;
  received_at: string;
}

export interface MetricsSummary {
  total_calls: number;
  success_rate_pct: number;
  total_gross_profit: number;
  total_gross_profit_margin: number;
  total_gross_loss: number;
  total_gross_loss_margin: number;
}

export interface MetricsResponse {
  summary: MetricsSummary;
  outcomes: Record<string, number>;
  sentiments: Record<string, number>;
  calls_over_time: Array<{ date: string; count: number }>;
  recent_calls: RecentCall[];
  ai_insights: string | null;
}
