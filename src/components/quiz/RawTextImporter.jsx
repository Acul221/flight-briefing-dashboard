// src/components/quiz/RawTextImporter.jsx
import { useState, useEffect } from "react";
import { parseRawBatch_v2 } from "../../lib/parseRawQuestion_v2";

export default function RawTextImporter({ onImport }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("quiz_raw_draft");
    if (saved) setText(saved);
  }, []);
  useEffect(() => {
    const id = setTimeout(()=>localStorage.setItem("quiz_raw_draft", text), 400);
    return ()=>clearTimeout(id);
  }, [text]);

  const handleParse = () => {
    setError("");
    try {
      const arr = parseRawBatch_v2(text);
      setPreview(arr);
      if (arr.length === 1 && onImport) onImport(arr[0]); // auto isi form jika 1 soal
    } catch (e) {
      setPreview([]);
      setError(e.message || "Parse error");
    }
  };

  return (
    <div className="rounded-xl border p-4 bg-white/70 dark:bg-gray-900/60">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Paste Raw Text</h3>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border"
          onClick={() => setText(EXAMPLE)}
        >
          Load Template
        </button>
      </div>

      <textarea
        className="w-full h-44 p-3 rounded-lg border"
        placeholder={`Tempel format:\n\nID: ...\nQuestion:\n...\n\nA. ...\n→ ✅ Correct – ...\nB. ...\n→ ❌ Incorrect – ...\n...\n\nTags: ...\nLevel: ...\nSource: ...\n\nGunakan '---' untuk banyak soal.`}
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={handleParse}
          className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black">
          Parse & Preview
        </button>
        <button type="button" onClick={()=>{setText("");setPreview([]);setError("");}}
          className="px-4 py-2 rounded-lg border">
          Clear
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">• {error}</div>}

      {preview.length > 0 && (
        <div className="mt-4 space-y-3">
          {preview.map((q, idx) => (
            <div key={idx} className="border rounded-lg p-3">
              <div className="text-sm opacity-70 mb-1">
                {(q.category || "No category")} • {(q.level)} • {(q.tags||[]).join(", ") || "no tags"}
              </div>
              <div className="font-medium mb-2">{q.question}</div>
              <ul className="text-sm space-y-1">
                {q.choices.map(c=>(
                  <li key={c.label}>
                    <b>{c.label}.</b> {c.text} {c.isCorrect && <span className="ml-2 text-xs px-2 py-0.5 border rounded-full">Correct</span>}
                    {c.explanation && <div className="opacity-70 pl-6">Exp: {c.explanation}</div>}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <button type="button" className="px-3 py-1.5 rounded-lg border"
                  onClick={()=>onImport && onImport(q)}>
                  Send to Form
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EXAMPLE = `ID: FCOM-ENG-FUEL-010
Question:
How does the FADEC achieve thrust regulation based on EPR demand?

A. By adjusting thrust lever detent logic
→ ❌ Incorrect – Thrust lever detents guide pilot input but do not directly regulate thrust.

B. By modulating N2 rotation via accessory gearbox
→ ❌ Incorrect – Accessory gearbox does not control N2 directly.

C. By computing required fuel flow via FMV to maintain target EPR
→ ✅ Correct – FADEC maintains EPR by modulating fuel flow through FMV.

D. By commanding engine starter valve modulation
→ ❌ Incorrect – Starter valve is only active during engine start, not normal thrust regulation.

Tags: FADEC, EPR, thrust control
Level: Medium
Source: FCOM DSC-70-45 P 3/6`;
