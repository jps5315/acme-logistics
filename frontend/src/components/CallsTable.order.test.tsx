// Feature: dynamic-dashboard-react, Property 8
import { describe, it, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import CallsTable from './CallsTable';

/**
 * Validates: Requirements 7.4
 *
 * Property 8: Recent calls are ordered by timestamp descending.
 * The frontend displays calls in the order provided (sorted descending by backend).
 * This test verifies that IF the input is already sorted descending, the rendered
 * rows maintain that same order.
 */

describe('CallsTable — Property 8: timestamp descending order', () => {
  afterEach(() => {
    cleanup();
  });

  it('Property 8: rendered rows maintain descending timestamp order when input is sorted descending', () => {
    fc.assert(
      fc.property(
        // Generate arrays of distinct timestamps to avoid sort instability
        fc.array(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          { minLength: 2, maxLength: 10 }
        ).filter(dates => {
          // Ensure all timestamps are distinct
          const times = dates.map(d => d.getTime());
          return new Set(times).size === times.length;
        }),
        (dates) => {
          const calls = dates.map((d, i) => ({
            id: `test-id-${i}`,
            session_id: `session-${i}-${d.getTime()}`,
            mc_number: null,
            carrier_name: null,
            load_id: null,
            agreed_price: null,
            loadboard_rate: null,
            deal_outcome: null,
            customer_sentiment: null,
            call_summary: null,
            gross_profit: null,
            gross_profit_margin: null,
            gross_loss: null,
            gross_loss_margin: null,
            timestamp: d.toISOString(),
            received_at: d.toISOString(),
          }));

          // Sort descending by timestamp
          const sortedCalls = [...calls].sort((a, b) =>
            new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
          );

          const { unmount } = render(<CallsTable calls={sortedCalls} loading={false} />);

          const timestampCells = document.querySelectorAll('[data-testid="cell-timestamp"]');

          if (timestampCells.length !== sortedCalls.length) {
            unmount();
            return false;
          }

          // Session ID is rendered as-is (no formatting)
          const expectedTexts = sortedCalls.map(call => call.session_id!);

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
