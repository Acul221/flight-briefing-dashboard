// src/components/ui/BMKGWindTemp.jsx
import { useEffect, useState } from "react";

function BMKGWindTemp() {
  const [data, setData] = useState("Loading BMKG WindTemp...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWindTemp = async () => {
      try {
        const res = await fetch('/.netlify/functions/fetch-bmkg?url=https://rami.bmkg.go.id/api/windtemp_get/get_date_now');
        const json = await res.json();

        // Optional: cek isi data
        console.log("🌀 BMKG WindTemp data:", json);
        setData(JSON.stringify(json, null, 2));
      } catch (err) {
        console.error("❌ Error fetching BMKG WindTemp:", err);
        setError("Failed to fetch BMKG WindTemp data.");
      }
    };

    fetchWindTemp();
  }, []);

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 text-gray-900 dark:text-white p-4 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-2">BMKG WindTemp (Test)</h3>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <pre className="text-sm font-mono whitespace-pre-wrap">{data}</pre>
      )}
    </div>
  );
}

export default BMKGWindTemp;
