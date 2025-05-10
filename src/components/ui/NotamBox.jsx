import { useState, useEffect } from "react";

export default function NotamBox({ icao, title = "NOTAMs" }) {
  const [visible, setVisible] = useState(true);
  const [notams, setNotams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!icao) return;

    const fetchNotams = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/.netlify/functions/fetch-notam?icao=${icao}`);
        const data = await res.json();
        setNotams(Array.isArray(data) ? data : []);
      } catch {
        setNotams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotams();
  }, [icao]);

  if (!icao) return null;

  return (
    <div className="p-4 bg-white/40 dark:bg-gray-800/50 rounded shadow border">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-semibold text-gray-800 dark:text-white">
          📄 {title} ({icao})
        </h4>
        <button
          onClick={() => setVisible(!visible)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {visible ? "▾ Hide" : "▸ Show"}
        </button>
      </div>

      {visible && (
        <>
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">⏳ Loading NOTAMs...</p>
          ) : notams.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-100 space-y-2">
              {notams.map((n, i) => (
                <li key={i}>{n.raw || JSON.stringify(n)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">No NOTAMs available.</p>
          )}
        </>
      )}
    </div>
  );
}
