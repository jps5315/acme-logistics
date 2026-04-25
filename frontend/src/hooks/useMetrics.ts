import { useState, useEffect, useCallback, useRef } from 'react';
import { MetricsResponse } from '../types/metrics';

interface UseMetricsResult {
  data: MetricsResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

function useMetrics(baseUrl: string, apiKey: string, intervalMs: number = 30000): UseMetricsResult {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasReceivedData = useRef(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/metrics`, {
        headers: { 'X-API-Key': apiKey },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const json: MetricsResponse = await response.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
      hasReceivedData.current = true;
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Only clear loading on first fetch failure; subsequent failures keep loading=false
      if (!hasReceivedData.current) {
        setLoading(false);
      }
    }
  }, [baseUrl, apiKey]);

  useEffect(() => {
    fetchMetrics();

    const intervalId = setInterval(fetchMetrics, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchMetrics, intervalMs]);

  return { data, loading, error, lastUpdated, refresh: fetchMetrics };
}

export default useMetrics;
