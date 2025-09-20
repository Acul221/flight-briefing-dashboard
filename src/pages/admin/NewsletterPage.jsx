// src/pages/admin/NewsletterPage.jsx
import React, { useEffect, useState } from "react";
import NewsletterForm from "@/components/admin/NewsletterForm";

export default function NewsletterPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/.netlify/functions/list-newsletters");
        const data = await res.json();
        if (res.ok) setCampaigns(data);
      } catch (err) {
        console.error("Failed to load newsletters:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📨 Newsletter Management</h1>

      {/* Form untuk kirim newsletter baru */}
      <NewsletterForm />

      <h2 className="text-xl font-semibold mt-10 mb-4">History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : campaigns.length === 0 ? (
        <p className="text-gray-500">No newsletters yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Audience</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-left">Total Sent</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.title}</td>
                  <td className="p-2 capitalize">{c.audience}</td>
                  <td className="p-2">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{c.sent_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
