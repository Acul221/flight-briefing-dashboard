// src/components/ui/WeatherBox.jsx
import { useEffect, useState } from "react";

function WeatherBox({ icao }) {
  const [metar, setMetar] = useState("Loading METAR...");

  useEffect(() => {
    const fetchMetar = async () => {
      try {
        const res = await fetch(`/.netlify/functions/fetch-metar?icao=${icao}`);
        const data = await res.json();
        setMetar(data?.raw || '⚠️ No METAR data available for this airport');

      } catch (err) {
        console.error(err);
        setMetar("Failed to fetch METAR");
      }
    };
    fetchMetar();
  }, [icao]);

  return (
    <div className="bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white p-4 rounded-xl shadow transition-all">
      <h3 className="font-semibold mb-2">Weather Summary</h3>
      <pre className="text-sm font-mono whitespace-pre-wrap">{metar}</pre>
    </div>
  );
}

export default WeatherBox;
