import { useRef, useState, useEffect } from "react";
import { warmup, getWorker, recognizePSM } from "../../lib/tessCdnWorker";
import { normalizeText } from "../../lib/normalizeText";

// 🟢 Preprocess image: resize + grayscale + adaptive threshold
function preprocessImage(img, width = 1200) {
  const scale = width / img.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.floor(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // resize
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // get image data
  const im = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0;
  for (let i = 0; i < im.data.length; i += 4) {
    const g =
      0.299 * im.data[i] +
      0.587 * im.data[i + 1] +
      0.114 * im.data[i + 2];
    total += g;
  }
  const avg = total / (im.data.length / 4);

  // adaptive threshold
  for (let i = 0; i < im.data.length; i += 4) {
    const g =
      0.299 * im.data[i] +
      0.587 * im.data[i + 1] +
      0.114 * im.data[i + 2];
    const v = g > avg * 0.9 ? 255 : 0;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
  }
  ctx.putImageData(im, 0, 0);

  return canvas.toDataURL("image/png");
}

// 🟢 Score OCR result based on keyword presence
function scoreText(text) {
  const keywords = ["DEP", "ARR", "BLK", "BLOCK", "LDNG", "TKOF", "AIR", "TIME"];
  const S = text.toUpperCase();
  return keywords.reduce((acc, k) => acc + (S.includes(k) ? 1 : 0), 0);
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
          // Preprocess
          const processed = preprocessImage(img);

          // Run multi-pass OCR
          const text6 = normalizeText(
            await recognizePSM(processed, 6, {
              tessedit_char_whitelist:
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
            })
          );
          const text7 = normalizeText(
            await recognizePSM(processed, 7, {
              tessedit_char_whitelist:
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
            })
          );

          // Pick best between 6 and 7
          let best =
            scoreText(text7) > scoreText(text6)
              ? { text: text7, mode: "PSM 7", score: scoreText(text7) }
              : { text: text6, mode: "PSM 6", score: scoreText(text6) };

          // If too weak → fallback to PSM 11
          if (best.score < 2) {
            console.log("⚠️ Low score on PSM 6/7, running fallback PSM 11…");
            const text11 = normalizeText(
              await recognizePSM(processed, 11, {
                tessedit_char_whitelist:
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/-. \n",
              })
            );
            const score11 = scoreText(text11);
            if (score11 > best.score) {
              best = { text: text11, mode: "PSM 11 (fallback)", score: score11 };
            }
          }

          console.log(
            `📄 BEST OCR (${best.mode}, score=${best.score}):`,
            best.text.slice(0, 500)
          );
          setDebug(best.text.slice(0, 1000));

          // Pass to parent
          if (onFileSelected) {
            onFileSelected(f, best.text);
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
