// src/pages/QuizEditorMaster.jsx
import React, { useState } from "react";
import { CATEGORIES } from "../constants/categories";
import RawTextImporter from "../components/quiz/RawTextImporter";
import { uploadImage } from "../lib/uploadImage"; // <-- helper Supabase

export default function QuizEditorMaster() {
  const [formData, setFormData] = useState({
    id: "",
    question: "",
    questionImage: "",                // URL
    choices: ["", "", "", ""],
    choiceImages: ["", "", "", ""],   // URL per pilihan
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

  // state kecil untuk indikator upload per field
  const [isUploadingQuestionImg, setIsUploadingQuestionImg] = useState(false);
  const [isUploadingChoiceImg, setIsUploadingChoiceImg] = useState([false, false, false, false]);

  // ======== Import dari RawTextImporter (auto-fill) ========
  const importFromRaw = (q) => {
    const get = (L) =>
      q.choices.find((c) => c.label === L) || {
        text: "",
        explanation: "",
        isCorrect: false,
        image: "",
      };

    const A = get("A"), B = get("B"), C = get("C"), D = get("D");

    setFormData((prev) => ({
      ...prev,
      id: q.id || prev.id,
      question: q.question || prev.question,
      questionImage: q.questionImage || prev.questionImage || "",
      choices: [A.text, B.text, C.text, D.text],
      choiceImages: [A.image || "", B.image || "", C.image || "", D.image || ""],
      explanations: [A.explanation, B.explanation, C.explanation, D.explanation],
      correctIndex:
        [A, B, C, D].findIndex((x) => x.isCorrect) >= 0
          ? [A, B, C, D].findIndex((x) => x.isCorrect)
          : prev.correctIndex,
      tags: (q.tags || []).join(", "),
      level: q.level || prev.level,
      source: q.source || prev.source,
      category: q.category || prev.category,
      aircraft: q.aircraft || prev.aircraft,
    }));

    setShowPreview(true);
  };

  // ======== Helpers ========
  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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
    const updated = [...formData.explanations];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, explanations: updated }));
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

  // ======== Upload Handlers ========
  const uploadQuestionImage = async (file) => {
    try {
      setIsUploadingQuestionImg(true);
      const url = await uploadImage(file, "questions"); // folder "questions"
      handleChange("questionImage", url);
    } catch (e) {
      console.error(e);
      alert("Upload question image failed.");
    } finally {
      setIsUploadingQuestionImg(false);
    }
  };

  const uploadChoiceImage = async (i, file) => {
    try {
      const flags = [...isUploadingChoiceImg];
      flags[i] = true;
      setIsUploadingChoiceImg(flags);

      const url = await uploadImage(file, "choices"); // folder "choices"
      handleChoiceImageChange(i, url);
    } catch (e) {
      console.error(e);
      alert(`Upload image for choice ${String.fromCharCode(65 + i)} failed.`);
    } finally {
      const flags2 = [...isUploadingChoiceImg];
      flags2[i] = false;
      setIsUploadingChoiceImg(flags2);
    }
  };

  // ======== Submit to Notion ========
  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentCategory = CATEGORIES.find(
      (cat) => cat.value === formData.category
    );
    const aircraftRequired = currentCategory?.requiresAircraft;

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

    const submissionData = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t),
    };

    try {
      const response = await fetch("/.netlify/functions/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Submission error:", err);
        alert(`Submission failed.\n${err?.error || ""}`);
        return;
      }
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Submission failed (network).");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Raw Importer */}
      <RawTextImporter onImport={importFromRaw} />

      {/* Form */}
      {!showSuccess ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowPreview(true);
          }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold">Add Quiz Question</h2>

          {/* ID */}
          <input
            type="text"
            placeholder="ID"
            value={formData.id}
            onChange={(e) => handleChange("id", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          {/* Question */}
          <textarea
            placeholder="Question"
            value={formData.question}
            onChange={(e) => handleChange("question", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          {/* Question Image: file upload + url (opsional manual) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Question Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadQuestionImage(e.target.files[0])}
            />
            {isUploadingQuestionImg && (
              <p className="text-xs italic text-gray-500">Uploading...</p>
            )}
            <input
              type="url"
              placeholder="Question Image URL (optional)"
              value={formData.questionImage}
              onChange={(e) => handleChange("questionImage", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Choices */}
          {["A", "B", "C", "D"].map((label, i) => (
            <div key={i} className="space-y-2 border rounded p-3">
              <label className="block font-semibold">Choice {label}</label>

              <input
                type="text"
                value={formData.choices[i]}
                onChange={(e) => handleChoiceChange(i, e.target.value)}
                className="w-full p-2 border rounded"
                required
              />

              {/* Choice Image Upload + URL */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadChoiceImage(i, e.target.files[0])}
                  />
                  {isUploadingChoiceImg[i] && (
                    <span className="text-xs italic text-gray-500">Uploading...</span>
                  )}
                </div>

                <input
                  type="url"
                  placeholder={`Image URL for ${label} (optional)`}
                  value={formData.choiceImages[i]}
                  onChange={(e) => handleChoiceImageChange(i, e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

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
                className="w-full p-2 border rounded"
              />
            </div>
          ))}

          {/* Aircraft */}
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

          {/* Category */}
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

          {/* Tags / Source / Level */}
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

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Preview
          </button>
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

      {/* Preview */}
      {showPreview && !showSuccess && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>

          <p><strong>ID:</strong> {formData.id}</p>
          <p><strong>Question:</strong> {formData.question}</p>

          {formData.questionImage && (
            <img
              src={formData.questionImage}
              alt="Question"
              className="max-h-60 rounded mb-4 border"
            />
          )}

          {formData.choices.map((choice, i) => (
            <div key={i} className="mb-3">
              <strong>{String.fromCharCode(65 + i)}.</strong> {choice}
              {formData.choiceImages[i] && (
                <img
                  src={formData.choiceImages[i]}
                  alt={`Choice ${String.fromCharCode(65 + i)}`}
                  className="max-h-32 rounded my-2 border"
                />
              )}
              {formData.correctIndex === i && (
                <span className="ml-2 text-green-600 dark:text-green-400 italic">
                  (Correct Answer)
                </span>
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

          <button
            onClick={handleSubmit}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit to Master DB
          </button>
        </div>
      )}
    </div>
  );
}
