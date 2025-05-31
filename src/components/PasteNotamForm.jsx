import React, { useState } from "react";

export default function PasteNotamForm() {
  const [icao, setIcao] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!text || !icao) {
      setStatus("⚠️ Please paste the NOTAM text and select ICAO before uploading.");
      return;
    }

    setStatus("Uploading...");

    try {
      const res = await fetch("/.netlify/functions/parse-notam-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, icao })
      });
      const result = await res.json();
      setStatus(result.message || "Upload complete!");
    } catch (err) {
      console.error(err);
      setStatus("Upload failed.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">
        Paste NOTAM Text
      </h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            ICAO Code
          </label>
          <input
            type="text"
            value={icao}
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            placeholder="e.g., WIOO"
            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 mt-4">
        NOTAM Text
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the full NOTAM text here..."
        rows={12}
        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      ></textarea>

      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Upload to Notion
      </button>

      {status && <p className="text-sm text-gray-500">{status}</p>}
    </div>
  );
}
