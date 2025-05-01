// src/components/ui/WeatherBox.jsx
import { useEffect, useState } from "react";

function WeatherBox() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      try {
        const response = await fetch("/.netlify/functions/fetchMetar?icao=WIII");
        if (!response.ok) throw new Error("Failed to fetch METAR");
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  return (
    <div className="bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white p-4 rounded-xl shadow transition-all">
      <h3 className="font-semibold mb-1">Weather Summary</h3>
      {loading && <p className="text-sm">Loading METAR...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {weather && (
        <pre className="text-xs whitespace-pre-wrap font-mono">{weather.raw}</pre>
      )}
    </div>
  );
}

export default WeatherBox;
