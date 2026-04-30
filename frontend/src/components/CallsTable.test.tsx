// Feature: dynamic-dashboard-react, Property 7
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import CallsTable from './CallsTable';
import type { RecentCall } from '../types/metrics';

/**
 * Validates: Requirements 7.1, 7.2
 *
 * Property 7: Calls table renders all required columns and null fields render as "—"
 */

// Nullable string arbitrary — use non-whitespace strings to avoid edge cases
const nullableString = () => fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0)
);
// Nullable number arbitrary
const nullableNumber = () => fc.oneof(fc.constant(null), fc.float({ noNaN: true, noDefaultInfinity: true }));

function recentCallArbitrary(): fc.Arbitrary<RecentCall> {
  return fc.record({
    id: fc.uuidV(4),
    session_id: nullableString(),
    mc_number: nullableString(),
    carrier_name: nullableString(),
    load_id: nullableString(),
    agreed_price: nullableNumber(),
    loadboard_rate: nullableNumber(),
    deal_outcome: nullableString(),
    customer_sentiment: nullableString(),
    call_summary: nullableString(),
    gross_profit: nullableNumber(),
    gross_profit_margin: nullableNumber(),
    gross_loss: nullableNumber(),
    gross_loss_margin: nullableNumber(),
    timestamp: nullableString(),
    received_at: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  });
}

// Columns that have data-testid attributes in CallsTable
const NULLABLE_STRING_CELLS: Array<{ testId: string; field: keyof RecentCall }> = [
  { testId: 'cell-mc_number', field: 'mc_number' },
  { testId: 'cell-carrier_name', field: 'carrier_name' },
  { testId: 'cell-load_id', field: 'load_id' },
  { testId: 'cell-deal_outcome', field: 'deal_outcome' },
  { testId: 'cell-sentiment', field: 'customer_sentiment' },
  // call_summary column removed — now shown as a clickable dropdown, not a table column
];

const NULLABLE_NUMBER_CELLS: Array<{ testId: string; field: keyof RecentCall }> = [
  { testId: 'cell-loadboard_rate', field: 'loadboard_rate' },
  { testId: 'cell-agreed_price', field: 'agreed_price' },
];

describe('CallsTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('Property 7: renders all required columns and null fields show "—"', () => {
    fc.assert(
      fc.property(
        fc.array(recentCallArbitrary(), { minLength: 1, maxLength: 5 }),
        (calls) => {
          // Ensure unique IDs to avoid React key warnings
          const uniqueCalls = calls.map((c, i) => ({ ...c, id: `test-id-${i}` }));
          const { unmount } = render(<CallsTable calls={uniqueCalls} loading={false} />);

          for (const call of uniqueCalls) {
            const callIndex = uniqueCalls.indexOf(call);

            // Check nullable string cells — only verify null → "—" mapping
            for (const { testId, field } of NULLABLE_STRING_CELLS) {
              const cells = document.querySelectorAll(`[data-testid="${testId}"]`);
              const cell = cells[callIndex];
              expect(cell).toBeTruthy();
              if (call[field] === null) {
                expect(cell.textContent).toBe('—');
              } else {
                expect(cell.textContent).not.toBe('—');
              }
            }

            // Check nullable number cells — null renders as "—"
            for (const { testId, field } of NULLABLE_NUMBER_CELLS) {
              const cells = document.querySelectorAll(`[data-testid="${testId}"]`);
              const cell = cells[callIndex];
              expect(cell).toBeTruthy();
              if (call[field] === null) {
                expect(cell.textContent).toBe('—');
              }
            }

            // Check timestamp cell — null renders as "—"
            const timestampCells = document.querySelectorAll('[data-testid="cell-timestamp"]');
            const tsCell = timestampCells[callIndex];
            expect(tsCell).toBeTruthy();
            if (call.session_id === null && call.timestamp === null) {
              expect(tsCell.textContent).toBe('—');
            }
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('shows empty-state message when calls array is empty', () => {
    render(<CallsTable calls={[]} loading={false} />);
    expect(screen.getByText('No calls recorded yet')).toBeTruthy();
  });
});
