import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MainLayout from "@/layouts/MainLayout";

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-admin-secret": import.meta.env.VITE_ADMIN_API_SECRET || "", // set di Vite untuk FE
};

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at,suspended_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load users error:", error);
      alert("Failed to load users.");
    } else {
      setList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const callFn = async (payload) => {
    const res = await fetch("/.netlify/functions/admin-users", {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  };

  const changeRole = async (id, newRole) => {
    if (!confirm(`Change role to ${newRole}?`)) return;
    setProcessing(id);
    try {
      await callFn({ action: "role", userId: id, newRole });
    } catch (err) {
      console.error("Role update error:", err);
      alert("Failed to update role.");
    }
    await load();
    setProcessing(null);
  };

  const suspendUser = async (id, email) => {
    if (!confirm(`Suspend ${email}? They will be blocked from accessing the app.`)) return;
    setProcessing(id);
    try {
      await callFn({ action: "suspend", userId: id });
      alert("User suspended.");
    } catch (err) {
      console.error("Suspend error:", err);
      alert("Failed to suspend user.");
    }
    await load();
    setProcessing(null);
  };

  const unsuspendUser = async (id, email) => {
    if (!confirm(`Unsuspend ${email}?`)) return;
    setProcessing(id);
    try {
      await callFn({ action: "unsuspend", userId: id });
      alert("User unsuspended.");
    } catch (err) {
      console.error("Unsuspend error:", err);
      alert("Failed to unsuspend user.");
    }
    await load();
    setProcessing(null);
  };

  const removeUser = async (id, email) => {
    if (!confirm(`Delete user ${email}? This will remove from Auth & Profiles.`)) return;
    setProcessing(id);
    try {
      await callFn({ action: "delete", userId: id });
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Failed to delete user.");
    }
    await load();
    setProcessing(null);
  };

  const renderActions = (u) => {
    const busy = processing === u.id;
    const isDisabled = u.role === "disabled";
    const isAdmin = u.role === "admin";

    return (
      <div className="flex gap-2">
        {!isDisabled ? (
          <button
            onClick={() => suspendUser(u.id, u.email)}
            disabled={busy}
            className="px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? "…" : "Suspend"}
          </button>
        ) : (
          <button
            onClick={() => unsuspendUser(u.id, u.email)}
            disabled={busy}
            className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 disabled:opacity-50"
          >
            {busy ? "…" : "Unsuspend"}
          </button>
        )}

        {isAdmin ? (
          <button
            onClick={() => changeRole(u.id, "user")}
            disabled={busy}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 disabled:opacity-50"
          >
            {busy ? "…" : "Demote"}
          </button>
        ) : (
          <button
            onClick={() => changeRole(u.id, "admin")}
            disabled={busy}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "…" : "Promote"}
          </button>
        )}

        <button
          onClick={() => removeUser(u.id, u.email)}
          disabled={busy}
          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "…" : "Delete"}
        </button>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-600">Promote, demote, suspend, or delete users.</p>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Suspended</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 font-mono">{u.email}</td>
                    <td className="p-2">{u.full_name || "-"}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2 text-xs">{u.suspended_at ? new Date(u.suspended_at).toLocaleString() : "-"}</td>
                    <td className="p-2 text-xs text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="p-2">{renderActions(u)}</td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
