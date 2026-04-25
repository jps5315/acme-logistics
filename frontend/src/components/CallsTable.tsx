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

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const COLUMNS = [
  'Timestamp',
  'MC Number',
  'Carrier Name',
  'Load ID',
  'Loadboard Rate',
  'Agreed Price',
  'Deal Outcome',
  'Sentiment',
  'Call Summary',
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
                  width: col === 'Call Summary' ? '180px' : '80px',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
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
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : calls.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                style={{ padding: '24px', textAlign: 'center', color: '#888' }}
              >
                No calls recorded yet
              </td>
            </tr>
          ) : (
            calls.map((call) => (
              <tr key={call.id} style={{ borderBottom: '1px solid #eee' }}>
                <td data-testid="cell-timestamp" style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(call.timestamp)}
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
                <td data-testid="cell-call_summary" style={{ padding: '10px 12px' }}>
                  {formatField(call.call_summary)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
