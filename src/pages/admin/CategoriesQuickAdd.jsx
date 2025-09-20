import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function CategoriesQuickAdd() {
  const [parents, setParents] = useState([]);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setSlug(
      label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  }, [label]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/.netlify/functions/categories");
      const { items } = await res.json();
      setParents(items.filter((x) => !x.parent_id)); // hanya root sbg parent
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setNote("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not logged in");
      }

      const res = await fetch("/.netlify/functions/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          slug,
          label,
          parent_id: parentId || null,
          order_index: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setNote(`Saved: ${data.item.label}`);
      setLabel("");
      setSlug("");
      setParentId("");
    } catch (err) {
      setNote(`Error: ${String(err.message || err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg p-6">
      <h1 className="text-xl font-semibold mb-4">
        Categories — Quick Add
      </h1>

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm">Label</label>
          <input
            className="input input-bordered w-full"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm">Slug</label>
          <input
            className="input input-bordered w-full"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm">Parent (optional)</label>
          <select
            className="select select-bordered w-full"
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

        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {note && <div className="mt-3 text-sm">{note}</div>}
    </div>
  );
}

/*
  Catatan:
  - Pastikan fungsi Netlify sudah terdeploy dan dapat diakses di path:
      /.netlify/functions/categories
  - Pastikan environment variable VITE_SUPABASE_ANON_KEY sudah di-set di Netlify.
*/
    