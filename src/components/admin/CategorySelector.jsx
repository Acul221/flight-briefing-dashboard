import React, { useEffect, useMemo, useState } from "react";
import { useCategoriesTree } from "@/hooks/useCategoriesTree";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const CATS_URL = `${FN_BASE}/categories`;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

export default function CategorySelector({ value, onChange, subValue, onSubChange }) {
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [creating, setCreating] = useState(false);

  // ambil root categories
  const { items: rootItems = [], refresh: refreshRoot } = useCategoriesTree({
    rootOnly: true,
    includeCounts: false,
    includeInactive: true,
  });

  // parent node berdasarkan value category
  const parentNode = useMemo(() => {
    const val = String(value || "").toLowerCase();
    return (rootItems || []).find(
      (r) => String(r.label || "").toLowerCase() === val
    ) || null;
  }, [rootItems, value]);

  // ambil child (subcategory) untuk parent tsb
  const { items: childItems = [], refresh: refreshChild } = useCategoriesTree({
    parentSlug: parentNode?.slug || "",
    includeCounts: false,
    includeInactive: true,
  });

  // Create Category
  async function createCategory(label) {
    if (!label?.trim()) return;
    const exists = rootItems.find(
      (c) => c.label.toLowerCase() === label.trim().toLowerCase()
    );
    if (exists) {
      alert("⚠️ Category already exists");
      setNewCat("");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(CATS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ label: label.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to create category");

      await refreshRoot?.();
      onChange?.(json.label || label.trim());
      setNewCat("");
    } catch (e) {
      alert(e.message || "Create category failed");
    } finally {
      setCreating(false);
    }
  }

  // Create SubCategory
  async function createSubcategory(label) {
    if (!label?.trim() || !parentNode?.slug) return;
    const exists = childItems.find(
      (sc) => sc.label.toLowerCase() === label.trim().toLowerCase()
    );
    if (exists) {
      alert("⚠️ SubCategory already exists under this category");
      setNewSub("");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(CATS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ label: label.trim(), parent_slug: parentNode.slug }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to create subcategory");

      await refreshChild?.();
      onSubChange?.(json.label || label.trim());
      setNewSub("");
    } catch (e) {
      alert(e.message || "Create subcategory failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Select Category --</option>
          {rootItems.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex mt-2 gap-2">
          <input
            type="text"
            placeholder="New category"
            className="flex-1 border rounded p-2"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button
            type="button"
            disabled={creating || !newCat.trim()}
            onClick={() => createCategory(newCat)}
            className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Subcategory */}
      {parentNode ? (
        <div>
          <label className="block text-sm font-medium">SubCategory</label>
          <select
            value={subValue}
            onChange={(e) => onSubChange?.(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">-- Select SubCategory --</option>
            {childItems.map((sc) => (
              <option key={sc.id} value={sc.label}>
                {sc.label}
              </option>
            ))}
          </select>
          <div className="flex mt-2 gap-2">
            <input
              type="text"
              placeholder="New subcategory"
              className="flex-1 border rounded p-2"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
            />
            <button
              type="button"
              disabled={creating || !newSub.trim()}
              onClick={() => createSubcategory(newSub)}
              className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
