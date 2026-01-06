// src/hooks/useCategoriesTree.js
// V3 placeholder: category tree endpoints removed; returns empty data and no network calls.
import { useCallback, useMemo, useState } from "react";

export function useCategoriesTree() {
  const [items] = useState([]);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [lastUpdated] = useState(null);
  const refresh = useCallback(() => {}, []);

  const findBySlug = useCallback(() => null, []);

  return { items, loading, error, lastUpdated, refresh, findBySlug };
}

// Admin helpers intentionally disabled
const NOT_SUPPORTED = () => {
  throw new Error("Category API disabled in Quiz V3 migration");
};

export const createCategory = NOT_SUPPORTED;
export const deleteCategory = NOT_SUPPORTED;
export const updateCategory = NOT_SUPPORTED;
