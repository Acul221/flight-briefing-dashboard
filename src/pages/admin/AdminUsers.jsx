// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MainLayout from "@/layouts/MainLayout";

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,role,created_at")
      .order("created_at", { ascending: false });

    if (error) console.error("Load users error:", error);
    setList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const promote = async (id) => {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", id);
    load();
  };

  const demote = async (id) => {
    await supabase.from("profiles").update({ role: "user" }).eq("id", id);
    load();
  };

  const removeUser = async (id, email) => {
    if (!confirm(`Hapus user ${email}?`)) return;

    // hapus dari profiles
    await supabase.from("profiles").delete().eq("id", id);

    // TODO: kalau pakai server/service-role, bisa juga panggil API supabase.auth.admin.deleteUser(id)
    // untuk sekarang kita hanya delete di profiles

    load();
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-600">Promote, demote, atau hapus user.</p>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="space-y-2">
            {list.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center border p-3 rounded bg-white dark:bg-gray-800 shadow-sm"
              >
                <div>
                  <div className="font-mono text-sm">{u.email}</div>
                  <div className="text-xs text-gray-500">
                    {u.role} • {new Date(u.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.role !== "admin" ? (
                    <button
                      onClick={() => promote(u.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Promote
                    </button>
                  ) : (
                    <button
                      onClick={() => demote(u.id)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                    >
                      Demote
                    </button>
                  )}
                  <button
                    onClick={() => removeUser(u.id, u.email)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <p className="text-gray-500 text-sm">No users found.</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
