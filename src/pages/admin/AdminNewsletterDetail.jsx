import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/apiClient";


export default function AdminNewsletterDetail() {
  const { campaignId } = useParams();
  const [logs, setLogs] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
    fetchCampaignLogs();
  }, [campaignId]);

  const fetchCampaign = async () => {
    const { data, error } = await supabase
      .from("newsletter_overview")
      .select("*")
      .eq("campaign_id", campaignId)
      .single();
    if (!error) setCampaign(data);
  };

  const fetchCampaignLogs = async () => {
    const { data, error } = await supabase
      .from("newsletter_logs")
      .select("id, user_id, status, error, sent_at, opened, clicked, unsubscribed, opened_at, clicked_at, unsubscribed_at")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false });
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const header = Object.keys(logs[0]).join(",");
    const rows = logs.map((r) => Object.values(r).map((v) => (v == null ? "" : `"${v}"`)).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter_campaign_${campaignId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter_campaign_${campaignId}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading campaign logs…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📧 Campaign Detail</h1>
          <p className="text-gray-500 dark:text-gray-400">Campaign ID: {campaignId}</p>
          {campaign && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <strong>{campaign.subject}</strong> — Sent {campaign.last_sent ? new Date(campaign.last_sent).toLocaleString("id-ID") : "-"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Export CSV</button>
          <button onClick={exportJSON} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">Export JSON</button>
          <Link to="/admin/newsletter" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600">← Back</Link>
        </div>
      </div>

      {campaign && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Stat label="Total Attempts" value={campaign.total_attempts} />
          <Stat label="Success" value={campaign.success_count} color="green" />
          <Stat label="Failed" value={campaign.failed_count} color="red" />
          <Stat label="Opens" value={campaign.open_count} color="blue" />
          <Stat label="Clicks" value={campaign.click_count} color="yellow" />
          <Stat label="Unsubs" value={campaign.unsub_count} color="pink" />
        </div>
      )}

      <div className="overflow-x-auto">
        <h2 className="font-semibold mb-2">Recipient Logs</h2>
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-left">
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Error</th>
              <th className="p-2 border">Opened</th>
              <th className="p-2 border">Clicked</th>
              <th className="p-2 border">Unsubscribed</th>
              <th className="p-2 border">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-2 border">{l.user_id}</td>
                <td className={`p-2 border font-semibold ${l.status === "success" ? "text-green-600" : "text-red-600"}`}>{l.status}</td>
                <td className="p-2 border text-xs max-w-xs truncate">{l.error || "-"}</td>
                <td className="p-2 border">{l.opened ? <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">✅ {new Date(l.opened_at).toLocaleString("id-ID")}</span> : "-"}</td>
                <td className="p-2 border">{l.clicked ? <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">🔗 {new Date(l.clicked_at).toLocaleString("id-ID")}</span> : "-"}</td>
                <td className="p-2 border">{l.unsubscribed ? <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">🚫 {new Date(l.unsubscribed_at).toLocaleString("id-ID")}</span> : "-"}</td>
                <td className="p-2 border">{l.sent_at ? new Date(l.sent_at).toLocaleString("id-ID") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colorMap = { green: "text-green-600", red: "text-red-600", blue: "text-blue-600", yellow: "text-yellow-600", pink: "text-pink-600" };
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color] || ""}`}>{value}</p>
    </div>
  );
}
