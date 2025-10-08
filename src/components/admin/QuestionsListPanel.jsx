// src/components/admin/QuestionsListPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCategoriesTree } from "@/hooks/useCategoriesTree";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const Q_URL = `${FN_BASE}/questions`;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

export default function QuestionsListPanel({
  q, status, categorySlug, includeDesc, limit, page,
  setFilters, refreshKey,
  onSelect,
}) {
  // categories (root only)
  const { items: rootCats = [] } = useCategoriesTree({
    rootOnly: true,
    includeInactive: true,
  });

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((count || 0) / (limit || 20))), [count, limit]);

  async function fetchList() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      if (categorySlug) {
        qs.set("category_slug", categorySlug);
        if (includeDesc) qs.set("include_descendants", "1");
      }
      qs.set("limit", String(limit));
      const offset = (page - 1) * limit;
      if (offset > 0) qs.set("offset", String(offset));

      const res = await fetch(`${Q_URL}?${qs.toString()}`, {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "fetch failed");
      setRows(json.items || []);
      setCount(json.count || 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [q, status, categorySlug, includeDesc, limit, page, refreshKey]);

  return (
    <div>
      {/* Filters */}
      <div className="p-3 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setFilters((s) => ({ ...s, page: 1, q: e.target.value }))}
          placeholder="Search…"
          className="border rounded p-2 flex-1 min-w-[180px]"
        />
        <select
          value={status}
          onChange={(e) => setFilters((s) => ({ ...s, page: 1, status: e.target.value }))}
          className="border rounded p-2"
        >
          <option value="">(all)</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>

        <select
          value={categorySlug}
          onChange={(e) => setFilters((s) => ({ ...s, page: 1, categorySlug: e.target.value }))}
          className="border rounded p-2"
        >
          <option value="">(all categories)</option>
          {rootCats.map((c) => (
            <option key={c.id} value={c.slug}>{c.label}</option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={includeDesc}
            onChange={(e) => setFilters((s) => ({ ...s, page: 1, includeDesc: e.target.checked }))}
          />
          include descendants
        </label>

        <select
          value={limit}
          onChange={(e) => setFilters((s) => ({ ...s, page: 1, limit: Number(e.target.value) }))}
          className="border rounded p-2"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 w-16">Action</th>
              <th className="p-2">Question</th>
              <th className="p-2 w-24">Status</th>
              <th className="p-2 w-24">Difficulty</th>
              <th className="p-2 w-28">Aircraft</th>
              <th className="p-2 w-20">Answer</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t align-top hover:bg-gray-50">
                  <td className="p-2">
                    <button
                      onClick={() => onSelect?.(r.id)}
                      className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="p-2">
                    <div className="line-clamp-2">{r.question_text}</div>
                    {Array.isArray(r.tags) && r.tags.length ? (
                      <div className="text-[11px] text-gray-500 mt-1">{r.tags.join(", ")}</div>
                    ) : null}
                  </td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.difficulty}</td>
                  <td className="p-2">{r.aircraft || "-"}</td>
                  <td className="p-2">{String(r.answer_key || "").toUpperCase()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-3">
        <div className="text-xs text-gray-600">Page {page} / {totalPages}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilters((s) => ({ ...s, page: Math.max(1, s.page - 1) }))}
            disabled={page <= 1}
            className={`px-3 py-1 rounded border ${page <= 1 ? "opacity-50" : "hover:bg-gray-50"}`}
          >
            Prev
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilters((s) => ({ ...s, page: Math.min(totalPages, s.page + 1) }))}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded border ${page >= totalPages ? "opacity-50" : "hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
