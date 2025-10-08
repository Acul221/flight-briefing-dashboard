// src/components/admin/QuestionFormLayout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadImage } from "@/utils/uploadImage";

export default function QuestionFormLayout({
  form,
  onChange,
  onSubmit,
  categoriesTree,              // [{id,label,slug,requires_aircraft,pro_only,children:[...]}]
  saving = false,
  requiresAircraft = false,    // fallback flag dari parent (opsional)
}) {
  /* ---------- helpers ---------- */
  const ensureLen4 = (arrLike, filler = null) => {
    const a = Array.isArray(arrLike) ? arrLike.slice(0, 4) : [];
    while (a.length < 4) a.push(filler);
    return a;
  };

  /* ---------- categories ---------- */
  const parents = useMemo(() => categoriesTree || [], [categoriesTree]);
  const parentNode = useMemo(
    () => parents.find((p) => p.label === (form.category || "")) || null,
    [parents, form.category]
  );
  const children = parentNode?.children || [];
  const childNode = useMemo(
    () => children.find((c) => c.label === (form.subcategory || "")) || null,
    [children, form.subcategory]
  );

  // child > parent > prop fallback
  const mustAircraft =
    (childNode?.requires_aircraft ?? parentNode?.requires_aircraft ?? false) ||
    requiresAircraft;

  useEffect(() => {
    if (parentNode && form.subcategory) {
      const ok = children.some((c) => c.label === form.subcategory);
      if (!ok) onChange("subcategory", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  /* ---------- local arrays (stabil per render) ---------- */
  const answers = ensureLen4(form.answers, "");
  const explanations = ensureLen4(form.explanations, "");
  const choiceImages = ensureLen4(form.choiceImages, null);

  const setArrayItem = (field, idx, val) => {
    const base =
      field === "answers"
        ? answers
        : field === "explanations"
        ? explanations
        : choiceImages;
    const next = base.slice();
    next[idx] = val;
    onChange(field, next);
  };

  /* ---------- upload handling ---------- */
  const [upMsg, setUpMsg] = useState("");
  const qFileRef = useRef(null);

  // Hooks harus top-level: buat 4 refs secara eksplisit
  const cFileRefA = useRef(null);
  const cFileRefB = useRef(null);
  const cFileRefC = useRef(null);
  const cFileRefD = useRef(null);
  const cFileRefs = [cFileRefA, cFileRefB, cFileRefC, cFileRefD];

  const doUploadQuestionImage = async (file) => {
    try {
      setUpMsg("Uploading question image…");
      const { publicUrl } = await uploadImage(file, {
        label: `${form.category || "cat"}-${form.subcategory || "sub"}-question`,
        prefix: "q",
      });
      onChange("questionImage", publicUrl); // builder akan map ke questionImageUrl
      setUpMsg("Question image uploaded");
    } catch (e) {
      setUpMsg(`Upload failed: ${e.message || e}`);
    }
  };

  const doUploadChoiceImage = async (i, file) => {
    try {
      setUpMsg(`Uploading choice ${String.fromCharCode(65 + i)}…`);
      const { publicUrl } = await uploadImage(file, {
        label: `${form.category || "cat"}-${form.subcategory || "sub"}-choice-${String.fromCharCode(65 + i)}`,
        prefix: "q",
      });
      const next = choiceImages.slice();
      next[i] = publicUrl;
      onChange("choiceImages", next);
      setUpMsg(`Choice ${String.fromCharCode(65 + i)} image uploaded`);
    } catch (e) {
      setUpMsg(`Upload failed: ${e.message || e}`);
    }
  };

  const disabled = saving || (mustAircraft && !String(form.aircraft || "").trim());

  /* ---------- render ---------- */
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {upMsg && <div className="alert alert-info">{upMsg}</div>}

      {/* ID (opsional) */}
      <div>
        <label className="label">ID (optional / legacy_id)</label>
        <input
          className="input input-bordered w-full"
          placeholder="e.g., ICAO-ALTIMETER-005"
          value={form.id || ""}
          onChange={(e) => onChange("id", e.target.value)}
        />
      </div>

      {/* Category & SubCategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select
            className="select select-bordered w-full"
            value={form.category || ""}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option value="">— select —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className="input input-bordered w-full mt-2"
            placeholder="Or type new category"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) onChange("category", v);
            }}
          />
        </div>

        <div>
          <label className="label">SubCategory</label>
          <select
            className="select select-bordered w-full"
            value={form.subcategory || ""}
            onChange={(e) => onChange("subcategory", e.target.value)}
            disabled={!parentNode || children.length === 0}
          >
            <option value="">— select —</option>
            {children.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="input input-bordered w-full mt-2"
            placeholder="Or type new subcategory"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) onChange("subcategory", v);
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="label">Question</label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          value={form.question || ""}
          onChange={(e) => onChange("question", e.target.value)}
        />
      </div>

      {/* Question Image uploader */}
      <div className="grid grid-cols-1 gap-2">
        <label className="label">Question Image (optional)</label>
        {form.questionImage ? (
          <div className="mb-2">
            <img
              src={form.questionImage}
              alt="question"
              className="max-h-40 rounded border"
            />
            <button
              type="button"
              className="btn btn-xs mt-2"
              onClick={() => onChange("questionImage", "")}
            >
              Clear
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <input
            ref={qFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="file-input file-input-bordered"
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const f = qFileRef.current?.files?.[0];
              if (f) doUploadQuestionImage(f);
            }}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Answers & Explanations + Choice Images */}
      <div className="grid grid-cols-1 gap-3">
        {[0, 1, 2, 3].map((i) => {
          const L = String.fromCharCode(65 + i);
          return (
            <div key={i} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <label className="label">Answer {L}</label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="correct-answer"
                    className="radio"
                    checked={form.correctIndex === i}
                    onChange={() => onChange("correctIndex", i)}
                  />
                  Correct
                </label>
              </div>

              <input
                className="input input-bordered w-full"
                placeholder={`Answer ${L}`}
                value={answers[i] || ""}
                onChange={(e) => setArrayItem("answers", i, e.target.value)}
              />

              <textarea
                className="textarea textarea-bordered w-full mt-2"
                placeholder={`Explanation ${L}`}
                value={explanations[i] || ""}
                onChange={(e) => setArrayItem("explanations", i, e.target.value)}
              />

              {/* Choice image */}
              <div className="mt-2">
                <label className="label text-sm">Image {L} (optional)</label>
                {choiceImages[i] ? (
                  <div className="mb-2">
                    <img
                      src={choiceImages[i]}
                      alt={`choice ${i}`}
                      className="max-h-28 rounded border"
                    />
                    <button
                      type="button"
                      className="btn btn-xs mt-2"
                      onClick={() => {
                        const next = choiceImages.slice();
                        next[i] = null;
                        onChange("choiceImages", next);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <input
                    ref={cFileRefs[i]}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="file-input file-input-bordered file-input-sm"
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const f = cFileRefs[i].current?.files?.[0];
                      if (f) doUploadChoiceImage(i, f);
                    }}
                  >
                    Upload {L}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Meta (Status + Level + Source) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Status</label>
          <select
            className="select select-bordered w-full"
            value={form.status || "draft"}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="label">Level</label>
          <select
            className="select select-bordered w-full"
            value={form.level || "medium"}
            onChange={(e) => onChange("level", e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="label">Source</label>
          <input
            className="input input-bordered w-full"
            value={form.source || ""}
            onChange={(e) => onChange("source", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Tags (CSV)</label>
          <input
            className="input input-bordered w-full"
            placeholder="atpl, human-factor"
            value={form.tags || ""}
            onChange={(e) => onChange("tags", e.target.value)}
          />
        </div>

        <div>
          <label className="label">
            Aircraft {mustAircraft ? "(required)" : "(optional)"}
          </label>
          <input
            className="input input-bordered w-full"
            placeholder="A320"
            value={form.aircraft || ""}
            onChange={(e) => onChange("aircraft", e.target.value)}
          />
          {mustAircraft && !String(form.aircraft || "").trim() && (
            <div className="mt-2 alert alert-warning text-sm">
              This category requires an Aircraft value.
            </div>
          )}
        </div>
      </div>

      <button className={`btn btn-success w-full ${disabled ? "btn-disabled" : ""}`}>
        {saving ? "Saving..." : "Save Question"}
      </button>
    </form>
  );
}
