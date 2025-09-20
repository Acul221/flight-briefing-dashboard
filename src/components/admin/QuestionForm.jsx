import { useEffect, useMemo, useState } from "react";
import { useCategoriesFlat } from "@/hooks/useCategories";
import useSubmitQuestion from "@/hooks/useSubmitQuestion"; // pastikan file hook dari step sebelumnya sudah ada

export default function QuestionForm({ initial, onSubmit }) {
  const isEdit = !!initial?.id;

  // ==== BASIC FIELDS ====
  const [question_text, setQ] = useState(initial?.question_text || "");
  const [choices, setChoices] = useState(() => {
    const c = initial?.choices || {};
    return { A: c.A || "", B: c.B || "", C: c.C || "", D: c.D || "" };
  });
  const [answer_key, setAnswer] = useState(initial?.answer_key || "A");

  // Single explanation (legacy) + per-choice explanations (new, optional)
  const [explanation, setExpl] = useState(initial?.explanation || "");
  const [usePerChoiceExpl, setUsePerChoiceExpl] = useState(
    Array.isArray(initial?.explanations) && initial.explanations.length === 4
  );
  const [explanations, setExplanations] = useState(() => {
    const ex = initial?.explanations;
    return Array.isArray(ex) && ex.length === 4 ? ex : ["", "", "", ""];
  });

  const [difficulty, setDiff] = useState(initial?.difficulty || "");
  const [status, setStatus] = useState(initial?.status || "draft");
  const [category_ids, setCategoryIds] = useState(initial?.category_ids || []);

  // ==== EXTRA META (optional but recommended for Notion pipeline) ====
  const [tagsCsv, setTagsCsv] = useState(
    Array.isArray(initial?.tags) ? initial.tags.join(",") : ""
  );
  const [aircraftCsv, setAircraftCsv] = useState(
    typeof initial?.aircraft === "string" ? initial.aircraft : ""
  );
  const [source, setSource] = useState(initial?.source || "");
  const [questionImageUrl, setQuestionImageUrl] = useState(
    initial?.question_image_url || ""
  );
  const [choiceImageUrls, setChoiceImageUrls] = useState(() => {
    const imgs = initial?.choice_images;
    return Array.isArray(imgs) && imgs.length === 4 ? imgs : ["", "", "", ""];
    });

  // Inline NEW categories (auto-create via submit-question)
  const [parentCategoryLabel, setParentCategoryLabel] = useState("");
  const [childCategoryLabel, setChildCategoryLabel] = useState("");

  // Optional code/ID human readable (akan jadi Title di Notion jika diisi)
  const [code, setCode] = useState("");

  // ==== CATEGORIES (existing picker) ====
  const { items: cats } = useCategoriesFlat();
  const categories = useMemo(() => cats, [cats]);

  // For UX: if user memilih existing categories, tetap disimpan untuk flow lama
  // Kalau user isi parent/child label baru, akan dipakai saat “Save & Sync to Notion”.

  useEffect(() => {
    if (initial) {
      setQ(initial.question_text || "");
      const c = initial.choices || {};
      setChoices({ A: c.A || "", B: c.B || "", C: c.C || "", D: c.D || "" });
      setAnswer(initial.answer_key || "A");
      setExpl(initial.explanation || "");
      setUsePerChoiceExpl(Array.isArray(initial?.explanations) && initial.explanations.length === 4);
      setExplanations(
        Array.isArray(initial?.explanations) && initial.explanations.length === 4
          ? initial.explanations
          : ["", "", "", ""]
      );
      setDiff(initial.difficulty || "");
      setStatus(initial.status || "draft");
      setCategoryIds(initial.category_ids || []);
      setQuestionImageUrl(initial.question_image_url || "");
      const ci = initial.choice_images;
      setChoiceImageUrls(Array.isArray(ci) && ci.length === 4 ? ci : ["", "", "", ""]);
      setTagsCsv(Array.isArray(initial?.tags) ? initial.tags.join(",") : "");
      setAircraftCsv(typeof initial?.aircraft === "string" ? initial.aircraft : "");
      setSource(initial?.source || "");
    }
  }, [initial?.id]);

  function validateBasic() {
    if (!question_text.trim()) return "Question text required";
    for (const k of ["A", "B", "C", "D"]) {
      if (!choices[k] || !String(choices[k]).trim())
        return `Choice ${k} required`;
    }
    if (!["A", "B", "C", "D"].includes(answer_key))
      return "Answer must be A/B/C/D";
    return null;
  }

  async function handleSubmitDB(e) {
    e.preventDefault();
    const err = validateBasic();
    if (err) {
      alert(err);
      return;
    }

    // Map per-choice explanations (optional) → single explanation legacy (untuk flow lama)
    let explanationToSend = explanation;
    if (usePerChoiceExpl) {
      const idx = { A: 0, B: 1, C: 2, D: 3 }[answer_key];
      explanationToSend = explanations[idx] || explanation;
    }

    await onSubmit({
      question_text,
      choices,
      answer_key,
      explanation: explanationToSend,
      // kirim difficulty kosong sebagai null agar schema valid
      difficulty: difficulty || null,
      status,
      category_ids, // junction update di backend
      question_image_url: questionImageUrl || null,
      choice_images: choiceImageUrls.map((x) => (x?.trim() ? x.trim() : null)),
      source: source || null,
      tags: tagsCsv
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      aircraft: aircraftCsv || null,
    });
  }

  // ==== NOTION SUBMIT ====
  const { submit: submitToNotion, loading, error, lastResult } = useSubmitQuestion();

  async function handleSubmitNotion(e) {
    e.preventDefault();
    const err = validateBasic();
    if (err) {
      alert(err);
      return;
    }

    // Build choices array in order
    const choicesArr = [choices.A, choices.B, choices.C, choices.D];

    // Explanations array (4) — jika user tidak mengisi per-choice, taruh di jawaban benar
    let explanationsArr = explanations;
    if (!usePerChoiceExpl) {
      const idx = { A: 0, B: 1, C: 2, D: 3 }[answer_key];
      const base = ["", "", "", ""];
      base[idx] = explanation || "";
      explanationsArr = base;
    }

    const payload = {
      code: code?.trim() || undefined,
      question: question_text,
      choices: choicesArr,
      correctIndex: { A: 0, B: 1, C: 2, D: 3 }[answer_key],
      explanations: explanationsArr,
      level: difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : "Easy",
      tags: tagsCsv
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      aircraft: aircraftCsv || undefined,
      source: source || undefined,
      status,
      questionImage: questionImageUrl || undefined,
      choiceImages: choiceImageUrls.map((x) => (x?.trim() ? x.trim() : null)),
      // Inline NEW category labels (auto-create by function).
      category: {
        parent: parentCategoryLabel?.trim() || // prioritas label baru
                // fallback: cari label dari selected category_ids yang parent
                categories.find(c => category_ids.includes(c.id) && !c.parent_id)?.label ||
                "general",
        child: childCategoryLabel?.trim() ||
               // fallback: label dari selected yang child (ambil salah satu)
               (categories.find(c => category_ids.includes(c.id) && c.parent_id)?.label || undefined),
      },
      // Saat edit (jika ada), bisa kirim legacy_id (Notion page id); disiapkan bila kamu simpan di `initial.legacy_id`
      legacy_id: initial?.legacy_id || undefined,
    };

    try {
      const res = await submitToNotion(payload);
      if (res?.success) {
        alert("Saved & synced to Notion ✅");
      }
    } catch (e2) {
      // error already set
    }
  }

  const setChoice = (k, val) =>
    setChoices((prev) => ({ ...prev, [k]: val }));
  const setChoiceImg = (i, val) =>
    setChoiceImageUrls((arr) => arr.map((v, idx) => (idx === i ? val : v)));
  const setExplPerChoice = (i, val) =>
    setExplanations((arr) => arr.map((v, idx) => (idx === i ? val : v)));

  return (
    <form className="space-y-4" onSubmit={handleSubmitDB}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm">Code (optional)</label>
          <input className="input input-bordered w-full" value={code} onChange={(e)=>setCode(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Difficulty</label>
          <select className="select select-bordered w-full" value={difficulty} onChange={(e)=>setDiff(e.target.value)}>
            <option value="">(none)</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Status</label>
          <select className="select select-bordered w-full" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="text-sm">Question</label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={question_text}
          onChange={(e)=>setQ(e.target.value)}
          rows={4}
        />
      </div>

      {/* Question Image */}
      <div>
        <label className="text-sm">Question Image URL (optional)</label>
        <input
          className="input input-bordered w-full"
          value={questionImageUrl}
          onChange={(e)=>setQuestionImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {["A","B","C","D"].map((k, idx) => (
          <div key={k} className="p-3 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="answer"
                    className="radio"
                    checked={answer_key === k}
                    onChange={()=>setAnswer(k)}
                  />
                  <span className="label-text text-sm">Correct</span>
                </label>
              </div>
              <div className="flex-1">
                <label className="text-sm">Choice {k}</label>
                <input
                  className="input input-bordered w-full"
                  value={choices[k]}
                  onChange={(e)=> setChoice(k, e.target.value)}
                />
              </div>
            </div>

            {/* Per-choice explanation (optional) */}
            {usePerChoiceExpl && (
              <div className="mt-2">
                <label className="text-xs">Explanation {k} (optional)</label>
                <input
                  className="input input-bordered w-full"
                  value={explanations[idx]}
                  onChange={(e)=>setExplPerChoice(idx, e.target.value)}
                />
              </div>
            )}

            <div className="mt-2">
              <label className="text-xs">Choice {k} Image URL (optional)</label>
              <input
                className="input input-bordered w-full"
                value={choiceImageUrls[idx]}
                onChange={(e)=>setChoiceImg(idx, e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Single explanation (legacy) OR toggle per-choice */}
      <div className="p-3 rounded-xl border">
        <div className="flex items-center justify-between">
          <label className="text-sm">Explanation (single)</label>
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-xs">Use per-choice explanations</span>
            <input
              type="checkbox"
              className="toggle"
              checked={usePerChoiceExpl}
              onChange={()=>setUsePerChoiceExpl(v => !v)}
            />
          </label>
        </div>
        {!usePerChoiceExpl && (
          <textarea
            className="textarea textarea-bordered w-full"
            value={explanation}
            onChange={(e)=>setExpl(e.target.value)}
            rows={3}
            placeholder="Will be attached to the correct answer"
          />
        )}
      </div>

      {/* Tags / Aircraft / Source */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm">Tags (comma)</label>
          <input
            className="input input-bordered w-full"
            value={tagsCsv}
            onChange={(e)=>setTagsCsv(e.target.value)}
            placeholder="atpl,human-performance"
          />
        </div>
        <div>
          <label className="text-sm">Aircraft (comma)</label>
          <input
            className="input input-bordered w-full"
            value={aircraftCsv}
            onChange={(e)=>setAircraftCsv(e.target.value)}
            placeholder="A320,A330"
          />
        </div>
        <div>
          <label className="text-sm">Source</label>
          <input
            className="input input-bordered w-full"
            value={source}
            onChange={(e)=>setSource(e.target.value)}
            placeholder="ATPL 040 / FCOM 1.27.10"
          />
        </div>
      </div>

      {/* Existing categories (DB flow) */}
      <div>
        <label className="text-sm">Categories (existing)</label>
        <select
          className="select select-bordered w-full"
          multiple
          value={category_ids}
          onChange={(e) => {
            const vals = Array.from(e.target.selectedOptions).map(o => o.value);
            setCategoryIds(vals);
          }}
          size={Math.min(8, Math.max(3, categories.length))}
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.label}{c.parent_id ? " (sub)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          (Untuk flow “DB only”. Untuk auto-create kategori, gunakan field di bawah.)
        </p>
      </div>

      {/* Inline NEW category (Notion flow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border">
        <div>
          <label className="text-sm">Parent Category (new)</label>
          <input
            className="input input-bordered w-full"
            value={parentCategoryLabel}
            onChange={(e)=>setParentCategoryLabel(e.target.value)}
            placeholder="e.g., ATPL"
          />
        </div>
        <div>
          <label className="text-sm">Subcategory (new, optional)</label>
          <input
            className="input input-bordered w-full"
            value={childCategoryLabel}
            onChange={(e)=>setChildCategoryLabel(e.target.value)}
            placeholder="e.g., Human Factors"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={handleSubmitDB}>
          {isEdit ? "Update (DB only)" : "Create (DB only)"}
        </button>

        <button type="button" className="btn" onClick={handleSubmitNotion} disabled={loading}>
          {loading ? "Saving & Syncing…" : "Save & Sync to Notion"}
        </button>

        {error && <span className="text-red-600 text-sm">Error: {error.message}</span>}
        {lastResult?.success && (
          <span className="text-green-600 text-sm">Synced. Page: {lastResult.legacy_id}</span>
        )}
      </div>
    </form>
  );
}
// helper fetch GET dgn bearer supabase (dipakai hooks/*)