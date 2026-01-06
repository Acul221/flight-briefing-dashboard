import { useState, useEffect, useCallback } from "react";
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
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingNotam, setLoadingNotam] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState({
    departure: false,
    dest: false,
    additional: false,
  });

  const fetchAirportData = async (icao) => {
    try {
      const res = await fetch(`/.netlify/functions/fetch-airport-data?icao=${icao}`);
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

  const handleUpdate = useCallback(async () => {
    setLoadingWeather(true);
    setLoadingNotam(true);
    setAiText("");
    let narrative = `📍 Weather at your current location:\n`;

    try {
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

      const fetchAndFormat = async (label, icao) => {
        let output = `\n${label} (${icao}):\n`;
        const data = await fetchAirportData(icao);
        if (data) {
          output += `METAR: ${data.metar?.raw || "N/A"}\n`;
          output += `TAF: ${data.taf?.raw || "N/A"}\n`;
          output += `SIGMET: ${data.sigmet?.rawSigmet || "No significant SIGMET"}\n`;
        } else {
          output += "⚠️ Weather data unavailable.\n";
        }
        return output;
      };

      if (departure) narrative += await fetchAndFormat("🛫 Departure", departure);
      if (dest) narrative += await fetchAndFormat("🛬 Destination", dest);
      if (additional) narrative += await fetchAndFormat("🛬 Additional Airport", additional);
    } catch {
      narrative += "⚠️ Failed to fetch weather data.\n";
    }

    setSummary(narrative);
    setLoadingWeather(false);

    // AI Reasoning
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

    // Trigger NOTAM fetch
    setFetchTrigger({
      departure: !!departure,
      dest: !!dest,
      additional: !!additional,
    });
    setLoadingNotam(false);
  }, [additional, departure, dest]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => (active ? handleUpdate() : null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [handleUpdate]);

  const handleIcaoChange = (field, value) => {
    const uppercaseValue = value.toUpperCase();
    if (field === "departure") setDeparture(uppercaseValue);
    if (field === "dest") setDest(uppercaseValue);
    if (field === "additional") setAdditional(uppercaseValue);
    setFetchTrigger((prev) => ({ ...prev, [field]: false }));
  };

  return (
    <section className="p-6 mt-6 max-w-6xl mx-auto bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl shadow-lg border border-white/10 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          🛰️ Weather Summary and NOTAM
        </h2>
        <button
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loadingWeather || loadingNotam ? "⏳ Updating..." : "🔄 Update Weather & NOTAM"}
        </button>
      </div>

      {expanded && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Based on your location, departure, destination, and additional airports.
          </p>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            ))}
          </div>

          <div className="bg-white/30 dark:bg-gray-900/40 border border-white/10 rounded-xl p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              📋 Weather Narrative
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {loadingWeather ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                summary
              )}
            </pre>
          </div>

          <ReasoningBox text={aiText} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
