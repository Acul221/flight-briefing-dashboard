import { useRef, useState } from "react";
import { useLogbookStore } from "../../store/useLogbookStore";
import { getTessWorker, recognizeWith } from "../../lib/tessWorker";

export default function OcrUploader() {
  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const addEntry = useLogbookStore((s) => s.addEntry);

  const [imgURL, setImgURL] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");

  // helper crop relatif (x,y,w,h dalam persentase 0..1)
  const cropRel = (img, { x, y, w, h }, scale = 2, threshold = true) => {
    const cw = Math.max(1, Math.floor(img.naturalWidth * w) * scale);
    const ch = Math.max(1, Math.floor(img.naturalHeight * h) * scale);
    const sx = Math.floor(img.naturalWidth * x);
    const sy = Math.floor(img.naturalHeight * y);
    const sw = Math.floor(img.naturalWidth * w);
    const sh = Math.floor(img.naturalHeight * h);

    const c = canvasRef.current;
    c.width = cw; c.height = ch;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

    // grayscale + threshold ringan → mempercepat & tajamkan angka
    const im = ctx.getImageData(0, 0, cw, ch);
    for (let i = 0; i < im.data.length; i += 4) {
      const y0 = 0.299 * im.data[i] + 0.587 * im.data[i+1] + 0.114 * im.data[i+2];
      im.data[i] = im.data[i+1] = im.data[i+2] = y0;
    }
    if (threshold) {
      for (let i = 0; i < im.data.length; i += 4) {
        const v = im.data[i] > 185 ? 255 : 0;
        im.data[i] = im.data[i+1] = im.data[i+2] = v;
      }
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL("image/jpeg", 0.95);
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImgURL(url);
    setData(null);
    setDebug("");
    setLoading(true);

    try {
      const img = new Image();
      img.onload = async () => {
        imgRef.current = img;
        const worker = await getTessWorker();

        // === AUTO-ROI UNTUK LEMBAR CFP ===
        // Header (A320-232/PK-XXX/SJV740) -> kira2 13–20% tinggi dokumen
        const headerROI = cropRel(img, { x: 0.04, y: 0.14, w: 0.92, h: 0.08 }, 2, true);
        // Times block (DEP/ARR BLK-ON/OFF + TKOF/LDNG/AIR TIME) -> 26–46%
        const timesROI  = cropRel(img, { x: 0.04, y: 0.28, w: 0.92, h: 0.20 }, 2, true);
        // Jadwal (STD/STA) -> 20–26%
        const schedROI  = cropRel(img, { x: 0.04, y: 0.20, w: 0.92, h: 0.06 }, 2, true);

        // OCR cepat: header=psm7 (single line), schedule=psm7, times=psm6
        const [tHeader, tSched, tTimes] = await Promise.all([
          recognizeWith(worker, headerROI, 7),
          recognizeWith(worker, schedROI, 7),
          recognizeWith(worker, timesROI, 6),
        ]);

        const rawText = (tHeader + "\n" + tSched + "\n" + tTimes);
        setDebug(rawText.slice(0, 600));

        const resp = await fetch("/.netlify/functions/parse-ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText }),
        });
        const parsed = await resp.json();
        setData(parsed);
        setLoading(false);
      };
      img.src = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("OCR error: " + (err?.message || err));
    }
  };

  const save = () => {
    if (!data) return;
    addEntry({ id: crypto.randomUUID(), ...data, created_at: new Date().toISOString() });
    setData(null); setImgURL(""); setDebug("");
    if (fileRef.current) fileRef.current.value = "";
    alert("Entry added ✅");
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 rounded-2xl bg-white shadow">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="block w-full text-sm border p-2 rounded mb-3"
      />
      <canvas ref={canvasRef} className="hidden" />
      {imgURL && <img src={imgURL} alt="preview" className="rounded mb-3" />}

      {loading && <div className="text-sm animate-pulse">Running OCR…</div>}

      {debug && !data && (
        <pre className="text-[10px] bg-gray-50 p-2 rounded border overflow-auto max-h-40">{debug}</pre>
      )}

      {data && (
        <div className="space-y-2">
          {[
            ["date_hint","Date"],["aircraft","Aircraft"],["registration","Registration"],["flight_no","Flight No"],
            ["from","From"],["to","To"],["bo","Block Off"],["toff","Takeoff"],["ldg","Landing"],["bn","Block On"],
            ["block_hhmm","Block Time"],["air_hhmm","Air Time"]
          ].map(([k,label])=>(
            <div key={k} className="flex items-center gap-2">
              <label className="w-36 text-sm">{label}</label>
              <input className="flex-1 border rounded p-2 text-sm"
                     value={data[k]||""}
                     onChange={e=>setData(d=>({...d,[k]:e.target.value}))}/>
            </div>
          ))}
          <button onClick={save} className="mt-2 px-4 py-2 rounded-xl bg-black text-white">Save Entry</button>
        </div>
      )}
    </div>
  );
}
