import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import TestAdmin from "@/components/TestAdmin";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    subs: 0,
    promos: 0,
    revenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [trend, setTrend] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [activity, setActivity] = useState([]);
  const [system, setSystem] = useState({
    supabase: "healthy",
    netlify: "healthy",
  });

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

      // fake revenue sum
      const monthlyRevenue = [
        { month: "Jan", revenue: 12000000 },
        { month: "Feb", revenue: 18500000 },
        { month: "Mar", revenue: 25000000 },
        { month: "Apr", revenue: 22000000 },
        { month: "May", revenue: 32000000 },
      ];

      setStats({
        users: userCount || 0,
        subs: subCount || 0,
        promos: promoCount || 0,
        revenue: monthlyRevenue.reduce((acc, m) => acc + m.revenue, 0),
      });

      // list users
      const { data: userList } = await supabase
        .from("profiles")
        .select("id, email, role, created_at");

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

      // fake analytics trend
      const monthlyTrend = [
        { month: "Jan", users: 20, subs: 5 },
        { month: "Feb", users: 35, subs: 12 },
        { month: "Mar", users: 50, subs: 18 },
        { month: "Apr", users: 70, subs: 25 },
        { month: "May", users: 90, subs: 40 },
      ];
      setTrend(monthlyTrend);

      // revenue per month
      setRevenue(monthlyRevenue);

      // fake activity logs
      setActivity([
        { id: 1, text: "User john@example.com signed up", time: "2h ago" },
        { id: 2, text: "New subscription: jane@demo.com → Pro Plan", time: "5h ago" },
        { id: 3, text: "Promo SPRING50 redeemed", time: "1d ago" },
      ]);

      // fake system health (dummy ping)
      setSystem({
        supabase: "healthy",
        netlify: "healthy",
      });
    }
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-600">
        Monitoring & manajemen untuk SkyDeckPro Admin.
      </p>

      {/* Debug role */}
      <TestAdmin />

      {/* Statistik singkat */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users} />
        <StatCard title="Active Subscriptions" value={stats.subs} />
        <StatCard title="Promo Codes" value={stats.promos} />
        <StatCard
          title="Revenue (Total)"
          value={`Rp ${(stats.revenue / 1_000_000).toFixed(1)}M`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User & Subs Trend */}
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-semibold mb-4">Growth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#2563eb"
                strokeWidth={2}
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="subs"
                stroke="#16a34a"
                strokeWidth={2}
                name="Subscriptions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-semibold mb-4">Revenue per Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(val) => `Rp ${val.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#f97316" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Links, Activity, System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Recent Activity */}
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-semibold mb-2">Recent Activity</h2>
          <ul className="space-y-2 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between border-b pb-1">
                <span>{a.text}</span>
                <span className="text-gray-500">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* System Health */}
        <div className="border rounded p-4 bg-white shadow">
          <h2 className="font-semibold mb-2">System Health</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Supabase</span>
              <span
                className={`font-semibold ${
                  system.supabase === "healthy" ? "text-green-600" : "text-red-600"
                }`}
              >
                {system.supabase}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Netlify</span>
              <span
                className={`font-semibold ${
                  system.netlify === "healthy" ? "text-green-600" : "text-red-600"
                }`}
              >
                {system.netlify}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Daftar user */}
      <div className="border rounded p-4 bg-white shadow">
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
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow text-center">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
