// src/pages/admin/EditQuestionPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RawInputParser from "@/components/admin/RawInputParser";
import ImageUploader from "@/components/admin/ImageUploader";
import QuestionPreview from "@/components/admin/QuestionPreview";
import CategoryManagerPanel from "@/components/admin/CategoryManagerPanel";
import { buildQuestionPayload } from "@/utils/buildQuestionPayload";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

const a4 = (arr) => {
  if (!Array.isArray(arr)) return [null, null, null, null];
  return [...arr, null, null, null].slice(0, 4);
};

export default function EditQuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const [tab, setTab] = useState("form");

  const [form, setForm] = useState({
    id: null,
    legacy_id: "",
    question_text: "",
    question_image_url: "",
    choices: { A: "", B: "", C: "", D: "" },
    choice_images: [null, null, null, null],
    explanations: ["", "", "", ""],
    answer_key: "A",
    difficulty: "medium",
    source: "",
    category: "",
    subcategory: "",
    tags: [],
    status: "draft",
    aircraft: "",
  });

  const updateField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updateChoice = (L, v) => setForm((p) => ({ ...p, choices: { ...p.choices, [L]: v } }));
  const updateExplanation = (i, v) =>
    setForm((p) => ({ ...p, explanations: p.explanations.map((e, idx) => (i === idx ? v : e)) }));
  const updateChoiceImage = (i, url) =>
    setForm((p) => ({ ...p, choice_images: p.choice_images.map((c, idx) => (i === idx ? url : c)) }));

  // ---------------- Guard + Fetch ----------------
  useEffect(() => {
    if (!id || id === ":id") {
      alert("Invalid Question ID");
      navigate("/admin/questions/list");
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${FN_BASE}/questions?id=${encodeURIComponent(id)}`, {
          headers: { "x-admin-secret": ADMIN_SECRET },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load question");
        if (!alive) return;

        const q = data || {};
        const asObjChoices = Array.isArray(q.choices)
          ? { A: q.choices[0] || "", B: q.choices[1] || "", C: q.choices[2] || "", D: q.choices[3] || "" }
          : (q.choices || { A: "", B: "", C: "", D: "" });

        setForm({
          id: q.id || null,
          legacy_id: q.legacy_id || "",
          question_text: q.question_text || "",
          question_image_url: q.question_image_url || "",
          choices: asObjChoices,
          choice_images: a4(q.choice_images),
          explanations: a4(q.explanations),
          answer_key: (q.answer_key || "A").toUpperCase(),
          difficulty: q.difficulty || "medium",
          source: q.source || "",
          category: "",    // kategori & subkategori bisa dipilih admin di panel
          subcategory: "",
          tags: Array.isArray(q.tags) ? q.tags : [],
          status: q.status || "draft",
          aircraft: q.aircraft || "",
        });
      } catch (e) {
        alert(e.message || "Failed to load question");
        navigate("/admin/questions/list");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, navigate]);

  // ---------------- Validation ----------------
  const errors = useMemo(() => {
    const e = {};
    if (!String(form.question_text || "").trim()) e.question_text = "Question is required.";
    const ak = String(form.answer_key || "").toUpperCase();
    if (!["A", "B", "C", "D"].includes(ak)) e.answer_key = "Answer key must be A/B/C/D.";
    const hasAnyChoice = Object.values(form.choices || {}).some((v) => String(v || "").trim());
    if (!hasAnyChoice) e.choices = "At least one choice should be filled.";
    return e;
  }, [form]);

  // ---------------- Save (PUT) ----------------
  async function handleSubmit(e) {
    e.preventDefault();
    if (Object.keys(errors).length) {
      alert("Please fix form errors first.");
      return;
    }
    setSaving(true);
    try {
      const normalized = {
        ...form,
        choice_images: a4(form.choice_images),
        explanations: a4(form.explanations),
      };
      const payload = buildQuestionPayload(normalized);
      if (!payload.legacy_id) payload.legacy_id = null;

      const res = await fetch(`${FN_BASE}/questions?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`${res.status} ${data.error || "Update failed"}`);

      alert("✅ Question updated");
      if (data?.status) updateField("status", data.status);
    } catch (err) {
      alert("❌ Failed to update: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------------- Quick status ----------------
  async function quickSetStatus(newStatus) {
    if (!confirm(`Set status to "${newStatus}"?`)) return;
    try {
      const res = await fetch(`${FN_BASE}/questions?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({
          ...buildQuestionPayload({ ...form, status: newStatus }),
          category_slugs: [],
          category_path: [],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "status update failed");
      updateField("status", newStatus);
      alert(`OK → ${newStatus}`);
    } catch (e) {
      alert(e.message || "status update failed");
    }
  }

  // ---------------- Hard delete ----------------
  async function hardDelete() {
    if (form.status !== "archived") {
      return alert('Hard delete hanya untuk status "archived". Set ke archived dahulu.');
    }
    if (!confirm("Hard delete this question? This is irreversible.")) return;
    try {
      const res = await fetch(`${FN_BASE}/questions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "delete failed");
      alert("🗑️ Deleted");
      navigate("/admin/questions/list");
    } catch (e) {
      alert(e.message || "delete failed");
    }
  }

  const payloadJSON = JSON.stringify(
    buildQuestionPayload({
      ...form,
      choice_images: a4(form.choice_images),
      explanations: a4(form.explanations),
    }),
    null,
    2
  );

  if (loading) {
    return <div className="p-6 max-w-7xl mx-auto"><div className="animate-pulse text-gray-500">Loading question…</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Question</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ID: <code>{id}</code></span>
          <span className="text-xs text-gray-500">FN_BASE <code>{FN_BASE}</code></span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => quickSetStatus("draft")} className="px-3 py-2 rounded bg-slate-500 text-white">Set Draft</button>
        <button onClick={() => quickSetStatus("published")} className="px-3 py-2 rounded bg-green-600 text-white">Publish</button>
        <button onClick={() => quickSetStatus("archived")} className="px-3 py-2 rounded bg-amber-600 text-white">Archive</button>
        <button
          onClick={hardDelete}
          disabled={form.status !== "archived"}
          className={`px-3 py-2 rounded text-white ${form.status !== "archived" ? "bg-red-300" : "bg-red-700 hover:bg-red-800"}`}
        >
          Hard Delete
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {["parse", "form", "preview"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 -mb-px border-b-2 ${tab === t ? "border-blue-600 font-semibold" : "border-transparent"}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Parse */}
      {tab === "parse" && (
        <RawInputParser
          onParsed={(parsed) => {
            const next = { ...form, ...parsed };
            if (Array.isArray(parsed?.choice_images)) next.choice_images = a4(parsed.choice_images);
            if (Array.isArray(parsed?.explanations)) next.explanations = a4(parsed.explanations);
            setForm(next);
            setTab("form");
          }}
        />
      )}

      {/* Form */}
      {tab === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium">Question</label>
              <textarea
                value={form.question_text}
                onChange={(e) => updateField("question_text", e.target.value)}
                className={`w-full border rounded p-2 ${errors.question_text ? "border-red-500" : ""}`}
              />
              {errors.question_text && <p className="text-xs text-red-600">{errors.question_text}</p>}
              <ImageUploader label="Question Image" value={form.question_image_url} onChange={(url) => updateField("question_image_url", url)} />
            </div>

            {/* Choices */}
            {["A", "B", "C", "D"].map((L, i) => (
              <div key={L} className="border rounded p-3 space-y-2">
                <label className="block text-sm font-medium">Choice {L}</label>
                <input type="text" value={form.choices[L]} onChange={(e) => updateChoice(L, e.target.value)} className={`w-full border rounded p-2 ${errors.choices ? "border-red-500" : ""}`} />
                <ImageUploader label={`Image for ${L}`} value={form.choice_images[i]} onChange={(url) => updateChoiceImage(i, url)} />
                <textarea placeholder="Explanation" value={form.explanations[i]} onChange={(e) => updateExplanation(i, e.target.value)} className="w-full border rounded p-2 text-sm" />
              </div>
            ))}
            {errors.choices && <p className="text-xs text-red-600">{errors.choices}</p>}

            {/* Answer Key */}
            <div>
              <label className="block text-sm font-medium">Correct Answer</label>
              <select value={form.answer_key} onChange={(e) => updateField("answer_key", e.target.value)} className="border rounded p-2">
                {["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Difficulty + Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)} className="border rounded p-2">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Source</label>
                <input type="text" value={form.source} onChange={(e) => updateField("source", e.target.value)} className="w-full border rounded p-2" />
              </div>
            </div>

            {/* Aircraft */}
            <div>
              <label className="block text-sm font-medium">Aircraft</label>
              <input type="text" value={form.aircraft} onChange={(e) => updateField("aircraft", e.target.value)} className="w-full border rounded p-2" placeholder="e.g. A320" />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium">Tags (comma separated)</label>
              <input type="text" value={form.tags.join(",")} onChange={(e) => updateField("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} className="w-full border rounded p-2" />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className="border rounded p-2">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPayload(true)} className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">Preview Payload</button>
              <button type="submit" disabled={saving} className={`px-4 py-2 rounded text-white ${saving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* RIGHT: Category Manager */}
          <div className="lg:sticky lg:top-4 h-max">
            <CategoryManagerPanel
              value={form.category}
              onChange={(label) => updateField("category", label)}
              subValue={form.subcategory}
              onSubChange={(label) => updateField("subcategory", label)}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {tab === "preview" && <QuestionPreview question={form} />}

      {/* Payload Modal */}
      {showPayload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4">
            <h2 className="text-lg font-semibold mb-2">Payload JSON</h2>
            <pre className="bg-gray-100 p-2 rounded max-h-96 overflow-auto text-xs">{payloadJSON}</pre>
            <div className="flex justify-end mt-3">
              <button onClick={() => setShowPayload(false)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
