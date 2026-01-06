// src/pages/admin/AdminExamAttempts.jsx
import React, { useEffect, useMemo, useState } from "react";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function AdminExamAttempts() {
  const [subject, setSubject] = useState("a320");
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      const ts = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (startDate) {
        const s = new Date(startDate).getTime();
        if (Number.isFinite(s) && ts < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate).getTime();
        if (Number.isFinite(e) && ts > e) return false;
      }
      return true;
    });
  }, [attempts, startDate, endDate]);

  async function load() {
    if (!subject) {
      setAttempts([]);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${FN_BASE}/exam-attempts?subject=${encodeURIComponent(subject)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed to load attempts (${res.status})`);
      setAttempts(Array.isArray(json?.attempts) ? json.attempts : []);
    } catch (e) {
      setErr(e.message || String(e));
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Exam Attempts</h1>
          <p className="text-sm text-slate-600">Recent attempts per subject</p>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded bg-sky-600 text-white text-sm disabled:opacity-50"
          onClick={load}
          disabled={loading || !subject}
        >
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 bg-white border rounded-lg p-3 shadow-sm">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Subject slug</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. a320"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Start date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">End date</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {err && (
        <div className="p-3 border border-rose-200 bg-rose-50 text-rose-700 rounded text-sm">
          {err}
        </div>
      )}

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-2 px-3 py-2 text-xs font-semibold text-slate-600 border-b">
          <div>Date</div>
          <div>Total / Correct</div>
          <div>Score %</div>
          <div>Subject</div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading attempts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No attempts found.</div>
        ) : (
          filtered.map((a) => {
            const answers = Array.isArray(a.answers) ? a.answers : [];
            const total = answers.length;
            const correct = answers.filter((x) => x.selectedIndex === x.correctIndex).length;
            const scorePct = total ? Math.round((correct / total) * 100) : 0;
            return (
              <div
                key={a.id}
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-2 px-3 py-2 text-xs text-slate-700 border-b last:border-0"
              >
                <div>{new Date(a.created_at).toLocaleString()}</div>
                <div>
                  {total} / {correct}
                </div>
                <div>{scorePct}%</div>
                <div>{a.subject_slug || subject}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
