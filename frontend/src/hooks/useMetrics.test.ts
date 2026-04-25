// Feature: dynamic-dashboard-react, Property 10
// Validates: Requirements 5.5, 9.3
//
// Property 10: Error state retains last known data
// For any sequence of polling requests where at least one succeeds before a
// subsequent failure, the useMetrics hook SHALL retain the data from the last
// successful response and set an error indicator, without clearing the displayed values.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import useMetrics from './useMetrics';
import type { MetricsResponse } from '../types/metrics';

const mockMetrics: MetricsResponse = {
  summary: {
    total_calls: 1,
    success_rate_pct: 100,
    avg_agreed_rate: 1000,
    avg_loadboard_rate: 900,
    price_vs_loadboard_pct: 11.1,
    avg_call_duration_secs: 120,
    total_gross_profit: 100,
    avg_gross_profit_margin: 10,
  },
  outcomes: { successful: 1 },
  sentiments: { happy: 1 },
  calls_over_time: [],
  recent_calls: [],
  ai_insights: null,
};

describe('useMetrics — Property 10: Error state retains last known data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retains last successful data and sets error after a subsequent fetch failure', async () => {
    // Property 10: for any N >= 1 successful fetches followed by a failure,
    // data is retained and error is set.
    await fc.assert(
      fc.asyncProperty(
        // Generate number of successful fetches before failure (min 1, max 5)
        fc.integer({ min: 1, max: 5 }),
        async (successCount) => {
          // Build a fetch mock: first successCount calls succeed, then fail
          let callIndex = 0;
          const fetchMock = vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex <= successCount) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMetrics),
              } as Response);
            }
            // Subsequent calls fail with a network error
            return Promise.reject(new Error('Network error'));
          });
          vi.stubGlobal('fetch', fetchMock);

          const intervalMs = 50;
          const { result, unmount } = renderHook(() =>
            useMetrics('http://localhost:8000', 'test-key', intervalMs)
          );

          // Advance through all successful fetches
          for (let i = 0; i < successCount; i++) {
            await act(async () => {
              await vi.advanceTimersByTimeAsync(intervalMs);
            });
          }

          // At this point, data should be set from the last successful fetch
          const dataAfterSuccess = result.current.data;
          expect(dataAfterSuccess).not.toBeNull();

          // Advance one more interval to trigger the failing fetch
          await act(async () => {
            await vi.advanceTimersByTimeAsync(intervalMs);
          });

          // Property assertion: data is retained and error is set
          expect(result.current.data).toEqual(dataAfterSuccess);
          expect(result.current.error).not.toBeNull();
          expect(result.current.error).toBeTypeOf('string');

          unmount();
          vi.restoreAllMocks();
          callIndex = 0;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('sets error on non-2xx response while retaining last known data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (successCount) => {
          let callIndex = 0;
          const fetchMock = vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex <= successCount) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockMetrics),
              } as Response);
            }
            // Non-2xx response (e.g. 500 Internal Server Error)
            return Promise.resolve({
              ok: false,
              status: 500,
            } as Response);
          });
          vi.stubGlobal('fetch', fetchMock);

          const intervalMs = 50;
          const { result, unmount } = renderHook(() =>
            useMetrics('http://localhost:8000', 'test-key', intervalMs)
          );

          // Advance through successful fetches
          for (let i = 0; i < successCount; i++) {
            await act(async () => {
              await vi.advanceTimersByTimeAsync(intervalMs);
            });
          }

          const dataAfterSuccess = result.current.data;
          expect(dataAfterSuccess).not.toBeNull();

          // Trigger the failing fetch
          await act(async () => {
            await vi.advanceTimersByTimeAsync(intervalMs);
          });

          // Property assertion: data retained, error set with status info
          expect(result.current.data).toEqual(dataAfterSuccess);
          expect(result.current.error).not.toBeNull();
          expect(result.current.error).toContain('500');

          unmount();
          vi.restoreAllMocks();
          callIndex = 0;
        }
      ),
      { numRuns: 20 }
    );
  });
});
