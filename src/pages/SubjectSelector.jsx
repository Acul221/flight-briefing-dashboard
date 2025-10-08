// src/pages/SubjectSelector.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function SubjectSelector() {
  const { aircraft } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // ambil anak kategori untuk aircraft terpilih
        const res = await fetch(`${FN_BASE}/categories?parent_slug=${encodeURIComponent(aircraft)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load subjects");
        setSubjects(json.items || []);
      } catch (e) {
        console.error(e);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [aircraft]);

  function handleSubjectClick(subjectSlug) {
    navigate(`/quiz/${aircraft}/${subjectSlug}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Choose Subject</h1>
        <div className="text-sm text-gray-600">Aircraft: <b>{aircraft}</b></div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading subjects…</div>
      ) : subjects.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSubjectClick(s.slug)}
              className="border rounded-lg p-3 text-left hover:bg-gray-50"
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-gray-500">{s.slug}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No subjects available</div>
      )}
    </div>
  );
}
