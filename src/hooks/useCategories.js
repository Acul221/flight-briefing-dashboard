// src/hooks/useCategories.js
import { useCallback, useEffect, useMemo, useState } from "react";

const CATS_URL = "/.netlify/functions/categories?tree=1";

function normalizeTree(arr) {
  // Shape tolerant: {tree:[...]} | {items:[...]} | [...]
  const data = Array.isArray(arr?.tree) ? arr.tree : Array.isArray(arr?.items) ? arr.items : arr || [];
  // pastikan setiap node punya children array
  const fill = (node) => ({
    ...node,
    children: Array.isArray(node.children) ? node.children.map(fill) : [],
  });
  return data.map(fill);
}

function flatten(tree) {
  const out = [];
  const walk = (nodes, parent = null) => {
    nodes.forEach((n) => {
      out.push({
        id: n.id,
        label: n.label,
        slug: n.slug,
        parent_id: n.parent_id ?? parent?.id ?? null,
        requires_aircraft: !!n.requires_aircraft,
      });
      if (n.children?.length) walk(n.children, n);
    });
  };
  walk(tree);
  return out;
}

export function useCategoriesTree() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(CATS_URL, { credentials: "omit" });
      const json = await res.json();
      const t = normalizeTree(json);
      setTree(t);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const flat = useMemo(() => flatten(tree), [tree]);

  return { tree, flat, loading, error: error, refetch };
}

// Backward compatibility – used by some admin pages
export function useCategoriesFlat() {
  const { flat, loading, error, refetch } = useCategoriesTree();
  return { items: flat, loading, error, refetch };
}
