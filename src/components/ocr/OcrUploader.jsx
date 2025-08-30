import { useRef, useState, useEffect } from "react";
import { warmup, getWorker, recognizePSM } from "../../lib/tessCdnWorker";
import { useROIStore } from "../../store/useROIStore";

function cropRel(img, roi, scale = 1.0) {
  const { x, y, w, h, angle = 0, pad = 0 } = roi;

  const cw = Math.max(1, Math.floor(img.naturalWidth * (w + pad * 2) * scale));
  const ch = Math.max(1, Math.floor(img.naturalHeight * (h + pad * 2) * scale));
  const sx = Math.floor(img.naturalWidth * (x - pad));
  const sy = Math.floor(img.naturalHeight * (y - pad));
  const sw = Math.floor(img.naturalWidth * (w + pad * 2));
  const sh = Math.floor(img.naturalHeight * (h + pad * 2));

  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true });

  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(img, sx, sy, sw, sh, -cw / 2, -ch / 2, cw, ch);
  ctx.restore();

  return c.toDataURL("image/png");
}

async function bestOCR(img, roi, psm = 6) {
  const roiImg = cropRel(img, roi);
  const text = await recognizePSM(roiImg, psm, {
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
  });
  return text.trim();
}

export default function OcrUploader({ onFileSelected }) {
  const fileRef = useRef(null);
  const [imgURL, setImgURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [roiPreviews, setRoiPreviews] = useState({});
  const roiConfig = useROIStore((s) => s.roiConfig);

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
    setRoiPreviews({});

    try {
      await getWorker();
      const img = new Image();
      img.onload = async () => {
        console.log("📷 Image loaded:", f.name);
        const t0 = performance.now();

        const parts = {};
        const previews = {};

        for (const [key, roi] of Object.entries(roiConfig)) {
          const roiImg = cropRel(img, roi);
          previews[key] = roiImg;
          parts[key] = await bestOCR(img, roi, 6);
        }

        setRoiPreviews(previews);

        let raw = Object.values(parts).filter(Boolean).join("\n");
        if (raw.length < 40) {
          console.log("⚠️ ROI weak → running full OCR fallback…");
          raw = await recognizePSM(img.src, 6);
        }

        console.log("📄 RAW OCR TEXT:\n", raw);
        setDebug(raw.slice(0, 1000));

        if (onFileSelected) {
          onFileSelected(f, raw);
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
      <div className="flex items-center justify-between mb-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={loading}
          onChange={handleFile}
          className="block w-full text-sm border p-2 rounded"
        />
        <label className="ml-3 flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug Mode
        </label>
      </div>

      {imgURL && (
        <div className="relative mb-3">
          <img src={imgURL} alt="preview" className="rounded" />
          {debugMode &&
            Object.entries(roiConfig).map(([key, roi]) => (
              <div
                key={key}
                className="absolute border-2 border-red-500 opacity-50"
                style={{
                  left: `${roi.x * 100}%`,
                  top: `${roi.y * 100}%`,
                  width: `${roi.w * 100}%`,
                  height: `${roi.h * 100}%`,
                  transform: `rotate(${roi.angle || 0}deg)`,
                  transformOrigin: "top left",
                }}
                title={roi.label}
              />
            ))}
        </div>
      )}

      {loading && <div className="text-sm animate-pulse">Running OCR…</div>}

      {debug && (
        <pre className="text-[10px] bg-gray-50 p-2 rounded border overflow-auto max-h-40 whitespace-pre-wrap">
          {debug}
        </pre>
      )}
    </div>
  );
}
