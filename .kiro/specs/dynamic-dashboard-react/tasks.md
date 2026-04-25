# Implementation Plan: Dynamic Dashboard React

## Overview

Extend the FastAPI backend with financial KPIs, per-call summaries, and Gemini AI insights; replace the static `index.html` with a Vite + React SPA; wire both services together via Docker Compose.

## Tasks

- [x] 1. Extend the FastAPI backend — CallResult model and financial KPI aggregation
  - [x] 1.1 Add `gross_profit`, `gross_profit_margin`, and `call_summary` optional fields to the `CallResult` Pydantic model in `main.py`
    - Fields must default to `None` so existing payloads without them continue to be accepted
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Write property test for call result ingestion round-trip (Property 1)
    - **Property 1: Call result ingestion round-trip**
    - Use `hypothesis` `@given(call_result_strategy())` — POST any valid `CallResult` payload, assert `success: true` and `id` returned, assert record appears in `GET /metrics` `recent_calls` with all fields preserved
    - Tag: `# Feature: dynamic-dashboard-react, Property 1`
    - **Validates: Requirements 1.1, 1.2, 1.3, 3.1, 3.2**

  - [x] 1.3 Update `GET /metrics` aggregation to compute `total_gross_profit` and `avg_gross_profit_margin`
    - Sum all stored `gross_profit` values for `total_gross_profit`; compute mean of `gross_profit_margin` values rounded to one decimal place for `avg_gross_profit_margin`
    - Return `0` / `0.0` when no records exist
    - Add both fields to the `summary` dict in the response and to `_empty_metrics()`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.4 Write property test for financial KPI aggregation correctness (Property 3)
    - **Property 3: Financial KPI aggregation correctness**
    - Use `hypothesis` `@given(st.lists(call_with_financials_strategy(), min_size=1))` — assert `total_gross_profit` equals exact sum and `avg_gross_profit_margin` equals rounded mean
    - Tag: `# Feature: dynamic-dashboard-react, Property 3`
    - **Validates: Requirements 2.1, 2.2**

  - [x] 1.5 Write property test for protected endpoint auth rejection (Property 2)
    - **Property 2: Protected endpoints reject invalid API keys**
    - Use `hypothesis` `@given(invalid_api_key_strategy())` — assert HTTP 403 for `POST /calls/result` and `GET /metrics` with absent or incorrect keys
    - Tag: `# Feature: dynamic-dashboard-react, Property 2`
    - **Validates: Requirements 1.4, 2.4**

- [x] 2. Add `GeminiClient` and wire AI insights into `GET /metrics`
  - [x] 2.1 Implement the `GeminiClient` async wrapper class in `main.py`
    - Read `GEMINI_API_KEY` from environment at startup; log a warning if absent
    - `generate_insights(kpi_context: dict) -> str | None`: build the prompt from the template in the design, call `model.generate_content_async`, return response text
    - Catch all exceptions, log the error, and return `None`
    - Instantiate a single `GeminiClient` at module level
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1_

  - [x] 2.2 Write property test for Gemini failure resilience (Property 4)
    - **Property 4: Gemini failure resilience**
    - Use `hypothesis` `@given(gemini_failure_strategy())` — mock `GeminiClient.generate_insights` to raise various exceptions; assert `GET /metrics` returns HTTP 200 with `ai_insights: null` and all other KPI fields populated
    - Tag: `# Feature: dynamic-dashboard-react, Property 4`
    - **Validates: Requirements 4.3**

  - [x] 2.3 Update `GET /metrics` to call `GeminiClient.generate_insights` and include `ai_insights` in the response
    - Call Gemini only when `total_calls > 0`; pass `total_calls`, `success_rate_pct`, `total_gross_profit`, `avg_gross_profit_margin`, `outcomes`, and `sentiments` as context
    - Add `ai_insights: null` to `_empty_metrics()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Checkpoint — backend tests pass
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 4. Scaffold the React frontend with Vite + TypeScript
  - [x] 4.1 Initialise a new Vite + React + TypeScript project in the `frontend/` directory
    - Run `npm create vite@latest frontend -- --template react-ts` (user runs this manually)
    - Install dependencies: `recharts`, `fast-check`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`
    - Configure `vite.config.ts`: set `server.proxy` to forward `/api` to `http://localhost:8000`, and read `VITE_API_BASE_URL` from env
    - _Requirements: 10.3, 10.4_

  - [x] 4.2 Create TypeScript interfaces in `frontend/src/types/metrics.ts`
    - Define `RecentCall`, `MetricsSummary`, and `MetricsResponse` interfaces exactly as specified in the design document
    - _Requirements: 1.1, 2.1, 3.1, 4.2_

- [x] 5. Implement the `useMetrics` polling hook
  - [x] 5.1 Create `frontend/src/hooks/useMetrics.ts`
    - Implement `useMetrics(baseUrl, apiKey, intervalMs = 30000): UseMetricsResult`
    - On each successful fetch update `data` and `lastUpdated`; on failure set `error` but retain previous `data`
    - Clean up the interval on unmount
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 5.2 Write property test for error state retaining last known data (Property 10)
    - **Property 10: Error state retains last known data**
    - Use `fast-check` — simulate a sequence where at least one fetch succeeds then a subsequent one fails; assert `data` is retained and `error` is set
    - Tag: `// Feature: dynamic-dashboard-react, Property 10`
    - **Validates: Requirements 5.5, 9.3**

- [x] 6. Implement React UI components
  - [x] 6.1 Create `frontend/src/components/Header.tsx`
    - Render logo, "Live" badge with pulsing dot, and `lastUpdated` timestamp prop
    - _Requirements: 9.2_

  - [x] 6.2 Create `frontend/src/components/KpiCard.tsx`
    - Accept `KpiCardProps`: `label`, `value`, `loading`, `accentColor?`, `subtext?`
    - Show a loading skeleton while `loading` is true; render formatted value otherwise
    - _Requirements: 5.3, 5.4_

  - [x] 6.3 Write property test for KPI value formatting (Property 5)
    - **Property 5: KPI value formatting**
    - Use `fast-check` `fc.property(fc.float(), ...)` — assert dollar-format and percentage-format functions always return a non-empty string
    - Tag: `// Feature: dynamic-dashboard-react, Property 5`
    - **Validates: Requirements 5.1, 5.2**

  - [x] 6.4 Create `frontend/src/components/KpiGrid.tsx`
    - Render a responsive grid of `KpiCard` instances for: Total Calls, Success Rate, Avg Agreed Rate, Rate vs Loadboard, Avg Call Duration, Gross Profit, Gross Profit Margin
    - Pass `loading` down to each card
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.5 Create `frontend/src/components/OutcomesChart.tsx`
    - Render a doughnut chart (Recharts `PieChart`) from the `outcomes` dict
    - Include a data point for every key, including zero-count categories
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 6.6 Write property test for chart data completeness (Property 6)
    - **Property 6: Chart data completeness**
    - Use `fast-check` `fc.property(fc.dictionary(...), ...)` — assert the chart data array contains an entry for every key in the input dict
    - Tag: `// Feature: dynamic-dashboard-react, Property 6`
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [x] 6.7 Create `frontend/src/components/SentimentChart.tsx`
    - Render a horizontal bar chart (Recharts `BarChart`) from the `sentiments` dict
    - Include all categories including zero-count ones
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 6.8 Create `frontend/src/components/CallsTable.tsx`
    - Accept `CallsTableProps`: `calls: RecentCall[]`, `loading: boolean`
    - Render columns: timestamp, MC number, carrier name, load ID, loadboard rate, agreed price, deal outcome, sentiment, call summary
    - Display `"—"` for any null field; show empty-state message when `calls` is empty
    - Calls are displayed in the order provided (descending by timestamp, sorted by backend)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 6.9 Write property test for CallsTable column rendering (Property 7)
    - **Property 7: Calls table renders all required columns**
    - Use `fast-check` `fc.property(fc.array(recentCallArbitrary()), ...)` — assert every row contains all required columns and null fields render as `"—"`
    - Tag: `// Feature: dynamic-dashboard-react, Property 7`
    - **Validates: Requirements 7.1, 7.2**

  - [x] 6.10 Write property test for timestamp descending order (Property 8)
    - **Property 8: Recent calls are ordered by timestamp descending**
    - Use `fast-check` `fc.property(fc.array(recentCallArbitrary(), {minLength: 2}), ...)` — assert rendered rows are in descending timestamp order
    - Tag: `// Feature: dynamic-dashboard-react, Property 8`
    - **Validates: Requirements 7.4**

  - [x] 6.11 Create `frontend/src/components/AiInsightsPanel.tsx`
    - Accept `AiInsightsPanelProps`: `insights: string | null`, `loading: boolean`
    - Show loading skeleton while `loading`; show placeholder "AI insights unavailable" when `insights` is null; render text otherwise
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 6.12 Write property test for AI insights panel rendering (Property 9)
    - **Property 9: AI insights panel renders any non-null text**
    - Use `fast-check` `fc.property(fc.string({minLength: 1}), ...)` — assert the panel renders the exact string passed as `insights`
    - Tag: `// Feature: dynamic-dashboard-react, Property 9`
    - **Validates: Requirements 8.1**

- [x] 7. Wire components together in `App.tsx`
  - [x] 7.1 Implement `frontend/src/App.tsx`
    - Read `VITE_API_BASE_URL` (default `http://localhost:8000`) and `VITE_API_KEY` from `import.meta.env`
    - Call `useMetrics` and pass `data`, `loading`, `error`, and `lastUpdated` to child components
    - Render `Header`, `KpiGrid`, `OutcomesChart`, `SentimentChart`, `CallsTable`, and `AiInsightsPanel`
    - Display an error banner when `error` is set, retaining last-known values in all components
    - _Requirements: 5.3, 5.4, 5.5, 9.1, 9.2, 9.3_

- [x] 8. Checkpoint — frontend tests pass
  - Ensure all frontend tests pass, ask the user if questions arise.

- [x] 9. Update Docker Compose and add frontend Dockerfile
  - [x] 9.1 Create `frontend/Dockerfile` (multi-stage: `node:20-alpine` build → `nginx:alpine` serve)
    - Build stage: `npm ci && npm run build`
    - Serve stage: copy `dist/` to `/usr/share/nginx/html`
    - Accept `VITE_API_BASE_URL` as a build arg and pass it to `npm run build`
    - _Requirements: 10.4_

  - [x] 9.2 Update `docker-compose.yml` to add the `frontend` service
    - Build context: `./frontend`, Dockerfile: `./frontend/Dockerfile`
    - Port mapping: `3000:80`
    - Pass `VITE_API_BASE_URL=http://api:8000` as a build arg
    - Add `depends_on: api`
    - Add `GEMINI_API_KEY` env var to the `api` service
    - _Requirements: 10.4, 10.5_

- [x] 10. Final checkpoint — full system integration
  - Ensure all backend and frontend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Backend PBT uses `hypothesis`; frontend PBT uses `fast-check` + `vitest`
- Property tests are placed close to their corresponding implementation tasks to catch errors early
- The `useMetrics` hook retains last-known-good data on polling failures (Requirements 5.5, 9.3)
