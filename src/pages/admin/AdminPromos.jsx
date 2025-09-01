// src/pages/admin/AdminPromos.jsx
import { useState } from "react";

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");

  const handleCreate = () => {
    // TODO: Supabase insert
    const promo = {
      id: Date.now(),
      code: newCode,
      discount: newDiscount,
      usage: 0,
      status: "active",
    };
    setPromos([...promos, promo]);
    setShowForm(false);
    setNewCode("");
    setNewDiscount("");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Promo Codes</h2>

      {/* Button create */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
      >
        {showForm ? "Cancel" : "➕ New Promo Code"}
      </button>

      {/* Create form */}
      {showForm && (
        <div className="mt-4 border rounded p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          <label className="block text-sm">
            Code
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border bg-white dark:bg-gray-800"
              placeholder="e.g. SKYDECK50"
            />
          </label>
          <label className="block text-sm">
            Discount (%)
            <input
              type="number"
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border bg-white dark:bg-gray-800"
              placeholder="10"
            />
          </label>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
          >
            Save
          </button>
        </div>
      )}

      {/* Promo list */}
      <div className="mt-6 space-y-2">
        {promos.length === 0 && (
          <p className="text-sm text-gray-500">No promos yet.</p>
        )}
        {promos.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center border rounded p-3 bg-white dark:bg-gray-800"
          >
            <div>
              <div className="font-mono">{p.code}</div>
              <div className="text-xs text-gray-500">
                {p.discount}% off • {p.status} • Used {p.usage} times
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-xs rounded bg-yellow-500 text-white">
                Edit
              </button>
              <button className="px-2 py-1 text-xs rounded bg-red-600 text-white">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
