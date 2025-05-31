import { useEffect, useState } from "react";
import moment from "moment";

export default function NotamBox({ icao, title = "NOTAMs", trigger }) {
  const [notams, setNotams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!icao || icao.length < 4 || !trigger) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/.netlify/functions/fetch-notam?icao=${icao}`);
        const data = await res.json();
        setNotams(data);
      } catch (err) {
        setNotams([{ Text: "⚠️ Failed to fetch NOTAM data." }]);
      }
      setLoading(false);
    };

    fetchData();
  }, [icao, trigger]);

  const urgencyStyle = (urgency) => {
    const base = "p-3 rounded border";
    if (urgency?.toLowerCase().includes("urgent")) {
      return `${base} border-red-500 bg-red-100 dark:bg-red-900/40`;
    }
    if (urgency?.toLowerCase().includes("advisory")) {
      return `${base} border-yellow-500 bg-yellow-100 dark:bg-yellow-800/40`;
    }
    return `${base} border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900`;
  };

  const urgencyIcon = (urgency) => {
    if (urgency?.toLowerCase().includes("urgent")) return "🔴";
    if (urgency?.toLowerCase().includes("advisory")) return "🟡";
    return "⚪";
  };

  return (
    <div className="p-4 bg-white/40 dark:bg-gray-800/50 rounded-xl shadow border text-sm space-y-3">
      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
        📋 {title} ({icao})
      </h4>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-300 italic">
          Loading NOTAMs...
        </p>
      ) : notams.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300 italic">
          No NOTAMs found.
        </p>
      ) : (
        <ul className="space-y-2">
          {notams.map((item, idx) => (
            <li key={idx} className={urgencyStyle(item.Urgency)}>
              <p className="text-xs text-gray-400 mb-1">
                Last updated on:{" "}
                {item["Valid From"]
                  ? moment(item["Valid From"]).format("DD MMM YYYY HH:mm [UTC]")
                  : "-"}
              </p>
              <pre className="font-medium text-gray-800 dark:text-white whitespace-pre-wrap">
                {item.Text}
              </pre>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {item.Category} | {urgencyIcon(item.Urgency)} {item.Urgency}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
