// src/components/ui/AirportSelector.jsx
import { useEffect } from "react";

function AirportSelector({ selectedIcao, onSelect }) {
  useEffect(() => {
    console.log("Selected ICAO:", selectedIcao);
  }, [selectedIcao]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <label className="block mb-2 font-semibold text-gray-800 dark:text-white">
        ICAO Code
      </label>
      <input
        type="text"
        value={selectedIcao}
        onChange={(e) => onSelect(e.target.value.toUpperCase())}
        className="w-full p-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 uppercase"
        placeholder="e.g. WIII, RJTT, KLAX"
      />
    </div>
  );
}

export default AirportSelector;
