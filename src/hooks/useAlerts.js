import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/.netlify/functions/fetch-alerts');
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      } else {
        console.warn('⚠️ Unexpected alert data format', res.data);
        setAlerts([]);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('❌ Failed to load alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, lastUpdated, refresh: fetchAlerts };
};

export default useAlerts;
