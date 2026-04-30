// Feature: dynamic-dashboard-react, Property 8
import { describe, it, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import CallsTable from './CallsTable';
import type { RecentCall } from '../types/metrics';

/**
 * Validates: Requirements 7.4
 *
 * Property 8: Recent calls are ordered by timestamp descending.
 * The frontend displays calls in the order provided (sorted descending by backend).
 * This test verifies that IF the input is already sorted descending, the rendered
 * rows maintain that same order.
 */

function recentCallArbitrary(): fc.Arbitrary<RecentCall> {
  // Generate ISO timestamp strings (non-null) for ordering tests
  const isoTimestamp = fc
    .date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
    .map((d) => d.toISOString());
  const nullableStr = fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 }));
  const nullableFloat = fc.oneof(fc.constant(null), fc.float({ noNaN: true, noDefaultInfinity: true }));

  return fc.record({
    id: fc.uuid(),
    session_id: nullableStr,
    mc_number: nullableStr,
    carrier_name: nullableStr,
    load_id: nullableStr,
    agreed_price: nullableFloat,
    loadboard_rate: nullableFloat,
    deal_outcome: nullableStr,
    customer_sentiment: nullableStr,
    call_summary: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
    gross_profit: nullableFloat,
    gross_profit_margin: nullableFloat,
    gross_loss: nullableFloat,
    gross_loss_margin: nullableFloat,
    timestamp: isoTimestamp,
    received_at: fc.string({ minLength: 1, maxLength: 20 }),
  });
}

describe('CallsTable — Property 8: timestamp descending order', () => {
  afterEach(() => {
    cleanup();
  });

  it('Property 8: rendered rows maintain descending timestamp order when input is sorted descending', () => {
    fc.assert(
      fc.property(
        fc.array(recentCallArbitrary(), { minLength: 2, maxLength: 10 }),
        (calls) => {
          // Sort descending by timestamp before passing to the component
          const sortedCalls = [...calls].sort((a, b) => {
            // timestamp is non-null due to our arbitrary
            return new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime();
          });

          const { unmount } = render(<CallsTable calls={sortedCalls} loading={false} />);

          const timestampCells = document.querySelectorAll('[data-testid="cell-timestamp"]');

          // The number of rendered cells must match the number of calls
          if (timestampCells.length !== sortedCalls.length) {
            unmount();
            return false;
          }

          // Build the expected rendered texts from the sorted input
          const expectedTexts = sortedCalls.map((call) =>
            new Date(call.timestamp!).toLocaleString()
          );

          // Assert each rendered cell matches the expected text in order
          for (let i = 0; i < sortedCalls.length; i++) {
            if (timestampCells[i].textContent !== expectedTexts[i]) {
              unmount();
              return false;
            }
          }

          unmount();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
