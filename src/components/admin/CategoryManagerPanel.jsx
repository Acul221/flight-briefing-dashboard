import React, { useEffect, useMemo, useState } from "react";
import { useCategoriesTree } from "@/hooks/useCategoriesTree";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/").replace(/\/+$/, "");
const CATS_URL = `${FN_BASE}/.netlify/functions/categories`;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

export default function CategoryManagerPanel({
  value,
  onChange,
  subValue,
  onSubChange,
}) {
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null); // {type:"success"|"error", msg:string}

  // root categories
  const {
    items: rootItems = [],
    refresh: refreshRoot,
    loading: rootLoading,
  } = useCategoriesTree({ rootOnly: true });

  // selected parent node by label (form menyimpan label)
  const parentNode = useMemo(() => {
    const target = String(value || "").toLowerCase();
    return (rootItems || []).find(
      (r) => String(r.label || "").toLowerCase() === target
    );
  }, [rootItems, value]);

  // children of selected parent
  const {
    items: childItems = [],
    refresh: refreshChild,
    loading: childLoading,
  } = useCategoriesTree({
    parentSlug: parentNode?.slug || "",
  });

  function showFlash(type, msg) {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 1200);
  }

  async function createCategory(label) {
    if (!label?.trim()) return;
    setBusy(true);
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
      if (!res.ok || json.error) throw new Error(json.error || "create_failed");
      setNewCat("");
      await refreshRoot();
      onChange?.(json.label); // set nilai form ke label baru
      showFlash("success", "Category added");
    } catch (e) {
      showFlash("error", e.message || "Create category failed");
    } finally {
      setBusy(false);
    }
  }

  async function createSubcategory(label) {
    if (!label?.trim() || !parentNode?.slug) {
      showFlash("error", "Choose a category first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(CATS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({
          label: label.trim(),
          parent_slug: parentNode.slug,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "create_failed");
      setNewSub("");
      await refreshChild();
      onSubChange?.(json.label);
      showFlash("success", "Subcategory added");
    } catch (e) {
      showFlash("error", e.message || "Create subcategory failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategoryById(id) {
    if (!id) return;
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setBusy(true);
    try {
      const url = `${CATS_URL}?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "delete_failed");
      await refreshRoot();
      await refreshChild();
      // reset form value jika yang dihapus adalah yang sedang terpilih
      if (parentNode?.id === id) {
        onChange?.("");
        onSubChange?.("");
      } else if (childItems.some((c) => c.id === id)) {
        if (String(subValue || "").toLowerCase() ===
            String(childItems.find((c) => c.id === id)?.label || "").toLowerCase()) {
          onSubChange?.("");
        }
      }
      showFlash("success", "Deleted");
    } catch (e) {
      let hint = "";
      if (e.message === "category_has_children") {
        hint = " (has children)";
      } else if (e.message === "category_in_use") {
        hint = " (in use by questions)";
      }
      showFlash("error", `Delete failed${hint}`);
    } finally {
      setBusy(false);
    }
  }

  // derived selects
  const selectedRoot = useMemo(() => {
    return (rootItems || []).find((r) => r.label === value) || null;
  }, [rootItems, value]);

  const selectedChild = useMemo(() => {
    return (childItems || []).find((c) => c.label === subValue) || null;
  }, [childItems, subValue]);

  return (
    <aside className="w-full md:w-80 bg-white border rounded p-3 relative">
      <div className="font-semibold mb-2">Category Manager</div>

      {/* Flash / mini animation */}
      {flash && (
        <div
          className={`text-xs mb-2 px-2 py-1 rounded transition-all ${
            flash.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* CATEGORY SELECT + DELETE */}
      <label className="block text-xs text-gray-600 mb-1">Category</label>
      <div className="flex gap-2">
        <select
          className="flex-1 border rounded p-2"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={rootLoading || busy}
        >
          <option value="">-- Select Category --</option>
          {rootItems.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="px-2 text-xs rounded bg-red-600 text-white disabled:opacity-50"
          disabled={!selectedRoot || busy}
          onClick={() => deleteCategoryById(selectedRoot?.id)}
          title="Delete selected category"
        >
          Delete
        </button>
      </div>

      {/* ADD CATEGORY */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="New category"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => createCategory(newCat)}
          disabled={!newCat.trim() || busy}
          className="px-3 rounded bg-green-600 text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* SUBCATEGORY SELECT + DELETE */}
      <label className="block text-xs text-gray-600 mt-4 mb-1">SubCategory</label>
      <div className="flex gap-2">
        <select
          className="flex-1 border rounded p-2"
          value={subValue || ""}
          onChange={(e) => onSubChange?.(e.target.value)}
          disabled={!parentNode || childLoading || busy}
        >
          <option value="">-- Select SubCategory --</option>
          {childItems.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="px-2 text-xs rounded bg-red-600 text-white disabled:opacity-50"
          disabled={!selectedChild || busy}
          onClick={() => deleteCategoryById(selectedChild?.id)}
          title="Delete selected subcategory"
        >
          Delete
        </button>
      </div>

      {/* ADD SUBCATEGORY */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="New subcategory"
          value={newSub}
          onChange={(e) => setNewSub(e.target.value)}
          disabled={!parentNode || busy}
        />
        <button
          type="button"
          onClick={() => createSubcategory(newSub)}
          disabled={!parentNode || !newSub.trim() || busy}
          className="px-3 rounded bg-green-600 text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </aside>
  );
}
