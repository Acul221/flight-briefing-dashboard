// src/components/admin/QuestionFormLayout.jsx
// Sprint 1 admin update: normalization helpers + simulated publish flow.
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadImage } from "@/utils/uploadImage";
import { buildNormalizedQuestion, validateNormalizedQuestion } from "@/lib/questionNormalization";

export default function QuestionFormLayout({
  form = {},
  onChange = () => {},
  onSubmit = () => {},
  categoriesTree = [],              // intentionally unused (legacy tree disabled)
  saving = false,
  requiresAircraft = false,    // fallback flag dari parent (opsional)
  onNormalizedChange,
}) {
  /* ---------- helpers ---------- */
  const ensureLen4 = (arrLike, filler = "") => {
    const a = Array.isArray(arrLike) ? arrLike.slice(0, 4) : [];
    while (a.length < 4) a.push(filler);
    return a;
  };

  /* ---------- categories (stubbed; tree disabled in V3) ---------- */
  const mustAircraft = requiresAircraft;

  /* ---------- local arrays (stabil per render) ---------- */
  const answers = ensureLen4(form.answers, "");
  const explanations = ensureLen4(form.explanations, "");
  const choiceImages = ensureLen4(form.choice_images, null);

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
      onChange("question_image", publicUrl);
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
      onChange("choice_images", next);
      setUpMsg(`Choice ${String.fromCharCode(65 + i)} image uploaded`);
    } catch (e) {
      setUpMsg(`Upload failed: ${e.message || e}`);
    }
  };

  const normalizedQuestion = useMemo(
    () => buildNormalizedQuestion({ ...form, requires_aircraft: mustAircraft }),
    [form, mustAircraft]
  );
  const validation = useMemo(
    () => validateNormalizedQuestion(normalizedQuestion),
    [normalizedQuestion]
  );
  const validationErrors = validation.errors || {};

  useEffect(() => {
    onNormalizedChange?.(normalizedQuestion, validation);
  }, [normalizedQuestion, validation, onNormalizedChange]);

  const disabled = saving || !validation.valid;

  /* ---------- render ---------- */
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(normalizedQuestion);
      }}
    >
      {upMsg && <div className="alert alert-info">{upMsg}</div>}

      {/* Category & SubCategory (tree disabled in V3; free text only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Category (sluggable)</label>
          <input
            className={`input input-bordered w-full ${validationErrors.category ? "border-error focus:border-error" : ""}`}
            placeholder="e.g., airframe"
            value={form.category || ""}
            onChange={(e) => onChange("category", e.target.value)}
            aria-invalid={validationErrors.category ? "true" : "false"}
            aria-describedby={validationErrors.category ? "category-error" : undefined}
          />
          {validationErrors.category && (
            <p id="category-error" className="mt-1 text-sm text-error">
              {validationErrors.category}
            </p>
          )}
          <p className="text-xs text-base-content/70 mt-1">
            Category tree is disabled in Quiz V3; importer will create slugs from these values.
          </p>
        </div>

        <div>
          <label className="label">SubCategory (optional, sluggable)</label>
          <input
            className="input input-bordered w-full"
            placeholder="e.g., hydraulics"
            value={form.subcategory || ""}
            onChange={(e) => onChange("subcategory", e.target.value)}
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="label">Question</label>
        <textarea
          className={`textarea textarea-bordered w-full ${
            validationErrors.question ? "border-error focus:border-error" : ""
          }`}
          rows={4}
          value={form.question || ""}
          onChange={(e) => onChange("question", e.target.value)}
          aria-invalid={validationErrors.question ? "true" : "false"}
          aria-describedby={validationErrors.question ? "question-error" : undefined}
        />
        {validationErrors.question && (
          <p id="question-error" className="mt-1 text-sm text-error">
            {validationErrors.question}
          </p>
        )}
      </div>

      {/* Question Image uploader */}
      <div className="grid grid-cols-1 gap-2">
        <label className="label">Question Image (optional)</label>
        {form.question_image ? (
          <div className="mb-2">
            <img
              src={form.question_image}
              alt="question"
              className="max-h-40 rounded border"
            />
            <button
              type="button"
              className="btn btn-xs mt-2"
              onClick={() => onChange("question_image", "")}
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
          const choiceError = validationErrors[`choices.${i}`];
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
                    aria-invalid={validationErrors.correctIndex ? "true" : "false"}
                  />
                  Correct
                </label>
              </div>

              <input
                className={`input input-bordered w-full ${
                  choiceError ? "border-error focus:border-error" : ""
                }`}
                placeholder={`Answer ${L}`}
                value={answers[i] || ""}
                onChange={(e) => setArrayItem("answers", i, e.target.value)}
                aria-invalid={choiceError ? "true" : "false"}
                aria-describedby={choiceError ? `choice-${i}-error` : undefined}
              />
              {choiceError && (
                <p id={`choice-${i}-error`} className="mt-1 text-sm text-error">
                  {choiceError}
                </p>
              )}

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
        {validationErrors.correctIndex && (
          <p className="text-sm text-error">{validationErrors.correctIndex}</p>
        )}
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
          <label className="label">
            Aircraft {mustAircraft ? "(required)" : "(optional)"}
          </label>
          <input
            className={`input input-bordered w-full ${
              validationErrors.aircraft ? "border-error focus:border-error" : ""
            }`}
            placeholder="A320"
            value={form.aircraft || ""}
            onChange={(e) => onChange("aircraft", e.target.value)}
            aria-invalid={validationErrors.aircraft ? "true" : "false"}
            aria-describedby={validationErrors.aircraft ? "aircraft-error" : undefined}
          />
          {validationErrors.aircraft && (
            <p id="aircraft-error" className="mt-1 text-sm text-error">
              {validationErrors.aircraft}
            </p>
          )}
        </div>
      </div>

      {!validation.valid && (
        <div className="alert alert-warning text-sm" role="alert">
          Fix {Object.keys(validationErrors).length} required field
          {Object.keys(validationErrors).length === 1 ? "" : "s"} before publishing.
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className={`btn btn-success w-full ${disabled ? "btn-disabled" : ""}`}
      >
        {saving ? "Saving..." : "Save Question"}
      </button>
    </form>
  );
}
