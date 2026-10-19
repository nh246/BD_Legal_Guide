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
    try {
      const res = await api.get(path);
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}

export default useApi;
