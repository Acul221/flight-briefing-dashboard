// src/admin/QuestionFormFull.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // bukan default
import useSubmitQuestion from "../hooks/useSubmitQuestion";

// --- Helper: ambil kategori dari API function (kalau public), fallback ke Supabase query dengan RLS public read ---
async function fetchCategoryTreeViaFunction() {
  const res = await fetch("/.netlify/functions/categories-tree");
  if (!res.ok) throw new Error(`fn_${res.status}`);
  const json = await res.json();
  return Array.isArray(json.items) ? json.items : [];
}

async function fetchCategoryTreeViaSupabase() {
  // Ambil semua, lalu bentuk tree di client
  const { data, error } = await supabase.from("categories")
    .select("id, label, slug, parent_id, requires_aircraft, pro_only, order_index, is_active")
    .order("order_index", { ascending: true });
  if (error) throw error;
  const byParent = new Map();
  data.forEach((row) => {
    const key = row.parent_id || "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push({ ...row, children: [] });
  });
  const attach = (node) => {
    node.children = byParent.get(node.id) || [];
    node.children.forEach(attach);
    return node;
  };
  const roots = byParent.get("__root__") || [];
  roots.forEach(attach);
  return roots;
}

async function fetchCategoryTreeSmart() {
  try {
    return await fetchCategoryTreeViaFunction();
  } catch {
    return await fetchCategoryTreeViaSupabase();
  }
}

function flattenTree(nodes, parent = null) {
  const out = [];
  nodes.forEach((n) => {
    out.push({ ...n, parent });
    if (n.children?.length) out.push(...flattenTree(n.children, n));
  });
  return out;
}

function ChoiceField({ label, value, onChange, imgValue, onImgChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <label className="md:col-span-1 label">
        <span className="label-text font-semibold">{label}</span>
      </label>
      <div className="md:col-span-7">
        <input
          className="input input-bordered w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Teks pilihan ${label}`}
        />
      </div>
      <div className="md:col-span-4">
        <input
          className="input input-bordered w-full"
          value={imgValue || ""}
          onChange={(e) => onImgChange(e.target.value)}
          placeholder={`URL gambar ${label} (opsional)`}
        />
      </div>
    </div>
  );
}

function ExplanationField({ label, value, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <label className="md:col-span-1 label">
        <span className="label-text">{label}</span>
      </label>
      <div className="md:col-span-11">
        <textarea
          className="textarea textarea-bordered w-full"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Penjelasan ${label} (opsional)`}
        />
      </div>
    </div>
  );
}

export default function QuestionFormFull({ initial = null, onSaved }) {
  const { call } = useSubmitQuestion();

  // ---- Form state
  const [form, setForm] = useState(() => ({
    legacy_id: initial?.legacy_id || null,
    question: initial?.question_text || "",
    choiceA: initial?.choices?.A || "",
    choiceB: initial?.choices?.B || "",
    choiceC: initial?.choices?.C || "",
    choiceD: initial?.choices?.D || "",
    correctIndex: ["A", "B", "C", "D"].indexOf(initial?.answer_key || "A"),
    explA: initial?.explanations?.[0] || "",
    explB: initial?.explanations?.[1] || "",
    explC: initial?.explanations?.[2] || "",
    explD: initial?.explanations?.[3] || "",
    difficulty: initial?.difficulty || "easy",
    status: initial?.status || "draft",
    tags: initial?.tags || [],
    aircraft: initial?.aircraft ? String(initial.aircraft).split(",").filter(Boolean) : [],
    questionImageUrl: initial?.question_image_url || "",
    choiceImgA: initial?.choice_images?.[0] || "",
    choiceImgB: initial?.choice_images?.[1] || "",
    choiceImgC: initial?.choice_images?.[2] || "",
    choiceImgD: initial?.choice_images?.[3] || "",
  }));

  // ---- Categories
  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState(() => {
    const ids = initial?.category_ids || [];
    return Array.isArray(ids) ? ids : [];
  });

  const parents = useMemo(() => flat.filter((n) => !n.parent_id), [flat]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const nodes = await fetchCategoryTreeSmart();
        if (!mounted) return;
        setTree(nodes);
        setFlat(flattenTree(nodes));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => (mounted = false);
  }, []);

  // ---- UI helpers
  const isUpdating = Boolean(form.legacy_id);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [warns, setWarns] = useState([]);
  const [wouldCreate, setWouldCreate] = useState([]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const toggleCategory = (id) => {
    setSelectedCatIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const validate = () => {
    const issues = [];
    const choices = [form.choiceA, form.choiceB, form.choiceC, form.choiceD];
    if (choices.filter((c) => (c || "").trim()).length < 2) issues.push("Minimal 2 pilihan terisi");
    if (form.correctIndex < 0 || form.correctIndex > 3) issues.push("Correct index harus 0..3");
    if (!(form.question || "").trim()) issues.push("Pertanyaan tidak boleh kosong");
    return issues;
  };

  const doDryRun = async () => {
    const issues = validate();
    if (issues.length) {
      setMsg({ type: "error", text: issues.join(", ") });
      return;
    }
    setBusy(true);
    setMsg(null);
    setWarns([]);
    setWouldCreate([]);
    try {
      const res = await call(form, selectedCatIds, { dry: true, mirror: false });
      setMsg({ type: "success", text: "Dry-run OK. Tidak ada side-effect." });
      setWarns(res.warnings || []);
      setWouldCreate(res.wouldCreate || []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Dry-run gagal" });
    } finally {
      setBusy(false);
    }
  };

  const doSubmit = async () => {
    const issues = validate();
    if (issues.length) {
      setMsg({ type: "error", text: issues.join(", ") });
      return;
    }
    setBusy(true);
    setMsg(null);
    setWarns([]);
    setWouldCreate([]);
    try {
      const res = await call(form, selectedCatIds);
      setField("legacy_id", res.legacy_id);
      setMsg({ type: "success", text: isUpdating ? "Updated to Notion + DB." : "Created in Notion + DB." });
      setWarns(res.warnings || []);
      setWouldCreate(res.wouldCreate || []);
      onSaved && onSaved(res);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Submit gagal" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {isUpdating ? "Edit Question (Notion-linked)" : "Create Question (Notion-linked)"}
        </h1>
        <p className="text-sm opacity-70">
          Authoring dua-arah: UI → Notion → mirror ke Supabase. Kategori multi (parent & child) didukung via IDs.
        </p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"} mb-4`}>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Question */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text font-semibold">Pertanyaan</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          value={form.question}
          onChange={(e) => setField("question", e.target.value)}
          placeholder="Tulis pertanyaan di sini…"
        />
      </div>

      {/* Question image */}
      <div className="form-control mb-6">
        <label className="label">
          <span className="label-text">Question Image URL (opsional)</span>
        </label>
        <input
          className="input input-bordered w-full"
          value={form.questionImageUrl}
          onChange={(e) => setField("questionImageUrl", e.target.value)}
          placeholder="https://... (atau kosongkan)"
        />
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-4">
        <ChoiceField
          label="A"
          value={form.choiceA}
          onChange={(v) => setField("choiceA", v)}
          imgValue={form.choiceImgA}
          onImgChange={(v) => setField("choiceImgA", v)}
        />
        <ChoiceField
          label="B"
          value={form.choiceB}
          onChange={(v) => setField("choiceB", v)}
          imgValue={form.choiceImgB}
          onImgChange={(v) => setField("choiceImgB", v)}
        />
        <ChoiceField
          label="C"
          value={form.choiceC}
          onChange={(v) => setField("choiceC", v)}
          imgValue={form.choiceImgC}
          onImgChange={(v) => setField("choiceImgC", v)}
        />
        <ChoiceField
          label="D"
          value={form.choiceD}
          onChange={(v) => setField("choiceD", v)}
          imgValue={form.choiceImgD}
          onImgChange={(v) => setField("choiceImgD", v)}
        />
      </div>

      {/* Correct answer */}
      <div className="form-control mb-6">
        <label className="label">
          <span className="label-text font-semibold">Jawaban Benar</span>
        </label>
        <div className="join">
          {["A", "B", "C", "D"].map((L, i) => (
            <button
              key={L}
              className={`btn join-item ${form.correctIndex === i ? "btn-primary" : "btn-ghost"}`}
              onClick={(e) => {
                e.preventDefault();
                setField("correctIndex", i);
              }}
              type="button"
            >
              {L}
            </button>
          ))}
        </div>
      </div>

      {/* Explanations */}
      <div className="space-y-3 mb-6">
        <ExplanationField label="A" value={form.explA} onChange={(v) => setField("explA", v)} />
        <ExplanationField label="B" value={form.explB} onChange={(v) => setField("explB", v)} />
        <ExplanationField label="C" value={form.explC} onChange={(v) => setField("explC", v)} />
        <ExplanationField label="D" value={form.explD} onChange={(v) => setField("explD", v)} />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-3">
          <label className="label">
            <span className="label-text">Difficulty</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={form.difficulty}
            onChange={(e) => setField("difficulty", e.target.value)}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label">
            <span className="label-text">Status</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label">
            <span className="label-text">Tags (comma separated)</span>
          </label>
          <input
            className="input input-bordered w-full"
            value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="ATPL, pitot-static"
          />
        </div>
        <div className="md:col-span-3">
          <label className="label">
            <span className="label-text">Aircraft (comma separated)</span>
          </label>
          <input
            className="input input-bordered w-full"
            value={Array.isArray(form.aircraft) ? form.aircraft.join(", ") : form.aircraft}
            onChange={(e) => setField("aircraft", e.target.value)}
            placeholder="A320, B737"
          />
        </div>
      </div>

      {/* Categories multi-select */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Categories (multi)</div>
          <div className="text-xs opacity-60">Total selected: {selectedCatIds.length}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {useMemo(() => flat.filter((n) => !n.parent_id), [flat]).map((p) => (
            <div key={p.id} className="card bg-base-200">
              <div className="card-body p-4">
                <label className="label cursor-pointer">
                  <span className="label-text font-semibold">{p.label}</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedCatIds.includes(p.id)}
                    onChange={() => toggleCategory(p.id)}
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {flat
                    .filter((c) => c.parent_id === p.id)
                    .map((c) => (
                      <label key={c.id} className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={selectedCatIds.includes(c.id)}
                          onChange={() => toggleCategory(c.id)}
                        />
                        <span className="label-text">{c.label}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost" onClick={doDryRun} disabled={busy} type="button">
          Dry-run
        </button>
        <button
          className={`btn ${isUpdating ? "btn-primary" : "btn-accent"}`}
          onClick={doSubmit}
          disabled={busy}
          type="button"
        >
          {isUpdating ? "Update Notion + DB" : "Create in Notion + DB"}
        </button>
        {busy && <span className="loading loading-spinner loading-sm" />}
        {form.legacy_id && (
          <div className="text-xs opacity-70">
            legacy_id: <code>{form.legacy_id}</code>
          </div>
        )}
      </div>

      {(warns.length > 0 || (wouldCreate?.length || 0) > 0) && (
        <div className="mt-6">
          {warns.length > 0 && (
            <div className="alert alert-warning mb-3">
              <div>
                <div className="font-semibold">Warnings:</div>
                <ul className="list-disc ml-6">
                  {warns.map((w, idx) => (
                    <li key={idx} className="text-sm">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {wouldCreate?.length > 0 && (
            <div className="alert">
              <div>
                <div className="font-semibold">Kategori yang akan dibuat (saat bukan dry-run):</div>
                <ul className="list-disc ml-6">
                  {wouldCreate.map((w, idx) => (
                    <li key={idx} className="text-sm">
                      {w.parentLabel ? `${w.parentLabel} > ${w.label}` : w.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
