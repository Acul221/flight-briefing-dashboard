import { useState } from "react";
import Tesseract from "tesseract.js";

export default function OcrTestPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);

    const url = URL.createObjectURL(f);

    const { data: { text } } = await Tesseract.recognize(url, "eng", {
      workerPath: "/tess/worker.min.js",
      corePath: "/tess/tesseract-core.wasm.js",
      langPath: "/tess/lang/",
    });

    setText(text);
    setLoading(false);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-lg font-bold mb-4">🔎 OCR Direct Test</h1>
      <input type="file" accept="image/*" onChange={handleFile} className="block mb-4" />
      {loading && <p>Running OCR…</p>}
      {text && <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">{text}</pre>}
    </div>
  );
}
