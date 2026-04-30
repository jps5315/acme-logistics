import { useState } from 'react';
import { RecentCall } from '../types/metrics';

interface CallsTableProps {
  calls: RecentCall[];
  loading: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatField(value: string | null): string {
  return value ?? '—';
}

const COLUMNS = [
  'Session ID',
  'MC Number',
  'Carrier Name',
  'Load ID',
  'Loadboard Rate',
  'Agreed Price',
  'Deal Outcome',
  'Sentiment',
];

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i}>
          {COLUMNS.map((col) => (
            <td key={col} style={{ padding: '10px 12px' }}>
              <div
                style={{
                  height: '14px',
                  background: '#e0e0e0',
                  borderRadius: '4px',
                  width: '80px',
                }}
              />
            </td>
          ))}
          {/* expand icon placeholder */}
          <td style={{ padding: '10px 12px', width: '32px' }} />
        </tr>
      ))}
    </>
  );
}

function CallRow({ call }: { call: RecentCall }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        key={call.id}
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          borderBottom: expanded ? 'none' : '1px solid #eee',
          cursor: 'pointer',
          background: expanded ? '#f0f9ff' : undefined,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '';
        }}
      >
        <td data-testid="cell-timestamp" style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
          {formatField(call.session_id)}
        </td>
        <td data-testid="cell-mc_number" style={{ padding: '10px 12px' }}>
          {formatField(call.mc_number)}
        </td>
        <td data-testid="cell-carrier_name" style={{ padding: '10px 12px' }}>
          {formatField(call.carrier_name)}
        </td>
        <td data-testid="cell-load_id" style={{ padding: '10px 12px' }}>
          {formatField(call.load_id)}
        </td>
        <td data-testid="cell-loadboard_rate" style={{ padding: '10px 12px' }}>
          {formatCurrency(call.loadboard_rate)}
        </td>
        <td data-testid="cell-agreed_price" style={{ padding: '10px 12px' }}>
          {formatCurrency(call.agreed_price)}
        </td>
        <td data-testid="cell-deal_outcome" style={{ padding: '10px 12px' }}>
          {formatField(call.deal_outcome)}
        </td>
        <td data-testid="cell-sentiment" style={{ padding: '10px 12px' }}>
          {formatField(call.customer_sentiment)}
        </td>
        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid #eee', background: '#f0f9ff' }}>
          <td
            colSpan={COLUMNS.length + 1}
            style={{ padding: '12px 16px 16px 16px' }}
          >
            <div style={{ fontSize: '13px', color: '#374151' }}>
              <span style={{ fontWeight: 600, marginRight: '8px' }}>Call Summary:</span>
              {call.call_summary
                ? call.call_summary
                : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No summary available</span>
              }
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CallsTable({ calls, loading }: CallsTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            {COLUMNS.map((col) => (
              <th
                key={col}
                style={{ padding: '10px 12px', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}
              >
                {col}
              </th>
            ))}
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #ddd', width: '32px' }} />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : calls.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length + 1}
                style={{ padding: '24px', textAlign: 'center', color: '#888' }}
              >
                No calls recorded yet
              </td>
            </tr>
          ) : (
            calls.map((call) => (
              <CallRow key={call.id} call={call} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
