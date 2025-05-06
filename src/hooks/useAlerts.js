import { useEffect, useState } from 'react';
import axios from 'axios';

const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('/.netlify/functions/fetch-alerts');
        setAlerts(res.data);
      } catch (err) {
        console.error('❌ Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return { alerts, loading };
};

export default useAlerts;
