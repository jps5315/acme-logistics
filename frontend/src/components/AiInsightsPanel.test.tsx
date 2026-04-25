// Feature: dynamic-dashboard-react, Property 9
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import AiInsightsPanel from './AiInsightsPanel';

/**
 * Validates: Requirements 8.1
 * Property 9: AI insights panel renders any non-null text
 */
describe('AiInsightsPanel', () => {
  it('Property 9: renders any non-empty string as insights text', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (text) => {
        const { unmount } = render(<AiInsightsPanel insights={text} loading={false} />);
        const el = screen.getByTestId('ai-insights-text');
        expect(el.textContent).toBe(text);
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('shows placeholder when insights is null', () => {
    render(<AiInsightsPanel insights={null} loading={false} />);
    expect(screen.getByTestId('ai-insights-placeholder')).toBeTruthy();
  });

  it('shows loading skeleton when loading is true', () => {
    render(<AiInsightsPanel insights={null} loading={true} />);
    expect(screen.getByTestId('ai-insights-loading')).toBeTruthy();
  });
});
