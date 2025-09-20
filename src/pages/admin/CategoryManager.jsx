// src/pages/admin/CategoryManager.jsx
import { useMemo, useState } from "react";
import {
  useCategoryTree,
  useCategoriesFlat,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderSibling,
} from "../../hooks/useCategories";
import CategoryForm from "../../components/admin/CategoryForm";
import CategoryTreeItem from "@/components/admin/CategoryTreeItem";

export default function CategoryManager() {
  const { tree, isLoading, error, mutate } = useCategoryTree();
  const { items } = useCategoriesFlat();

  const [editing, setEditing] = useState(null); // object kategori yg sedang diedit (atau null untuk create)
  const [parentId, setParentId] = useState(""); // "" = root

  const parents = useMemo(() => (items || []).filter((i) => !i.parent_id), [items]);

  // --- Handlers
  const handleEdit = (node) => {
    setEditing(node);
    setParentId(node.parent_id || "");
  };

  const onAddChild = (node) => {
    setEditing({
      parent_id: node.id,
      label: "",
      slug: "",
      order_index: 0,
      requires_aircraft: false,
      pro_only: false,
    });
    setParentId(node.id);
  };

  async function handleCreate(form) {
    await createCategory({ ...form, parent_id: parentId || null });
    setEditing(null);
    setParentId("");
    await mutate();
  }

  async function handleUpdate(id, form) {
    await updateCategory(id, { ...form, parent_id: parentId || null });
    setEditing(null);
    setParentId("");
    await mutate();
  }

  async function handleDelete(id) {
    if (!confirm("Delete category?")) return;
    await deleteCategory(id);
    await mutate();
  }

  async function handleReorder(node, direction) {
    await reorderSibling(node.id, direction);
    await mutate();
  }

  // --- States UI sederhana
  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {String(error)}</div>;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Tree */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Categories</h1>
          <button
            className="btn btn-sm"
            onClick={() => {
              setEditing(null);
              setParentId("");
            }}
          >
            + New Root
          </button>
        </div>

        <ul>
          {tree.map((n, i) => (
            <CategoryTreeItem
              key={n.id}
              node={{ ...n, _isFirst: i === 0, _isLast: i === tree.length - 1 }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={onAddChild}
              onReorder={handleReorder}
            />
          ))}
        </ul>
      </div>

      {/* RIGHT: Form */}
      <div>
        <div className="card p-4 shadow">
          <h2 className="font-semibold mb-2">
            {editing?.id ? "Edit Category" : "New Category"}
          </h2>

          <div className="mb-3">
            <label className="text-sm">Parent</label>
            <select
              className="w-full select select-bordered"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">(root)</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <CategoryForm
            initial={editing}
            onSubmit={(payload) =>
              editing?.id
                ? handleUpdate(editing.id, payload)
                : handleCreate(payload)
            }
          />
        </div>
      </div>
    </div>
  );
}
