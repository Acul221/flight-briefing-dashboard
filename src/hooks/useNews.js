import { useEffect, useState, useCallback } from 'react';

const useNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/fetch-news');

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('⚠️ Unexpected response (not JSON):', text.slice(0, 100));
        throw new Error('Response is not JSON');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn('⚠️ Unexpected news format:', data);
        return;
      }

      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { articles, loading, refresh: fetchNews };
};

export default useNews;
