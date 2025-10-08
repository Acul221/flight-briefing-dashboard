// src/hooks/useCategoriesTree.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * Hook untuk fetch tree kategori dari Netlify Function
 *
 * Options:
 *  - parentSlug: string|null
 *  - rootOnly: boolean
 *  - includeCounts: boolean
 *  - countMode: "aggregate" | "direct"
 *  - aircraft: string
 *  - includeInactive: boolean
 *  - timeoutMs: number (default 15000)
 *
 * Env:
 *  - VITE_FUNCTIONS_BASE (opsional): e.g. "http://localhost:8888"
 *  - VITE_ADMIN_API_SECRET (opsional, hanya untuk helper admin di bawah)
 */
export function useCategoriesTree({
  parentSlug = null,
  rootOnly = false,
  includeCounts = false,
  countMode = "aggregate",
  aircraft = "",
  includeInactive = false,
  timeoutMs = 15000,
} = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // manual refetch key
  const [bump, setBump] = useState(0);
  const refresh = useCallback(() => setBump((n) => n + 1), []);

  // normalize base URL untuk fungsi
  const fnBase = useMemo(() => {
    const envBase = (import.meta.env.VITE_FUNCTIONS_BASE || "").trim();
    return envBase ? envBase.replace(/\/+$/, "") : "";
  }, []);

  const url = useMemo(() => {
    const qs = new URLSearchParams();

    if (parentSlug) qs.set("parent_slug", String(parentSlug).toLowerCase().trim());
    if (rootOnly) qs.set("root_only", "1");

    if (includeCounts) {
      qs.set("include_counts", "1");
      const mode = (countMode || "aggregate").toLowerCase();
      qs.set("count_mode", mode === "direct" ? "direct" : "aggregate");
      const ac = String(aircraft || "").trim();
      if (ac) qs.set("aircraft", ac);
    }

    if (includeInactive) qs.set("include_inactive", "1");

    const path = "/.netlify/functions/categories-tree";
    const query = qs.toString();
    return `${fnBase}${path}${query ? `?${query}` : ""}`;
  }, [fnBase, parentSlug, rootOnly, includeCounts, countMode, aircraft, includeInactive]);

  // keep latest url for race-proof setState
  const urlRef = useRef(url);
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  useEffect(() => {
    let alive = true;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`categories-tree ${res.status}: ${text || res.statusText}`);
        }
        const json = await res.json();
        if (!alive || urlRef.current !== url) return;

        // support {items:[...]} atau legacy [...]
        const data = Array.isArray(json) ? json : (json.items || []);
        setItems(Array.isArray(data) ? data : []);
        setLastUpdated(Date.now());
      } catch (e) {
        if (!alive || e.name === "AbortError") return;
        setErr(e);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
        clearTimeout(timer);
      }
    })();

    return () => {
      alive = false;
      ctl.abort();
      clearTimeout(timer);
    };
  }, [url, bump, timeoutMs]);

  // helper untuk cari kategori by slug
  const findBySlug = useCallback(
    (slug) => {
      if (!slug) return null;
      return items.find((c) => c.slug?.toLowerCase() === slug.toLowerCase()) || null;
    },
    [items]
  );

  return { items, loading, error, lastUpdated, refresh, findBySlug };
}

/* ======================================================================
 * Admin helpers (dipakai oleh panel admin). Non-breaking untuk konsumen lama.
 * Server-side requirement (sesuai function categories.js kamu):
 *  - GET     /.netlify/functions/categories
 *  - POST    /.netlify/functions/categories          { label, parent_slug? }
 *  - DELETE  /.netlify/functions/categories?id=<uuid>
 *  - (PUT/PATCH belum ada) → updateCategory() di bawah akan melempar error jelas.
 * ====================================================================== */

const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const ADMIN_SECRET   = import.meta.env.VITE_ADMIN_API_SECRET;

/** Create category / subcategory */
export async function createCategory({ label, parent_slug = null }) {
  if (!ADMIN_SECRET) throw new Error("Missing VITE_ADMIN_API_SECRET");
  const res = await fetch(`${FUNCTIONS_BASE}/categories`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
      accept: "application/json",
    },
    body: JSON.stringify({ label, parent_slug }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Create category failed (${res.status}) ${txt}`);
  }
  return res.json();
}

/** Delete category by id (akan 409 bila kategori masih dipakai) */
export async function deleteCategory(id) {
  if (!ADMIN_SECRET) throw new Error("Missing VITE_ADMIN_API_SECRET");
  const u = new URL(`${FUNCTIONS_BASE}/categories`, window.location.origin);
  u.searchParams.set("id", id);
  const res = await fetch(u.toString().replace(window.location.origin, ""), {
    method: "DELETE",
    headers: {
      "x-admin-secret": ADMIN_SECRET,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Delete category failed (${res.status}) ${txt}`);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Update category (rename / relink) — placeholder.
 * Jika kamu sudah menambahkan endpoint PUT/PATCH di netlify/functions/categories.js,
 * ganti implementasi di bawah agar memanggil endpoint tersebut.
 */
export async function updateCategory(/* payload */) {
  throw new Error("Update category not implemented on server. Please implement PUT/PATCH /categories.");
}
