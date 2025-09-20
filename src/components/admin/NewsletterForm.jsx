// src/components/admin/NewsletterForm.jsx
import React, { useState } from "react";

export default function NewsletterForm() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Insert campaign ke DB
      const res = await fetch("/.netlify/functions/create-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create newsletter");

      // 2. Panggil send-newsletter untuk distribusi
      const sendRes = await fetch("/.netlify/functions/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterId: data.id }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || "Send failed");

      setMessage(`✅ Newsletter sent to ${sendData.count} users.`);
      setSubject("");
      setContent("");
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Send Newsletter</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800"
          >
            <option value="all">All Users</option>
            <option value="free">Free Users</option>
            <option value="pro">Pro Users</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800"
            placeholder="Use {{NAME}} for personalization, {{UNSUB_URL}} for unsubscribe link"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Newsletter"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
