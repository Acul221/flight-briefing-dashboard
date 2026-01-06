// src/pages/admin/AdminFlagsQueue.jsx
import React, { useEffect, useState } from "react";
import { fetchQuestionFlags, resolveQuestionFlag } from "@/lib/quizApi";
import { Link } from "react-router-dom";

export default function AdminFlagsQueue() {
  const [subject, setSubject] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState("false");
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const resolved = resolvedFilter === "all" ? null : resolvedFilter === "true";
      const data = await fetchQuestionFlags({ subjectSlug: subject || undefined, resolved });
      setFlags(data);
    } catch (e) {
      setErr(e.message || String(e));
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveQuestionFlag(id);
      await load();
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Question Flags</h1>
          <p className="text-sm text-slate-600">Reviewer queue</p>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded bg-sky-600 text-white text-sm disabled:opacity-50"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 bg-white border rounded-lg p-3 shadow-sm">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Subject slug (optional)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. a320"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
          >
            <option value="false">Open</option>
            <option value="true">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {err && (
        <div className="p-3 border border-rose-200 bg-rose-50 text-rose-700 rounded text-sm">
          {err}
        </div>
      )}

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-[0.8fr_2fr_1fr_1fr] gap-2 px-3 py-2 text-xs font-semibold text-slate-600 border-b">
          <div>Date</div>
          <div>Reason / Comment</div>
          <div>Question</div>
          <div>Actions</div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading flags...</div>
        ) : flags.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No flags found.</div>
        ) : (
          flags.map((f) => {
            const subjectSlug = f?.meta?.subjectSlug || "";
            const questionLink = f.question_id ? `/admin/questions/${f.question_id}` : null;
            return (
              <div
                key={f.id}
                className="grid grid-cols-[0.8fr_2fr_1fr_1fr] gap-2 px-3 py-2 text-xs text-slate-700 border-b last:border-0"
              >
                <div>{new Date(f.created_at).toLocaleString()}</div>
                <div>
                  <div className="font-semibold text-slate-800">{f.reason}</div>
                  {f.comment && <div className="text-slate-600 text-[11px]">{f.comment}</div>}
                </div>
                <div>
                  <div className="text-slate-800">{f.question_id || "-"}</div>
                  {subjectSlug && <div className="text-slate-500 text-[11px]">{subjectSlug}</div>}
                </div>
                <div className="flex gap-2 items-center">
                  {questionLink ? (
                    <Link to={questionLink} className="text-sky-700 underline text-[11px]">
                      Open Editor
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No link</span>
                  )}
                  {!f.resolved && (
                    <button
                      type="button"
                      className="text-[11px] px-2 py-[3px] rounded bg-emerald-600 text-white"
                      onClick={() => handleResolve(f.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {f.resolved && <span className="text-[11px] text-emerald-700">Resolved</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
