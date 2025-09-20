// src/hooks/useCategories.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";

const API = "/.netlify/functions/categories";
const API_TREE = "/.netlify/functions/categories-tree";

/** ---------------- Plain API helpers (dipakai UI / komponen lain) ---------------- */
export async function getCategoriesTree() {
  const data = await adminFetch(API_TREE, { method: "GET" });
  return data?.items || [];
}

export async function listCategories(params = {}) {
  const qs = new URLSearchParams(params);
  const data = await adminFetch(`${API}?${qs.toString()}`, { method: "GET" });
  return data?.items || [];
}

export async function createCategory(payload) {
  // payload: { label, parent_id?, requires_aircraft?, pro_only?, order_index?, is_active? }
  const data = await adminFetch(API, { method: "POST", body: payload });
  return data?.item;
}

export async function updateCategory(id, patch) {
  const data = await adminFetch(`${API}?id=${id}`, { method: "PUT", body: patch });
  return data?.item;
}

export async function deleteCategory(id) {
  const data = await adminFetch(`${API}?id=${id}`, { method: "DELETE" });
  return data?.ok === true;
}

/** ---------------- Hooks ---------------- */
export function useCategoriesTree(auto = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!!auto);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getCategoriesTree();
      setItems(rows);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) reload();
  }, [auto, reload]);

  return { items, loading, error, reload };
}

function flatten(tree, acc = [], prefix = "") {
  for (const n of tree || []) {
    const pathLabel = prefix ? `${prefix} › ${n.label}` : n.label;
    acc.push({ ...n, pathLabel });
    if (n.children?.length) flatten(n.children, acc, pathLabel);
  }
  return acc;
}

export function useCategoriesFlat(auto = true) {
  const { items: tree, loading, error, reload } = useCategoriesTree(auto);
  const flat = useMemo(() => flatten(tree || []), [tree]);
  return { items: flat, tree, loading, error, reload };
}
