import { useCallback, useEffect, useState } from 'react';
import { fetchRecords } from '../api.js';

function useRecords(endpoint, recordLabel) {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      setStatus('loading');
      setError('');

      try {
        setRecords(await fetchRecords(endpoint, recordLabel, controller.signal));
        setStatus('success');
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return;
        }
        setError(loadError.message || `Unable to load ${recordLabel}.`);
        setStatus('error');
      }
    }

    loadRecords();
    return () => controller.abort();
  }, [endpoint, recordLabel, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { records, status, error, reload };
}

export default useRecords;
