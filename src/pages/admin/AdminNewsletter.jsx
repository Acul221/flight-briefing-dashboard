import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminNewsletter() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      let { data, error } = await supabase
        .from("newsletter_performance")
        .select("*")
        .order("sent_at", { ascending: false });

      if (!error) setCampaigns(data || []);
    };
    fetchCampaigns();
  }, []);

  // data untuk chart
  const lineData = campaigns.map((c) => ({
    name: c.subject,
    openRate: c.open_rate,
  }));

  const barData = campaigns.map((c) => ({
    name: c.subject,
    clickRate: c.click_rate,
  }));

  const unsubData = campaigns.map((c) => ({
    name: c.subject,
    unsubRate: c.unsub_rate,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">📧 Newsletter Campaign Analytics</h1>

      {/* Line Chart: Open Rate */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Open Rate per Campaign</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="openRate" stroke="#4ade80" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Click Rate */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Click Rate per Campaign</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="clickRate" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Unsubscribe Rate */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-2">Unsubscribe Rate per Campaign</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={unsubData}>
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="unsubRate" fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-2">Campaign Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Subject</th>
                <th className="border px-2 py-1">Sent</th>
                <th className="border px-2 py-1">Open %</th>
                <th className="border px-2 py-1">Click %</th>
                <th className="border px-2 py-1">Unsub %</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.campaign_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="border px-2 py-1">{c.subject}</td>
                  <td className="border px-2 py-1">{c.total_sent}</td>
                  <td className="border px-2 py-1">{c.open_rate}%</td>
                  <td className="border px-2 py-1">{c.click_rate}%</td>
                  <td className="border px-2 py-1">{c.unsub_rate}%</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td className="p-2 text-center" colSpan={5}>
                    No campaigns
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
