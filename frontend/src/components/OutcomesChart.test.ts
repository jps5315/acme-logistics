// Feature: dynamic-dashboard-react, Property 6
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { outcomesToChartData } from "./OutcomesChart";

// Validates: Requirements 6.1, 6.2, 6.4
describe("outcomesToChartData", () => {
  it("Property 6: chart data completeness — output contains an entry for every key in the input dict", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1 }), fc.integer({ min: 0, max: 1000 })),
        (outcomes) => {
          const result = outcomesToChartData(outcomes);
          const keys = Object.keys(outcomes);

          // Same length
          expect(result).toHaveLength(keys.length);

          // Every key appears as a name
          for (const key of keys) {
            expect(result.some((entry) => entry.name === key)).toBe(true);
          }

          // Every value appears as the corresponding value for its key
          for (const [key, val] of Object.entries(outcomes)) {
            const entry = result.find((e) => e.name === key);
            expect(entry).toBeDefined();
            expect(entry!.value).toBe(val);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
