// src/pages/admin/CategoryManager.jsx
import { useEffect, useMemo, useState } from "react";
import {
  useCategoriesTree,
  useCategoriesFlat,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/hooks/useCategories";
import { Plus, RefreshCcw, Trash2, Pencil, Check, X } from "lucide-react";

/** Simple tree node */
function Node({ node, onSelect, selectedId }) {
  const active = selectedId === node.id;
  return (
    <div className="mb-1">
      <div
        onClick={() => onSelect(node)}
        className={`px-2 py-1 rounded cursor-pointer text-sm flex items-center justify-between ${
          active ? "bg-base-200 font-medium" : "hover:bg-base-100"
        }`}
      >
        <span>
          {node.label}
          {!node.is_active && <span className="badge badge-ghost ml-2">inactive</span>}
          {node.requires_aircraft && <span className="badge badge-outline ml-2">requires AC</span>}
          {node.pro_only && <span className="badge badge-primary ml-2">PRO</span>}
        </span>
      </div>
      {node.children?.length > 0 && (
        <div className="ml-4 mt-1">
          {node.children.map((c) => (
            <Node key={c.id} node={c} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryManager() {
  const { items: tree, loading, reload } = useCategoriesTree(true);
  const { items: flat } = useCategoriesFlat(false);

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("view"); // "view" | "create" | "edit"
  const [form, setForm] = useState({
    label: "",
    parent_id: "",
    requires_aircraft: false,
    pro_only: false,
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    if (mode === "create") return; // keep form
    if (selected) {
      setForm({
        label: selected.label || "",
        parent_id: selected.parent_id || "",
        requires_aircraft: !!selected.requires_aircraft,
        pro_only: !!selected.pro_only,
        is_active: selected.is_active !== false,
        order_index: Number(selected.order_index || 0),
      });
    } else {
      setForm({
        label: "",
        parent_id: "",
        requires_aircraft: false,
        pro_only: false,
        is_active: true,
        order_index: 0,
      });
    }
  }, [selected, mode]);

  const parentOptions = useMemo(() => {
    // hanya root yg bisa jadi parent (parent_id null)
    const roots = flat.filter((n) => !n.parent_id);
    return [{ id: "", label: "(root)" }, ...roots];
  }, [flat]);

  const onNewParent = () => {
    setMode("create");
    setSelected(null);
    setForm({
      label: "",
      parent_id: "",
      requires_aircraft: false,
      pro_only: false,
      is_active: true,
      order_index: 0,
    });
  };

  const onNewChild = () => {
    // kalau belum ada yg dipilih, treat as child of root? pakai root default
    const pId = selected?.id || "";
    setMode("create");
    setForm({
      label: "",
      parent_id: pId,
      requires_aircraft: false,
      pro_only: false,
      is_active: true,
      order_index: 0,
    });
  };

  async function onSave(e) {
    e?.preventDefault?.();
    const payload = {
      label: form.label?.trim(),
      parent_id: form.parent_id || null,
      requires_aircraft: !!form.requires_aircraft,
      pro_only: !!form.pro_only,
      is_active: !!form.is_active,
      order_index: Number(form.order_index || 0),
    };
    if (!payload.label) return alert("Label wajib diisi");

    try {
      if (mode === "create") {
        await createCategory(payload);
      } else if (mode === "edit" && selected?.id) {
        await updateCategory(selected.id, payload);
      }
      await reload();
      setMode("view");
    } catch (e) {
      alert(e.message || "Gagal menyimpan kategori");
    }
  }

  async function onDelete() {
    if (!selected?.id) return;
    if (!confirm("Hapus kategori ini? Semua relasi question akan terlepas.")) return;
    try {
      await deleteCategory(selected.id);
      setSelected(null);
      await reload();
    } catch (e) {
      alert(e.message || "Gagal menghapus kategori");
    }
  }

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Left: Tree */}
      <div className="md:col-span-1 border rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Categories</h2>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-xs" onClick={reload}>
              <RefreshCcw size={14} /> Refresh
            </button>
            <button className="btn btn-primary btn-xs" onClick={onNewParent}>
              <Plus size={14} /> New Parent
            </button>
            <button className="btn btn-outline btn-xs" onClick={onNewChild} disabled={!selected}>
              <Plus size={14} /> New Child
            </button>
          </div>
        </div>

        <div className="h-[65vh] overflow-auto">
          {loading && <div className="skeleton h-8 w-full mb-2" />}
          {!loading && !tree.length && <div className="text-sm opacity-60">No categories.</div>}
          {!loading &&
            tree.map((n) => (
              <Node key={n.id} node={n} onSelect={(x) => { setSelected(x); setMode("edit"); }} selectedId={selected?.id} />
            ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="md:col-span-2 border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            {mode === "create" ? "Create Category" : selected ? `Edit: ${selected.label}` : "Select a category"}
          </h2>
          <div className="flex gap-2">
            {selected && mode === "edit" && (
              <button className="btn btn-error btn-sm" onClick={onDelete}>
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </div>

        {(mode === "create" || (mode === "edit" && selected)) && (
          <form className="space-y-3" onSubmit={onSave}>
            <div>
              <label className="label"><span className="label-text">Label</span></label>
              <input
                className="input input-bordered w-full"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Mis. ATPL, Human Factors, Systems"
              />
            </div>

            <div>
              <label className="label"><span className="label-text">Parent</span></label>
              <select
                className="select select-bordered w-full"
                value={form.parent_id || ""}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              >
                {parentOptions.map((p) => (
                  <option key={p.id || "root"} value={p.id || ""}>{p.label || "(root)"}</option>
                ))}
              </select>
              <p className="text-xs opacity-60 mt-1">
                Kosongkan untuk root; pilih parent untuk membuat subcategory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={form.requires_aircraft}
                  onChange={(e) => setForm({ ...form, requires_aircraft: e.target.checked })}
                />
                <span className="text-sm">Requires aircraft</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={form.pro_only}
                  onChange={(e) => setForm({ ...form, pro_only: e.target.checked })}
                />
                <span className="text-sm">PRO only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>

              <div>
                <label className="label"><span className="label-text">Order index</span></label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={form.order_index}
                  onChange={(e) => setForm({ ...form, order_index: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn btn-primary btn-sm">
                <Check size={16} /> Save
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("view")}>
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        )}

        {mode === "view" && !selected && (
          <p className="text-sm opacity-60">Pilih kategori di kiri, atau klik “New Parent/Child”.</p>
        )}
      </div>
    </div>
  );
}
