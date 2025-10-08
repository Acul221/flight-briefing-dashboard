// src/components/admin/RawInputParser.jsx
import React, { useState } from "react";
import { parseRawQuestion } from "@/utils/parseRawQuestion";

// Contoh format yang didukung parser
const SAMPLE = `ID: ICAO-ALTIMETER-005
Question: When the transition altitude has been established...
Image question: https://example.com/q.png

A: Using QNH at all levels
Image answer A: https://example.com/a.png
Explanation A: Salah karena...

B: Use FL concept...
Image answer B: https://example.com/b.png
Explanation B: ...

C: Using flight level based on standard pressure
Image answer C: https://example.com/c.png
Explanation C: Benar karena...

D: transition altitude
Image answer D: https://example.com/d.png
Explanation D: ...

Level: Medium
Source: ICAO Altimeter Procedures Ch.1
Category: airlaw
SubCategory: ATA21
Tags: icao, altimeter
Correct: C`;

function toEditorShape(parsed) {
  // parsed.choices (array -> object A–D)
  const letters = ["A", "B", "C", "D"];
  const choicesObj = letters.reduce((acc, L, i) => {
    const t = Array.isArray(parsed.choices) ? (parsed.choices[i]?.text || "") : "";
    acc[L] = t;
    return acc;
  }, { A: "", B: "", C: "", D: "" });

  // correctIndex -> answer_key huruf
  const answer_key = parsed.answer_key
    ? String(parsed.answer_key).toUpperCase()
    : letters[parsed.correctIndex ?? 0] || "A";

  // normalisasi arrays tetap 4 elemen
  const choice_images = (parsed.choice_images || []).slice(0, 4);
  while (choice_images.length < 4) choice_images.push(null);

  const explanations = (parsed.explanations || []).slice(0, 4);
  while (explanations.length < 4) explanations.push("");

  // tags array
  const tags = Array.isArray(parsed.tags) ? parsed.tags : [];

  return {
    id: null,
    legacy_id: parsed.id || "",
    question_text: parsed.question || "",
    question_image_url: parsed.question_image_url || "",
    choices: choicesObj,
    choice_images,
    explanations,
    answer_key,
    difficulty: parsed.difficulty || "medium",
    source: parsed.source || "",
    category: parsed.category || "",
    subcategory: parsed.subcategory || "",
    tags,
    status: "draft",
    aircraft: "", // opsional; bisa diisi manual di Form
  };
}

export default function RawInputParser({ onParsed }) {
  const [raw, setRaw] = useState(SAMPLE);
  const [error, setError] = useState("");

  const handleParse = () => {
    try {
      setError("");
      const parsed = parseRawQuestion(raw);
      const patch = toEditorShape(parsed);
      onParsed?.(patch);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to parse text");
    }
  };

  const loadSample = () => setRaw(SAMPLE);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700">
        Paste teks soal dengan format:
        <ul className="list-disc ml-5 mt-1">
          <li><code>ID:</code>, <code>Question:</code>, <code>Image question:</code></li>
          <li>Opsi <code>A:</code>–<code>D:</code>, <code>Image answer A:</code> …</li>
          <li><code>Explanation A:</code> … <code>Explanation D:</code></li>
          <li><code>Correct:</code> / <code>Answer:</code> (A–D)</li>
          <li><code>Level:</code> / <code>Difficulty:</code>, <code>Source:</code></li>
          <li><code>Category:</code>, <code>SubCategory:</code>, <code>Tags:</code></li>
        </ul>
      </div>

      <textarea
        className="w-full border rounded p-2 min-h-[280px] font-mono text-sm"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleParse}
        >
          Parse &amp; Fill Form
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
          onClick={loadSample}
        >
          Load Sample
        </button>
      </div>
    </div>
  );
}
