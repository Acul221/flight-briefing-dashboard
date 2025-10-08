// src/pages/QuizSelector.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function QuizSelector() {
  const navigate = useNavigate();
  const [aircrafts, setAircrafts] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // ambil root categories (aircraft roots)
        const res = await fetch(`${FN_BASE}/categories?root_only=1`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load aircraft");
        setAircrafts(json.items || []);
      } catch (e) {
        console.error(e);
        setAircrafts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleGo() {
    if (!selectedAircraft) return;
    navigate(`/quiz/${selectedAircraft}`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Choose Aircraft</h1>
      <div>
        <label className="block text-sm font-medium mb-1">Aircraft</label>
        <select
          value={selectedAircraft}
          onChange={(e) => setSelectedAircraft(e.target.value)}
          className="border rounded p-2 w-full"
          disabled={loading}
        >
          <option value="">-- Select aircraft --</option>
          {aircrafts.map((a) => (
            <option key={a.id} value={a.slug}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <button
          onClick={handleGo}
          disabled={!selectedAircraft}
          className={`px-4 py-2 rounded text-white ${
            selectedAircraft ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
