// src/components/quiz/CategorySidebar.jsx
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function CategorySidebar({ categories = [], activeSlug = null, loading = false }) {
  const params = useParams();
  const current = activeSlug || params.categorySlug || params.aircraft || null;

  // Local fetch (v3 schema) to ensure consistency with mirror (submit-question / notion-import-v3)
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      setBusy(true);
      setErr("");
      try {
        const u = new URL(`${FN_BASE}/categories`, window.location.origin);
        const res = await fetch(u.toString().replace(window.location.origin, ""), {
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `load_failed_${res.status}`);
        const arr = Array.isArray(json.categories) ? json.categories : [];
        // v3 mapping + safety filter
        const mapped = arr
          .map((r) => ({
            id: r.id,
            slug: r.category_slug || r.slug,
            label: r.category_name || r.name || r.label,
            is_active: r.is_active !== false,
            parent_id: r.parent_id ?? null,
            requires_aircraft: !!r.requires_aircraft,
            access_tier: r.access_tier || null,
          }))
          .filter((r) => r.is_active && !r.parent_id);
        setItems(mapped);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || String(e));
        setItems([]);
      } finally {
        setBusy(false);
      }
    })();
    return () => abort.abort();
  }, []);

  const list = useMemo(() => {
    // prefer locally fetched v3 items; fallback to props if provided
    if (items && items.length) return items;
    if (categories && categories.length) return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
    }));
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
