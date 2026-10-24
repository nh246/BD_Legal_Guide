import { useCallback, useEffect, useState } from 'react';
import api from './api';

/**
 * GET `path` on mount (and whenever `path` changes).
 * Returns { data, setData, loading, error, reload }.
 * Pass a falsy path to skip fetching.
 */
export function useApi(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const res = await api.get(path);
        setData(res.data);
        setError(null);
        setLoading(false);
        return;
      } catch (err) {
        attempts++;
        // If it's a network disconnect / server reboot (no HTTP response), retry with backoff
        if (!err.response && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempts * 700));
          continue;
        }
        setError(err);
        break;
      }
    }
    setLoading(false);
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export default useApi;
