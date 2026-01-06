// src/pages/quiz/SubCategoryGrid.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function SubCategoryGrid() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeFilter, setActiveFilter] = useState('all'); // all | exam

  const categoryName = useMemo(() => {
    if (!categorySlug) return '';
    return String(categorySlug)
      .split('-')
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : ''))
      .join(' ');
  }, [categorySlug]);

  useEffect(() => {
    // Categories tree removed; no subcategories available.
    setItems([]);
    setErr("");
    setLoading(false);
  }, [categorySlug]);

  const onStart = (subjectSlug) => {
    navigate(`/quiz/${categorySlug}/${subjectSlug}`);
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'exam') return items.filter((it) => it.exam_pool === true);
    return items;
  }, [items, activeFilter]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold text-[#0D47A1]">{categoryName || 'Select a Topic'}</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm border transition ${
              activeFilter === 'all'
                ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                : 'bg-white text-[#0D47A1] border-[#90CAF9]'
            }`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm border transition ${
              activeFilter === 'exam'
                ? 'bg-[#FF9800] text-white border-[#FF9800]'
                : 'bg-white text-[#FF9800] border-[#FFCC80]'
            }`}
            onClick={() => setActiveFilter('exam')}
          >
            Exam Mode
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-3 p-3 rounded bg-amber-50 text-amber-800 border border-amber-200 text-sm">{err}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl bg-white p-4">
              <div className="skeleton h-5 w-2/3 mb-2" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <button
              key={s.id}
              className="group border rounded-xl bg-white p-4 text-left hover:shadow-md transition-all duration-150"
              onClick={() => onStart(s.slug)}
            >
              <div className="font-semibold text-slate-900 group-hover:text-[#2196F3] transition-colors">
                {s.label}
              </div>
              <div className="text-sm text-slate-600 mt-1">{s.description || "Challenge your knowledge in this topic."}</div>
              <div className="mt-3 inline-flex items-center text-sky-600 hover:text-orange-500 group-hover:translate-x-0.5 transition-transform">
                Start Quiz →
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="border rounded-xl bg-white p-6 inline-flex items-center gap-3 text-slate-600">
          <span aria-hidden>📭</span>
          <span>No subtopics available</span>
        </div>
      )}
    </div>
  );
}
