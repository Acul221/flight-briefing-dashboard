// src/pages/admin/QuestionEditorPage.jsx
import React, { useMemo, useState } from "react";
import RawInputParser from "@/components/admin/RawInputParser";
import ImageUploader from "@/components/admin/ImageUploader";
import QuestionPreview from "@/components/admin/QuestionPreview";
import CategoryManagerPanel from "@/components/admin/CategoryManagerPanel";
import { buildQuestionPayload } from "@/utils/buildQuestionPayload";

const FN_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

// helper kecil: normalize array 4
const a4 = (arr) => {
  if (!Array.isArray(arr)) return [null, null, null, null];
  return [...arr, null, null, null].slice(0, 4);
};

export default function QuestionEditorPage() {
  const [tab, setTab] = useState("form");
  const [showPayload, setShowPayload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // NOTE: simpan LABEL untuk category/subcategory; slug akan dibuat saat build payload
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
    category: "",     // LABEL
    subcategory: "",  // LABEL
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

  // Validasi ringan
  const errors = useMemo(() => {
    const e = {};
    if (!String(form.question_text || "").trim()) e.question_text = "Question is required.";
    const ak = String(form.answer_key || "").toUpperCase();
    if (!["A", "B", "C", "D"].includes(ak)) e.answer_key = "Answer key must be A/B/C/D.";
    const hasAnyChoice = Object.values(form.choices || {}).some((v) => String(v || "").trim());
    if (!hasAnyChoice) e.choices = "At least one choice should be filled.";
    return e;
  }, [form]);

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (Object.keys(errors).length) {
      alert("Please fix form errors first.");
      return;
    }
    setSubmitting(true);
    try {
      // pastikan array 4 untuk image & explanations
      const normalized = {
        ...form,
        choice_images: a4(form.choice_images),
        explanations: a4(form.explanations),
      };

      // build payload → otomatis buat category_slugs & category_path dari LABEL yang dipilih
      const payload = buildQuestionPayload(normalized);
      // (opsional) tambah legacy guard kalau kosong
      if (!payload.legacy_id) payload.legacy_id = null;

      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `${FN_BASE}/questions?id=${form.id}` : `${FN_BASE}/questions`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`${res.status} ${data.error || "Submit failed"}`);

      alert("✅ Question saved successfully");
      if (data?.id) setForm((prev) => ({ ...prev, id: data.id }));
    } catch (err) {
      alert("❌ Failed to save question: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const payloadJSON = JSON.stringify(buildQuestionPayload({
    ...form,
    choice_images: a4(form.choice_images),
    explanations: a4(form.explanations),
  }), null, 2);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Question Editor</h1>
        <span className="text-xs text-gray-500">
          FN_BASE <code>{FN_BASE}</code>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {["parse", "form", "preview"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 -mb-px border-b-2 ${
              tab === t ? "border-blue-600 font-semibold" : "border-transparent"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Parse (autofill) */}
      {tab === "parse" && (
        <RawInputParser
          onParsed={(parsed) => {
            // parser boleh mengembalikan choices array/object; kita normalkan
            const next = { ...form, ...parsed };
            if (Array.isArray(parsed?.choice_images)) next.choice_images = a4(parsed.choice_images);
            if (Array.isArray(parsed?.explanations)) next.explanations = a4(parsed.explanations);
            setForm(next);
            setTab("form");
          }}
        />
      )}

      {/* Form + Category Manager (kanan) */}
      {tab === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT: FORM */}
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
              <ImageUploader
                label="Question Image"
                value={form.question_image_url}
                onChange={(url) => updateField("question_image_url", url)}
              />
            </div>

            {/* Choices A-D */}
            {["A", "B", "C", "D"].map((L, i) => (
              <div key={L} className="border rounded p-3 space-y-2">
                <label className="block text-sm font-medium">Choice {L}</label>
                <input
                  type="text"
                  value={form.choices[L]}
                  onChange={(e) => updateChoice(L, e.target.value)}
                  className={`w-full border rounded p-2 ${errors.choices ? "border-red-500" : ""}`}
                />
                <ImageUploader
                  label={`Image for ${L}`}
                  value={form.choice_images[i]}
                  onChange={(url) => updateChoiceImage(i, url)}
                />
                <textarea
                  placeholder="Explanation"
                  value={form.explanations[i]}
                  onChange={(e) => updateExplanation(i, e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            ))}
            {errors.choices && <p className="text-xs text-red-600">{errors.choices}</p>}

            {/* Answer key */}
            <div>
              <label className="block text-sm font-medium">Correct Answer</label>
              <select
                value={form.answer_key}
                onChange={(e) => updateField("answer_key", e.target.value)}
                className="border rounded p-2"
              >
                {["A", "B", "C", "D"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Difficulty + Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="border rounded p-2"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Source</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            {/* Aircraft */}
            <div>
              <label className="block text-sm font-medium">Aircraft</label>
              <input
                type="text"
                value={form.aircraft}
                onChange={(e) => updateField("aircraft", e.target.value)}
                className="w-full border rounded p-2"
                placeholder="e.g. A320"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags.join(",")}
                onChange={(e) =>
                  updateField(
                    "tags",
                    e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                  )
                }
                className="w-full border rounded p-2"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="border rounded p-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPayload(true)}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
              >
                Preview Payload
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded text-white ${
                  submitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>

          {/* RIGHT: Category Manager (sticky) */}
          <div className="lg:sticky lg:top-4 h-max">
            <CategoryManagerPanel
              value={form.category}                 // LABEL in state
              onChange={(label) => updateField("category", label)}
              subValue={form.subcategory}           // LABEL in state
              onSubChange={(label) => updateField("subcategory", label)}
            />

            {/* ringkas: info pilihan sekarang */}
            <div className="mt-3 text-xs text-gray-600 border rounded p-2 bg-white">
              <div>Selected Category: <b>{form.category || "-"}</b></div>
              <div>Selected SubCategory: <b>{form.subcategory || "-"}</b></div>
              {(form.category || form.subcategory) && (
                <button
                  type="button"
                  onClick={() => { updateField("category",""); updateField("subcategory",""); }}
                  className="mt-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {tab === "preview" && <QuestionPreview question={form} />}

      {/* Modal payload */}
      {showPayload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-4">
            <h2 className="text-lg font-semibold mb-2">Payload JSON</h2>
            <pre className="bg-gray-100 p-2 rounded max-h-96 overflow-auto text-xs">
              {payloadJSON}
            </pre>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => setShowPayload(false)}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
