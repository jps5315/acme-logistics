// Feature: dynamic-dashboard-react, Property 5
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDollar, formatPercent } from './KpiCard';

/**
 * Validates: Requirements 5.1, 5.2
 *
 * Property 5: KPI value formatting functions always return a non-empty string
 * for any finite float input.
 */
describe('KpiCard formatting functions', () => {
  it('formatDollar returns a non-empty string containing "$" for any finite float', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const result = formatDollar(value);
          expect(result.length).toBeGreaterThan(0);
          expect(result).toContain('$');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatPercent returns a non-empty string ending with "%" for any finite float', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const result = formatPercent(value);
          expect(result.length).toBeGreaterThan(0);
          expect(result.endsWith('%')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
