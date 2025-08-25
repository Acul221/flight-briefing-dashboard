// src/pages/QuizEditorMaster.jsx
import React, { useMemo, useState } from "react";
import { CATEGORIES } from "../constants/categories";
import RawTextImporter from "../components/quiz/RawTextImporter"; // importer siap pakai

function isValidHttpUrl(value) {
  if (!value) return true; // kosong = boleh
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function QuizEditorMaster() {
  const [formData, setFormData] = useState({
    id: "",
    question: "",
    questionImage: "",                // NEW
    choices: ["", "", "", ""],
    choiceImages: ["", "", "", ""],   // NEW
    correctIndex: null,
    explanations: ["", "", "", ""],
    tags: "",
    level: "",
    source: "",
    category: "",
    aircraft: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- Auto-isi dari parser (RawTextImporter) ---
  const importFromRaw = (q) => {
    const get = (L) =>
      q.choices.find((c) => c.label === L) || {
        text: "",
        explanation: "",
        isCorrect: false,
        image: "",
      };
    const A = get("A"), B = get("B"), C = get("C"), D = get("D");

    const choices = [A.text, B.text, C.text, D.text];
    const explanations = [A.explanation, B.explanation, C.explanation, D.explanation];
    const choiceImages = [A.image || "", B.image || "", C.image || "", D.image || ""];
    const correctIndex = [A, B, C, D].findIndex((x) => x.isCorrect);

    setFormData((prev) => ({
      ...prev,
      id: q.id || prev.id,
      question: q.question || prev.question,
      questionImage: q.questionImage || prev.questionImage || "",
      choices,
      choiceImages,
      explanations,
      correctIndex: correctIndex >= 0 ? correctIndex : prev.correctIndex,
      tags: (q.tags || []).join(", "),
      level: q.level || prev.level,
      source: q.source || prev.source,
      category: q.category || prev.category,
      aircraft: q.aircraft || prev.aircraft,
    }));

    setShowPreview(true); // tampilkan preview otomatis
  };

  const resetForm = () => {
    setFormData({
      id: "",
      question: "",
      questionImage: "",
      choices: ["", "", "", ""],
      choiceImages: ["", "", "", ""],
      correctIndex: null,
      explanations: ["", "", "", ""],
      tags: "",
      level: "",
      source: "",
      category: "",
      aircraft: "",
    });
    setShowPreview(false);
    setShowSuccess(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChoiceChange = (index, value) => {
    const updated = [...formData.choices];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, choices: updated }));
  };

  const handleChoiceImageChange = (index, value) => {
    const updated = [...formData.choiceImages];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, choiceImages: updated }));
  };

  const handleExplanationChange = (index, value) => {
    const updatedExp = [...formData.explanations];
    updatedExp[index] = value;
    setFormData((prev) => ({ ...prev, explanations: updatedExp }));
  };

  const currentCategory = useMemo(
    () => CATEGORIES.find((cat) => cat.value === formData.category),
    [formData.category]
  );
  const aircraftRequired = currentCategory?.requiresAircraft;

  const imageUrlErrors = useMemo(() => {
    const questionOk = isValidHttpUrl(formData.questionImage);
    const choiceOk = formData.choiceImages.map(isValidHttpUrl);
    return { question: !questionOk, choices: choiceOk.map((ok) => !ok) };
  }, [formData.questionImage, formData.choiceImages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi minimal
    if (
      !formData.id ||
      !formData.question ||
      formData.choices.some((c) => !c) ||
      formData.correctIndex === null ||
      (aircraftRequired && !formData.aircraft)
    ) {
      alert("Please complete all required fields.");
      return;
    }
    // Validasi URL gambar (jika diisi)
    if (imageUrlErrors.question || imageUrlErrors.choices.some(Boolean)) {
      alert("One or more image URLs are invalid. Please use http(s) URLs.");
      return;
    }

    // Siapkan payload
    const submissionData = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t),
    };

    const response = await fetch("/.netlify/functions/submit-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });

    if (response.ok) {
      setShowSuccess(true);
    } else {
      alert("Submission failed.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* ===== Paste Raw Text Mode ===== */}
      <RawTextImporter onImport={importFromRaw} />

      {/* ===== Form Manual ===== */}
      {!showSuccess ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowPreview(true);
          }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold">Add Quiz Question</h2>

          <input
            type="text"
            placeholder="ID"
            value={formData.id}
            onChange={(e) => handleChange("id", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          <textarea
            placeholder="Question"
            value={formData.question}
            onChange={(e) => handleChange("question", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          {/* NEW: Question Image URL + preview */}
          <div className="space-y-2">
            <input
              type="url"
              placeholder="Question Image URL (optional)"
              value={formData.questionImage}
              onChange={(e) => handleChange("questionImage", e.target.value)}
              className={`w-full p-2 border rounded ${imageUrlErrors.question ? "border-red-500" : ""}`}
            />
            {imageUrlErrors.question && (
              <p className="text-xs text-red-600">Invalid URL. Use http(s) only.</p>
            )}
            {formData.questionImage && isValidHttpUrl(formData.questionImage) && (
              <img
                src={formData.questionImage}
                alt="Question"
                className="max-h-44 rounded border"
                loading="lazy"
              />
            )}
          </div>

          {["A", "B", "C", "D"].map((label, i) => (
            <div key={i} className="space-y-1">
              <label className="block font-semibold">Choice {label}</label>

              <input
                type="text"
                value={formData.choices[i]}
                onChange={(e) => handleChoiceChange(i, e.target.value)}
                className="w-full p-2 border rounded"
                required
              />

              {/* NEW: Image URL per choice + preview */}
              <input
                type="url"
                placeholder={`Image URL for ${label} (optional)`}
                value={formData.choiceImages[i] || ""}
                onChange={(e) => handleChoiceImageChange(i, e.target.value)}
                className={`w-full p-2 border rounded ${imageUrlErrors.choices[i] ? "border-red-500" : ""}`}
              />
              {imageUrlErrors.choices[i] && (
                <p className="text-xs text-red-600">Invalid URL. Use http(s) only.</p>
              )}
              {formData.choiceImages[i] && isValidHttpUrl(formData.choiceImages[i]) && (
                <img
                  src={formData.choiceImages[i]}
                  alt={`Choice ${label}`}
                  className="max-h-32 rounded border"
                  loading="lazy"
                />
              )}

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={formData.correctIndex === i}
                  onChange={() => handleChange("correctIndex", i)}
                />
                Mark as correct
              </label>

              <textarea
                placeholder="Explanation"
                value={formData.explanations[i]}
                onChange={(e) => handleExplanationChange(i, e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </div>
          ))}

          <select
            value={formData.aircraft}
            onChange={(e) => handleChange("aircraft", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Aircraft --</option>
            <option value="a320">A320</option>
            <option value="a330">A330</option>
            <option value="b737">B737</option>
          </select>

          <select
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Category --</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Source"
            value={formData.source}
            onChange={(e) => handleChange("source", e.target.value)}
            className="w-full p-2 border rounded"
          />

          <select
            value={formData.level}
            onChange={(e) => handleChange("level", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Difficulty --</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Preview
            </button>
            {showPreview && (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit to Master DB
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
            Question submitted successfully!
          </h3>
          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create New Question
          </button>
        </div>
      )}

      {/* PREVIEW (read-only), termasuk gambar */}
      {showPreview && !showSuccess && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>

          <p><strong>ID:</strong> {formData.id}</p>
          <p><strong>Question:</strong> {formData.question}</p>

          {formData.questionImage && isValidHttpUrl(formData.questionImage) && (
            <div className="mb-3">
              <img
                src={formData.questionImage}
                alt="Question"
                className="max-h-44 rounded border"
              />
            </div>
          )}

          {formData.choices.map((choice, i) => (
            <div key={i} className="mb-3">
              <strong>{String.fromCharCode(65 + i)}.</strong> {choice}
              {formData.correctIndex === i && (
                <span className="ml-2 text-green-600 dark:text-green-400 italic">
                  (Correct Answer)
                </span>
              )}
              {formData.choiceImages[i] && isValidHttpUrl(formData.choiceImages[i]) && (
                <div className="mt-1">
                  <img
                    src={formData.choiceImages[i]}
                    alt={`Choice ${String.fromCharCode(65 + i)}`}
                    className="max-h-32 rounded border"
                  />
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-300 italic">
                {formData.explanations[i]}
              </div>
            </div>
          ))}

          <p><strong>Aircraft:</strong> {formData.aircraft}</p>
          <p><strong>Category:</strong> {formData.category}</p>
          <p><strong>Tags:</strong> {formData.tags}</p>
          <p><strong>Level:</strong> {formData.level}</p>
          <p><strong>Source:</strong> {formData.source}</p>
        </div>
      )}
    </div>
  );
}
