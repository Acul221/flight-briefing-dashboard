import { useState, useEffect } from "react";

export default function WeatherSummary() {
  const [dest, setDest] = useState("");
  const [alt, setAlt] = useState("");
  const [summary, setSummary] = useState("Fetching weather summary...");
  const [loading, setLoading] = useState(false);

  const fetchFromFn = async (endpoint, param) => {
    try {
      const url = `/.netlify/functions/${endpoint}?icao=${param}`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  };

  const fetchCurrentWeather = async (lat, lon) => {
    try {
      const res = await fetch(`/.netlify/functions/fetch-current?lat=${lat}&lon=${lon}`);
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    let narrative = `📍 Weather at your current location:\n`;

    // Get current location
    const pos = await new Promise((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p.coords),
        () => resolve(null)
      )
    );

    if (pos) {
      const local = await fetchCurrentWeather(pos.latitude, pos.longitude);
      if (local) {
        narrative += `🌡️ Temp: ${local.temp}°C, ${local.clouds}, Wind: ${local.windSpeed} m/s from ${local.windDeg}°, Pressure: ${local.pressure} hPa, Visibility: ${local.visibility} m.\n`;
      } else {
        narrative += "⚠️ Local weather unavailable.\n";
      }
    } else {
      narrative += "⚠️ Location not available.\n";
    }

    // DEST
    if (dest) {
      narrative += `\n🛬 Destination (${dest}):\n`;
      const [metar, taf, sigmet] = await Promise.all([
        fetchFromFn("fetch-metar", dest),
        fetchFromFn("fetch-taf", dest),
        fetchFromFn("fetch-sigmet", dest),
      ]);
      narrative += `METAR: ${metar?.raw || "N/A"}\n`;
      narrative += `TAF: ${taf?.raw || "N/A"}\n`;
      narrative += `SIGMET: ${sigmet?.rawSigmet || "No significant SIGMET"}\n`;
      narrative += `NOTAM: Skipped (free-tier)\n`;
    }

    // ALT
    if (alt) {
      narrative += `\n🛬 Alternate (${alt}):\n`;
      const [metar, taf, sigmet] = await Promise.all([
        fetchFromFn("fetch-metar", alt),
        fetchFromFn("fetch-taf", alt),
        fetchFromFn("fetch-sigmet", alt),
      ]);
      narrative += `METAR: ${metar?.raw || "N/A"}\n`;
      narrative += `TAF: ${taf?.raw || "N/A"}\n`;
      narrative += `SIGMET: ${sigmet?.rawSigmet || "No significant SIGMET"}\n`;
      narrative += `NOTAM: Skipped (free-tier)\n`;
    }

    // GPT
    try {
      const res = await fetch("/.netlify/functions/get-weather-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      const data = await res.json();
      if (data.analysis) {
        narrative += `\n\n🧠 AI Reasoning:\n${data.analysis}`;
      } else {
        narrative += "\n\n⚠️ AI Reasoning unavailable.";
      }
    } catch {
      narrative += "\n\n⚠️ AI Reasoning error.";
    }

    setSummary(narrative);
    setLoading(false);
  };

  // Auto-update on mount
  useEffect(() => {
    handleUpdate();
  }, []);

  return (
    <section className="p-6 mt-6 max-w-6xl mx-auto bg-white/30 dark:bg-gray-800/40 backdrop-blur-md rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">🛰️ Weather Summary</h2>
        <button
          onClick={handleUpdate}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Update Weather
        </button>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Based on your location, destination, and alternate airports
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <input
          className="p-2 border rounded w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          placeholder="Destination ICAO (e.g., WIII)"
          value={dest}
          onChange={(e) => setDest(e.target.value.toUpperCase())}
        />
        <input
          className="p-2 border rounded w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
          placeholder="Alternate ICAO (e.g., WARR)"
          value={alt}
          onChange={(e) => setAlt(e.target.value.toUpperCase())}
        />
      </div>
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded border text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">
        {loading ? "Loading..." : summary}
      </pre>
    </section>
  );
}
