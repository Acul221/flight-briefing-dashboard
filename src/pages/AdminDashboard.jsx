import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TestAdmin from "@/components/TestAdmin";
import MainLayout from "@/layouts/MainLayout";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, subs: 0, promos: 0 });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      // total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // total subscriptions active
      const { count: subCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // total promos
      const { count: promoCount } = await supabase
        .from("promos")
        .select("*", { count: "exact", head: true });

      setStats({
        users: userCount || 0,
        subs: subCount || 0,
        promos: promoCount || 0,
      });

      // list users
      const { data: userList } = await supabase
        .from("profiles")
        .select("id, email, role");

      // join dengan subscription plan
      const { data: subsList } = await supabase
        .from("subscriptions")
        .select("user_id, plan, status");

      const merged = (userList || []).map((u) => {
        const sub = subsList?.find((s) => s.user_id === u.id);
        return {
          ...u,
          plan: sub?.plan || "free",
          status: sub?.status || "none",
        };
      });

      setUsers(merged);
    }
    loadData();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">
          Halaman khusus admin untuk monitoring dan manajemen.
        </p>

        {/* Debug role */}
        <TestAdmin />

        {/* Statistik singkat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Users" value={stats.users} />
          <StatCard title="Active Subscriptions" value={stats.subs} />
          <StatCard title="Promo Codes" value={stats.promos} />
        </div>

        {/* Quick Links */}
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">Quick Links</h2>
          <ul className="list-disc ml-6 text-blue-600 space-y-1">
            <li>
              <a href="/admin/promos" className="hover:underline">
                Kelola Promo Codes
              </a>
            </li>
            <li>
              <a href="/admin/users" className="hover:underline">
                Kelola Users
              </a>
            </li>
          </ul>
        </div>

        {/* Daftar user */}
        <div className="border rounded p-4 bg-white dark:bg-gray-800 shadow">
          <h2 className="font-semibold mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Plan</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2 capitalize">{u.plan}</td>
                    <td className="p-2">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow text-center">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
