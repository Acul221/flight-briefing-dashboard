import React, { useState } from "react";
import { CATEGORIES } from "../constants/categories";
import RawTextImporter from "../components/quiz/RawTextImporter";

export default function QuizEditorMaster() {
  const [formData, setFormData] = useState({
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

  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // === Import dari RawTextImporter ===
  const importFromRaw = (q) => {
    const get = (L) =>
      q.choices.find((c) => c.label === L) || {
        text: "",
        explanation: "",
        isCorrect: false,
        image: "",
      };
    const A = get("A"),
      B = get("B"),
      C = get("C"),
      D = get("D");

    setFormData((prev) => ({
      ...prev,
      id: q.id || prev.id,
      question: q.question || prev.question,
      questionImage: q.questionImage || prev.questionImage,
      choices: [A.text, B.text, C.text, D.text],
      choiceImages: [A.image, B.image, C.image, D.image],
      explanations: [A.explanation, B.explanation, C.explanation, D.explanation],
      correctIndex: [A, B, C, D].findIndex((x) => x.isCorrect),
      tags: (q.tags || []).join(", "),
      level: q.level || prev.level,
      source: q.source || prev.source,
      category: q.category || prev.category,
      aircraft: q.aircraft || prev.aircraft,
    }));

    setShowPreview(true);
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
    const updatedExp = [...formData.explanations];
    updatedExp[index] = value;
    setFormData((prev) => ({ ...prev, explanations: updatedExp }));
  };

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
      {/* Importer Raw Text */}
      <RawTextImporter onImport={importFromRaw} />

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

          {/* Question Image */}
          <input
            type="url"
            placeholder="Question Image URL (optional)"
            value={formData.questionImage}
            onChange={(e) => handleChange("questionImage", e.target.value)}
            className="w-full p-2 border rounded"
          />

          {/* Choices */}
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
              <input
                type="url"
                placeholder={`Image URL for ${label} (optional)`}
                value={formData.choiceImages[i]}
                onChange={(e) => handleChoiceImageChange(i, e.target.value)}
                className="w-full p-2 border rounded"
              />
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

          {/* Tags */}
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            className="w-full p-2 border rounded"
          />

          {/* Source */}
          <input
            type="text"
            placeholder="Source"
            value={formData.source}
            onChange={(e) => handleChange("source", e.target.value)}
            className="w-full p-2 border rounded"
          />

          {/* Level */}
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
          <p>
            <strong>ID:</strong> {formData.id}
          </p>
          <p>
            <strong>Question:</strong> {formData.question}
          </p>
          {formData.questionImage && (
            <img
              src={formData.questionImage}
              alt="Question"
              className="max-h-60 rounded mb-4 border"
            />
          )}
          {formData.choices.map((choice, i) => (
            <div key={i} className="mb-1">
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
          <p>
            <strong>Aircraft:</strong> {formData.aircraft}
          </p>
          <p>
            <strong>Category:</strong> {formData.category}
          </p>
          <p>
            <strong>Tags:</strong> {formData.tags}
          </p>
          <p>
            <strong>Level:</strong> {formData.level}
          </p>
          <p>
            <strong>Source:</strong> {formData.source}
          </p>

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
