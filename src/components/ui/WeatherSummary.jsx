import { useState, useEffect } from "react";
import IcaoInput from "./IcaoInput";
import ReasoningBox from "./ReasoningBox";
import NotamBox from "./NotamBox";
import ExternalToolsBox from "./ExternalToolsBox";

export default function WeatherSummary() {
  const [departure, setDeparture] = useState("");
  const [dest, setDest] = useState("");
  const [additional, setAdditional] = useState("");
  const [summary, setSummary] = useState("Fetching weather summary...");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState({
    departure: false,
    dest: false,
    additional: false,
  });

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
      const res = await fetch(
        `/.netlify/functions/fetch-current?lat=${lat}&lon=${lon}`
      );
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setAiText("");
    let narrative = `📍 Weather at your current location:\n`;

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

    if (departure) {
      narrative += `\n🛫 Departure (${departure}):\n`;
      const [metar, taf, sigmet] = await Promise.all([
        fetchFromFn("fetch-metar", departure),
        fetchFromFn("fetch-taf", departure),
        fetchFromFn("fetch-sigmet", departure),
      ]);
      narrative += `METAR: ${metar?.raw || "N/A"}\n`;
      narrative += `TAF: ${taf?.raw || "N/A"}\n`;
      narrative += `SIGMET: ${sigmet?.rawSigmet || "No significant SIGMET"}\n`;
    }

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
    }

    if (additional) {
      narrative += `\n🛬 Additional Airport (${additional}):\n`;
      const [metar, taf, sigmet] = await Promise.all([
        fetchFromFn("fetch-metar", additional),
        fetchFromFn("fetch-taf", additional),
        fetchFromFn("fetch-sigmet", additional),
      ]);
      narrative += `METAR: ${metar?.raw || "N/A"}\n`;
      narrative += `TAF: ${taf?.raw || "N/A"}\n`;
      narrative += `SIGMET: ${sigmet?.rawSigmet || "No significant SIGMET"}\n`;
    }

    try {
      const res = await fetch("/.netlify/functions/get-weather-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      const data = await res.json();
      setAiText(data.analysis || "⚠️ AI Reasoning unavailable.");
    } catch {
      setAiText("⚠️ AI Reasoning error.");
    }

    setSummary(narrative);
    setLoading(false);
  };

  useEffect(() => {
    handleUpdate();
  }, []);

  const handleIcaoChange = (field, value) => {
    const uppercaseValue = value.toUpperCase();
    if (field === "departure") setDeparture(uppercaseValue);
    if (field === "dest") setDest(uppercaseValue);
    if (field === "additional") setAdditional(uppercaseValue);
    setFetchTrigger((prev) => ({ ...prev, [field]: false }));
  };

  return (
    <section className="p-6 mt-6 max-w-6xl mx-auto bg-white/30 dark:bg-gray-800/40 backdrop-blur-md rounded-xl shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          🛰️ Weather Summary and NOTAM
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Update Weather
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-2 rounded hover:opacity-80"
          >
            {expanded ? "▾ Hide" : "▸ Show"}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Based on your location, departure, destination, and additional airports
          </p>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {["departure", "dest", "additional"].map((field) => (
              <div key={field} className="space-y-1">
                <IcaoInput
                  label={`${field === "departure" ? "Departure" : field === "dest" ? "Destination" : "Additional"} ICAO`}
                  placeholder="e.g., WIII"
                  value={
                    field === "departure"
                      ? departure
                      : field === "dest"
                      ? dest
                      : additional
                  }
                  onChange={(val) => handleIcaoChange(field, val)}
                />
                <button
                  onClick={() =>
                    setFetchTrigger((prev) => ({ ...prev, [field]: true }))
                  }
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  🔍 Fetch {field.charAt(0).toUpperCase() + field.slice(1)} NOTAM
                </button>
              </div>
            ))}
          </div>

          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded border text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap min-h-[160px]">
            {loading ? (
              <span className="animate-pulse text-blue-600 dark:text-blue-400">
                ⏳ Generating weather narrative...
              </span>
            ) : (
              summary
            )}
          </pre>

          <ReasoningBox text={aiText} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {departure && fetchTrigger.departure && (
              <NotamBox
                icao={departure}
                title="Departure NOTAMs"
                trigger={fetchTrigger.departure}
              />
            )}
            {dest && fetchTrigger.dest && (
              <NotamBox
                icao={dest}
                title="Destination NOTAMs"
                trigger={fetchTrigger.dest}
              />
            )}
            {additional && fetchTrigger.additional && (
              <NotamBox
                icao={additional}
                title="Additional NOTAMs"
                trigger={fetchTrigger.additional}
              />
            )}
          </div>

          <ExternalToolsBox />
        </>
      )}
    </section>
  );
}
