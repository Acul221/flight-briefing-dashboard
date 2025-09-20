// src/pages/admin/AdminNewsletter.jsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis,
  Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import { Link } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminNewsletter() {
  const [summary, setSummary] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    fetchLogs();
  }, []);

  // --- Fetch campaign summary ---
  const fetchSummary = async () => {
    const { data, error } = await supabase
      .from("newsletter_summary")
      .select("*")
      .order("last_sent", { ascending: false });

    if (error) {
      console.error("Error fetching summary:", error);
    } else {
      setSummary(data || []);
    }
    setLoading(false);
  };

  // --- Fetch recent logs (join profiles for email) ---
  const fetchLogs = async () => {
    const { data, error } = await supabase.rpc("get_newsletter_logs");
    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
    }
  };

  if (loading) {
    return <div className="p-6">Loading newsletter analytics…</div>;
  }

  // --- Stats ---
  const totalCampaigns = summary.length;
  const totalSent = summary.reduce((sum, s) => sum + (s.total_attempts || 0), 0);
  const avgOpenRate = summary.length > 0
    ? (summary.reduce((sum, s) => sum + (s.total_attempts > 0 ? (s.open_count / s.total_attempts) * 100 : 0), 0) / summary.length).toFixed(1)
    : 0;
  const avgClickRate = summary.length > 0
    ? (summary.reduce((sum, s) => sum + (s.total_attempts > 0 ? (s.click_count / s.total_attempts) * 100 : 0), 0) / summary.length).toFixed(1)
    : 0;

  // --- Data for Failed Reasons Pie ---
  const failedReasons = logs
    .filter(l => l.status === "failed" && l.error)
    .reduce((acc, log) => {
      const existing = acc.find(a => a.error === log.error);
      if (existing) existing.count++;
      else acc.push({ error: log.error, count: 1 });
      return acc;
    }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 dark:bg-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold mb-6">📧 Newsletter Campaign Analytics</h1>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Campaigns" value={totalCampaigns} color="blue" />
        <StatCard title="Total Sent" value={totalSent} color="purple" />
        <StatCard title="Avg Open Rate" value={`${avgOpenRate}%`} color="green" />
        <StatCard title="Avg Click Rate" value={`${avgClickRate}%`} color="yellow" />
      </div>

      {/* Chart Open Rate */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Open Rate % per Campaign</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={summary.map(s => ({
            subject: s.subject,
            openRate: s.total_attempts > 0 ? (s.open_count / s.total_attempts) * 100 : 0
          }))}>
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="openRate" stroke="#4ade80" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Click Rate */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Click Rate % per Campaign</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={summary.map(s => ({
            subject: s.subject,
            clickRate: s.total_attempts > 0 ? (s.click_count / s.total_attempts) * 100 : 0
          }))}>
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clickRate" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart Failed Reasons */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Failed Reasons</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={failedReasons}
              dataKey="count"
              nameKey="error"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#ef4444"
              label
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Table Summary */}
      <div className="overflow-x-auto mb-10">
        <h2 className="font-semibold mb-2">Campaign Summary</h2>
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              <th className="p-2 border dark:border-gray-700">Subject</th>
              <th className="p-2 border dark:border-gray-700">Total Attempts</th>
              <th className="p-2 border dark:border-gray-700">Success</th>
              <th className="p-2 border dark:border-gray-700">Failed</th>
              <th className="p-2 border dark:border-gray-700">Opens</th>
              <th className="p-2 border dark:border-gray-700">Clicks</th>
              <th className="p-2 border dark:border-gray-700">Unsubs</th>
              <th className="p-2 border dark:border-gray-700">Last Sent</th>
              <th className="p-2 border dark:border-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.newsletter_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-2 border dark:border-gray-700">{s.subject}</td>
                <td className="p-2 border dark:border-gray-700">{s.total_attempts}</td>
                <td className="p-2 border dark:border-gray-700 text-green-600">{s.success_count}</td>
                <td className="p-2 border dark:border-gray-700 text-red-600">{s.failed_count}</td>
                <td className="p-2 border dark:border-gray-700">{s.open_count}</td>
                <td className="p-2 border dark:border-gray-700">{s.click_count}</td>
                <td className="p-2 border dark:border-gray-700">{s.unsub_count}</td>
                <td className="p-2 border dark:border-gray-700">
                  {s.last_sent ? new Date(s.last_sent).toLocaleString("id-ID") : "-"}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  <Link to={`/admin/newsletter/${s.campaign_id}`} className="text-blue-600 underline">
                    View Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Logs */}
      <div className="overflow-x-auto">
        <h2 className="font-semibold mb-2">Recent Logs</h2>
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              <th className="p-2 border dark:border-gray-700">Email</th>
              <th className="p-2 border dark:border-gray-700">Status</th>
              <th className="p-2 border dark:border-gray-700">Sent At</th>
              <th className="p-2 border dark:border-gray-700">Campaign ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-2 border dark:border-gray-700">{log.email}</td>
                <td className={`p-2 border dark:border-gray-700 ${log.status === "success" ? "text-green-600" : "text-red-600"}`}>
                  {log.status}
                </td>
                <td className="p-2 border dark:border-gray-700">
                  {log.sent_at ? new Date(log.sent_at).toLocaleString("id-ID") : "-"}
                </td>
                <td className="p-2 border dark:border-gray-700">{log.campaign_id || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Reusable StatCard ---
function StatCard({ title, value, color }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-300",
    purple: "text-purple-600 dark:text-purple-300",
    green: "text-green-600 dark:text-green-300",
    yellow: "text-yellow-600 dark:text-yellow-300",
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
