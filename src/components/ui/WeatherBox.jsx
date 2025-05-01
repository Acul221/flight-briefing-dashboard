// src/components/ui/WeatherBox.jsx
import { useEffect, useState } from "react";

function WeatherBox({ icao }) {
  const [metar, setMetar] = useState("Loading METAR...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!icao || icao.length !== 4) {
      console.warn("Invalid or missing ICAO:", icao);
      setMetar("✈️ Please enter a valid 4-letter ICAO code.");
      return;
    }

    const fetchMetar = async () => {
      console.log("🌐 Fetching METAR for:", icao);
      setLoading(true);
      try {
        const res = await fetch(`/.netlify/functions/fetch-metar?icao=${icao}`);
        const data = await res.json();
        console.log("📦 METAR Response:", data);
        setMetar(data?.raw || '⚠️ No METAR data available for this airport');
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setMetar("Failed to fetch METAR");
      } finally {
        setLoading(false);
      }
    };

    fetchMetar();
  }, [icao]);

  return (
    <div className="bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white p-4 rounded-xl shadow transition-all">
      <h3 className="font-semibold mb-2">Weather Summary</h3>
      <pre className="text-sm font-mono whitespace-pre-wrap">
        {loading ? "Fetching METAR..." : metar}
      </pre>
    </div>
  );
}

export default WeatherBox;
