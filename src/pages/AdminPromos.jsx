import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MainLayout from "@/layouts/MainLayout";

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({
    code: "",
    type: "percent", // percent | fixed
    value: 10,
    starts_at: "",
    ends_at: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadPromos();
  }, []);

  async function loadPromos() {
    const { data, error } = await supabase.from("promos").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    else setPromos(data || []);
  }

  async function createPromo(e) {
    e.preventDefault();
    setMsg("Saving...");
    const { error } = await supabase.from("promos").insert([form]);
    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      setMsg("✅ Promo created!");
      setForm({ code: "", type: "percent", value: 10, starts_at: "", ends_at: "" });
      loadPromos();
    }
  }

  async function deletePromo(id) {
    if (!confirm("Delete this promo?")) return;
    const { error } = await supabase.from("promos").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      loadPromos();
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Kelola Promo Codes</h1>
        <p className="text-gray-600">Tambah, lihat, atau hapus kode promo.</p>

        {/* Form create promo */}
        <form onSubmit={createPromo} className="border p-4 rounded space-y-4 bg-white dark:bg-gray-800 shadow">
          <h2 className="font-semibold">Buat Promo Baru</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Kode Promo"
              className="border p-2 rounded"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <select
              className="border p-2 rounded"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input
              type="number"
              className="border p-2 rounded"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <input
              type="date"
              className="border p-2 rounded"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
            <input
              type="date"
              className="border p-2 rounded"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save Promo
          </button>
          {msg && <p className="text-sm text-gray-500 mt-2">{msg}</p>}
        </form>

        {/* List promos */}
        <div className="border rounded p-4 bg-white dark:bg-gray-800 shadow">
          <h2 className="font-semibold mb-2">Daftar Promo</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Code</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Value</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{p.code}</td>
                    <td className="p-2">{p.type}</td>
                    <td className="p-2">{p.value}</td>
                    <td className="p-2">{p.starts_at?.slice(0, 10) || "-"}</td>
                    <td className="p-2">{p.ends_at?.slice(0, 10) || "-"}</td>
                    <td className="p-2">
                      <button
                        onClick={() => deletePromo(p.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      No promo codes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
