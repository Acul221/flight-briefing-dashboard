// src/components/admin/QuestionEditor.jsx

import React, { useMemo, useState } from "react";

import QuestionCard from "@/components/quiz/QuestionCard";

/**

 * Admin Question Editor (Quick + Advanced + Live Preview)

 *

 * Quick mode: question + 4 choices + correct radio + category + access tier + publish button

 * Advanced mode: shows extra fields (placeholder: explanations, tags)

 *

 * Validation rules:

 * - question non-empty

 * - 4 choices non-empty

 * - correctIndex !== null

 * - category non-empty

 *

 * This component is intentionally self-contained and uses Tailwind classes to match project styling.

 */

const emptyChoices = () => ["", "", "", ""];

// Normalize local form state to the fields QuestionCard expects (camelCase for images)

function normalizeForPreview({ id, questionText, choices, correctIndex, category, accessTier, extra }) {

  return {

    id: id || `preview-${Math.random().toString(36).slice(2, 9)}`,

    question: questionText || "",

    choices: choices || emptyChoices(),

    correctIndex: Number.isInteger(correctIndex) ? correctIndex : 0,

    tags: extra?.tags || [],

    difficulty: extra?.difficulty || null,

    category_slugs: category ? [category] : [],

    explanations: extra?.explanations || ["", "", "", ""],

    questionImage: null,

    choiceImages: [null, null, null, null],

    access_tier: accessTier,

  };

}

export default function QuestionEditor() {

  const [mode, setMode] = useState("quick"); // quick | advanced

  const [questionText, setQuestionText] = useState("");

  const [choices, setChoices] = useState(emptyChoices());

  const [correctIndex, setCorrectIndex] = useState(null);

  const [category, setCategory] = useState("");

  const [accessTier, setAccessTier] = useState("free"); // free | pro

  const [extra, setExtra] = useState({ explanations: ["", "", "", ""], tags: [] });

  const [previewSize, setPreviewSize] = useState("desktop"); // desktop | mobile

  const [showPublishModal, setShowPublishModal] = useState(false);

  const validation = useMemo(() => {

    const errors = [];

    if (!questionText.trim()) errors.push("Question must not be empty");

    const emptyChoiceIdx = choices.findIndex((c) => !String(c || "").trim());

    if (emptyChoiceIdx !== -1) errors.push(`Choice ${emptyChoiceIdx + 1} is empty`);

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3)

      errors.push("Correct answer must be selected");

    if (!category) errors.push("Category must be selected");

    return { ok: errors.length === 0, errors };

  }, [questionText, choices, correctIndex, category]);

  const normalizedQuestion = useMemo(

    () =>

      normalizeForPreview({

        questionText,

        choices,

        correctIndex,

        category,

        accessTier,

        extra,

      }),

    [questionText, choices, correctIndex, category, accessTier, extra]

  );

  function updateChoice(idx, val) {

    setChoices((prev) => {

      const copy = [...prev];

      copy[idx] = val;

      return copy;

    });

  }

  function handlePublishClick(e) {

    e.preventDefault();

    if (!validation.ok) {
      setShowPublishModal(true);
      return;
    }
    setShowPublishModal(false);
    // For now: just console.log payload. In real implementation: call API.
    const payload = {
      question: questionText,

      choices,

      correctIndex,

      category_slugs: category ? [category] : [],

      access_tier: accessTier,

      tags: extra?.tags || [],

      explanations: extra?.explanations || ["", "", "", ""],

    };

    // eslint-disable-next-line no-console

    console.log("Publishing question:", payload);

    alert("Published (mock). Check console for payload.");

  }

  return (

    <div className="max-w-6xl mx-auto p-4">

      <div className="mb-4 flex items-center justify-between">

        <h2 className="text-xl font-semibold">Question Editor</h2>

        <div className="flex items-center gap-2 text-sm">

          <button

            type="button"

            onClick={() => setMode("quick")}

            className={`px-3 py-1 rounded ${mode === "quick" ? "bg-slate-900 text-white" : "bg-white border"}`}

          >

            Quick

          </button>

          <button

            type="button"

            onClick={() => setMode("advanced")}

            className={`px-3 py-1 rounded ${mode === "advanced" ? "bg-slate-900 text-white" : "bg-white border"}`}

          >

            Advanced

          </button>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left: Form */}

        <form

          onSubmit={(e) => {

            e.preventDefault();

            handlePublishClick(e);

          }}

          className="space-y-4"

        >

          <div>

            <label className="block text-sm font-medium mb-1">Question</label>

            <textarea

              value={questionText}

              onChange={(e) => setQuestionText(e.target.value)}

              className="w-full rounded border px-3 py-2 text-sm"

              rows={4}

              placeholder="Type the question stem..."

              data-testid="input-question"

            />

          </div>

          <div className="grid grid-cols-1 gap-2">

            {[0, 1, 2, 3].map((i) => (

              <div key={i} className="flex items-start gap-2">

                <label className="w-6 pt-2 text-sm">{["A", "B", "C", "D"][i]}</label>

                <input

                  value={choices[i]}

                  onChange={(e) => updateChoice(i, e.target.value)}

                  placeholder={`Choice ${i + 1}`}

                  className="flex-1 rounded border px-3 py-2 text-sm"

                  data-testid={`input-choice-${i}`}

                />

                <label className="flex items-center gap-1 text-sm">

                  <input

                    type="radio"

                    name="correct"

                    checked={correctIndex === i}

                    onChange={() => setCorrectIndex(i)}

                    data-testid={`radio-correct-${i}`}

                  />

                  <span className="text-xs">Correct</span>

                </label>

              </div>

            ))}

          </div>

          <div className="flex items-center gap-3">

            <div className="flex-1">

              <label className="block text-sm font-medium mb-1">Category</label>

              <select

                value={category}

                onChange={(e) => setCategory(e.target.value)}

                className="w-full rounded border px-3 py-2 text-sm"

                data-testid="select-category"

              >

                <option value="">-- select category --</option>

                <option value="systems">systems</option>

                <option value="procedures">procedures</option>

                <option value="abnormal">abnormal</option>

              </select>

            </div>

            <div>

              <label className="block text-sm font-medium mb-1">Access</label>

              <div className="flex items-center gap-2">

                <button

                  type="button"

                  onClick={() => setAccessTier("free")}

                  className={`px-3 py-1 rounded ${accessTier === "free" ? "bg-emerald-600 text-white" : "bg-white border"}`}

                  data-testid="btn-access-free"

                >

                  Free

                </button>

                <button

                  type="button"

                  onClick={() => setAccessTier("pro")}

                  className={`px-3 py-1 rounded ${accessTier === "pro" ? "bg-amber-400 text-white" : "bg-white border"}`}

                  data-testid="btn-access-pro"

                >

                  Pro

                </button>

              </div>

            </div>

          </div>

          {mode === "advanced" && (

            <div className="border rounded p-3 bg-gray-50">

              <div className="mb-2 text-sm font-medium">Advanced fields (optional)</div>

              <label className="block text-xs mb-1">Tags (comma-separated)</label>

              <input

                className="w-full rounded border px-3 py-2 text-sm"

                value={(extra.tags || []).join(",")}

                onChange={(e) => setExtra((s) => ({ ...s, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))}

                placeholder="e.g. a320, systems"

                data-testid="input-tags"

              />

              <label className="block text-xs mt-3 mb-1">Explanations (optional)</label>

              <textarea

                className="w-full rounded border px-3 py-2 text-sm"

                rows={3}

                value={extra.explanations?.[0] || ""}

                onChange={(e) => setExtra((s) => ({ ...s, explanations: [e.target.value, "", "", ""] }))}

                placeholder="Short explanation for the question"

                data-testid="input-explanation"

              />

            </div>

          )}

          <div className="flex items-center justify-between pt-2">

            <div className="text-sm text-slate-600">

              {validation.ok ? (

                <span className="text-emerald-700">All validations passed</span>

              ) : (

                <div>

                  <div className="text-amber-700">Validation issues:</div>

                  <ul className="text-xs list-disc ml-5 text-amber-800">

                    {validation.errors.map((e, idx) => (

                      <li key={idx}>{e}</li>

                    ))}

                  </ul>

                </div>

              )}

            </div>

            <div className="flex items-center gap-2">

              <button

                type="button"

                onClick={() => {

                  // Reset form

                  setQuestionText("");

                  setChoices(emptyChoices());

                  setCorrectIndex(null);

                  setCategory("");

                  setAccessTier("free");

                  setExtra({ explanations: ["", "", "", ""], tags: [] });

                }}

                className="px-3 py-2 border rounded text-sm bg-white"

              >

                Reset

              </button>

              <button
                type="submit"
                aria-disabled={validation.ok ? "false" : "true"}
                className={`px-4 py-2 rounded text-sm ${
                  validation.ok
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-600 cursor-not-allowed"
                }`}
                data-testid="btn-publish"
                onClick={(e) => handlePublishClick(e)}
              >
                Publish
              </button>
            </div>

          </div>

        </form>

        {/* Right: Live Preview */}

        <div className="space-y-3">

          <div className="flex items-center justify-between">

            <div className="text-sm font-medium">Live Preview</div>

            <div className="flex items-center gap-2 text-xs text-slate-500">

              <span>Viewport:</span>

              <div className="inline-flex rounded border overflow-hidden">

                <button

                  type="button"

                  className={`px-2 py-1 ${previewSize === "mobile" ? "bg-slate-900 text-white" : "bg-white"}`}

                  onClick={() => setPreviewSize("mobile")}

                  data-testid="preview-mobile"

                >

                  Mobile

                </button>

                <button

                  type="button"

                  className={`px-2 py-1 ${previewSize === "desktop" ? "bg-slate-900 text-white" : "bg-white"}`}

                  onClick={() => setPreviewSize("desktop")}

                  data-testid="preview-desktop"

                >

                  Desktop

                </button>

              </div>

            </div>

          </div>

          <div

            className={`border rounded p-3 bg-white ${

              previewSize === "mobile" ? "max-w-xs" : "max-w-xl"

            }`}

            data-testid="preview-container"

          >

            <QuestionCard question={normalizedQuestion} index={0} total={4} selected={null} onSelect={() => {}} />

          </div>

        </div>

      </div>

      {/* Publish modal (simple) */}

      {showPublishModal && (

        <div className="fixed inset-0 flex items-center justify-center z-50">

          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPublishModal(false)} />

          <div className="bg-white rounded p-4 z-10 max-w-lg w-full">

            <h3 className="text-lg font-semibold mb-2">Cannot publish - validation errors</h3>

            <ul className="list-disc ml-5 text-sm text-rose-700">

              {validation.errors.map((e, i) => (

                <li key={i}>{e}</li>

              ))}

            </ul>

            <div className="mt-4 text-right">

              <button className="px-3 py-1 rounded bg-slate-200" onClick={() => setShowPublishModal(false)}>

                Close

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

