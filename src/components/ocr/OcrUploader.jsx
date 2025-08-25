import { useRef, useState, useEffect } from "react";
import { warmup, getWorker, recognizePSM } from "../../lib/tessCdnWorker";
import { normalizeText } from "../../lib/normalizeText";

function preprocessImage(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const im = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < im.data.length; i += 4) {
    const g = 0.299 * im.data[i] + 0.587 * im.data[i + 1] + 0.114 * im.data[i + 2];
    const v = g > 180 ? 255 : 0;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
  }
  ctx.putImageData(im, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function OcrUploader({ onFileSelected }) {
  const fileRef = useRef(null);
  const [imgURL, setImgURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");

  useEffect(() => {
    warmup();
  }, []);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgURL(url);
    setDebug("");
    setLoading(true);

    try {
      await getWorker();
      const img = new Image();
      img.onload = async () => {
        console.log("📷 Image loaded, preprocessing & OCR…", f.name);
        const t0 = performance.now();

        try {
          const processed = preprocessImage(img);

          let fullText = await recognizePSM(processed, 6, {
            tessedit_char_whitelist:
              "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
          });

          fullText = normalizeText(fullText);

          console.log("📄 FULL OCR TEXT (normalized):", fullText.slice(0, 500));
          setDebug(fullText.slice(0, 1000));

          if (onFileSelected) {
            onFileSelected(f, fullText);
          }
        } catch (err) {
          console.error("❌ OCR failed:", err);
        }

        console.log(`⏱️ OCR total: ${(performance.now() - t0).toFixed(0)} ms`);
        setLoading(false);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error("❌ OCR error:", err);
      setLoading(false);
      alert("OCR error: " + (err?.message || err));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 rounded-2xl bg-white shadow">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={loading}
        onChange={handleFile}
        className="block w-full text-sm border p-2 rounded mb-3"
      />

      {imgURL && <img src={imgURL} alt="preview" className="rounded mb-3" />}
      {loading && <div className="text-sm animate-pulse">Running OCR…</div>}

      {debug && (
        <pre className="text-[10px] bg-gray-50 p-2 rounded border overflow-auto max-h-40 whitespace-pre-wrap">
          {debug}
        </pre>
      )}
    </div>
  );
}
