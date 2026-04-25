interface AiInsightsPanelProps {
  insights: string | null;
  loading: boolean;
}

export default function AiInsightsPanel({ insights, loading }: AiInsightsPanelProps) {
  if (loading) {
    return (
      <div data-testid="ai-insights-loading" style={{ padding: '16px' }}>
        {[80, 60, 70].map((width, i) => (
          <div
            key={i}
            style={{
              height: '14px',
              width: `${width}%`,
              background: '#e0e0e0',
              borderRadius: '4px',
              marginBottom: '10px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (insights === null) {
    return (
      <div
        data-testid="ai-insights-placeholder"
        style={{ padding: '16px', color: '#888', fontStyle: 'italic' }}
      >
        AI insights unavailable
      </div>
    );
  }

  return (
    <div
      data-testid="ai-insights-text"
      style={{ padding: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
    >
      {insights}
    </div>
  );
}
