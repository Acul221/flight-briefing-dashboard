// src/hooks/useCZIB.js

import { useEffect, useState, useCallback } from 'react';

const useCZIB = () => {
  const [czibs, setCzibs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCZIB = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/fetch-czibs');
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response: ${res.status}`);
      }

      const data = await res.json();
      setCzibs(Array.isArray(data) ? data : []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Failed to fetch CZIBs:', error);
      setCzibs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCZIB();
  }, [fetchCZIB]);

  return { czibs, loading, lastUpdated, refresh: fetchCZIB };
};

export default useCZIB;
