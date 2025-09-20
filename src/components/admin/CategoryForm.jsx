import { useEffect, useState } from "react";

export default function CategoryForm({ onSubmit, initial }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [parentId, setParentId] = useState(initial?.parent_id || "");
  const [requiresAircraft, setRequiresAircraft] = useState(
    !!initial?.requires_aircraft
  );
  const [proOnly, setProOnly] = useState(!!initial?.pro_only);
  const [orderIndex, setOrderIndex] = useState(initial?.order_index ?? 0);

  useEffect(() => {
    if (!initial && label && !slug) {
      setSlug(label.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [label]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          label,
          slug,
          parent_id: parentId || null,
          requires_aircraft: requiresAircraft,
          pro_only: proOnly,
          order_index: Number(orderIndex),
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Label</label>
          <input
            className="w-full input input-bordered"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm">Slug</label>
          <input
            className="w-full input input-bordered"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={requiresAircraft}
            onChange={(e) => setRequiresAircraft(e.target.checked)}
          />
          Requires Aircraft
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={proOnly}
            onChange={(e) => setProOnly(e.target.checked)}
          />
          Pro Only
        </label>

        <div>
          <label className="text-sm">Order</label>
          <input
            type="number"
            className="w-full input input-bordered"
            value={orderIndex}
            onChange={(e) => setOrderIndex(e.target.value)}
          />
        </div>
      </div>

      {/* Parent select diisi dari luar via children slot atau prop jika diperlukan */}
      <button className="btn btn-primary">Save</button>
    </form>
  );
}
