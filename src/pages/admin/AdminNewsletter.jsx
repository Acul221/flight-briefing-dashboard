import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client (frontend-safe anon key)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminNewsletter() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(
    `<h1>Hello {{NAME}} ✈️</h1>
     <p>This is a test newsletter 🚀</p>
     <p><a href="{{UNSUB_URL}}">Unsubscribe</a></p>`
  );
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletters")
      .select("id, title, audience, created_at")
      .order("created_at", { ascending: false });
    if (!error) setCampaigns(data || []);
    setLoading(false);
  }

  async function createCampaign() {
    if (!title || !content) return alert("Title & content required");

    const { data, error } = await supabase
      .from("newsletters")
      .insert({ title, content, audience })
      .select("id")
      .single();

    if (error) return alert(error.message);

    setTitle("");
    setContent("");
    setAudience("all");
    await loadCampaigns();
    setSelectedId(data.id);
    alert("Campaign created ✅");
  }

  async function sendCampaign(id) {
    setSending(true);
    try {
      const res = await fetch("/.netlify/functions/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      alert(`Send triggered: ${json.count} recipients`);
      await loadLogs(id);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  async function loadLogs(id) {
    setSelectedId(id);
    const { data, error } = await supabase
      .from("newsletter_logs")
      .select("status, sent_at")
      .eq("newsletter_id", id)
      .order("sent_at", { ascending: false });

    if (!error) setLogs(data || []);
  }

  const stats = useMemo(() => {
    const s = { success: 0, failed: 0 };
    logs.forEach((l) => (s[l.status] = (s[l.status] || 0) + 1));
    return s;
  }, [logs]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Newsletter Admin</h1>

      {/* Create Campaign Form */}
      <div className="grid gap-3 mb-8 bg-white/70 dark:bg-zinc-900 rounded-2xl p-4 shadow">
        <div className="grid gap-2">
          <label className="text-sm">Title</label>
          <input
            className="border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Subject / Title"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm">Audience</label>
          <select
            className="border rounded px-3 py-2 w-48"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="all">All</option>
            <option value="free">Free only</option>
            <option value="pro">Pro only</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm">
            Content (HTML, supports {"{{NAME}}"} & {"{{UNSUB_URL}}"})
          </label>
          <textarea
            className="border rounded px-3 py-2 font-mono min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={createCampaign}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Campaign
          </button>
          <button
            onClick={() => {
              const preview = window.open("", "_blank");
              preview.document.write(content);
              preview.document.close();
            }}
            className="px-4 py-2 rounded border"
          >
            Preview HTML
          </button>
        </div>
      </div>

      {/* Campaign List */}
      <h2 className="text-lg font-medium mb-2">Campaigns</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="border rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-gray-500">
                  {c.audience.toUpperCase()} •{" "}
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => loadLogs(c.id)}
                  className="px-3 py-1 rounded border"
                >
                  Logs
                </button>
                <button
                  disabled={sending}
                  onClick={() => sendCampaign(c.id)}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {sending && selectedId === c.id ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      {selectedId && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Logs for campaign: {selectedId}</h3>
          <div className="text-sm mb-2">
            Success: {stats.success} • Failed: {stats.failed}
          </div>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-zinc-800">
                <tr>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{l.status}</td>
                    <td className="p-2">
                      {new Date(l.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td className="p-3" colSpan={2}>
                      No logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
