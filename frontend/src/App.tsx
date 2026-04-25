import useMetrics from './hooks/useMetrics';
import Header from './components/Header';
import { KpiGrid } from './components/KpiGrid';
import { OutcomesChart } from './components/OutcomesChart';
import { SentimentChart } from './components/SentimentChart';
import CallsTable from './components/CallsTable';
import AiInsightsPanel from './components/AiInsightsPanel';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const apiKey = import.meta.env.VITE_API_KEY ?? '';

export default function App() {
  const { data, loading, error, lastUpdated } = useMetrics(baseUrl, apiKey);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      <Header lastUpdated={lastUpdated} />

      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div
            data-testid="error-banner"
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#b91c1c',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <KpiGrid summary={data?.summary ?? null} loading={loading} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>Call Outcomes</h3>
            <OutcomesChart outcomes={data?.outcomes ?? {}} />
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>Sentiment Breakdown</h3>
            <SentimentChart sentiments={data?.sentiments ?? {}} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>Recent Calls</h3>
          <CallsTable calls={data?.recent_calls ?? []} loading={loading} />
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>AI Insights</h3>
          <AiInsightsPanel insights={data?.ai_insights ?? null} loading={loading} />
        </div>
      </main>
    </div>
  );
}
