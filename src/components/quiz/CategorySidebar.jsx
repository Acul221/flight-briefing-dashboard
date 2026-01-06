// src/components/quiz/CategorySidebar.jsx
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function CategorySidebar({ categories = [], activeSlug = null, loading = false }) {
  const params = useParams();
  const current = activeSlug || params.categorySlug || params.aircraft || null;

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Categories tree endpoint removed; rely on passed-in categories or remain empty.
    setItems([]);
    setBusy(false);
    setErr("");
  }, []);

  const list = useMemo(() => {
    if (items && items.length) return items;
    if (categories && categories.length) {
      return categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.label,
        access_tier: c.access_tier,
      }));
    }
    return [];
  }, [items, categories]);

  const showLoading = busy || loading;

  return (
    <aside className="w-64 shrink-0 border-r bg-white sticky top-0 h-[100dvh] overflow-y-auto">
      <div className="px-3 py-3 border-b">
        <h2 className="font-semibold text-slate-800">Categories</h2>
      </div>

      <div className="p-2 space-y-1">
        {showLoading && (
          <div className="space-y-2">
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-6 w-11/12" />
            <div className="skeleton h-6 w-10/12" />
          </div>
        )}

        {!showLoading && err && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</div>
        )}

        {!showLoading && !err && list.length === 0 && (
          <div className="text-sm text-slate-500">No categories</div>
        )}

        {!showLoading && !err && list.map((c) => {
          const isActive = current && String(current).toLowerCase() === String(c.slug).toLowerCase();
          return (
            <Link
              key={c.id || c.slug}
              to={`/quiz/${c.slug}`}
              className={[
                "block px-3 py-2 rounded-r-xl transition-all duration-150",
                isActive ? "bg-[#0D47A1] text-white" : "hover:bg-[#EAF4F6] text-slate-800",
              ].join(" ")}
            >
              <div className="font-medium flex items-center">
                <span>{c.label}</span>
                <span
                  className={[
                    "ml-2 text-[10px] font-medium px-2 py-[2px] rounded-md",
                    (c.access_tier || "free").toLowerCase() === "pro"
                      ? "bg-[#FFF3E0] text-[#FF9800]"
                      : "bg-[#E3F2FD] text-[#2196F3]",
                  ].join(" ")}
                >
                  {(c.access_tier || "free").toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] opacity-70">{c.slug}</div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

CategorySidebar.propTypes = {
  categories: PropTypes.array,
  activeSlug: PropTypes.string,
  loading: PropTypes.bool,
};
