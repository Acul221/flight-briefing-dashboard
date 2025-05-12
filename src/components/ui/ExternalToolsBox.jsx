import { useState } from "react";

export default function ExternalToolsBox() {
  const [visible, setVisible] = useState(true);

  return (
    <div className="mt-6 p-4 bg-white/40 dark:bg-gray-800/50 rounded shadow border text-sm space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-gray-800 dark:text-white">
          🌍 External Tools: Nav-Earth & NOTAM Search
        </h4>
        <button
          onClick={() => setVisible(!visible)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {visible ? "▾ Hide" : "▸ Show"}
        </button>
      </div>

      {visible && (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Nav-Earth */}
          <div>
            <h5 className="font-medium text-gray-700 dark:text-white mb-1">
              🌐 Nav-Earth (AirNav Indonesia)
            </h5>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Nav-Earth is a visual aeronautical map that provides NOTAM overlays, FIR boundaries,
              and active route information for Indonesia.
            </p>
            <a
              href="https://app-pia.airnavindonesia.co.id/navearth/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm shadow"
            >
              🔗 Open Nav-Earth
            </a>
          </div>

          {/* FAA NOTAM Search */}
          <div>
            <h5 className="font-medium text-gray-700 dark:text-white mb-1">
              🧾 FAA NOTAM Search
            </h5>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Access FAA's official NOTAM Search system. Supports ICAO-based NOTAM queries,
              route bulletins, and printable summaries.
            </p>
            <a
              href="https://notams.aim.faa.gov/notamSearch/nsapp.html#/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm shadow"
            >
              🔗 Open FAA NOTAM Search
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
