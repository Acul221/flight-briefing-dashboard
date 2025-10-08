// src/layouts/QuizShell.jsx
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import QuizSidebar from "@/components/quiz/QuizSidebar";

const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function QuizShell() {
  const { aircraft } = useParams(); // slug aktif kalau sedang di /quiz/:aircraft/...
  const [parents, setParents] = useState([]);      // root categories (aircraft/ATPL/etc.)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Ambil root categories untuk sidebar
        const u = new URL(`${FUNCTIONS_BASE}/categories`, window.location.origin);
        u.searchParams.set("root_only", "1");
        const res = await fetch(u.toString().replace(window.location.origin, ""), {
          method: "GET",
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`categories failed (${res.status})`);
        const json = await res.json();
        setParents(Array.isArray(json?.items) ? json.items : []);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e?.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  return (
    <div className="min-h-[100dvh] flex bg-slate-50">
      {/* Sidebar kiri */}
      <QuizSidebar
        parents={parents}
        activeSlug={aircraft || null}
        loading={loading}
      />

      {/* Area konten */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-4">
        {err && (
          <div className="mb-3 p-2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-sm">
            {err}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
