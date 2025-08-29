import { useRef, useState, useEffect } from "react";
import { warmup, getWorker, recognizePSM } from "../../lib/tessCdnWorker";
import roiConfig from "../../config/roiConfig";

// Crop relatif
function cropRel(img, { x, y, w, h }, scale = 1.0, offset = { dx: 0, dy: 0 }) {
  const c = document.createElement("canvas");
  const cw = Math.max(1, Math.floor(img.naturalWidth * w * scale));
  const ch = Math.max(1, Math.floor(img.naturalHeight * h * scale));
  const sx = Math.max(0, Math.floor(img.naturalWidth * (x + offset.dx)));
  const sy = Math.max(0, Math.floor(img.naturalHeight * (y + offset.dy)));
  const sw = Math.floor(img.naturalWidth * w);
  const sh = Math.floor(img.naturalHeight * h);

  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

  return c.toDataURL("image/png");
}

// Score teks berdasarkan keyword
function scoreText(text) {
  if (!text) return 0;
  const keywords = ["DEP", "ARR", "STD", "STA", "BLOCK", "AIR", "LDG", "TKOF"];
  const S = text.toUpperCase();
  return keywords.reduce((acc, k) => acc + (S.includes(k) ? 1 : 0), 0);
}

// OCR dengan auto-adjust
async function bestOCR(img, roi, psm = 6) {
  const scales = [1.0, 1.1, 1.2];
  const offsets = [
    { dx: 0, dy: 0 },
    { dx: -0.01, dy: 0 },
    { dx: 0.01, dy: 0 },
    { dx: 0, dy: -0.01 },
    { dx: 0, dy: 0.01 },
  ];

  let best = { text: "", score: -1 };
  for (const s of scales) {
    for (const o of offsets) {
      try {
        const roiImg = cropRel(img, roi, s, o);
        const text = await recognizePSM(roiImg, psm, {
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
        });
        const sc = scoreText(text) + text.length * 0.01;
        if (sc > best.score) best = { text, score: sc };
      } catch (err) {
        console.warn("ROI OCR failed:", err);
      }
    }
  }
  return best.text.trim();
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
        console.log("📷 Image loaded:", f.name);
        const t0 = performance.now();

        try {
          // Loop semua ROI dari config
          const parts = {};
          for (const [key, roi] of Object.entries(roiConfig)) {
            parts[key] = await bestOCR(img, roi, 6);
          }

          let raw = Object.values(parts).filter(Boolean).join("\n");

          // fallback: full OCR kalau hasil terlalu pendek
          if (raw.length < 40) {
            console.log("⚠️ ROI result weak → running full OCR fallback…");
            raw = await recognizePSM(img.src, 6);
          }

          console.log("📄 RAW OCR TEXT:\n", raw);
          setDebug(raw.slice(0, 1000));

          if (onFileSelected) {
            onFileSelected(f, raw);
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
