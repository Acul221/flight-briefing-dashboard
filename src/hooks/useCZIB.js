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

      if (!res.ok) {
        throw new Error(`❌ HTTP error ${res.status}`);
      }

      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('⚠️ Unexpected response format:', text.slice(0, 100));
        throw new Error('Response is not valid JSON');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn('⚠️ CZIB data is not an array:', data);
        setCzibs([]);
      } else {
        // Sort descending by pubDate
        const sorted = data.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        setCzibs(sorted);
      }

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
